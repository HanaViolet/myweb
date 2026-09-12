// Internet Archive public Search + Metadata APIs. Only explicit CC BY recordings.
// Stores metadata locally; streams the original audio without modifying it.
import { readFile, writeFile, rename } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { get } from 'node:https'
import { HttpsProxyAgent } from 'https-proxy-agent'

const channels = [
  { id: 'reading', label: '纸页之间', tags: 'piano' },
  { id: 'gallery', label: '光影漫游', tags: 'ambient' },
  { id: 'coding', label: '夜间编码', tags: 'electronic' },
  { id: 'wandering', label: '街角偶遇', tags: 'jazz' }
]
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy
const agent = proxy ? new HttpsProxyAgent(proxy) : undefined
const download = (url, probe = false, redirects = 0) => new Promise((resolve, reject) => {
  const req = get(url, { agent, headers: probe ? { Range: 'bytes=0-127' } : {}, timeout: 25000 }, response => {
    if ([301,302,303,307,308].includes(response.statusCode) && response.headers.location && redirects < 5) {
      response.resume()
      const next = new URL(response.headers.location, url)
      if (next.protocol !== 'https:' || !/(^|\.)archive\.org$/.test(next.hostname)) { reject(new Error('Unexpected redirect')); return }
      resolve(download(next, probe, redirects + 1)); return
    }
    if (![200,206].includes(response.statusCode)) { response.resume(); reject(new Error(`Internet Archive: HTTP ${response.statusCode}`)); return }
    if (probe) {
      const audio = /audio|octet-stream/.test(response.headers['content-type'] || '')
      response.destroy()
      resolve(audio); return
    }
    let body = ''
    response.setEncoding('utf8')
    response.on('data', chunk => { body += chunk; if (body.length > 4000000) req.destroy(new Error('API response too large')) })
    response.on('end', () => { try { resolve(JSON.parse(body)) } catch (error) { reject(error) } })
    response.on('error', reject)
  })
  req.on('timeout', () => req.destroy(new Error('Internet Archive request timed out')))
  req.on('error', reject)
})
const request = url => download(url)
const text = value => Array.isArray(value) ? value.join(' / ') : String(value || '')
const seconds = value => String(value || '').split(':').reduce((total, part) => total * 60 + Number(part), 0)
const tracks = []
const usedItems = new Set()
let recentlyVerified = new Set()
try {
  const previous = JSON.parse(await readFile(new URL('../source/_data/discovery.json', import.meta.url), 'utf8'))
  if (Date.now() - Date.parse(previous.updatedAt) < 86400000) recentlyVerified = new Set(previous.tracks.map(track => track.src))
} catch { /* First refresh has no cache. */ }
for (const channel of channels) {
  const url = new URL('https://archive.org/advancedsearch.php')
  const licenses = ['http', 'https'].flatMap(scheme => ['4.0', '3.0', '2.5'].map(version => `"${scheme}://creativecommons.org/licenses/by/${version}/"`))
  url.search = new URLSearchParams({ q: `mediatype:audio AND subject:${channel.tags} AND licenseurl:(${licenses.join(' OR ')})`, output: 'json', rows: '18', 'fl[]': 'identifier', 'sort[]': 'downloads desc' })
  const search = await request(url)
  let count = 0
  for (const item of search.response.docs) {
    if (usedItems.has(item.identifier)) continue
    const info = await request(`https://archive.org/metadata/${encodeURIComponent(item.identifier)}`)
    const metadata = info.metadata || {}
    const license = text(metadata.licenseurl).replace(/^http:/, 'https:')
    if (info.is_dark || metadata.nodownload || !/^https:\/\/creativecommons.org\/licenses\/by\/(?:4\.0|3\.0|2\.5)\/$/.test(license)) continue
    let albumCount = 0
    const names = new Set()
    for (const file of info.files || []) {
      // Do not mistake lower-bitrate derivatives of an MP3 for different songs.
      if (/\.mp3$/i.test(file.original || '') || /_64kb\.mp3$/i.test(file.name)) continue
      const duration = seconds(file.length)
      const artist = text(file.creator || metadata.creator)
      const title = text(file.title || file.name.replace(/\.mp3$/i, ''))
      if (!/\.mp3$/i.test(file.name) || duration < 60 || duration > 900 || Number(file.size) > 35000000 || !artist || names.has(title)) continue
      const src = `https://archive.org/download/${encodeURIComponent(item.identifier)}/${encodeURIComponent(file.name)}`
      // Verify a small ranged GET; some servers intentionally reject HEAD requests.
      try {
        if (!recentlyVerified.has(src) && !await download(src, true)) continue
      } catch { continue }
      const hash = createHash('sha256').update(`${item.identifier}/${file.name}`).digest('hex').slice(0, 16)
      tracks.push({ id: `archive-${hash}`, title, artist, src, channel: channel.id, duration,
        source: 'Internet Archive', sourceUrl: `https://archive.org/details/${encodeURIComponent(item.identifier)}`,
        licenseUrl: license, licenseLabel: `CC BY ${license.split('/').at(-2)}`,
        meta: `OPEN MUSIC / ${channel.label}`, about: `收录于「${text(metadata.title)}」。来自 Internet Archive 的开放授权录音。`,
        noteJa: '', noteZh: '给熟悉的日常，留一点陌生的旋律。' })
      names.add(title)
      count++
      albumCount++
      if (albumCount === 4 || count === 12) break
    }
    if (albumCount) usedItems.add(item.identifier)
    if (count === 12) break
  }
  if (count < 4) throw new Error(`Insufficient playable tracks for ${channel.id}; existing catalogue kept`)
  console.log(`${channel.label}: ${count} playable tracks`)
}
const destination = new URL('../source/_data/discovery.json', import.meta.url)
const temporary = new URL('../source/_data/discovery.json.tmp', import.meta.url)
await writeFile(temporary, JSON.stringify({ updatedAt: new Date().toISOString(), provider: 'Internet Archive', channels, tracks }, null, 2) + '\n')
await rename(temporary, destination)
console.log(`Saved ${tracks.length} CC BY tracks. Only metadata stored; no audio files downloaded.`)
