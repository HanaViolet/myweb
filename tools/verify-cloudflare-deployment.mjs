const targetUrl = process.env.CLOUDFLARE_SITE_URL || 'https://sakura.luxe/about/'
const expectedMarker = (process.env.CLOUDFLARE_EXPECTED_MARKER || '').trim()
const timeoutMs = Math.min(15 * 60 * 1000, Math.max(30_000, Number(process.env.CLOUDFLARE_VERIFY_TIMEOUT_MS) || 10 * 60 * 1000))
const intervalMs = Math.min(60_000, Math.max(5_000, Number(process.env.CLOUDFLARE_VERIFY_INTERVAL_MS) || 15_000))

if (!expectedMarker) {
  throw new Error('CLOUDFLARE_EXPECTED_MARKER is required.')
}

const deadline = Date.now() + timeoutMs
let attempt = 0
let lastResult = 'not requested'

while (Date.now() < deadline) {
  attempt += 1
  const controller = new AbortController()
  const requestTimeout = setTimeout(() => controller.abort(), 20_000)

  try {
    const url = new URL(targetUrl)
    url.searchParams.set('_deploy_check', String(Date.now()))
    const response = await fetch(url, {
      headers: {
        'cache-control': 'no-cache',
        'user-agent': 'sakura-cloudflare-deployment-check/1.0'
      },
      redirect: 'follow',
      signal: controller.signal
    })
    const body = await response.text()
    if (response.ok && body.includes(expectedMarker)) {
      console.log(`[cloudflare] Deployment verified after ${attempt} attempt(s): ${expectedMarker}`)
      process.exit(0)
    }
    lastResult = `HTTP ${response.status}; marker ${body.includes(expectedMarker) ? 'present' : 'missing'}`
  } catch (error) {
    lastResult = error.name === 'AbortError' ? 'request timed out' : error.message
  } finally {
    clearTimeout(requestTimeout)
  }

  console.log(`[cloudflare] Attempt ${attempt}: ${lastResult}; waiting for Pages deployment...`)
  await new Promise((resolve) => setTimeout(resolve, intervalMs))
}

throw new Error(`Cloudflare Pages did not expose marker ${expectedMarker} within ${Math.round(timeoutMs / 1000)} seconds. Last result: ${lastResult}`)
