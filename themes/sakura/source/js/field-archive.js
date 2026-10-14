'use strict';

(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const clamp = value => Math.min(1, Math.max(0, value))
  let cleanup = () => {}

  const init = () => {
    cleanup()
    const archive = document.querySelector('[data-personal-archive]')
    if (!archive) return

    const abort = new AbortController()
    const on = (target, type, handler, options = {}) => {
      target?.addEventListener(type, handler, { ...options, signal: abort.signal })
    }
    const records = Array.isArray(window.__SAKURA_NOTES) ? window.__SAKURA_NOTES : []
    const tracks = Array.isArray(window.__SAKURA_TRACKS) ? window.__SAKURA_TRACKS : []
    const gallery = Array.isArray(window.__SAKURA_GALLERY) ? window.__SAKURA_GALLERY : []
    const latest = records[0]
    const firstTrack = tracks[0]
    const modes = {
      sound: {
        label: 'FILE 01 / FREQUENCY',
        system: 'SYNTHESIS / LISTENING OS',
        signal: 'SYNTHESIS / READY',
        title: '此刻的你，在哪个频率？',
        description: firstTrack
          ? `从「${firstTrack.title}」开始，让一首歌和一段文字在此相遇。`
          : '调到你的心情，让一首歌和一段文字在此相遇。',
        href: '#mood-radio',
        cta: '进入心情电台',
        bootTitle: '正在接入声音档案',
        bootSteps: ['ESTABLISHING PERSONAL CHANNEL', 'MATCHING THE LISTENING FREQUENCY', 'SOUND ARCHIVE / READY']
      },
      notes: {
        label: 'FILE 02 / FIELD NOTES',
        system: 'CENTRAL MEMORY CONTROL',
        signal: 'DOSSIER / READY',
        title: latest?.title || '最近写下的事',
        description: '最新一篇手记已经收进档案，读完还可以继续检索完整索引。',
        href: latest?.url || '#recent-posts',
        cta: '打开最近手记',
        bootTitle: '正在检索文字档案',
        bootSteps: ['LOCATING THE LATEST FIELD NOTE', 'INDEX / MATCHED', 'TEXT ARCHIVE / READY']
      },
      frames: {
        label: 'FILE 03 / VISUAL FRAGMENTS',
        system: 'VISUAL MEMORY / ARCHIVE OS',
        signal: 'FRAGMENTS / READY',
        title: '一些被保存的瞬间',
        description: gallery.length
          ? `${gallery.length} 枚影像碎片，拼成生活的另一条时间线。`
          : '从图库里抽取影像，拼成生活的另一条时间线。',
        href: '#fragments-title',
        cta: '查看影像图录',
        bootTitle: '正在唤回影像碎片',
        bootSteps: ['SCANNING VISUAL INDEX', 'FRAME SEQUENCE / MATCHED', 'IMAGE ARCHIVE / READY']
      },
      about: {
        label: 'FILE 04 / ABOUT SAKURA',
        system: 'PERSONAL DOSSIER / SAKURA',
        signal: 'PROFILE / READY',
        title: '关于这间收听室',
        description: '音乐、阅读、游戏与代码——这是它们相遇的房间。',
        href: '/about/',
        cta: '认识房间的主人',
        bootTitle: '正在打开个人档案',
        bootSteps: ['READING LOCAL PROFILE INDEX', 'PERSONAL FILE / MATCHED', 'DOSSIER / READY']
      }
    }

    const label = archive.querySelector('[data-archive-label]')
    const title = archive.querySelector('[data-archive-title]')
    const description = archive.querySelector('[data-archive-description]')
    const action = archive.querySelector('[data-archive-link]')
    const actionCopy = action?.querySelector('[data-archive-cta]')
    const system = archive.querySelector('[data-archive-system]')
    const signal = archive.querySelector('[data-archive-signal]')
    const boot = archive.querySelector('[data-archive-boot]')
    const bootTitle = archive.querySelector('[data-archive-boot-title]')
    const bootStep = archive.querySelector('[data-archive-boot-step]')
    const bootProgress = archive.querySelector('[data-archive-boot-progress]')
    const bootPercent = archive.querySelector('[data-archive-boot-percent]')
    const bootClose = archive.querySelector('[data-archive-boot-close]')
    const modesLinks = [...archive.querySelectorAll('[data-archive-mode]')]
    let bootFrame = 0
    let bootStartedAt = 0
    let bootTarget = ''
    const setMode = mode => {
      const record = modes[mode]
      if (!record) return
      archive.dataset.selectedMode = mode
      archive.querySelector('[data-archive-board]')?.setAttribute('data-mode', mode)
      if (label) label.textContent = record.label
      if (system) system.textContent = record.system
      if (signal) signal.textContent = record.signal
      if (title) title.textContent = record.title
      if (description) description.textContent = record.description
      if (action) action.href = record.href
      if (actionCopy) actionCopy.textContent = record.cta
      modesLinks.forEach(link => {
        if (link.dataset.archiveMode === mode) link.setAttribute('aria-current', 'location')
        else link.removeAttribute('aria-current')
      })
    }

    const clearBoot = restoreFocus => {
      if (bootFrame) cancelAnimationFrame(bootFrame)
      bootFrame = 0
      bootStartedAt = 0
      bootTarget = ''
      archive.querySelector('[data-archive-board]')?.classList.remove('is-authenticating')
      if (boot) {
        boot.hidden = true
        boot.setAttribute('aria-hidden', 'true')
      }
      bootProgress?.setAttribute('aria-valuenow', '0')
      bootPercent?.style.setProperty('--boot-progress', '0%')
      if (restoreFocus) action?.focus({ preventScroll: true })
    }
    const continueTo = href => {
      const destination = new URL(href, location.href)
      const sameDocument = destination.origin === location.origin && destination.pathname === location.pathname && destination.hash
      if (sameDocument) {
        const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)))
        if (target) {
          history.replaceState(history.state, '', destination.hash)
          target.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' })
          target.setAttribute('tabindex', '-1')
          target.focus({ preventScroll: true })
          return
        }
      }
      location.assign(destination.href)
    }
    const startBoot = event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || bootFrame) return
      event.preventDefault()
      const record = modes[archive.dataset.selectedMode] || modes.sound
      bootTarget = action?.getAttribute('href') || record.href
      if (bootTitle) bootTitle.textContent = record.bootTitle
      if (bootStep) bootStep.textContent = record.bootSteps[0]
      if (bootProgress) bootProgress.setAttribute('aria-valuenow', '0')
      if (bootPercent) bootPercent.textContent = '000%'
      if (boot) {
        boot.hidden = false
        boot.setAttribute('aria-hidden', 'false')
      }
      archive.querySelector('[data-archive-board]')?.classList.add('is-authenticating')
      bootClose?.focus({ preventScroll: true })
      bootStartedAt = 0
      const duration = motion.matches ? 100 : 1280
      const animate = now => {
        if (!bootStartedAt) bootStartedAt = now
        const progress = clamp((now - bootStartedAt) / duration)
        const percent = Math.round(progress * 100)
        const phase = Math.min(2, Math.floor(progress * 3))
        if (bootStep) bootStep.textContent = record.bootSteps[phase]
        if (bootProgress) {
          bootProgress.setAttribute('aria-valuenow', String(percent))
          bootProgress.style.setProperty('--boot-progress', `${percent}%`)
        }
        if (bootPercent) bootPercent.textContent = `${String(percent).padStart(3, '0')}%`
        if (progress < 1) bootFrame = requestAnimationFrame(animate)
        else {
          bootFrame = 0
          bootStartedAt = 0
          bootTarget = bootTarget || record.href
          const destination = bootTarget
          clearBoot(false)
          continueTo(destination)
        }
      }
      bootFrame = requestAnimationFrame(animate)
    }
    on(action, 'click', startBoot)
    on(bootClose, 'click', () => clearBoot(true))
    on(archive, 'keydown', event => {
      if (event.key === 'Escape' && boot && !boot.hidden) clearBoot(true)
    })

    on(archive, 'click', event => {
      const link = event.target.closest('[data-archive-mode]')
      if (!link || !archive.contains(link) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      setMode(link.dataset.archiveMode)
    })

    on(archive, 'keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
      const current = event.target.closest('[data-archive-mode]')
      if (!current) return
      event.preventDefault()
      const delta = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1
      const nextIndex = (modesLinks.indexOf(current) + delta + modesLinks.length) % modesLinks.length
      const next = modesLinks[nextIndex]
      next?.focus()
      setMode(next?.dataset.archiveMode)
    })

    const canvas = archive.querySelector('[data-archive-canvas]')
    const progressLabel = archive.querySelector('[data-archive-progress]')
    let pointerFrame = 0
    let scrollFrame = 0
    let pointer = null
    const paintPointer = () => {
      pointerFrame = 0
      if (!canvas || !pointer) return
      const bounds = canvas.getBoundingClientRect()
      const x = (pointer.x - bounds.left) / Math.max(1, bounds.width) - .5
      const y = (pointer.y - bounds.top) / Math.max(1, bounds.height) - .5
      canvas.style.setProperty('--archive-pointer-x', `${(x * 12).toFixed(1)}px`)
      canvas.style.setProperty('--archive-pointer-y', `${(y * 12).toFixed(1)}px`)
    }
    const canParallax = window.matchMedia('(hover: hover) and (pointer: fine)')
    on(canvas, 'pointermove', event => {
      if (motion.matches || !canParallax.matches) return
      pointer = { x: event.clientX, y: event.clientY }
      if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer)
    }, { passive: true })
    on(canvas, 'pointerleave', () => {
      pointer = null
      if (pointerFrame) cancelAnimationFrame(pointerFrame)
      pointerFrame = 0
      canvas?.style.removeProperty('--archive-pointer-x')
      canvas?.style.removeProperty('--archive-pointer-y')
    })
    on(motion, 'change', () => {
      if (!motion.matches) return
      pointer = null
      canvas?.style.removeProperty('--archive-pointer-x')
      canvas?.style.removeProperty('--archive-pointer-y')
      scheduleScroll()
    })

    const paintScroll = () => {
      scrollFrame = 0
      if (!canvas || document.hidden) return
      const bounds = archive.getBoundingClientRect()
      const travel = Math.max(1, Math.min(bounds.height, innerHeight) * .9)
      const progress = clamp(-bounds.top / travel)
      canvas.style.setProperty('--archive-scan-position', `${(8 + progress * 84).toFixed(2)}%`)
      canvas.style.setProperty('--archive-route-phase', `${(progress * 28).toFixed(1)}px`)
      archive.style.setProperty('--archive-disc-turn', `${motion.matches ? 0 : (progress * 210).toFixed(1)}deg`)
      if (progressLabel) progressLabel.textContent = `TRACE / ${String(Math.round(progress * 100)).padStart(3, '0')}%`
    }
    const scheduleScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(paintScroll)
    }
    on(window, 'scroll', scheduleScroll, { passive: true })
    on(window, 'resize', scheduleScroll, { passive: true })
    on(document, 'visibilitychange', scheduleScroll)
    const resizeObserver = new ResizeObserver(scheduleScroll)
    resizeObserver.observe(archive)

    setMode(archive.dataset.selectedMode || 'sound')
    scheduleScroll()
    cleanup = () => {
      clearBoot(false)
      abort.abort()
      if (pointerFrame) cancelAnimationFrame(pointerFrame)
      if (scrollFrame) cancelAnimationFrame(scrollFrame)
      resizeObserver.disconnect()
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true })
  else init()
  document.addEventListener('pjax:send', () => cleanup())
  document.addEventListener('pjax:complete', init)
})()
