import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tracksPath = path.join(root, 'source', '_data', 'tracks.json')
const chartPath = path.join(root, 'docs', 'listening-archive.svg')

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const formatNumber = (value) => new Intl.NumberFormat('zh-CN').format(value)
const formatSize = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`
const toLocalPath = (src) => path.join(root, 'source', String(src).replace(/^[/\\]+/, '').replaceAll('/', path.sep))

const tracks = JSON.parse(await readFile(tracksPath, 'utf8'))
if (!Array.isArray(tracks) || tracks.length === 0) {
  throw new Error('source/_data/tracks.json must contain at least one track')
}

const entries = await Promise.all(tracks.map(async (track, index) => {
  const audioPath = toLocalPath(track.src)
  let bytes = 0
  let available = true
  try {
    bytes = (await stat(audioPath)).size
  } catch {
    available = false
  }
  return {
    index: index + 1,
    title: track.title || track.titleJa || `Track ${index + 1}`,
    titleJa: track.titleJa || '',
    artist: track.artist || 'Unknown artist',
    bytes,
    available
  }
}))

const availableEntries = entries.filter((entry) => entry.available)
const totalBytes = availableEntries.reduce((sum, entry) => sum + entry.bytes, 0)
const largest = availableEntries.reduce((best, entry) => !best || entry.bytes > best.bytes ? entry : best, null)
const maxBytes = Math.max(...availableEntries.map((entry) => entry.bytes), 1)
const tickStep = maxBytes > 8 * 1024 * 1024 ? 4 : 2
const domainMb = Math.max(tickStep * 4, Math.ceil(maxBytes / 1024 / 1024 / tickStep) * tickStep)
const domainBytes = domainMb * 1024 * 1024

const width = 960
const rowHeight = 58
const chartTop = 176
const height = chartTop + entries.length * rowHeight + 54
const labelX = 72
const barX = 294
const barWidth = width - barX - 82
const colors = ['#b8e5d0', '#8da9ff', '#e9c98d', '#d9a7c7', '#9fc5d1', '#c7b9eb']
const formatMb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)}`

const rows = entries.map((entry, index) => {
  const y = chartTop + index * rowHeight
  const color = colors[index % colors.length]
  const barLength = entry.available ? Math.max(4, (entry.bytes / domainBytes) * barWidth) : 0
  const subtitle = entry.titleJa && entry.titleJa !== entry.title ? `${entry.titleJa} · ${entry.artist}` : entry.artist
  const sizeLabel = entry.available ? formatSize(entry.bytes) : '音频文件未找到'
  return `<g>
    <text x="${labelX}" y="${y + 8}" fill="#d9ebe4" font-size="15" font-weight="600">${escapeXml(String(entry.index).padStart(2, '0'))}  ${escapeXml(entry.title)}</text>
    <text x="${labelX}" y="${y + 28}" fill="#78918f" font-size="11">${escapeXml(subtitle)}</text>
    <rect x="${barX}" y="${y - 7}" width="${barWidth}" height="16" rx="8" fill="#1b292a" />
    ${entry.available ? `<rect x="${barX}" y="${y - 7}" width="${barLength.toFixed(2)}" height="16" rx="8" fill="${color}" />` : ''}
    <text x="${width - 82}" y="${y + 6}" text-anchor="end" fill="${entry.available ? color : '#78918f'}" font-size="12" font-weight="600">${escapeXml(sizeLabel)}</text>
  </g>`
}).join('\n  ')

const ticks = Array.from({ length: 5 }, (_, index) => {
  const value = index * tickStep
  const x = barX + (value / domainMb) * barWidth
  return `<line x1="${x.toFixed(2)}" y1="${chartTop - 30}" x2="${x.toFixed(2)}" y2="${height - 34}" stroke="#253638" stroke-width="1" stroke-dasharray="2 6" />
  <text x="${x.toFixed(2)}" y="${chartTop - 42}" text-anchor="middle" fill="#78918f" font-size="11">${value} MB</text>`
}).join('\n  ')

const summary = `${entries.length} 首 · ${formatSize(totalBytes)} · ${largest ? `最大文件 ${escapeXml(largest.title)}` : '暂无音频文件'}`
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Sakura Listening Room 音频档案</title>
  <desc id="desc">本地歌单中每首音频文件体积的横向条形图，数据来自 tracks.json 与 source/music。</desc>
  <rect width="${width}" height="${height}" rx="18" fill="#0b1213" />
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="17" fill="none" stroke="#263738" />
  <text x="${labelX}" y="40" fill="#d9ebe4" font-size="18" font-weight="600" letter-spacing="1.5">SOUND ARCHIVE / FILE SIZE</text>
  <text x="${labelX}" y="64" fill="#78918f" font-size="12">从 tracks.json 与本地音频自动读取 · 为 R2 迁移准备</text>
  <text x="${width - 72}" y="40" text-anchor="end" fill="#b8e5d0" font-size="13" font-weight="600">${formatNumber(availableEntries.length)} / ${formatNumber(entries.length)} files</text>
  <text x="${width - 72}" y="64" text-anchor="end" fill="#78918f" font-size="12">${escapeXml(summary)}</text>
  ${ticks}
  ${rows}
  <text x="${labelX}" y="${height - 16}" fill="#78918f" font-size="11" letter-spacing=".6">更新方式：修改歌曲数据或音频文件后运行 npm run listening:chart</text>
</svg>
`

await writeFile(chartPath, svg, 'utf8')
console.log(`Generated ${path.relative(root, chartPath)} from ${entries.length} track${entries.length === 1 ? '' : 's'}.`)
