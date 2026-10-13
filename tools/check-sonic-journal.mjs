import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const base = process.env.SONIC_TEST_URL || 'http://localhost:4000'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
const output = path.join(tmpdir(), 'sakura-sonic-qa')
await mkdir(output, { recursive: true })
try {
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__sakuraPlayer && document.querySelector('[data-sonic-play]:not([hidden])'))
  assert.equal(await page.locator('[data-sonic-radio]').count(), 1)
  assert.equal(await page.locator('[data-sonic-station]').count(), 4)
  for (let i = 0; i < 4; i++) {
    await page.locator(`[data-sonic-station="${i}"]`).click()
    assert.equal(await page.locator(`[data-sonic-station="${i}"]`).getAttribute('aria-pressed'), 'true')
    assert.equal(await page.locator('[data-sonic-note]').getAttribute('href'), await page.evaluate(index => window.__SAKURA_STATIONS[index].notes[0].url, i))
  }
  await page.locator('[data-sonic-next]').focus()
  await page.keyboard.press('Enter')
  assert.equal(await page.locator('[data-sonic-frequency]').textContent(), '88.3')
  const before = await page.locator('[data-sonic-song]').textContent()
  await page.locator('[data-sonic-shuffle]').click()
  assert.notEqual(await page.locator('[data-sonic-song]').textContent(), before)
  await page.locator('[data-sonic-radio]').screenshot({ path: path.join(output, 'radio-desktop.png') })
  await page.locator('[data-sonic-play]').click()
  await page.waitForFunction(() => !window.__sakuraPlayer.audio.paused && window.__sakuraPlayer.audio.currentTime > 0)
  assert.equal(await page.locator('[data-sonic-play]').textContent(), 'Ⅱ')
  await page.locator('[data-sonic-play]').click()
  assert.equal(await page.evaluate(() => window.__sakuraPlayer.audio.paused), true)

  // Visit the paired article through the real Pjax navigation path.
  await page.locator('[data-sonic-note]').click()
  await page.waitForSelector('[data-sonic-reading]:not([hidden])')
  await page.locator('[data-sonic-reading-play]').click()
  await page.waitForFunction(() => !window.__sakuraPlayer.audio.paused && Number.isFinite(window.__sakuraPlayer.audio.duration))
  await page.evaluate(() => { window.__sakuraPlayer.audio.currentTime = 23 })
  await page.evaluate(() => { const a = document.querySelector('#article-container'); scrollTo(0, a.getBoundingClientRect().top + scrollY + Math.max(0, a.offsetHeight - innerHeight) * .4) })
  await page.locator('.reading-desk [data-sonic-bookmark]').click()
  const mark = await page.evaluate(() => JSON.parse(localStorage.getItem(`sakura-soundmark-v1:${location.pathname}`)))
  assert.ok(mark.seconds >= 23)
  assert.ok(mark.progress > .1, 'bookmark captures a position within the article')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-sonic-resume]:not([hidden])')
  await page.locator('[data-sonic-resume]').click()
  await page.waitForFunction(() => window.__sakuraPlayer.audio.currentTime >= 23 && !window.__sakuraPlayer.audio.paused)
  await page.locator('[data-sonic-reading]').screenshot({ path: path.join(output, 'reading-desktop.png') })
  await page.setViewportSize({ width: 320, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'article toolbar fits mobile')
  await page.setViewportSize({ width: 1440, height: 1000 })

  await page.goto(`${base}/listening/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-sonic-station="0"]')
  await page.locator('[data-sonic-station="2"]').click()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelector('[data-sonic-station="2"]')?.getAttribute('aria-pressed') === 'true')
  // Reinitialization must not multiply handlers or duplicate controls.
  await page.evaluate(() => { for (let i = 0; i < 3; i++) document.dispatchEvent(new Event('pjax:complete')) })
  await page.locator('[data-sonic-next]').click()
  assert.equal(await page.locator('[data-sonic-frequency]').textContent(), '106.2')

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await page.locator('[data-sonic-radio]').scrollIntoViewIfNeeded()
    const overflow = await page.evaluate(() => {
      const radio = document.querySelector('[data-sonic-radio]')
      return radio.scrollWidth > radio.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 1
    })
    assert.equal(overflow, false, `overflow at ${width}px`)
    await page.locator('[data-sonic-radio]').screenshot({ path: path.join(output, `radio-${width}.png`), style: '#nav, #sakura-player, .skip-link { visibility: hidden !important; }' })
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await page.locator('.sonic-spectrum i').first().evaluate(element => getComputedStyle(element).animationName), 'none')
  const staticContext = await browser.newContext({ javaScriptEnabled: false })
  const staticPage = await staticContext.newPage()
  await staticPage.goto(base, { waitUntil: 'domcontentloaded' })
  assert.equal(await staticPage.locator('[data-sonic-note]').isVisible(), true)
  assert.equal(await staticPage.locator('[data-sonic-play]').isVisible(), false)
  await staticContext.close()
  assert.deepEqual(errors, [])
  console.log(`PASS: 4 channels, pairing, real audio, Pjax, sound bookmark reload/seek, persistence, 320/390px, reduced motion, no-JS fallback. Screenshots: ${output}`)
} finally {
  await browser.close()
}
