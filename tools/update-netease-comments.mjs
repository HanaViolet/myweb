import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tracksPath = path.join(root, 'source', '_data', 'tracks.json')
const outputPath = path.join(root, 'source', '_data', 'netease-comments.json')

const userAgent = 'Sakura-Listening-Room/1.0 (+https://sakura.luxe)'
const cookieHeader = (process.env.NETEASE_COOKIE || '').replace(/[\r\n]+/g, ' ').trim()
const commentLimit = Number(process.env.NETEASE_COMMENT_LIMIT) > 0
  ? Math.min(5, Math.round(Number(process.env.NETEASE_COMMENT_LIMIT)))
  : 3
const delayMs = Number.isFinite(Number(process.env.NETEASE_COMMENT_DELAY_MS))
  ? Math.min(10000, Math.max(300, Math.round(Number(process.env.NETEASE_COMMENT_DELAY_MS))))
  : 900
const timeoutMs = Number.isFinite(Number(process.env.NETEASE_COMMENT_TIMEOUT_MS))
  ? Math.min(60000, Math.max(5000, Math.round(Number(process.env.NETEASE_COMMENT_TIMEOUT_MS))))
  : 15000

const asText = (value) => String(value ?? '').replace(/\u0000/g, '').trim()

const normalizeKey = (value) => asText(value)
  .toLowerCase()
  .normalize('NFKC')
  .replace(/[\p{P}\p{S}\s]+/gu, '')

const positiveNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0
}

const formatDate = (value) => {
  const timestamp = Number(value)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date)
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${fields.year}-${fields.month}-${fields.day}`
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const requestHeaders = {
  accept: 'application/json, text/plain, */*',
  referer: 'https://music.163.com/',
  'user-agent': userAgent
}
if (cookieHeader) requestHeaders.cookie = cookieHeader

const fetchJson = async (url) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { headers: requestHeaders, signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}

const readJson = async (filePath, fallback) => {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

const getTrackTitleCandidates = (track) => [track.title, track.titleJa].filter(Boolean).map(asText)

const findSongId = async (track) => {
  const knownId = positiveNumber(track.neteaseId)
  if (knownId) return { songId: knownId, matchedBy: 'track-data' }

  const query = `${track.title || ''} ${track.artist || ''}`.trim()
  if (!query) return { songId: 0, matchedBy: 'none' }
  const url = `https://music.163.com/api/search/get/web?csrf_token=&s=${encodeURIComponent(query)}&type=1&offset=0&total=true&limit=10`
  const payload = await fetchJson(url)
  const songs = Array.isArray(payload?.result?.songs) ? payload.result.songs : []
  if (!songs.length) return { songId: 0, matchedBy: 'search-empty' }

  const titleKeys = new Set(getTrackTitleCandidates(track).map(normalizeKey).filter(Boolean))
  const artistKey = normalizeKey(track.artist)
  const songTitle = (song) => [song?.name, ...(Array.isArray(song?.alias) ? song.alias : []), ...(Array.isArray(song?.alia) ? song.alia : [])]
  const songArtists = (song) => Array.isArray(song?.artists) ? song.artists.map((artist) => artist?.name || artist) : []
  const exact = songs.find((song) => {
    const titleMatch = songTitle(song).map(normalizeKey).some((name) => titleKeys.has(name))
    const artists = songArtists(song).map(normalizeKey)
    const artistMatch = !artistKey || artists.some((artist) => artist === artistKey || artist.includes(artistKey) || artistKey.includes(artist))
    return titleMatch && artistMatch
  })
  const fallback = exact || songs.find((song) => songTitle(song).map(normalizeKey).some((name) => titleKeys.has(name))) || songs[0]
  const songId = positiveNumber(fallback?.id)
  return { songId, matchedBy: songId ? 'public-search' : 'search-empty' }
}

const extractRawComments = (payload) => {
  if (Array.isArray(payload?.hotComments)) return payload.hotComments
  if (Array.isArray(payload?.data?.hotComments)) return payload.data.hotComments
  if (Array.isArray(payload?.data?.comments)) return payload.data.comments
  if (Array.isArray(payload?.comments)) return payload.comments
  return []
}

const normaliseComment = (raw) => {
  const content = asText(raw?.content || raw?.commentText || raw?.text).slice(0, 600)
  if (!content) return null
  const user = raw?.user || raw?.userProfile || {}
  const nickname = asText(user.nickname || user.nickName || '网易云听众').slice(0, 80)
  const commentId = positiveNumber(raw?.commentId || raw?.commentID || raw?.id)
  return {
    commentId: commentId || null,
    nickname,
    content,
    likedCount: positiveNumber(raw?.likedCount || raw?.likeCount || raw?.liked),
    date: formatDate(raw?.time || raw?.createTime || raw?.timeStamp)
  }
}

const fetchComments = async (songId) => {
  if (!songId) return { comments: [], endpoint: '', mode: 'unmatched' }
  const resourceEndpoint = `https://music.163.com/api/v1/resource/comments/R_SO_4_${songId}?limit=20&offset=0`
  let payload
  let endpoint = resourceEndpoint
  let usedModernEndpoint = false
  try {
    payload = await fetchJson(resourceEndpoint)
  } catch (error) {
    const modernEndpoint = `https://music.163.com/api/comment/resource/comments/get?threadId=R_SO_4_${songId}&pageNo=1&pageSize=20&cursor=0&sortType=1`
    payload = await fetchJson(modernEndpoint)
    endpoint = modernEndpoint
    usedModernEndpoint = true
    if (!payload) throw error
  }
  if (!usedModernEndpoint && !extractRawComments(payload).length) {
    const modernEndpoint = `https://music.163.com/api/comment/resource/comments/get?threadId=R_SO_4_${songId}&pageNo=1&pageSize=20&cursor=0&sortType=1`
    try {
      const modernPayload = await fetchJson(modernEndpoint)
      if (extractRawComments(modernPayload).length) {
        payload = modernPayload
        endpoint = modernEndpoint
      }
    } catch {
      // Keep the successful resource response; a temporary modern endpoint
      // failure should not discard usable cached comments.
    }
  }
  const seen = new Set()
  const comments = extractRawComments(payload).map(normaliseComment).filter(Boolean).filter((comment) => {
    const key = comment.commentId ? `id:${comment.commentId}` : `text:${comment.content}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, commentLimit)
  return { comments, endpoint, mode: comments.length ? 'fresh' : 'empty' }
}

const sourceUrl = (songId) => songId ? `https://music.163.com/#/song?id=${songId}` : 'https://music.163.com/'

const tracks = await readJson(tracksPath, [])
const previous = await readJson(outputPath, {})
const previousTracks = previous && typeof previous.tracks === 'object' ? previous.tracks : {}
const resultTracks = {}
let freshCount = 0
let cachedCount = 0
let failedCount = 0

for (const [index, track] of (Array.isArray(tracks) ? tracks : []).entries()) {
  if (index > 0) await sleep(delayMs)
  const trackId = asText(track?.id) || `track-${index + 1}`
  const previousEntry = previousTracks[trackId] || {}
  let songId = positiveNumber(track?.neteaseId) || positiveNumber(previousEntry.songId)
  let matchedBy = songId ? (track?.neteaseId ? 'track-data' : 'cached') : 'none'
  let entryError = ''
  let comments = []
  let endpoint = previousEntry.endpoint || ''
  let mode = 'empty'

  try {
    if (!songId) {
      const match = await findSongId(track || {})
      songId = match.songId
      matchedBy = match.matchedBy
    }
    const fetched = await fetchComments(songId)
    comments = fetched.comments
    endpoint = fetched.endpoint || endpoint
    mode = fetched.mode
    if (comments.length) freshCount += 1
  } catch (error) {
    failedCount += 1
    entryError = asText(error.message).slice(0, 180)
  }

  if (!comments.length && Array.isArray(previousEntry.comments) && previousEntry.comments.length) {
    comments = previousEntry.comments.slice(0, commentLimit)
    cachedCount += 1
    mode = 'cached'
  }

  resultTracks[trackId] = {
    trackId,
    songId: songId || null,
    title: asText(track?.title || previousEntry.title || '未命名歌曲'),
    artist: asText(track?.artist || previousEntry.artist || ''),
    titleJa: asText(track?.titleJa || previousEntry.titleJa || ''),
    comments,
    sourceUrl: sourceUrl(songId),
    endpoint,
    matchedBy,
    mode,
    error: entryError,
    updatedAt: new Date().toISOString()
  }
}

const now = new Date()
const result = {
  source: 'NetEase Cloud Music hot comments API',
  endpoint: '/api/v1/resource/comments/R_SO_4_{songId}',
  updatedAt: now.toISOString(),
  timezone: 'Asia/Shanghai',
  commentLimit,
  tracks: resultTracks,
  scrape: {
    mode: cookieHeader ? 'cookie-header+public-api' : 'public-api',
    cookieProvided: Boolean(cookieHeader),
    freshTracks: freshCount,
    cachedTracks: cachedCount,
    failedTracks: failedCount
  },
  notes: '每周从网易云公开热门评论中缓存少量摘录；Cookie 只在 GitHub Actions 运行时使用，不会写入数据文件。'
}

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
console.log(`Updated ${path.relative(root, outputPath)} (${freshCount} fresh / ${cachedCount} cached / ${failedCount} failed tracks).`)
