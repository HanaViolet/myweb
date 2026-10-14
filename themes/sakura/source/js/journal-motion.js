'use strict';

(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const compact = matchMedia('(max-width: 760px)')
  const player = () => window.__sakuraPlayer
  const clamp = value => Math.min(1, Math.max(0, value))
  let cleanup = () => {}
  const init = () => {
    cleanup()
    const abort = new AbortController()
    const on = (node, type, callback, options = {}) => node?.addEventListener(type, callback, { ...options, signal: abort.signal })
    let frame = 0
    const journey = document.querySelector('.journal-journey')
    const chapters = [...document.querySelectorAll('[data-journal-chapter]')]
    const scene = document.querySelector('.journal-scene')
    const covers = [...document.querySelectorAll('[data-journal-cover]')]
    const routeButtons = [...document.querySelectorAll('[data-journal-route]')]
    const nav = document.querySelector('.journal-nav')
    const anchors = [...document.querySelectorAll('[data-journal-anchor]')]
    const sections = anchors.map(anchor => document.getElementById(anchor.dataset.journalAnchor))
    const driftImages = [...document.querySelectorAll('.is-midnight-home .midnight-filmstrip img, .is-midnight-home .recent-post-item .post-bg')]
    const revealItems = [...document.querySelectorAll('.journal-chapter, .recent-post-item, .sonic-console, .room-postcard, .room-mixtape, .midnight-filmstrip figure')]
    let active = -1
    let revealObserver
    const paint = () => {
      frame = 0
      if (document.hidden) return
      const height = innerHeight
      if (journey) {
        const bounds = journey.querySelector('.journal-journey__layout').getBoundingClientRect()
        const progress = clamp((height * .35 - bounds.top) / Math.max(1, bounds.height - height * .5))
        scene.style.setProperty('--record-turn', `${motion.matches ? 0 : progress * 290}deg`)
        scene.style.setProperty('--sleeve-turn', `${motion.matches || compact.matches ? 0 : -7 + progress * 12}deg`)
        scene.style.setProperty('--record-slide', `${motion.matches || compact.matches ? 0 : 16 + progress * 14}%`)
        let nearest = 0
        let distance = Infinity
        chapters.forEach((chapter, index) => {
          const rect = chapter.getBoundingClientRect()
          const delta = Math.abs(rect.top + rect.height / 2 - height * .53)
          if (delta < distance) { distance = delta; nearest = index }
          const fill = motion.matches ? 100 : 20 + clamp((height * .9 - rect.top) / (height * .5)) * 80
          chapter.style.setProperty('--chapter-ink', `${fill}%`)
        })
        if (nearest !== active) {
          active = nearest
          chapters.forEach((chapter, index) => chapter.classList.toggle('is-current', index === active))
          covers.forEach((cover, index) => cover.classList.toggle('is-current', index === active))
          routeButtons.forEach((button, index) => {
            if (index === active) button.setAttribute('aria-current', 'location')
            else button.removeAttribute('aria-current')
          })
          scene.style.setProperty('--route-progress', String(active / Math.max(1, chapters.length - 1)))
          scene.dataset.activeChapter = String(active)
          scene.style.setProperty('--scene-accent', chapters[active].dataset.journalColor)
          scene.querySelector('[data-journal-scene-label]').textContent = chapters[active].querySelector('.journal-kicker').textContent
        }
      }
      if (nav) {
        let index = 0
        sections.forEach((section, i) => { if (section && section.getBoundingClientRect().top < height * .48) index = i })
        anchors.forEach((anchor, i) => { if (index === i) anchor.setAttribute('aria-current', 'location'); else anchor.removeAttribute('aria-current') })
        nav.style.setProperty('--page-progress', clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - height)))
      }
      driftImages.forEach(image => {
        const rect = image.parentElement.getBoundingClientRect()
        if (motion.matches || compact.matches) image.style.removeProperty('--journal-drift')
        else if (rect.bottom > -100 && rect.top < height + 100) image.style.setProperty('--journal-drift', `${(clamp((height - rect.top) / (height + rect.height)) - .5) * 24}px`)
      })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint) }
    on(window, 'scroll', schedule, { passive: true })
    on(window, 'resize', schedule, { passive: true })
    on(document, 'visibilitychange', schedule)
    on(motion, 'change', schedule)
    on(compact, 'change', schedule)
    const resize = new ResizeObserver(schedule)
    if (journey) resize.observe(journey)
    if (nav) resize.observe(document.body)
    if (revealItems.length && !motion.matches && 'IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed')
          revealObserver.unobserve(entry.target)
        }
      }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
      revealItems.forEach((item, index) => {
        item.style.setProperty('--reveal-delay', `${(index % 4) * 75}ms`)
        revealObserver.observe(item)
      })
      document.body.classList.add('has-scroll-reveal')
    }
    on(nav, 'click', event => {
      const link = event.target.closest('[data-journal-anchor]')
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      const target = document.getElementById(link.dataset.journalAnchor)
      if (!target) return
      event.preventDefault()
      target.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' })
      history.replaceState(history.state, '', `#${target.id}`)
      // Keep keyboard navigation at the chosen section rather than in the rail.
      target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
    })
    routeButtons.forEach((button, index) => {
      on(button, 'click', () => {
        const target = chapters[index]
        if (!target) return
        target.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'center' })
        target.setAttribute('tabindex', '-1')
        target.focus({ preventScroll: true })
      })
      on(button, 'keydown', event => {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return
        event.preventDefault()
        const delta = ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 1
        routeButtons[(index + delta + routeButtons.length) % routeButtons.length]?.focus()
      })
    })
    document.querySelectorAll('[data-journal-play]').forEach(button => {
      button.hidden = false
      on(button, 'click', () => {
        if (!player()) return
        if (player().currentTrack.id === button.dataset.journalPlay && !player().audio.paused) player().pause()
        else player().selectById(button.dataset.journalPlay)
      })
    })
    const syncPlayback = () => {
      document.querySelectorAll('[data-journal-play]').forEach(button => {
        const playing = player()?.currentTrack?.id === button.dataset.journalPlay && !player()?.audio.paused
        const track = (window.__SAKURA_TRACKS || []).find(track => track.id === button.dataset.journalPlay)
        button.textContent = playing ? 'Ⅱ' : '▶'
        button.setAttribute('aria-label', `${playing ? '暂停' : '播放'}${track?.title || '配乐'}`)
      })
      const root = document.querySelector('[data-mixtape]')
      const selected = root?.__mixtapeState?.ids || []
      document.querySelector('[data-journal-tape]')?.classList.toggle('is-playing', selected.includes(player()?.currentTrack?.id) && !player()?.audio.paused)
    }
    on(document, 'sakura:trackchange', syncPlayback)
    on(document, 'sakura:playbackchange', syncPlayback)

    const tape = document.querySelector('[data-journal-tape]')
    let tapeObserver
    if (tape) {
      const flip = tape.querySelector('[data-journal-flip]')
      const front = tape.querySelector('.journal-tape__front')
      const back = tape.querySelector('.journal-tape__back')
      const message = tape.querySelector('[data-journal-tape-message]')
      const feedback = tape.querySelector('[data-journal-tape-feedback]')
      const name = document.querySelector('[data-mixtape-name]')
      tape.classList.add('is-enhanced')
      flip.hidden = false
      back.hidden = false
      const alreadyFlipped = tape.classList.contains('is-flipped')
      front.inert = alreadyFlipped
      back.inert = !alreadyFlipped
      front.setAttribute('aria-hidden', String(alreadyFlipped))
      back.setAttribute('aria-hidden', String(!alreadyFlipped))
      flip.setAttribute('aria-pressed', String(alreadyFlipped))
      flip.textContent = alreadyFlipped ? '翻回 A 面，看见今晚的声音 ↻' : '翻到 B 面，留一句话 ↻'
      try { message.value = (localStorage.getItem('sakura-tape-message-v1') || '').slice(0, 120) } catch (_) {}
      on(message, 'input', () => {
        try { localStorage.setItem('sakura-tape-message-v1', message.value); feedback.textContent = `${message.value.length} / 120 · 已保存在这台浏览器` }
        catch (_) { feedback.textContent = '浏览器无法保存；请复制这句话留存。' }
      })
      on(flip, 'click', () => {
        const flipped = tape.classList.toggle('is-flipped')
        front.inert = flipped
        back.inert = !flipped
        front.setAttribute('aria-hidden', String(flipped))
        back.setAttribute('aria-hidden', String(!flipped))
        flip.setAttribute('aria-pressed', String(flipped))
        flip.textContent = flipped ? '翻回 A 面，看见今晚的声音 ↻' : '翻到 B 面，留一句话 ↻'
      })
      const updateName = () => { tape.querySelector('[data-journal-tape-name]').textContent = name?.value.trim() || 'SAKURA / AFTER HOURS'; syncPlayback() }
      on(name, 'input', updateName)
      tapeObserver = new MutationObserver(updateName)
      const slots = document.querySelector('[data-mixtape-slots]')
      if (slots) tapeObserver.observe(slots, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-track-id'] })
      updateName()
    }
    const inView = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('journal-in-view', entry.isIntersecting)))
    if (tape) inView.observe(tape)
    on(document, 'visibilitychange', () => tape?.classList.toggle('journal-background', document.hidden))
    tape?.classList.toggle('journal-background', document.hidden)
    syncPlayback()
    paint()
    cleanup = () => { abort.abort(); cancelAnimationFrame(frame); resize.disconnect(); inView.disconnect(); revealObserver?.disconnect(); tapeObserver?.disconnect(); document.body.classList.remove('has-scroll-reveal') }
  }
  document.addEventListener('DOMContentLoaded', init)
  document.addEventListener('pjax:send', () => cleanup())
  document.addEventListener('pjax:complete', init)
})()
