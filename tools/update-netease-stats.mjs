import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  scrapeNeteaseProfile
} from './netease-browser-scraper.mjs'
import { fetchOfficialListenDurations } from './netease-listen-data.mjs'

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
const cookieHeader = (process.env.NETEASE_COOKIE || '')
  .replace(/[\r\n]+/g, ' ')
  .replace(/^\s*cookie:\s*/i, '')
  .trim()
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
let officialDurations = {
  available: false,
  weeklyMinutes: null,
  allTimeMinutes: null,
  weekly: { ok: false, message: '未配置有效的网易云登录 Cookie。' },
  allTime: { ok: false, message: '未配置有效的网易云登录 Cookie。' }
}
if (cookieHeader) {
  try {
    officialDurations = await fetchOfficialListenDurations(cookieHeader)
  } catch (error) {
    console.warn(`[netease] 官方听歌足迹请求失败：${error.message}`)
  }
}

const finiteMinutes = (value) => {
  if (value === null || value === undefined || value === '') return null
  const minutes = Number(value)
  return Number.isFinite(minutes) && minutes >= 0 ? Math.round(minutes) : null
}

// The browser scraper reads the values printed on the authenticated NetEase
// profile (for example “本周收听时长 11 小时 19 分” and “总时长 2102 小时
// 26 分”). They are exact UI totals, unlike the old Top-20 play-count ×
// song-length estimate. Prefer the labelled profile values for both periods;
// the two listen-data endpoints are the fallback when the page omits them.
const browserWeeklyMinutes = finiteMinutes(
  browserResult?.duration?.weeklyVisibleMinutes ?? browserResult?.duration?.weeklyMinutes
)
const browserAllTimeMinutes = finiteMinutes(
  browserResult?.duration?.allTimeVisibleMinutes ?? browserResult?.duration?.allTimeMinutes
)
const browserDuration = (minutes, period) => minutes === null
  ? null
  : {
      ok: true,
      source: 'browser-visible',
      endpoint: 'browser-profile-visible',
      path: `${period}.visibleDuration`,
      unit: 'minutes',
      rawValue: minutes,
      minutes,
      message: ''
    }
const browserWeeklyDuration = browserDuration(browserWeeklyMinutes, 'weekly')
const browserAllTimeDuration = browserDuration(browserAllTimeMinutes, 'allTime')
const selectedWeeklyDuration = browserWeeklyDuration || (officialDurations.weekly?.ok === true
  ? { ...officialDurations.weekly, source: 'listen-data' }
  : null)
const selectedAllTimeDuration = browserAllTimeDuration || (officialDurations.allTime?.ok === true
  ? { ...officialDurations.allTime, source: 'listen-data' }
  : null)

// Never publish an impossible pair. If a newly returned candidate makes the
// cumulative total smaller than this week's total, keep the weekly value and
// suppress only the inconsistent cumulative candidate until the next run.
const inconsistentDuration = Boolean(
  selectedWeeklyDuration && selectedAllTimeDuration &&
  finiteMinutes(selectedAllTimeDuration.minutes ?? selectedAllTimeDuration.rawValue) <
    finiteMinutes(selectedWeeklyDuration.minutes ?? selectedWeeklyDuration.rawValue)
)
const allTimeDuration = inconsistentDuration
  ? {
      ...selectedAllTimeDuration,
      ok: false,
      message: '网易云累计接口返回的候选值小于本周值，已暂不显示累计时长。'
    }
  : selectedAllTimeDuration
const weeklyDurationAvailable = selectedWeeklyDuration?.ok === true
const allTimeDurationAvailable = allTimeDuration?.ok === true
const durationAvailable = weeklyDurationAvailable || allTimeDurationAvailable
const durationFailures = [
  weeklyDurationAvailable ? null : (officialDurations.weekly?.message || '网易云没有返回可识别的本周总时长。'),
  allTimeDurationAvailable ? null : (allTimeDuration?.message || officialDurations.allTime?.message)
]
  .filter(Boolean)
const weeklyFromProfile = selectedWeeklyDuration?.source === 'browser-visible'
const allTimeFromProfile = allTimeDuration?.source === 'browser-visible'
const durationMessage = weeklyDurationAvailable && allTimeDurationAvailable
  ? weeklyFromProfile && allTimeFromProfile
    ? '本周和累计听歌时长来自登录后的网易云个人页明确显示值。'
    : weeklyFromProfile
      ? '本周听歌时长来自登录后的网易云个人页；累计时长来自网易云“云村听歌足迹”接口。'
      : allTimeFromProfile
        ? '累计听歌时长来自登录后的网易云个人页；本周时长来自网易云“云村听歌足迹”接口。'
        : '本周和累计听歌时长来自网易云“云村听歌足迹”接口。'
  : weeklyDurationAvailable
    ? weeklyFromProfile
      ? `本周听歌时长来自登录后的网易云页面“本周收听时长”；累计时长暂不显示未经验证的字段。${durationFailures.join(' ')}`
      : `本周听歌时长来自网易云“云村听歌足迹”接口；累计时长暂不显示未经验证的字段。${durationFailures.join(' ')}`
    : allTimeDurationAvailable
      ? allTimeFromProfile
        ? `累计听歌时长来自登录后的网易云个人页“总时长”；本周时长暂不显示未经验证的字段。${durationFailures.join(' ')}`
        : `累计听歌时长来自网易云“云村听歌足迹”接口；本周时长暂不显示未经验证的字段。${durationFailures.join(' ')}`
      : cookieHeader
        ? `网易云“云村听歌足迹”接口和登录页面暂时没有返回可识别的本周总时长，未使用排行估算替代。${durationFailures.join(' ')}`
        : '未配置网易云 Cookie，暂不显示官方听歌时长。'
if (cookieHeader && (!durationAvailable || durationFailures.length)) {
  console.warn(`[netease] ${durationMessage}`)
}
if (cookieHeader) {
  console.log(`[netease] duration fields: weekly=${selectedWeeklyDuration?.path || '—'} (${selectedWeeklyDuration?.unit || '—'}); allTime=${allTimeDuration?.path || '—'} (${allTimeDuration?.unit || '—'})`)
}

// Keep a small, non-sensitive record of the selected field. This makes a
// future API shape change diagnosable without writing the Cookie or the full
// response payload to the repository.
const durationFieldDiagnostic = (result) => {
  if (!result?.path) return null
  const rawValue = result.rawValue
  if (typeof rawValue === 'string') {
    return { path: result.path, unit: result.unit || '', rawValue: rawValue.slice(0, 160) }
  }
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return { path: result.path, unit: result.unit || '', rawValue }
  }
  if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
    const components = Object.fromEntries(Object.entries(rawValue)
      .filter(([, value]) => Number.isFinite(Number(value)))
      .map(([key, value]) => [key, Number(value)]))
    return { path: result.path, unit: result.unit || '', rawValue: components }
  }
  return { path: result.path, unit: result.unit || '' }
}

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
const finalScrapeMode = durationAvailable
  ? `${officialDurations.available ? 'listen-data' : 'profile-duration'}+${scrapeMode}`
  : scrapeMode

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
    mode: finalScrapeMode,
    attempted: browserAttempted,
    succeeded: authenticatedSource,
    publicApiAuthenticated: publicCookieSucceeded,
    listenDataAuthenticated: officialDurations.available === true,
    message: scrapeMessage
  },
  duration: {
    weeklyMinutes: weeklyDurationAvailable ? finiteMinutes(selectedWeeklyDuration.minutes ?? selectedWeeklyDuration.rawValue) : null,
    allTimeMinutes: allTimeDurationAvailable ? finiteMinutes(allTimeDuration.minutes ?? allTimeDuration.rawValue) : null,
    available: durationAvailable,
    source: weeklyFromProfile && allTimeFromProfile
      ? 'netease-profile-visible'
      : weeklyFromProfile || allTimeFromProfile
        ? 'netease-listen-data+netease-profile-visible'
        : officialDurations.available ? 'netease-listen-data' : null,
    endpoints: {
      weekly: selectedWeeklyDuration?.endpoint || '/api/content/activity/listen/data/realtime/report',
      allTime: allTimeDuration?.endpoint || '/api/content/activity/listen/data/total'
    },
    fields: {
      weekly: durationFieldDiagnostic(selectedWeeklyDuration),
      allTime: durationFieldDiagnostic(allTimeDuration)
    },
    validation: {
      status: inconsistentDuration
        ? 'inconsistent'
        : (weeklyDurationAvailable && allTimeDurationAvailable ? 'valid' : durationAvailable ? 'partial' : 'unavailable'),
      message: inconsistentDuration ? allTimeDuration.message : (officialDurations.validation?.message || '')
    },
    weeklyTracksCounted: 0,
    allTimeTracksCounted: 0,
    message: durationMessage
  },
  weekly,
  allTime,
  notes: durationMessage
}

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
console.log(`Updated ${path.relative(root, outputPath)} (${weekly.length} weekly / ${allTime.length} all-time tracks; ${result.scrape.mode}).`)
