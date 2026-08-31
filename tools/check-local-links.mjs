import { access, readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const publicRoot = path.resolve(process.cwd(), 'public')
const linkPattern = /(?:href|src)=["']([^"'#?]+)["']/gi
const externalPattern = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i

async function exists (target) {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

async function walk (directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async entry => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(target) : [target]
  }))
  return nested.flat()
}

function decodeLocalPath (value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

async function resolveTarget (pagePath, rawUrl) {
  const decoded = decodeLocalPath(rawUrl)
  let target = decoded.startsWith('/')
    ? path.join(publicRoot, decoded.replace(/^[/\\]+/, ''))
    : path.resolve(path.dirname(pagePath), decoded)

  if (decoded.endsWith('/')) target = path.join(target, 'index.html')
  if (await exists(target)) {
    const info = await stat(target)
    return info.isDirectory() ? path.join(target, 'index.html') : target
  }
  return target
}

const files = await walk(publicRoot)
const htmlFiles = files.filter(file => file.endsWith('.html'))
const broken = []

for (const pagePath of htmlFiles) {
  const html = await readFile(pagePath, 'utf8')
  for (const match of html.matchAll(linkPattern)) {
    const rawUrl = match[1].trim()
    if (!rawUrl || externalPattern.test(rawUrl)) continue
    const target = await resolveTarget(pagePath, rawUrl)
    if (!await exists(target)) {
      broken.push({
        page: path.relative(publicRoot, pagePath).replaceAll('\\', '/'),
        url: rawUrl
      })
    }
  }
}

if (broken.length) {
  console.error(`Found ${broken.length} broken local link(s):`)
  for (const item of broken) console.error(`- ${item.page}: ${item.url}`)
  process.exitCode = 1
} else {
  console.log(`Checked ${htmlFiles.length} HTML files: no broken local links.`)
}
