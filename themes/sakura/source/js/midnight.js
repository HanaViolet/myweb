'use strict';

(() => {
  const tracks = Array.isArray(window.__SAKURA_TRACKS) ? window.__SAKURA_TRACKS : []
  const NETEASE_PLAYLIST_URL = 'https://music.163.com/#/playlist?id=2203036705'
  const PLAYER_STORAGE_KEY = 'sakura-player-state-v2'
  const LEGACY_PLAYER_STORAGE_KEY = 'sakura-player-state-v1'

  const getPlayerStorages = () => {
    const storages = []
    try { storages.push(window.localStorage) } catch (_) {}
    try { storages.push(window.sessionStorage) } catch (_) {}
    return storages
  }

  const readPlayerState = () => {
    let newest = null
    getPlayerStorages().forEach((storage) => {
      ;[PLAYER_STORAGE_KEY, LEGACY_PLAYER_STORAGE_KEY].forEach((key) => {
        try {
          const raw = storage.getItem(key)
          if (!raw) return
          const state = JSON.parse(raw)
          if (!state || typeof state.trackId !== 'string') return
          if (!newest || Number(state.updatedAt) > Number(newest.updatedAt)) newest = state
        } catch (_) {
          // Storage can be unavailable in private browsing or embedded frames.
        }
      })
    })
    return newest
  }

  const writePlayerState = (state) => {
    const serialized = JSON.stringify(state)
    getPlayerStorages().forEach((storage) => {
      try { storage.setItem(PLAYER_STORAGE_KEY, serialized) } catch (_) {}
    })
  }

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '0:00'
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
  }

  const escapeHtml = (value) => value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]))

  const formatShanghaiDate = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date).replace(/\//g, '-')
  }

  const formatCommentLikes = (value) => {
    const number = Number(value)
    if (!Number.isFinite(number) || number <= 0) return '—'
    if (number >= 10000) {
      const digits = number >= 100000 ? 0 : 1
      return `${(number / 10000).toFixed(digits)}万`
    }
    return new Intl.NumberFormat('zh-CN').format(number)
  }

  const formatPlayerSubline = (track) => {
    const title = String(track?.title || '').trim()
    const titleJa = String(track?.titleJa || '').trim()
    const artist = String(track?.artist || '').trim()
    const parts = []
    if (titleJa && titleJa !== title) parts.push(titleJa)
    if (artist) parts.push(artist)
    return parts.join(' · ')
  }

  const readGallerySelection = () => {
    try { return window.sessionStorage.getItem('sakura-gallery-selection-v1') || '' } catch (_) { return '' }
  }

  const writeGallerySelection = (selection) => {
    try { window.sessionStorage.setItem('sakura-gallery-selection-v1', selection) } catch (_) {}
  }

  const initRandomGallery = () => {
    const strip = document.querySelector('[data-random-gallery]')
    if (!strip || strip.dataset.galleryReady === 'true') return

    const pool = Array.isArray(window.__SAKURA_GALLERY)
      ? window.__SAKURA_GALLERY.filter((item) => item && typeof item.src === 'string' && item.src)
      : []
    const frames = Array.from(strip.querySelectorAll('figure'))
    if (!pool.length || !frames.length) return

    let shuffled = pool.slice()
    let selectionKey = ''
    const previousSelection = readGallerySelection()
    for (let attempt = 0; attempt < 10; attempt += 1) {
      shuffled = pool.slice()
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1))
        ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
      }
      selectionKey = shuffled.slice(0, frames.length).map((item) => item.src).join('|')
      if (selectionKey !== previousSelection || pool.length <= frames.length) break
    }

    frames.forEach((frame, index) => {
      const item = shuffled[index]
      if (!item) {
        frame.hidden = true
        return
      }
      const image = frame.querySelector('img')
      const caption = frame.querySelector('figcaption')
      if (image) {
        // The site uses Butterfly's lazy-loader, which reads data-lazy-src
        // after this script runs. Keep both attributes in sync so the loader
        // cannot replace the randomized source with the build-time placeholder.
        image.dataset.lazySrc = item.src
        image.src = item.src
        image.alt = item.alt || `图库片段 / FRAME ${String(index + 1).padStart(2, '0')}`
      }
      if (caption) caption.textContent = `FRAME / ${String(index + 1).padStart(2, '0')}`
    })
    writeGallerySelection(selectionKey)
    strip.dataset.galleryReady = 'true'
  }

  const renderTrackComments = (track) => {
    const payload = track?.neteaseComments || {}
    const comments = Array.isArray(payload.comments) ? payload.comments.slice(0, 4) : []
    const updated = formatShanghaiDate(payload.updatedAt)
    const commentItems = comments.map((comment) => `
        <blockquote>
          <p>${escapeHtml(comment.content || '')}</p>
          <footer><span>${escapeHtml(comment.nickname || '网易云听众')}</span><span>♥ ${escapeHtml(formatCommentLikes(comment.likedCount))}</span></footer>
        </blockquote>`).join('')
    const safeUrl = /^https:\/\/music\.163\.com\//.test(String(payload.sourceUrl || ''))
      ? String(payload.sourceUrl)
      : 'https://music.163.com/'
    return `<section class="track-comments" aria-label="${escapeHtml(track.title)} 网易云热门评论">
      <header class="track-comments__header"><div><span>NETEASE CLOUD / HOT COMMENTS</span><strong>听众留下的话</strong></div><time>${updated ? `UPDATED ${escapeHtml(updated)}` : 'WAITING FOR NEXT SYNC'}</time></header>
      ${commentItems ? `<div class="track-comments__list">${commentItems}</div>` : '<p class="track-comments__empty">这首歌的热评会在下一次同步后出现。</p>'}
      <a class="track-comments__link" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener">VIEW ON NETEASE <span aria-hidden="true">↗</span></a>
    </section>`
  }

  const initPlayer = () => {
    const root = document.querySelector('#sakura-player')
    if (!root || root.dataset.ready) return window.__sakuraPlayer

    root.dataset.ready = 'true'
    document.body.classList.add('has-sakura-player')

    const audio = root.querySelector('audio')
    const playButton = root.querySelector('[data-player-play]')
    const timeline = root.querySelector('.sakura-player__timeline input')
    const title = root.querySelector('[data-player-title]')
    const subline = root.querySelector('[data-player-subline]')
    const currentTime = root.querySelector('[data-player-current]')
    const duration = root.querySelector('[data-player-duration]')
    const status = root.querySelector('[data-player-status]')
    let currentIndex = 0
    let restoreState = readPlayerState()
    let lastSavedAt = 0
    let lastKnownTime = 0
    let suppressPersistence = Boolean(restoreState)
    let resumeOnReturn = false
    let pendingGestureResume = null
    let restoreGuard = null
    let restoreAttempts = 0

    if (!tracks.length) {
      status.textContent = '暂无可播放曲目。'
      return window.__sakuraPlayer
    }

    const saveState = (force = false) => {
      // A forced save is used immediately before a PJAX/full-page transition.
      // It must still write the last known position while a restored track is
      // waiting for metadata; otherwise a quick sign-in click can overwrite
      // the saved position with the browser's temporary 0:00.
      if (suppressPersistence && !force) return
      if (!force && Date.now() - lastSavedAt < 500) return
      const track = tracks[currentIndex]
      if (!track || !audio.dataset.trackId) return
      lastSavedAt = Date.now()
      const measuredTime = Number.isFinite(audio.currentTime) ? audio.currentTime : lastKnownTime
      const now = Date.now()
      let savedTime = Math.max(0, Number.isFinite(measuredTime) ? measuredTime : 0)
      if (restoreGuard) {
        if (now <= restoreGuard.expiresAt && savedTime + 0.5 < restoreGuard.time) {
          savedTime = restoreGuard.time
        } else if (now > restoreGuard.expiresAt || savedTime >= restoreGuard.time - 0.5) {
          restoreGuard = null
        }
      }
      // During page hide/unload some engines reset media.currentTime to zero
      // before dispatching pause/pagehide. Keep the latest known position.
      if (lastKnownTime > savedTime + 0.5) {
        savedTime = lastKnownTime
      }
      writePlayerState({
        trackId: track.id,
        currentTime: savedTime,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
        wasPlaying: resumeOnReturn && !audio.ended,
        updatedAt: Date.now()
      })
    }

    const updateProgressUI = (seconds, total = audio.duration) => {
      if (!Number.isFinite(seconds)) return
      currentTime.textContent = formatTime(seconds)
      if (Number.isFinite(total) && total > 0) {
        timeline.value = String(Math.min(Math.max((seconds / total) * 100, 0), 100))
      }
    }

    const updateTrackUI = () => {
      const track = tracks[currentIndex]
      title.textContent = track.title
      subline.textContent = formatPlayerSubline(track)
      root.dataset.playerState = audio.paused ? 'paused' : 'playing'
      document.querySelectorAll('.track-trigger').forEach((button) => {
        const active = button.dataset.trackId === track.id
        button.classList.toggle('is-active', active)
        button.setAttribute('aria-pressed', String(active))
      })
    }

    const updatePlaybackUI = () => {
      const playing = !audio.paused
      playButton.querySelector('span').textContent = playing ? 'Ⅱ' : '▶'
      playButton.setAttribute('aria-label', playing ? '暂停' : '播放')
      root.dataset.playerState = playing ? 'playing' : 'paused'
    }

    const loadTrack = (index, shouldPlay = false) => {
      currentIndex = (index + tracks.length) % tracks.length
      const track = tracks[currentIndex]
      const sameTrack = audio.dataset.trackId === track.id
      if (!sameTrack) {
        suppressPersistence = !shouldPlay && Boolean(restoreState)
        audio.src = track.src
        audio.dataset.trackId = track.id
        timeline.value = 0
        currentTime.textContent = '0:00'
        duration.textContent = '—:—'
        lastKnownTime = 0
        restoreGuard = null
      }
      updateTrackUI()
      status.textContent = `${track.title} · 完整曲目`
      if (shouldPlay) {
        resumeOnReturn = true
        suppressPersistence = false
        if (audio.ended) audio.currentTime = 0
        audio.play().catch(() => {
          status.textContent = '浏览器暂时阻止了播放，请再点一次播放按钮。'
          updatePlaybackUI()
        })
      }
      return track
    }

    const selectById = (id, shouldPlay = true) => {
      if (audio.dataset.trackId && audio.dataset.trackId !== id) saveState(true)
      restoreState = null
      pendingGestureResume = null
      restoreGuard = null
      resumeOnReturn = Boolean(shouldPlay)
      suppressPersistence = false
      const index = tracks.findIndex((track) => track.id === id)
      const track = loadTrack(index < 0 ? 0 : index, shouldPlay)
      renderTrackDetail(track)
    }

    const restoreForUserGesture = () => {
      const pending = pendingGestureResume || (restoreState && restoreState.trackId === tracks[currentIndex].id ? restoreState : null)
      if (!pending || !Number.isFinite(audio.duration) || audio.duration <= 0) return null
      const target = Number(pending.currentTime)
      if (!Number.isFinite(target)) return null
      const clampedTarget = Math.min(Math.max(target, 0), Math.max(audio.duration - 0.25, 0))
      audio.currentTime = clampedTarget
      restoreState = null
      pendingGestureResume = null
      suppressPersistence = false
      resumeOnReturn = true
      restoreGuard = { time: clampedTarget, expiresAt: Date.now() + 3000 }
      lastKnownTime = clampedTarget
      updateProgressUI(clampedTarget)
      return clampedTarget
    }

    playButton.addEventListener('click', () => {
      if (!audio.src) loadTrack(currentIndex)
      if (audio.paused) {
        resumeOnReturn = true
        if (audio.ended) audio.currentTime = 0
        const restoredTarget = restoreForUserGesture()
        const playPromise = audio.play()
        if (restoredTarget !== null) {
          Promise.resolve(playPromise).then(() => {
            audio.currentTime = restoredTarget
            lastKnownTime = restoredTarget
            updateProgressUI(restoredTarget)
          }).catch(() => {})
        }
        Promise.resolve(playPromise).catch(() => { status.textContent = '音频加载失败，请刷新后重试。' })
      } else {
        resumeOnReturn = false
        pendingGestureResume = null
        audio.pause()
      }
    })
    root.querySelector('[data-player-prev]').addEventListener('click', () => selectById(tracks[(currentIndex - 1 + tracks.length) % tracks.length].id))
    root.querySelector('[data-player-next]').addEventListener('click', () => selectById(tracks[(currentIndex + 1) % tracks.length].id))
    timeline.addEventListener('input', () => {
      if (Number.isFinite(audio.duration)) {
        const nextTime = (Number(timeline.value) / 100) * audio.duration
        audio.currentTime = nextTime
        lastKnownTime = nextTime
        restoreGuard = null
        updateProgressUI(nextTime)
      }
    })
    audio.addEventListener('play', () => {
      resumeOnReturn = true
      updatePlaybackUI()
      saveState(true)
    })
    audio.addEventListener('pause', () => {
      updatePlaybackUI()
      saveState(true)
    })
    const finishRestore = (pending, target) => {
      const track = tracks[currentIndex]
      const finish = (message) => {
        suppressPersistence = false
        if (message) status.textContent = message
        updatePlaybackUI()
        saveState(true)
      }

      if (!pending.wasPlaying) {
        resumeOnReturn = false
        finish(`${track.title} · 已恢复上次位置`)
        return
      }

      resumeOnReturn = true
      status.textContent = '正在恢复播放…'
      let playPromise
      try {
        playPromise = audio.play()
      } catch (_) {
        pendingGestureResume = { currentTime: target }
        finish('已恢复上次位置，浏览器拦截了自动播放，请点击播放继续。')
        return
      }

      Promise.resolve(playPromise).then(() => {
        // Some browsers reset currentTime to zero when play() begins after a
        // navigation. Re-apply the saved position after playback is allowed,
        // before persistence is enabled again.
        audio.currentTime = target
        lastKnownTime = target
        restoreGuard = { time: target, expiresAt: Date.now() + 3000 }
        updateProgressUI(target)
        pendingGestureResume = null
        finish(`${track.title} · 完整曲目`)
      }).catch(() => {
        // Keep the restored position visible when autoplay is blocked.
        audio.currentTime = target
        lastKnownTime = target
        restoreGuard = { time: target, expiresAt: Date.now() + 3000 }
        updateProgressUI(target)
        pendingGestureResume = { currentTime: target }
        finish('已恢复上次位置，浏览器拦截了自动播放；点击页面即可继续。')
      })
    }

    const restorePlaybackPosition = () => {
      const pending = restoreState && restoreState.trackId === tracks[currentIndex].id ? restoreState : null
      if (!pending || !Number.isFinite(audio.duration) || audio.duration <= 0) return false
      const target = Number(pending.currentTime)
      const clampedTarget = Number.isFinite(target) ? Math.min(Math.max(target, 0), Math.max(audio.duration - 0.25, 0)) : 0
      audio.currentTime = clampedTarget
      if (clampedTarget > 0 && Math.abs(audio.currentTime - clampedTarget) > 0.5) {
        if (restoreAttempts >= 20) return false
        restoreAttempts += 1
        window.setTimeout(restorePlaybackPosition, 100)
        return false
      }
      restoreAttempts = 0
      restoreState = null
      lastKnownTime = clampedTarget
      updateProgressUI(clampedTarget)
      finishRestore(pending, clampedTarget)
      return true
    }

    const resumePendingPlayback = (event) => {
      if (!pendingGestureResume || !audio.paused) return
      const target = event && event.target
      if (target && typeof target.closest === 'function' && target.closest('#sakura-player')) return
      const restoredTarget = restoreForUserGesture()
      if (restoredTarget === null) return
      const playPromise = audio.play()
      Promise.resolve(playPromise).then(() => {
        audio.currentTime = restoredTarget
        lastKnownTime = restoredTarget
        restoreGuard = { time: restoredTarget, expiresAt: Date.now() + 3000 }
        updateProgressUI(restoredTarget)
      }).catch(() => {
        pendingGestureResume = { currentTime: restoredTarget }
        status.textContent = '已恢复上次位置，浏览器仍阻止自动播放；点击播放器继续。'
      })
    }

    const resumeAfterReturn = () => {
      if (!resumeOnReturn || !audio.paused || audio.ended) return
      const playPromise = audio.play()
      Promise.resolve(playPromise).catch(() => {
        const target = Number.isFinite(audio.currentTime) ? audio.currentTime : lastKnownTime
        pendingGestureResume = { currentTime: Math.max(0, target) }
        status.textContent = '页面已返回；点击播放器即可继续播放。'
      })
    }

    document.addEventListener('pointerdown', resumePendingPlayback, { passive: true })
    document.addEventListener('keydown', resumePendingPlayback)
    document.addEventListener('pjax:send', () => saveState(true))

    audio.addEventListener('loadedmetadata', () => {
      duration.textContent = formatTime(audio.duration)
      const hasPendingRestore = Boolean(restoreState && restoreState.trackId === tracks[currentIndex].id)
      const restored = restorePlaybackPosition()
      if (!hasPendingRestore) suppressPersistence = false
      if (hasPendingRestore && !restored) suppressPersistence = true
    })
    audio.addEventListener('canplay', () => {
      if (!restoreState || restoreState.trackId !== tracks[currentIndex].id) {
        suppressPersistence = false
        return
      }
      if (!restorePlaybackPosition()) suppressPersistence = true
    })
    audio.addEventListener('timeupdate', () => {
      const reportedTime = audio.currentTime
      if (restoreGuard && Date.now() <= restoreGuard.expiresAt && reportedTime + 0.5 < restoreGuard.time) {
        audio.currentTime = restoreGuard.time
        lastKnownTime = restoreGuard.time
        updateProgressUI(restoreGuard.time)
      } else {
        lastKnownTime = reportedTime
        if (restoreGuard && reportedTime >= restoreGuard.time - 0.5) restoreGuard = null
        updateProgressUI(reportedTime)
      }
      saveState()
    })
    audio.addEventListener('ended', () => {
      resumeOnReturn = false
      pendingGestureResume = null
      restoreGuard = null
      audio.currentTime = 0
      lastKnownTime = 0
      currentTime.textContent = '0:00'
      timeline.value = 0
      updatePlaybackUI()
      status.textContent = `${tracks[currentIndex].title} · 播放完毕，点击播放可从头聆听。`
      saveState(true)
    })
    audio.addEventListener('error', () => {
      suppressPersistence = false
      status.textContent = '音频加载失败，请刷新后重试。'
    })
    timeline.addEventListener('change', () => saveState(true))
    window.addEventListener('pagehide', () => {
      saveState(true)
    })
    window.addEventListener('beforeunload', () => {
      saveState(true)
    })
    window.addEventListener('unload', () => {
      saveState(true)
    })
    window.addEventListener('blur', () => saveState(true))
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveState(true)
      else window.setTimeout(resumeAfterReturn, 0)
    })
    window.addEventListener('focus', resumeAfterReturn)

    const restoredIndex = restoreState ? tracks.findIndex((track) => track.id === restoreState.trackId) : -1
    const initialRestore = restoredIndex >= 0 ? restoreState : null
    if (!initialRestore) restoreState = null
    resumeOnReturn = Boolean(initialRestore && initialRestore.wasPlaying)
    loadTrack(restoredIndex >= 0 ? restoredIndex : 0)
    if (initialRestore) {
      const savedDuration = Number(initialRestore.duration)
      const savedTime = Number(initialRestore.currentTime)
      if (Number.isFinite(savedDuration) && savedDuration > 0) {
        const clampedTime = Number.isFinite(savedTime) ? Math.min(Math.max(savedTime, 0), savedDuration) : 0
        duration.textContent = formatTime(savedDuration)
        lastKnownTime = clampedTime
        updateProgressUI(clampedTime, savedDuration)
      }
    }
    window.__sakuraPlayer = { audio, selectById, syncTrackUI: updateTrackUI, get currentTrack () { return tracks[currentIndex] } }
    return window.__sakuraPlayer
  }

  const renderTrackDetail = (track) => {
    const detail = document.querySelector('[data-track-detail]')
    if (!detail || !track) return
    const index = tracks.indexOf(track) + 1
    detail.classList.remove('is-changing')
    void detail.offsetWidth
    detail.innerHTML = `
      <div class="listening-note__index"><span>${String(index).padStart(2, '0')}</span><small>ABOUT THE TRACK</small></div>
      <div class="listening-note__copy">
        <p class="listening-note__meta">${escapeHtml(track.meta)}</p>
        <h3>${escapeHtml(track.title)}</h3>
        <p class="listening-note__about">${escapeHtml(track.about)}</p>
        <blockquote><span>聆听札记 · 非原歌词</span><p lang="ja">${escapeHtml(track.noteJa)}</p><p>${escapeHtml(track.noteZh)}</p></blockquote>
        ${renderTrackComments(track)}
        <div class="listening-note__actions"><button type="button" data-detail-play="${track.id}">PLAY FULL TRACK <span>▶</span></button><a href="${NETEASE_PLAYLIST_URL}" target="_blank" rel="noopener">NETEASE PLAYLIST ↗</a></div>
      </div>`
    detail.classList.add('is-changing')
  }

  const initMidnight = () => {
    const player = initPlayer()
    const hero = document.querySelector('.midnight-hero')
    document.body.classList.toggle('is-midnight-home', Boolean(hero))
    if (!hero) return

    initRandomGallery()

    const playButton = hero.querySelector('.midnight-play')
    if (playButton && !playButton.dataset.ready) {
      playButton.dataset.ready = 'true'
      playButton.addEventListener('click', () => {
        const target = document.querySelector(playButton.dataset.midnightTarget)
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }

    document.querySelectorAll('.track-trigger').forEach((button) => {
      if (button.dataset.ready) return
      button.dataset.ready = 'true'
      button.addEventListener('click', () => player?.selectById(button.dataset.trackId))
    })

    const detail = document.querySelector('[data-track-detail]')
    if (detail && !detail.dataset.ready) {
      detail.dataset.ready = 'true'
      detail.addEventListener('click', (event) => {
        const button = event.target.closest('[data-detail-play]')
        if (button) player?.selectById(button.dataset.detailPlay)
      })
    }

    if (player?.currentTrack) renderTrackDetail(player.currentTrack)
    player?.syncTrackUI?.()

    const revealTargets = document.querySelectorAll('.listening-room__heading, .listening-tracks li, .listening-note, .midnight-section-title, .recent-post-item, .midnight-coda__heading, .midnight-filmstrip figure, .midnight-manifesto')
    revealTargets.forEach((element) => element.classList.add('midnight-reveal'))

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
      revealTargets.forEach((element) => observer.observe(element))
    } else {
      revealTargets.forEach((element) => element.classList.add('is-visible'))
    }
  }

  document.addEventListener('DOMContentLoaded', initMidnight)
  document.addEventListener('pjax:complete', initMidnight)
})()
