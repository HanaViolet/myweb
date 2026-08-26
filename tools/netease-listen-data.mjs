import { createCipheriv, createHash } from 'node:crypto'

const EAPI_DOMAIN = 'https://interfacepc.music.163.com'
const EAPI_KEY = 'e82ckenh8dichen8'
const EAPI_SEPARATOR = '-36cd479b6b5-'
const DEFAULT_USER_AGENT = 'NeteaseMusic/9.5.61.260802021928(9005061);Dalvik/2.1.0 (Linux; U; Android 12; HBN-AL00 Build/cd737a2.0)'
const DEFAULT_TIMEOUT_MS = 30000

const asText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()

const decodeCookieValue = (value) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * Parse a copied browser Cookie header without logging or persisting values.
 */
export const parseCookieHeader = (rawHeader = '') => {
  const header = String(rawHeader ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/^\s*cookie:\s*/i, '')
    .trim()
  const cookies = new Map()
  for (const chunk of header.split(';')) {
    const separator = chunk.indexOf('=')
    if (separator <= 0) continue
    const name = chunk.slice(0, separator).trim()
    const value = chunk.slice(separator + 1).trim()
    if (!/^[\w!#$%&'*+.^`|~-]+$/.test(name) || !value) continue
    cookies.set(name, decodeCookieValue(value))
  }
  return cookies
}

const createRequestId = () => `${Date.now()}_${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

const createHeaderCookie = (header) => Object.entries(header)
  .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value ?? ''))}`)
  .join('; ')

const buildEapiRequest = (uri, data, cookieMap) => {
  const now = Date.now().toString()
  const header = {
    osver: cookieMap.get('osver') || 'Microsoft-Windows-10-Professional-build-19045-64bit',
    deviceId: cookieMap.get('deviceId') || '',
    os: cookieMap.get('os') || 'pc',
    appver: cookieMap.get('appver') || '3.1.17.204416',
    versioncode: cookieMap.get('versioncode') || '140',
    mobilename: cookieMap.get('mobilename') || '',
    buildver: cookieMap.get('buildver') || now.slice(0, 10),
    resolution: cookieMap.get('resolution') || '1920x1080',
    __csrf: cookieMap.get('__csrf') || '',
    channel: cookieMap.get('channel') || 'netease',
    requestId: createRequestId()
  }
  for (const key of ['MUSIC_U', 'MUSIC_A', 'NMTID']) {
    const value = cookieMap.get(key)
    if (value) header[key] = value
  }

  const requestData = { ...data, e_r: false, header }
  const text = JSON.stringify(requestData)
  const digest = createHash('md5')
    .update(`nobody${uri}use${text}md5forencrypt`)
    .digest('hex')
  const message = `${uri}${EAPI_SEPARATOR}${text}${EAPI_SEPARATOR}${digest}`
  const cipher = createCipheriv('aes-128-ecb', Buffer.from(EAPI_KEY, 'utf8'), null)
  const encrypted = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()])
    .toString('hex')
    .toUpperCase()

  return {
    url: `${EAPI_DOMAIN}/eapi${uri.slice(4)}`,
    body: `params=${encodeURIComponent(encrypted)}`,
    cookie: createHeaderCookie(header)
  }
}

const fetchJson = async (uri, data, cookieMap, timeoutMs) => {
  const request = buildEapiRequest(uri, data, cookieMap)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(request.url, {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/x-www-form-urlencoded',
        cookie: request.cookie,
        origin: 'https://music.163.com',
        referer: 'https://music.163.com/',
        'user-agent': DEFAULT_USER_AGENT
      },
      body: request.body,
      signal: controller.signal
    })
    const text = await response.text()
    let payload = null
    try {
      payload = JSON.parse(text)
    } catch {
      return { ok: false, code: response.status, message: '网易云返回了无法解析的响应。' }
    }
    const code = Number(payload?.code)
    if (!response.ok || (Number.isFinite(code) && code !== 200)) {
      return {
        ok: false,
        code: Number.isFinite(code) ? code : response.status,
        message: asText(payload?.message || payload?.msg || `HTTP ${response.status}`)
      }
    }
    return { ok: true, payload }
  } catch (error) {
    return {
      ok: false,
      code: 0,
      message: error?.name === 'AbortError' ? '网易云听歌足迹请求超时。' : '网易云听歌足迹请求失败。'
    }
  } finally {
    clearTimeout(timer)
  }
}

const keyText = (value) => String(value || '').toLowerCase()

const durationKeyRank = (key, path, period) => {
  const keyName = keyText(key)
  const pathName = keyText(path.join('.'))
  const combined = `${keyName}.${pathName}`
  if (/(song|count|number|days?|rank|score|percent|rate|id|timestamp|date|starttime|endtime|updatetime|createtime)/i.test(combined)) return -100
  let score = 0
  if (/(listentime|totallistentime|listenduration|totalduration)/i.test(keyName)) score += 90
  if (/^(duration|time|total|minutes?|seconds?|milliseconds?)$/i.test(keyName)) score += 55
  if (/(listen|duration|time)/i.test(keyName)) score += 30
  if (period === 'weekly' && /(week|weekly|realtime|current)/i.test(combined)) score += 25
  if (period === 'allTime' && /(total|alltime|overall|history|cumulative)/i.test(combined)) score += 25
  if (period === 'allTime' && /(total|alltime|overall|history|cumulative)/i.test(combined)) score += 12
  if (period === 'weekly' && /(week|weekly|realtime|current)/i.test(combined)) score += 12
  return score
}

const parseDurationText = (value) => {
  const text = asText(value)
  if (!text) return null
  const clock = text.match(/^(?:(\d+)\s*[:：]\s*)?(\d{1,3})\s*[:：]\s*(\d{1,2})(?:\s*秒)?$/)
  if (clock) {
    const hours = Number(clock[1] || 0)
    const minutes = Number(clock[2] || 0)
    const seconds = Number(clock[3] || 0)
    return { minutes: Math.round(hours * 60 + minutes + seconds / 60), unit: 'clock' }
  }
  const matches = [...text.matchAll(/([0-9]+(?:\.[0-9]+)?)\s*(天|日|小时|小時|时|分钟|分|秒|毫秒|days?|hours?|hrs?|minutes?|mins?|seconds?|secs?|milliseconds?|msecs?)/gi)]
  if (matches.length) {
    let minutes = 0
    for (const match of matches) {
      const numeric = Number(match[1])
      if (!Number.isFinite(numeric)) continue
      const unit = match[2].toLowerCase()
      if (/^(天|日|day)/i.test(unit)) minutes += numeric * 24 * 60
      else if (/^(小时|小時|时|hour|hr)/i.test(unit)) minutes += numeric * 60
      else if (/^(秒|second|sec)/i.test(unit)) minutes += numeric / 60
      else if (/^(毫秒|millisecond|msec)/i.test(unit)) minutes += numeric / 60000
      else minutes += numeric
    }
    return { minutes: Math.round(minutes), unit: 'labelled' }
  }
  return null
}

const numericDuration = (value, key, unitHint = '') => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0) return null
  const hint = `${keyText(key)}.${keyText(unitHint)}`
  if (/(毫秒|millisecond|msec|ms)/i.test(hint)) return { minutes: Math.round(numeric / 60000), unit: 'milliseconds' }
  if (/(秒|second|sec)/i.test(hint)) return { minutes: Math.round(numeric / 60), unit: 'seconds' }
  if (/(小时|小時|时|hour|hr)/i.test(hint)) return { minutes: Math.round(numeric * 60), unit: 'hours' }
  if (/(分钟|分|minute|min)/i.test(hint)) return { minutes: Math.round(numeric), unit: 'minutes' }
  // NetEase duration fields conventionally use milliseconds. For an
  // unlabelled small value, minutes are the least surprising fallback.
  if (numeric >= 100000) return { minutes: Math.round(numeric / 60000), unit: 'milliseconds' }
  if (numeric >= 10000) return { minutes: Math.round(numeric / 60), unit: 'seconds' }
  return { minutes: Math.round(numeric), unit: 'minutes' }
}

const durationCandidate = (value, key, path, period, unitHint = '') => {
  const rank = durationKeyRank(key, path, period)
  if (rank < 0) return null
  const parsed = typeof value === 'string' ? parseDurationText(value) : numericDuration(value, key, unitHint)
  if (!parsed || !Number.isFinite(parsed.minutes) || parsed.minutes < 0) return null
  return { ...parsed, rank, path: [...path, key].join('.'), rawValue: value }
}

const collectDurationCandidates = (value, path, period, output, unitHint = '') => {
  if (value === null || value === undefined) return
  if (typeof value === 'string' || typeof value === 'number') {
    const key = path[path.length - 1] || ''
    const candidate = durationCandidate(value, key, path.slice(0, -1), period, unitHint)
    if (candidate) output.push(candidate)
    return
  }
  if (Array.isArray(value)) return
  if (typeof value !== 'object') return
  const localUnit = value.unit || value.timeUnit || value.durationUnit || value.listenTimeUnit || unitHint
  const numericField = (names) => {
    const entry = Object.entries(value).find(([key, child]) => names.test(key) && Number.isFinite(Number(child)))
    return entry ? Number(entry[1]) : null
  }
  const hours = numericField(/^(?:hours?|小时|小時|时)$/i)
  const minutes = numericField(/^(?:minutes?|mins?|分钟|分)$/i)
  const seconds = numericField(/^(?:seconds?|secs?|秒)$/i)
  const hasDurationContext = path.some((segment) => /(listen|duration|time|week|month|total|report)/i.test(segment))
  if (hasDurationContext && (hours !== null || minutes !== null || seconds !== null)) {
    const compositeMinutes = (hours || 0) * 60 + (minutes || 0) + (seconds || 0) / 60
    output.push({
      minutes: Math.round(compositeMinutes),
      unit: 'components',
      rank: durationKeyRank('listenTime', path, period) + 20,
      path: path.join('.') || 'duration',
      rawValue: { hours, minutes, seconds }
    })
  }
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'object' && child !== null) {
      collectDurationCandidates(child, [...path, key], period, output, localUnit)
    } else {
      const candidate = durationCandidate(child, key, path, period, localUnit)
      if (candidate) output.push(candidate)
    }
  }
}

/**
 * Extract one official listen-duration value from a listen-data response.
 * The API has changed nesting/labels over time, so this deliberately accepts
 * the documented hour/minute strings as well as numeric duration fields.
 */
export const extractListenDuration = (payload, period = 'weekly') => {
  const candidates = []
  collectDurationCandidates(payload?.data ?? payload, [], period, candidates)
  candidates.sort((left, right) => right.rank - left.rank || left.path.length - right.path.length)
  return candidates[0] || null
}

const endpointInfo = {
  weekly: '/api/content/activity/listen/data/realtime/report',
  allTime: '/api/content/activity/listen/data/total'
}

/**
 * Fetch the exact weekly and all-time listening totals with a Cookie login.
 * No Cookie value is included in the returned diagnostics.
 */
export const fetchOfficialListenDurations = async (rawCookie, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  const cookieMap = parseCookieHeader(rawCookie)
  if (!cookieMap.size || (!cookieMap.has('MUSIC_U') && !cookieMap.has('MUSIC_A'))) {
    return {
      available: false,
      weeklyMinutes: null,
      allTimeMinutes: null,
      weekly: { ok: false, message: '未配置有效的网易云登录 Cookie。' },
      allTime: { ok: false, message: '未配置有效的网易云登录 Cookie。' }
    }
  }

  const [weeklyResponse, allTimeResponse] = await Promise.all([
    fetchJson(endpointInfo.weekly, { type: 'week' }, cookieMap, timeoutMs),
    fetchJson(endpointInfo.allTime, {}, cookieMap, timeoutMs)
  ])
  const weekly = weeklyResponse.ok ? extractListenDuration(weeklyResponse.payload, 'weekly') : null
  const allTime = allTimeResponse.ok ? extractListenDuration(allTimeResponse.payload, 'allTime') : null
  return {
    available: Boolean(weekly || allTime),
    weeklyMinutes: weekly?.minutes ?? null,
    allTimeMinutes: allTime?.minutes ?? null,
    weekly: {
      ok: Boolean(weekly),
      endpoint: endpointInfo.weekly,
      path: weekly?.path || '',
      unit: weekly?.unit || '',
      message: weekly ? '' : (weeklyResponse.message || '网易云没有返回可识别的本周总时长。')
    },
    allTime: {
      ok: Boolean(allTime),
      endpoint: endpointInfo.allTime,
      path: allTime?.path || '',
      unit: allTime?.unit || '',
      message: allTime ? '' : (allTimeResponse.message || '网易云没有返回可识别的累计总时长。')
    }
  }
}

export { buildEapiRequest }
