import fs from 'node:fs'

const DEFAULT_USER_AGENT = 'Sakura-Listening-Room/1.0 (+https://sakura.luxe)'
const DEFAULT_VIEWPORT = { width: 1440, height: 1000 }
const DEFAULT_WAIT_MS = 5500

const asText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()

const asPositiveNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

const normaliseCount = (value) => {
  if (typeof value === 'number') return asPositiveNumber(value)
  const text = asText(value).replace(/,/g, '')
  const match = text.match(/(\d+(?:\.\d+)?)(?:万|w)?/i)
  if (!match) return 0
  const multiplier = /(?:万|w)/i.test(text) ? 10000 : 1
  return Math.round(Number(match[1]) * multiplier)
}

const normaliseDurationMs = (value) => {
  const number = asPositiveNumber(value)
  if (number > 0) return Math.round(number < 10000 ? number * 1000 : number)
  const text = asText(value)
  const match = text.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/)
  if (!match) return 0
  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  return (hours * 3600 + minutes * 60 + seconds) * 1000
}

const parseCookieHeader = (rawHeader) => {
  const header = asText(rawHeader).replace(/^cookie:\s*/i, '')
  if (!header) return []
  const cookies = []
  for (const chunk of header.split(';')) {
    const separator = chunk.indexOf('=')
    if (separator <= 0) continue
    const name = chunk.slice(0, separator).trim()
    const value = chunk.slice(separator + 1).trim()
    if (!/^[\w!#$%&'*+.^`|~-]+$/.test(name) || !value) continue
    cookies.push({
      name,
      value,
      domain: '.music.163.com',
      path: '/',
      secure: true
    })
  }
  return cookies
}

export { parseCookieHeader }

const candidateBrowserPaths = () => {
  const localAppData = process.env.LOCALAPPDATA || ''
  const programFiles = process.env.PROGRAMFILES || ''
  const programFilesX86 = process.env['PROGRAMFILES(X86)'] || ''
  return [
    process.env.NETEASE_BROWSER_PATH,
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    `${localAppData}\\Google\\Chrome\\Application\\chrome.exe`,
    `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
    `${localAppData}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`
  ].filter(Boolean)
}

export const findChromiumExecutable = () => {
  const found = candidateBrowserPaths().find((candidate) => fs.existsSync(candidate))
  return found || ''
}

const durationFromTracks = (tracks) => {
  const played = tracks.filter((track) => track.playCount > 0 && track.durationMs > 0)
  if (played.length === 0) return { minutes: null, available: false, tracksCounted: 0 }
  const milliseconds = played.reduce((sum, track) => sum + track.playCount * track.durationMs, 0)
  return {
    minutes: Math.round(milliseconds / 60000),
    available: true,
    tracksCounted: played.length
  }
}

export { durationFromTracks }

const normaliseTrack = (raw, index) => {
  const song = raw?.song || raw?.track || raw || {}
  const artists = Array.isArray(song.ar)
    ? song.ar.map((artist) => artist?.name).filter(Boolean)
    : Array.isArray(song.artists)
      ? song.artists.map((artist) => artist?.name || artist).filter(Boolean)
      : []
  const aliases = [
    ...(Array.isArray(song.tns) ? song.tns : []),
    ...(Array.isArray(song.alia) ? song.alia : []),
    raw?.alias,
    raw?.alia
  ].filter(Boolean)
  const id = Number(song.id ?? raw?.songId ?? raw?.id)
  const score = Number(raw?.score ?? song.score)
  const playCount = normaliseCount(raw?.playCount ?? raw?.plays ?? song.playCount)
  const durationMs = normaliseDurationMs(song.dt ?? song.duration ?? raw?.durationMs ?? raw?.duration)
  const title = asText(song.name ?? raw?.title ?? raw?.name)
  if (!title) return null
  return {
    rank: Number(raw?.rank) > 0 ? Number(raw.rank) : index + 1,
    songId: Number.isFinite(id) && id > 0 ? id : null,
    title,
    alias: aliases[0] ? asText(aliases[0]) : '',
    artist: artists.join(' / ') || asText(raw?.artist) || '未知艺人',
    album: asText(song.al?.name ?? song.album?.name ?? raw?.album),
    durationMs,
    playCount,
    score: Number.isFinite(score) && score > 0 ? score : null
  }
}

const normaliseTracks = (items, limit) => {
  if (!Array.isArray(items)) return []
  const seen = new Set()
  const tracks = []
  for (const [index, raw] of items.entries()) {
    const track = normaliseTrack(raw, index)
    if (!track) continue
    const key = track.songId ? `id:${track.songId}` : `title:${track.title.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    tracks.push({ ...track, rank: tracks.length + 1 })
    if (tracks.length >= limit) break
  }
  return tracks
}

const collectPayloadRankings = (payload, output, depth = 0) => {
  if (!payload || depth > 8 || typeof payload !== 'object') return
  if (Array.isArray(payload)) {
    for (const item of payload) collectPayloadRankings(item, output, depth + 1)
    return
  }
  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value) && /^(week|weekly|weekdata|all|alltime|alldata)$/i.test(key)) {
      const mode = /week/i.test(key) ? 'weekly' : 'allTime'
      output[mode].push(...value)
      continue
    }
    if (value && typeof value === 'object') collectPayloadRankings(value, output, depth + 1)
  }
}

const extractDurationMinutes = (text) => {
  const source = asText(text)
  const labelled = source.match(/听歌(?:时长|时间)[^\d]{0,12}(\d+(?:\.\d+)?)(?:天|日|小时|时|分钟|分)/i)
  if (!labelled) return null
  const value = Number(labelled[1])
  if (!Number.isFinite(value)) return null
  if (/天|日/.test(labelled[0])) return Math.round(value * 24 * 60)
  if (/小时|时/.test(labelled[0])) return Math.round(value * 60)
  return Math.round(value)
}

const extractVisibleRows = () => {
  const textOf = (element) => (element?.innerText || element?.textContent || '').replace(/\s+/g, ' ').trim()
  const isVisible = (element) => {
    if (!element) return false
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
  }
  const parseTime = (text) => {
    const match = text.match(/(?:^|\s)(?:(\d+):)?(\d{1,2}):(\d{2})(?:\s|$)/)
    if (!match) return 0
    return ((Number(match[1] || 0) * 60 + Number(match[2])) * 60 + Number(match[3])) * 1000
  }
  const parseCount = (text) => {
    const match = text.match(/(\d+(?:[,.]\d+)?)(?:\s*)(万|w)?(?:\s*)(?:次|plays?)/i)
    if (!match) return 0
    return Math.round(Number(match[1].replace(/,/g, '')) * (match[2] ? 10000 : 1))
  }
  const selectors = [
    'table tbody tr',
    '.m-record li',
    '.m-record .itm',
    '.m-wgt-song-list li',
    '[class*="record"] li'
  ]
  const elements = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))
  const seen = new Set()
  const rows = []
  for (const element of elements) {
    if (!isVisible(element)) continue
    const text = textOf(element)
    if (!text || text.length < 2) continue
    const titleAnchor = element.querySelector('a[href*="song?id="]')
    const titleNode = titleAnchor || element.querySelector('b, .txt, .f-thide')
    const title = textOf(titleNode).replace(/\s+-\s*\([^)]*\)\s*$/, '')
    if (!title || title.length > 180) continue
    const idMatch = titleAnchor?.getAttribute('href')?.match(/[?&]id=(\d+)/)
    const songId = idMatch ? Number(idMatch[1]) : null
    const key = songId ? `id:${songId}` : `title:${title.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    const artistNodes = Array.from(element.querySelectorAll('a[href*="artist?id="]'))
    const aliasNode = element.querySelector('.s-fc8, .alia')
    const durationNode = element.querySelector('.u-dur, [class*="duration"]')
    const scoreNode = element.querySelector('.score, [data-score], .tops')
    rows.push({
      rank: Number(text.match(/(?:^|\s)(\d{1,2})(?:\s|$)/)?.[1]) || rows.length + 1,
      songId,
      title,
      alias: textOf(aliasNode).replace(/^[-–—]\s*/, ''),
      artist: artistNodes.map(textOf).filter(Boolean).join(' / '),
      album: '',
      durationMs: parseTime(textOf(durationNode) || text),
      playCount: parseCount(text),
      score: Number(scoreNode?.getAttribute('data-score') || text.match(/评分\s*([\d.]+)/)?.[1]) || null
    })
  }
  return {
    rows,
    text: textOf(document.body),
    headings: Array.from(document.querySelectorAll('h1,h2,h3,h4,.u-title,.u-title-1')).filter(isVisible).map(textOf).filter(Boolean).slice(0, 40)
  }
}

const waitFor = (page, milliseconds) => page.waitForTimeout(milliseconds)

const clickLabel = async (page, labels) => {
  for (const label of labels) {
    try {
      const locator = page.getByText(label, { exact: true }).first()
      if (await locator.count()) {
        await locator.click({ timeout: 1800 })
        await waitFor(page, 900)
        return true
      }
    } catch {
      // The page can replace the node between count() and click(); try the next label.
    }
  }
  return false
}

const mergeTrack = (base, overlay) => ({
  ...base,
  ...overlay,
  songId: overlay.songId || base.songId || null,
  alias: overlay.alias || base.alias || '',
  artist: overlay.artist && overlay.artist !== '未知艺人' ? overlay.artist : base.artist,
  album: overlay.album || base.album || '',
  durationMs: overlay.durationMs || base.durationMs || 0,
  playCount: overlay.playCount || base.playCount || 0,
  score: overlay.score || base.score || null
})

const mergeRankings = (publicRows, browserRows, limit) => {
  if (!browserRows.length) return publicRows.slice(0, limit)
  const byKey = new Map(publicRows.map((row) => [row.songId ? `id:${row.songId}` : `title:${row.title.toLowerCase()}`, row]))
  const merged = []
  for (const row of browserRows) {
    const key = row.songId ? `id:${row.songId}` : `title:${row.title.toLowerCase()}`
    merged.push(mergeTrack(byKey.get(key) || {}, row))
    byKey.delete(key)
  }
  for (const row of publicRows) {
    const key = row.songId ? `id:${row.songId}` : `title:${row.title.toLowerCase()}`
    if (byKey.has(key)) merged.push(row)
  }
  return merged.slice(0, limit).map((row, index) => ({ ...row, rank: index + 1 }))
}

export async function scrapeNeteaseProfile({
  userId,
  profileUrl,
  cookieHeader = '',
  storageStateFile = '',
  browserPath = '',
  rankLimit = 20,
  waitMs = DEFAULT_WAIT_MS,
  timeoutMs = 30000,
  publicWeekly = [],
  publicAllTime = []
}) {
  const attempted = Boolean(asText(cookieHeader) || asText(storageStateFile))
  if (!attempted) return { attempted: false, succeeded: false, weekly: [], allTime: [], message: '未配置 Cookie 登录态。' }

  if (storageStateFile && !fs.existsSync(storageStateFile)) {
    throw new Error(`NETEASE_STORAGE_STATE_FILE not found: ${storageStateFile}`)
  }
  const cookies = cookieHeader ? parseCookieHeader(cookieHeader) : []
  if (cookieHeader && !cookies.length) throw new Error('NETEASE_COOKIE 未解析出有效 Cookie。')

  const { chromium } = await import('playwright-core')
  const executablePath = asText(browserPath) || findChromiumExecutable()
  if (!executablePath) {
    throw new Error('未找到 Chromium/Chrome。请设置 NETEASE_BROWSER_PATH，或在运行环境安装 Chrome。')
  }

  const browser = await chromium.launch({ headless: true, executablePath })
  const context = await browser.newContext({
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    viewport: DEFAULT_VIEWPORT,
    userAgent: DEFAULT_USER_AGENT,
    extraHTTPHeaders: { 'accept-language': 'zh-CN,zh;q=0.9,en;q=0.6' },
    ...(storageStateFile ? { storageState: storageStateFile } : {})
  })
  if (cookies.length) await context.addCookies(cookies)

  const page = await context.newPage()
  const responsePromises = []
  const responsePayloads = []
  page.on('response', (response) => {
    const url = response.url()
    if (!/^https?:\/\/(?:[^/]+\.)?music\.163\.com\/api\//i.test(url)) return
    const contentType = response.headers()['content-type'] || ''
    if (!/json|javascript|text/i.test(contentType) && !/(record|rank|user)/i.test(url)) return
    responsePromises.push((async () => {
      try {
        const payload = await response.json()
        responsePayloads.push({ url, payload })
      } catch {
        // Some NetEase responses are JSONP or HTML notices; the visible DOM remains the source of truth.
      }
    })())
  })

  const origin = new URL(profileUrl).origin
  const routeUrl = (category) => `${origin}/#/user/songs/rank?id=${encodeURIComponent(userId)}&cat=${category}`
  const captures = []
  const navigateAndCapture = async (url, mode, clickRankTab = false) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs })
    await waitFor(page, waitMs)
    if (clickRankTab) await clickLabel(page, ['听歌排行', '听歌排行榜'])
    captures.push({ mode, ...(await page.evaluate(extractVisibleRows)) })
  }

  try {
    await navigateAndCapture(profileUrl, 'profile', true)
    await navigateAndCapture(routeUrl('week'), 'weekly')
    await clickLabel(page, ['最近一周', '一周', '本周', '周榜'])
    captures.push({ mode: 'weekly', ...(await page.evaluate(extractVisibleRows)) })
    await navigateAndCapture(routeUrl('all'), 'allTime')
    await clickLabel(page, ['所有时间', '总榜', '全部'])
    captures.push({ mode: 'allTime', ...(await page.evaluate(extractVisibleRows)) })
  } finally {
    await Promise.allSettled(responsePromises)
    await context.close()
    await browser.close()
  }

  const browserRankings = { weekly: [], allTime: [] }
  for (const capture of captures) {
    const rows = normaliseTracks(capture.rows, rankLimit)
    if (capture.mode === 'weekly') browserRankings.weekly.push(...rows)
    if (capture.mode === 'allTime') browserRankings.allTime.push(...rows)
  }
  const payloadRankings = { weekly: [], allTime: [] }
  for (const response of responsePayloads) collectPayloadRankings(response.payload, payloadRankings)
  const weeklyFromPayload = normaliseTracks(payloadRankings.weekly, rankLimit)
  const allTimeFromPayload = normaliseTracks(payloadRankings.allTime, rankLimit)
  const weekly = mergeRankings(publicWeekly, mergeRankings(browserRankings.weekly, weeklyFromPayload, rankLimit), rankLimit)
  const allTime = mergeRankings(publicAllTime, mergeRankings(browserRankings.allTime, allTimeFromPayload, rankLimit), rankLimit)
  const weeklyDuration = durationFromTracks(weekly)
  const allTimeDuration = durationFromTracks(allTime)
  const weeklyVisibleDuration = captures
    .filter((capture) => capture.mode === 'weekly')
    .map((capture) => extractDurationMinutes(capture.text))
    .find((value) => value !== null) ?? null
  const allTimeVisibleDuration = captures
    .filter((capture) => capture.mode === 'allTime')
    .map((capture) => extractDurationMinutes(capture.text))
    .find((value) => value !== null) ?? extractDurationMinutes(captures.find((capture) => capture.mode === 'profile')?.text || '')

  if (!weekly.length && !allTime.length) {
    throw new Error('登录页面未提取到听歌排行；Cookie 可能已过期，或网易云页面结构发生变化。')
  }

  return {
    attempted: true,
    succeeded: true,
    weekly,
    allTime,
    duration: {
      weeklyMinutes: weeklyDuration.available ? weeklyDuration.minutes : weeklyVisibleDuration,
      allTimeMinutes: allTimeDuration.available ? allTimeDuration.minutes : allTimeVisibleDuration,
      available: weeklyDuration.available || allTimeDuration.available || weeklyVisibleDuration !== null || allTimeVisibleDuration !== null,
      weeklyTracksCounted: weeklyDuration.tracksCounted,
      allTimeTracksCounted: allTimeDuration.tracksCounted
    },
    message: '已通过 Cookie 登录态读取网易云页面可见数据。'
  }
}
