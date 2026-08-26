import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'docs', 'traffic.json')
const chartPath = path.join(root, 'docs', 'traffic.svg')

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const data = JSON.parse(await readFile(dataPath, 'utf8'))
if (!Array.isArray(data.points) || data.points.length === 0) {
  throw new Error('docs/traffic.json must contain at least one point')
}

const points = data.points
  .map((point) => ({
    date: String(point.date),
    uv: Number(point.uv),
    pv: Number(point.pv)
  }))
  .sort((a, b) => a.date.localeCompare(b.date))

for (const point of points) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(point.date) || !Number.isFinite(point.uv) || !Number.isFinite(point.pv) || point.uv < 0 || point.pv < 0) {
    throw new Error(`Invalid traffic point: ${JSON.stringify(point)}`)
  }
}

const width = 960
const height = 430
const margin = { top: 76, right: 58, bottom: 82, left: 76 }
const plotWidth = width - margin.left - margin.right
const plotHeight = height - margin.top - margin.bottom
const maxValue = Math.max(...points.flatMap((point) => [point.uv, point.pv]), 1)
const tickStep = Math.max(1, Math.ceil(maxValue / 4 / 10) * 10)
const domainMax = Math.max(tickStep * 4, 10)

const x = (index) => points.length === 1
  ? margin.left + plotWidth / 2
  : margin.left + (index / (points.length - 1)) * plotWidth
const y = (value) => margin.top + plotHeight - (value / domainMax) * plotHeight
const linePath = (key) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(2)} ${y(point[key]).toFixed(2)}`).join(' ')
const formatNumber = (value) => new Intl.NumberFormat('zh-CN').format(value)
const formatDate = (value) => value.slice(5).replace('-', '/')
const latest = points.at(-1)
const snapshotLabel = points.length === 1 ? '等待更多采样' : `${points.length} 个日快照`

const grid = Array.from({ length: 5 }, (_, index) => {
  const value = domainMax - index * tickStep
  const lineY = y(value)
  return `<line x1="${margin.left}" y1="${lineY.toFixed(2)}" x2="${width - margin.right}" y2="${lineY.toFixed(2)}" stroke="#253638" stroke-width="1" />\n  <text x="${margin.left - 18}" y="${(lineY + 4).toFixed(2)}" text-anchor="end" fill="#78918f" font-size="12">${formatNumber(value)}</text>`
}).join('\n  ')

const labels = points.map((point, index) => {
  const anchor = points.length === 1 ? 'middle' : index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'
  return `<text x="${x(index).toFixed(2)}" y="${height - 42}" text-anchor="${anchor}" fill="#78918f" font-size="12">${escapeXml(formatDate(point.date))}</text>`
}).join('\n  ')

const series = (key, color, label) => {
  const lastX = x(points.length - 1)
  const lastY = y(latest[key])
  return `<path d="${linePath(key)}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />\n  <circle cx="${lastX.toFixed(2)}" cy="${lastY.toFixed(2)}" r="5" fill="${color}" stroke="#081011" stroke-width="3" />\n  <text x="${(lastX + 13).toFixed(2)}" y="${(lastY + 4).toFixed(2)}" fill="${color}" font-size="12" font-weight="600">${label} ${formatNumber(latest[key])}</text>`
}

const emptyHint = points.length === 1
  ? `<text x="${width / 2}" y="${margin.top + plotHeight / 2 + 4}" text-anchor="middle" fill="#78918f" font-size="13" letter-spacing="1">${snapshotLabel} · 追加每日数据后折线会展开</text>`
  : ''

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Sakura Listening Room 访问趋势</title>
  <desc id="desc">Busuanzi 累计访客数 UV 与浏览量 PV 的日快照折线图。</desc>
  <rect width="${width}" height="${height}" rx="18" fill="#0b1213" />
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="17" fill="none" stroke="#263738" />
  <text x="${margin.left}" y="34" fill="#d9ebe4" font-size="18" font-weight="600" letter-spacing="1.5">VISITOR SNAPSHOTS</text>
  <text x="${margin.left}" y="55" fill="#78918f" font-size="12">Busuanzi · 累计 UV / PV · ${escapeXml(data.timezone || 'local time')}</text>
  <text x="${width - margin.right}" y="35" text-anchor="end" fill="#78918f" font-size="12">更新 ${escapeXml(String(data.updatedAt || latest.date).slice(0, 10))}</text>
  ${grid}
  <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${width - margin.right}" y2="${margin.top + plotHeight}" stroke="#496260" stroke-width="1" />
  ${series('pv', '#b8e5d0', 'PV')}
  ${series('uv', '#8da9ff', 'UV')}
  ${labels}
  ${emptyHint}
  <g transform="translate(${margin.left}, ${height - 20})">
    <circle cx="0" cy="-4" r="4" fill="#b8e5d0" /><text x="12" y="0" fill="#b8e5d0" font-size="12">页面浏览量 PV</text>
    <circle cx="142" cy="-4" r="4" fill="#8da9ff" /><text x="154" y="0" fill="#8da9ff" font-size="12">独立访客 UV</text>
  </g>
</svg>
`

await writeFile(chartPath, svg, 'utf8')
console.log(`Generated ${path.relative(root, chartPath)} from ${points.length} point${points.length === 1 ? '' : 's'}.`)
