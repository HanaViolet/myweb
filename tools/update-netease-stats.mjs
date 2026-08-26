import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  durationFromTracks,
  scrapeNeteaseProfile
} from './netease-browser-scraper.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = path.join(root, 'source', '_data', 'netease-stats.json')
const userId = process.env.NETEASE_USER_ID || '1441471952'
const profileUrl = `https://music.163.com/#/user/home?id=${userId}`
const endpoint = (type) => `https://music.163.com/api/v1/play/record?uid=${encodeURIComponent(userId)}&type=${type}`
const rankLimit = Number(process.env.NETEASE_RANK_LIMIT) > 0
  ? Math.min(100, Math.round(Number(process.env.NETEASE_RANK_LIMIT)))
  : 20
// Keep the Cookie in memory only. Normalising line breaks makes copied
// request headers work in GitHub Actions without ever writing the value out.
const cookieHeader = (process.env.NETEASE_COOKIE || '').replace(/[\r\n]+/g, ' ').trim()
const requestHeaders = {
  accept: 'application/json',
  referer: 'https://music.163.com/',
  'user-agent': 'Sakura-Listening-Room/1.0 (+https://sakura.luxe)',
  ...(cookieHeader ? { cookie: cookieHeader } : {})
}

const normalise = (items) => (Array.isArray(items) ? items : []).slice(0, rankLimit).map((item, index) => {
  const song = item?.song || {}
  const artists = Array.isArray(song.ar) ? song.ar.map((artist) => artist?.name).filter(Boolean) : []
  const aliases = [
    ...(Array.isArray(song.tns) ? song.tns : []),
    ...(Array.isArray(song.alia) ? song.alia : [])
  ].filter(Boolean)
  const playCount = Number(item?.playCount)
  const durationMs = Number(song.dt)
  return {
    rank: index + 1,
    songId: Number(song.id) || null,
    title: String(song.name || '未命名歌曲'),
    alias: aliases[0] ? String(aliases[0]) : '',
    artist: artists.join(' / ') || '未知艺人',
    album: String(song.al?.name || ''),
    durationMs: Number.isFinite(durationMs) && durationMs > 0 ? Math.round(durationMs) : 0,
    playCount: Number.isFinite(playCount) && playCount > 0 ? Math.round(playCount) : 0,
    score: Number.isFinite(Number(item?.score)) ? Number(item.score) : null
  }
})

const fetchPublicRankings = async () => {
  const [weeklyResponse, allTimeResponse] = await Promise.all([
    fetch(endpoint(1), { headers: requestHeaders }),
    fetch(endpoint(0), { headers: requestHeaders })
  ])
  if (!weeklyResponse.ok) throw new Error(`网易云周榜请求失败：${weeklyResponse.status}`)
  if (!allTimeResponse.ok) throw new Error(`网易云总榜请求失败：${allTimeResponse.status}`)
  const [weeklyPayload, allTimePayload] = await Promise.all([
    weeklyResponse.json(),
    allTimeResponse.json()
  ])
  if (!Array.isArray(weeklyPayload.weekData) || !Array.isArray(allTimePayload.allData)) {
    throw new Error('网易云公开接口没有返回周榜和总榜数据')
  }
  const weekly = normalise(weeklyPayload.weekData)
  const allTime = normalise(allTimePayload.allData)
  return {
    weekly,
    allTime,
    // Anonymous responses currently expose the rows but redact playCount.
    // A positive count is therefore a safe signal that the Cookie was
    // accepted, without persisting or logging the credential itself.
    authenticated: Boolean(cookieHeader && (
      weekly.some((track) => track.playCount > 0) ||
      allTime.some((track) => track.playCount > 0)
    ))
  }
}

const trackKey = (track) => track.songId
  ? `id:${track.songId}`
  : `title:${String(track.title || '').toLowerCase()}`

const mergeTrack = (base, overlay) => ({
  ...base,
  ...overlay,
  songId: overlay.songId || base.songId || null,
  title: overlay.title || base.title || '未命名歌曲',
  alias: overlay.alias || base.alias || '',
  artist: overlay.artist && overlay.artist !== '未知艺人' ? overlay.artist : (base.artist || '未知艺人'),
  album: overlay.album || base.album || '',
  durationMs: overlay.durationMs || base.durationMs || 0,
  playCount: overlay.playCount || base.playCount || 0,
  score: overlay.score || base.score || null
})

const mergeRankings = (publicRows, browserRows) => {
  if (!browserRows.length) return publicRows.slice(0, rankLimit)
  const publicByKey = new Map(publicRows.map((row) => [trackKey(row), row]))
  const merged = []
  for (const row of browserRows) {
    const key = trackKey(row)
    merged.push(mergeTrack(publicByKey.get(key) || {}, row))
    publicByKey.delete(key)
  }
  for (const row of publicRows) {
    const key = trackKey(row)
    if (publicByKey.has(key)) merged.push(row)
  }
  return merged.slice(0, rankLimit).map((row, index) => ({ ...row, rank: index + 1 }))
}

const storageStateFile = process.env.NETEASE_STORAGE_STATE_FILE?.trim() || ''
const browserAttempted = Boolean(cookieHeader || storageStateFile)
let browserResult = null
let browserError = null
if (browserAttempted) {
  try {
    browserResult = await scrapeNeteaseProfile({
      userId,
      profileUrl,
      cookieHeader,
      storageStateFile,
      browserPath: process.env.NETEASE_BROWSER_PATH || '',
      rankLimit,
      publicWeekly: [],
      publicAllTime: []
    })
  } catch (error) {
    browserError = error
    console.warn(`[netease] Cookie 页面抓取失败，将使用公开接口：${error.message}`)
  }
}

let publicRankings = { weekly: [], allTime: [], authenticated: false }
let publicError = null
// Query the lightweight API whenever a browser scrape is incomplete or did
// not expose play counts. This lets the Cookie-authenticated API fill in the
// exact counts even when the profile page HTML changes.
const browserNeedsFallback = !browserResult || !browserResult.weekly?.length || !browserResult.allTime?.length ||
  !browserResult.weekly.some((track) => track.playCount > 0) ||
  !browserResult.allTime.some((track) => track.playCount > 0)
if (browserNeedsFallback) {
  try {
    publicRankings = await fetchPublicRankings()
  } catch (error) {
    publicError = error
    console.warn(`[netease] 公开接口不可用：${error.message}`)
  }
}

const publicCookieSucceeded = publicRankings.authenticated === true
const authenticatedSource = Boolean(browserResult || publicCookieSucceeded)

if (!publicRankings.weekly.length && !publicRankings.allTime.length && !browserResult) {
  throw publicError || browserError || new Error('网易云没有返回可用排行数据')
}

const weekly = mergeRankings(publicRankings.weekly, browserResult?.weekly || [])
const allTime = mergeRankings(publicRankings.allTime, browserResult?.allTime || [])
const weeklyFromTracks = durationFromTracks(weekly)
const allTimeFromTracks = durationFromTracks(allTime)
const browserDuration = browserResult?.duration || {}
const weeklyDuration = weeklyFromTracks.available ? weeklyFromTracks : {
  minutes: Number.isFinite(browserDuration.weeklyMinutes) ? browserDuration.weeklyMinutes : null,
  available: Number.isFinite(browserDuration.weeklyMinutes),
  tracksCounted: browserDuration.weeklyTracksCounted || 0
}
const allTimeDuration = allTimeFromTracks.available ? allTimeFromTracks : {
  minutes: Number.isFinite(browserDuration.allTimeMinutes) ? browserDuration.allTimeMinutes : null,
  available: Number.isFinite(browserDuration.allTimeMinutes),
  tracksCounted: browserDuration.allTimeTracksCounted || 0
}
const durationAvailable = weeklyDuration.available || allTimeDuration.available
if (browserAttempted && !durationAvailable) {
  console.warn('[netease] 登录态仍未提供可计算的播放次数与歌曲时长；请检查 NETEASE_COOKIE 是否过期或重新运行工作流。')
}
const durationMessage = durationAvailable
  ? authenticatedSource
    ? '听歌时长由登录态返回的播放次数 × 歌曲时长计算；网易云未提供时，页面不会猜测。'
    : '听歌时长由公开排行中的播放次数 × 歌曲时长计算。'
  : browserResult
    ? '已读取登录页面的排行，但页面没有公开播放次数或累计时长；因此暂不显示猜测值。'
    : publicCookieSucceeded
      ? 'Cookie 登录接口返回了排行，但缺少可计算的播放次数或歌曲时长；因此暂不显示猜测值。'
    : '网易云公开排行接口返回了歌曲榜单，但未返回播放次数；因此暂不显示猜测的听歌时长。'

const scrapeMessage = browserResult
  ? 'Cookie 页面抓取成功；公开接口在页面抓取失败或字段缺失时回退。'
  : publicCookieSucceeded
    ? 'Cookie 页面抓取未成功，但 Cookie 接口读取成功；公开接口用于字段补全。'
  : browserAttempted
    ? 'Cookie 页面和接口均未返回播放次数，已回退公开接口。'
    : '未配置 Cookie，使用公开接口。'

const scrapeMode = browserResult
  ? 'cookie-browser+public-api'
  : publicCookieSucceeded
    ? 'cookie-api+public-api'
    : 'public-api'

const now = new Date()
const result = {
  userId: String(userId),
  profileUrl,
  source: browserResult
    ? 'NetEase Cloud Music rendered profile page (Cookie) + public fallback'
    : publicCookieSucceeded
      ? 'NetEase Cloud Music play record API (Cookie) + public fallback'
    : 'NetEase Cloud Music public play record API',
  endpoint: '/api/v1/play/record',
  updatedAt: now.toISOString(),
  timezone: 'Asia/Shanghai',
  rankLimit,
  scrape: {
    mode: scrapeMode,
    attempted: browserAttempted,
    succeeded: authenticatedSource,
    publicApiAuthenticated: publicCookieSucceeded,
    message: scrapeMessage
  },
  duration: {
    weeklyMinutes: weeklyDuration.minutes,
    allTimeMinutes: allTimeDuration.minutes,
    available: durationAvailable,
    weeklyTracksCounted: weeklyDuration.tracksCounted,
    allTimeTracksCounted: allTimeDuration.tracksCounted,
    message: durationMessage
  },
  weekly,
  allTime,
  notes: durationMessage
}

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
console.log(`Updated ${path.relative(root, outputPath)} (${weekly.length} weekly / ${allTime.length} all-time tracks; ${result.scrape.mode}).`)
