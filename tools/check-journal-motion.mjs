import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const base = process.env.SONIC_TEST_URL || 'http://localhost:4000'
const output = path.join(tmpdir(), 'sakura-motion-qa')
await mkdir(output, { recursive: true })
const errors = []
page.on('pageerror', error => errors.push(error.message))
const settleScroll = async () => { await page.waitForTimeout(350) }
const goToChapter = async index => {
  await page.locator(`[data-journal-chapter="${index}"]`).evaluate(element => {
    const bounds = element.getBoundingClientRect()
    scrollTo({ top: scrollY + bounds.top + bounds.height / 2 - innerHeight * .53, behavior: 'instant' })
  })
  await settleScroll()
}
try {
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-journal-play]:not([hidden])')
  assert.equal(await page.locator('[data-personal-archive]').count(), 1)
  assert.equal(await page.locator('[data-archive-mode="sound"]').first().getAttribute('aria-current'), 'location')
  const openingTurn = await page.locator('[data-personal-archive]').evaluate(element => element.style.getPropertyValue('--archive-disc-turn'))
  await page.evaluate(() => scrollTo({ top: 220, behavior: 'instant' }))
  await settleScroll()
  const travellingTurn = await page.locator('[data-personal-archive]').evaluate(element => element.style.getPropertyValue('--archive-disc-turn'))
  const scanPosition = await page.locator('[data-archive-canvas]').evaluate(element => element.style.getPropertyValue('--archive-scan-position'))
  assert.notEqual(travellingTurn, openingTurn, 'cover record should turn as the page scrolls')
  assert.notEqual(scanPosition, '8%', 'scanline should travel with page scroll')
  assert.match(await page.locator('[data-archive-progress]').textContent(), /TRACE \/ 0\d\d%/)
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  await settleScroll()
  await page.locator('.archive-index__items [data-archive-mode="notes"]').click()
  assert.equal(await page.locator('[data-personal-archive]').getAttribute('data-selected-mode'), 'notes')
  assert.equal(await page.locator('[data-archive-title]').textContent(), await page.evaluate(() => window.__SAKURA_NOTES[0].title))
  assert.equal(await page.locator('[data-archive-link]').getAttribute('href'), await page.evaluate(() => window.__SAKURA_NOTES[0].url))
  await page.locator('.archive-pin--three').click()
  assert.equal(await page.locator('[data-archive-label]').textContent(), 'FILE 03 / VISUAL FRAGMENTS')
  await page.locator('.archive-index__items [data-archive-mode="sound"]').click()
  assert.equal(await page.locator('.journal-journey').count(), 1)
  await page.locator('[data-archive-link]').click()
  await page.waitForSelector('[data-archive-boot]:not([hidden])')
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('[data-archive-boot]').isVisible(), false)
  assert.equal(await page.evaluate(() => location.hash), '')
  assert.equal(await page.evaluate(() => document.activeElement?.matches('[data-archive-link]')), true)
  await page.locator('[data-archive-link]').click()
  await page.waitForSelector('[data-archive-boot]:not([hidden])')
  await page.waitForFunction(() => location.hash === '#mood-radio')
  assert.equal(await page.locator('[data-archive-boot]').isVisible(), false)
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  await settleScroll()
  const order = await page.evaluate(() => ['.journal-journey', '#recent-posts', '#mood-radio', '#record-library', '#journal-workshop'].map(selector => document.querySelector(selector).getBoundingClientRect().top))
  assert.deepEqual(order, order.slice().sort((a, b) => a - b))
  assert.equal(await page.locator('#record-library').evaluate(element => element.open), false)
  // The existing hero playlist CTA must still reveal its destination.
  await page.locator('.midnight-play').click()
  assert.equal(await page.locator('#record-library').evaluate(element => element.open), true)
  await page.locator('#record-library').evaluate(element => { element.open = false })
  let rotation = ''
  for (let i = 0; i < 3; i++) {
    await goToChapter(i)
    assert.equal(await page.locator(`[data-journal-cover="${i}"]`).evaluate(element => element.classList.contains('is-current')), true)
    const current = await page.locator('.journal-scene').evaluate(element => element.style.getPropertyValue('--record-turn'))
    if (rotation) assert.notEqual(current, rotation)
    rotation = current
  }
  await goToChapter(1)
  const stickyTop = await page.locator('.journal-scene').evaluate(element => element.getBoundingClientRect().top)
  assert.ok(Math.abs(stickyTop - 172) < 3, `scene should stick at 172px, got ${stickyTop}`)
  await page.screenshot({ path: path.join(output, 'journey-desktop.png') })
  await page.locator('[data-journal-play="odoriko"]').click()
  await page.waitForFunction(() => window.__sakuraPlayer.currentTrack.id === 'odoriko' && !window.__sakuraPlayer.audio.paused)
  assert.equal(await page.locator('[data-journal-play="odoriko"]').textContent(), 'Ⅱ')
  await page.locator('[data-journal-anchor="journal-workshop"]').click()
  await page.waitForFunction(() => document.activeElement?.id === 'journal-workshop')
  await page.locator('[data-mixtape-random]').click()
  await page.locator('[data-mixtape-name]').fill('今晚留给自己')
  assert.equal(await page.locator('[data-journal-tape-name]').textContent(), '今晚留给自己')
  await page.locator('[data-journal-flip]').click()
  assert.equal(await page.locator('.journal-tape__back').evaluate(element => element.inert), false)
  await page.locator('[data-journal-tape-message]').fill('声音记得，今天也有好好生活。')
  assert.equal(await page.evaluate(() => localStorage.getItem('sakura-tape-message-v1')), '声音记得，今天也有好好生活。')
  await page.waitForTimeout(900)
  await page.locator('.journal-tape').screenshot({ path: path.join(output, 'tape-back.png') })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-journal-flip]:not([hidden])')
  await page.locator('[data-journal-flip]').click()
  assert.equal(await page.locator('[data-journal-tape-message]').inputValue(), '声音记得，今天也有好好生活。')
  // Repeated lifecycle events must not cause a double flip or extra scenes.
  await page.evaluate(() => { for (let i = 0; i < 3; i++) document.dispatchEvent(new Event('pjax:complete')) })
  await page.locator('[data-journal-flip]').click()
  assert.equal(await page.locator('.journal-tape').evaluate(element => element.classList.contains('is-flipped')), false)
  assert.equal(await page.locator('.journal-tape__front').evaluate(element => element.inert), false)
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await settleScroll()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
    assert.equal(overflow, false, `horizontal overflow at ${width}px`)
    for (const selector of ['.journal-nav', '.journal-journey', '.journal-tape']) {
      assert.equal(await page.locator(selector).evaluate(element => element.scrollWidth > element.clientWidth + 1), false, `${selector} overflow at ${width}px`)
    }
    if (width === 390) {
      await page.locator('.journal-tape').scrollIntoViewIfNeeded()
      await page.screenshot({ path: path.join(output, 'tape-mobile.png') })
      await page.locator('.journal-journey').screenshot({ path: path.join(output, 'journey-mobile.png') })
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await goToChapter(1)
  assert.equal(await page.locator('.journal-scene__record').evaluate(element => getComputedStyle(element).transform), 'none')
  await page.locator('[data-journal-flip]').click()
  assert.equal(await page.locator('.journal-tape__object').evaluate(element => getComputedStyle(element).transitionDuration), '0s')
  // Test actual Pjax leave/return instead of only synthetic lifecycle events.
  await page.locator('.journal-chapter > a').first().click()
  await page.waitForSelector('[data-sonic-reading]:not([hidden])')
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-journal-flip]:not([hidden])')
  await page.locator('[data-journal-flip]').click()
  assert.equal(await page.locator('.journal-tape').evaluate(element => element.classList.contains('is-flipped')), true)
  assert.deepEqual(errors, [])
  const staticContext = await browser.newContext({ javaScriptEnabled: false })
  const staticPage = await staticContext.newPage()
  await staticPage.goto(base, { waitUntil: 'domcontentloaded' })
  assert.equal(await staticPage.locator('.journal-chapter > a').count(), 3)
  assert.equal(await staticPage.locator('.archive-index__items [data-archive-mode]').count(), 4)
  await staticPage.locator('#record-library summary').click()
  assert.equal(await staticPage.locator('#listening-room').isVisible(), true)
  await staticContext.close()
  console.log(`PASS: layout order, cabinet CTA, scroll rotation/cover switching/sticky scene, real audio, chapter navigation, cassette flip/note persistence, Pjax, 320/390/768px, reduced motion and static fallback. Screenshots: ${output}`)
} finally { await browser.close() }
