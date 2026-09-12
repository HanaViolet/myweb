'use strict';

(() => {
  let cleanup = null
  const init = () => {
    cleanup?.()
    cleanup = null
    const wall = document.querySelector('.visual-wall')
    if (!wall) return
    const controller = new AbortController()
    const listen = (element, type, handler, capture = false) => element.addEventListener(type, handler, { signal: controller.signal, capture })
    const cards = [...wall.querySelectorAll('[data-wall-card]')]
    const dialog = wall.querySelector('[data-wall-dialog]')
    const image = wall.querySelector('[data-wall-detail-image]')
    const grid = wall.querySelector('[data-wall-grid]')
    const stage = wall.querySelector('[data-wall-stage]')
    if (!stage) return // Retain the plain gallery if older cached HTML is served.
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let mode = 'orbit'
    let batch = 0
    let rotation = 0
    let tilt = -16
    // The gallery opens as a living record. Respect reduced-motion users while
    // making the normal first visit feel active without requiring a click.
    let autoRotate = !motion.matches
    let inView = false
    let frame = 0
    let lastFrame = 0
    let dragging = null
    let ignoreClickUntil = 0
    let modeSwitching = false
    let modeSwitchTimer = 0
    const orbitSize = 12
    const transform = () => {
      grid.style.setProperty('--orbit-spin', `${rotation}deg`)
      grid.style.setProperty('--orbit-tilt', `${tilt}deg`)
    }
    const stopFrame = () => { cancelAnimationFrame(frame); frame = 0; lastFrame = 0 }
    const tick = now => {
      if (!autoRotate || !inView || mode !== 'orbit' || motion.matches || dialog.open || document.hidden || dragging) { stopFrame(); return }
      rotation += Math.min(now - (lastFrame || now), 50) * .003
      lastFrame = now
      transform()
      frame = requestAnimationFrame(tick)
    }
    const startFrame = () => { if (!frame && autoRotate && inView && mode === 'orbit' && !motion.matches && !dialog.open && !document.hidden && !dragging) frame = requestAnimationFrame(tick) }
    const syncMotionButton = () => {
      const button = wall.querySelector('[data-orbit-motion]')
      if (!button) return
      button.disabled = motion.matches
      button.setAttribute('aria-pressed', String(autoRotate))
      button.textContent = autoRotate ? '停止旋转' : '自动旋转'
    }
    const layout = () => {
      wall.classList.toggle('is-orbit', mode === 'orbit')
      const start = batch * orbitSize
      const subset = visible.slice(start, start + orbitSize)
      cards.forEach(card => {
        const index = subset.indexOf(card)
        card.hidden = mode === 'orbit' ? index < 0 : !visible.includes(card)
        if (index >= 0) card.style.setProperty('--orbit-angle', `${index * 360 / subset.length}deg`)
      })
      wall.querySelector('[data-orbit-range]').textContent = `${start + 1}—${Math.min(start + orbitSize, visible.length)} / ${visible.length}`
      wall.querySelectorAll('[data-orbit-batch]').forEach(button => { button.disabled = visible.length <= orbitSize })
      wall.querySelectorAll('[data-wall-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.wallView === mode)))
      wall.querySelector('[data-orbit-controls]').hidden = mode !== 'orbit'
      transform()
      stopFrame()
      startFrame()
    }
    const transitionMode = nextMode => {
      if (nextMode === mode || modeSwitching) return
      modeSwitching = true
      stopFrame()
      clearTimeout(modeSwitchTimer)
      stage.classList.remove('is-view-enter')
      stage.classList.add('is-view-exit')
      modeSwitchTimer = window.setTimeout(() => {
        mode = nextMode
        layout()
        stage.classList.remove('is-view-exit')
        stage.classList.add('is-view-enter', 'is-card-arrival')
        // Let the browser commit the new geometry before the arrival easing.
        requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove('is-view-enter')))
        modeSwitchTimer = window.setTimeout(() => {
          stage.classList.remove('is-card-arrival')
          modeSwitching = false
          startFrame()
        }, 620)
      }, 220)
    }
    const visibilityObserver = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; if (inView) startFrame(); else stopFrame() })
    if (stage) visibilityObserver.observe(stage)
    let visible = cards.slice()
    let selected = 0
    let origin = null
    let previousOverflow = ''
    let locked = false
    let animation = null
    const animate = element => {
      animation?.cancel()
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !element.animate) return
      animation = element.animate([{ opacity: .35, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, easing: 'ease-out' })
    }
    const music = () => {
      const player = window.__sakuraPlayer
      const button = wall.querySelector('[data-wall-music]')
      button.disabled = !player
      wall.querySelector('[data-wall-track]').textContent = player?.currentTrack ? `${player.currentTrack.title} · ${player.currentTrack.artist}` : '到听歌室选择一首歌'
      button.textContent = player && !player.audio.paused ? '暂停音乐' : '播放音乐'
    }
    const render = () => {
      const card = visible[selected]
      if (!card) return
      wall.querySelector('[data-wall-image-error]').hidden = true
      image.src = card.href
      image.alt = card.dataset.wallTitle
      wall.querySelector('[data-wall-detail-title]').textContent = card.dataset.wallTitle
      wall.querySelector('[data-wall-position]').textContent = `${selected + 1} / ${visible.length} · ${card.dataset.wallSeries}`
      wall.querySelector('[data-wall-original]').href = card.href
      animate(image)
      music()
    }
    const unlock = () => {
      if (!locked) return
      document.body.style.overflow = previousOverflow
      locked = false
    }
    const close = () => {
      dialog.close()
      unlock()
    }
    listen(wall, 'click', event => {
      const filter = event.target.closest('[data-wall-filter]')
      if (filter) {
        const series = filter.dataset.wallFilter
        visible = cards.filter(card => series === 'all' || card.dataset.wallSeries === series)
        batch = 0
        wall.querySelectorAll('[data-wall-filter]').forEach(button => button.setAttribute('aria-pressed', String(button === filter)))
        wall.querySelector('[data-wall-count]').textContent = `${visible.length} 个片段${series === 'all' ? '' : ` / ${series}`}`
        layout()
      }
      const view = event.target.closest('[data-wall-view]')
      if (view) transitionMode(view.dataset.wallView)
      const turn = event.target.closest('[data-orbit-turn]')
      if (turn) { rotation += Number(turn.dataset.orbitTurn) * 30; transform() }
      const group = event.target.closest('[data-orbit-batch]')
      if (group) { batch = (batch + Number(group.dataset.orbitBatch) + Math.ceil(visible.length / orbitSize)) % Math.ceil(visible.length / orbitSize); layout() }
      if (event.target.closest('[data-orbit-reset]')) { tilt = 0; rotation = 0; transform() }
      if (event.target.closest('[data-orbit-motion]')) {
        if (motion.matches || modeSwitching) return
        autoRotate = !autoRotate
        syncMotionButton()
        if (autoRotate) startFrame(); else stopFrame()
      }
      const card = event.target.closest('[data-wall-card]')
      if (card && performance.now() < ignoreClickUntil) { event.preventDefault(); event.stopPropagation(); return }
      if (card && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0 && typeof dialog.showModal === 'function') {
        // Prevent Pjax from treating an image as an HTML page.
        event.preventDefault()
        event.stopPropagation()
        selected = visible.indexOf(card)
        origin = card
        render()
        previousOverflow = document.body.style.overflow
        locked = true
        document.body.style.overflow = 'hidden'
        dialog.showModal()
        stopFrame()
        wall.querySelector('[data-wall-close]').focus()
      }
      if (event.target.closest('[data-wall-close]')) close()
      if (event.target.closest('[data-wall-prev]')) { selected = (selected - 1 + visible.length) % visible.length; render() }
      if (event.target.closest('[data-wall-next]')) { selected = (selected + 1) % visible.length; render() }
      if (event.target.closest('[data-wall-music]')) document.querySelector('[data-player-play]')?.click()
    }, true)
    listen(dialog, 'click', event => {
      if (event.target !== dialog) return
      const bounds = dialog.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close()
    })
    listen(dialog, 'close', () => { unlock(); if (origin?.isConnected) origin.focus({ preventScroll: true }); startFrame() })
    listen(stage, 'dragstart', event => { if (mode === 'orbit') event.preventDefault() })
    listen(stage, 'pointerdown', event => {
      if (mode !== 'orbit' || event.button !== 0) return
      ignoreClickUntil = 0
      // Cards remain reliable click targets; drag the space between them.
      if (event.target.closest('[data-wall-card]')) return
      dragging = { id: event.pointerId, x: event.clientX, y: event.clientY, rotation, tilt, moved: false }
      stopFrame()
    })
    listen(window, 'pointermove', event => {
      if (!dragging || dragging.id !== event.pointerId) return
      const dx = event.clientX - dragging.x
      const dy = event.clientY - dragging.y
      if (Math.hypot(dx, dy) < 7 && !dragging.moved) return
      dragging.moved = true
      // Allow vertical touch scrolling; use horizontal touch drag for the ring.
      if (event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) && !stage.hasPointerCapture(event.pointerId)) { dragging = null; startFrame(); return }
      if (!stage.hasPointerCapture(event.pointerId)) stage.setPointerCapture(event.pointerId)
      rotation = dragging.rotation + dx * .3
      tilt = Math.max(-55, Math.min(55, dragging.tilt + dy * .2))
      transform()
    })
    const endDrag = event => {
      if (!dragging || dragging.id !== event.pointerId) return
      if (dragging.moved) ignoreClickUntil = performance.now() + 350
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId)
      dragging = null
      startFrame()
    }
    listen(window, 'pointerup', endDrag)
    listen(window, 'pointercancel', endDrag)
    listen(document, 'visibilitychange', () => { if (document.hidden) stopFrame(); else startFrame() })
    listen(motion, 'change', () => {
      autoRotate = !motion.matches
      syncMotionButton()
      if (motion.matches) stopFrame(); else startFrame()
    })
    listen(dialog, 'keydown', event => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
      event.preventDefault()
      selected = (selected + (event.key === 'ArrowRight' ? 1 : -1) + visible.length) % visible.length
      render()
    })
    listen(image, 'error', () => { wall.querySelector('[data-wall-image-error]').hidden = false })
    listen(document, 'sakura:trackchange', music)
    listen(document, 'sakura:playbackchange', music)
    wall.querySelector('[data-wall-views]').hidden = false
    wall.querySelector('[data-orbit-controls] p').textContent = '拖动空白区域旋转与调整视角 · 点击图片放大'
    // All movement starts only on request; reduced-motion users retain manual controls.
    syncMotionButton()
    layout()
    cleanup = () => { controller.abort(); stopFrame(); clearTimeout(modeSwitchTimer); visibilityObserver.disconnect(); animation?.cancel(); if (dialog.open) dialog.close(); unlock() }
  }
  document.addEventListener('DOMContentLoaded', init)
  document.addEventListener('pjax:complete', init)
  document.addEventListener('pjax:send', () => { cleanup?.(); cleanup = null })
})()
