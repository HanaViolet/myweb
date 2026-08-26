import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = path.join(root, 'source', '_data', 'netease-stats.json')
const userId = process.env.NETEASE_USER_ID || '1441471952'
const profileUrl = `https://music.163.com/#/user/home?id=${userId}`
const endpoint = (type) => `https://music.163.com/api/v1/play/record?uid=${encodeURIComponent(userId)}&type=${type}`
const rankLimit = 20

const response = await fetch(endpoint(1), {
  headers: {
    accept: 'application/json',
    referer: 'https://music.163.com/',
    'user-agent': 'Sakura-Listening-Room/1.0 (+https://sakura.luxe)'
  }
})
if (!response.ok) throw new Error(`NetEase weekly request failed: ${response.status}`)
const weeklyPayload = await response.json()

const allTimeResponse = await fetch(endpoint(0), {
  headers: {
    accept: 'application/json',
    referer: 'https://music.163.com/',
    'user-agent': 'Sakura-Listening-Room/1.0 (+https://sakura.luxe)'
  }
})
if (!allTimeResponse.ok) throw new Error(`NetEase all-time request failed: ${allTimeResponse.status}`)
const allTimePayload = await allTimeResponse.json()

if (!Array.isArray(weeklyPayload.weekData) || !Array.isArray(allTimePayload.allData)) {
  throw new Error('NetEase response did not include public weekly and all-time rankings')
}

const normalize = (items) => (Array.isArray(items) ? items : []).slice(0, rankLimit).map((item, index) => {
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

const weekly = normalize(weeklyPayload.weekData)
const allTime = normalize(allTimePayload.allData)

const durationFor = (items) => {
  const played = items.filter((item) => item.playCount > 0 && item.durationMs > 0)
  if (played.length === 0) {
    return { minutes: null, available: false, tracksCounted: 0 }
  }
  const milliseconds = played.reduce((sum, item) => sum + item.playCount * item.durationMs, 0)
  return {
    minutes: Math.round(milliseconds / 60000),
    available: true,
    tracksCounted: played.length
  }
}

const weeklyDuration = durationFor(weekly)
const allTimeDuration = durationFor(allTime)
const durationAvailable = weeklyDuration.available || allTimeDuration.available
const now = new Date()
const notes = durationAvailable
  ? '听歌时长由公开排行中的播放次数 × 歌曲时长计算。'
  : '网易云公开排行接口返回了歌曲榜单，但未返回播放次数；因此暂不显示猜测的听歌时长。'

const result = {
  userId: String(userId),
  profileUrl,
  source: 'NetEase Cloud Music public play record API',
  endpoint: '/api/v1/play/record',
  updatedAt: now.toISOString(),
  timezone: 'Asia/Shanghai',
  rankLimit,
  duration: {
    weeklyMinutes: weeklyDuration.minutes,
    allTimeMinutes: allTimeDuration.minutes,
    available: durationAvailable,
    weeklyTracksCounted: weeklyDuration.tracksCounted,
    allTimeTracksCounted: allTimeDuration.tracksCounted,
    message: notes
  },
  weekly,
  allTime,
  notes
}

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
console.log(`Updated ${path.relative(root, outputPath)} (${weekly.length} weekly / ${allTime.length} all-time tracks).`)
