'use strict';

(() => {
  const tracks = Array.isArray(window.__SAKURA_TRACKS) ? window.__SAKURA_TRACKS : []
  const PLAYER_STORAGE_KEY = 'sakura-player-state-v1'

  const readPlayerState = () => {
    try {
      const raw = window.sessionStorage.getItem(PLAYER_STORAGE_KEY)
      if (!raw) return null
      const state = JSON.parse(raw)
      return state && typeof state.trackId === 'string' ? state : null
    } catch (_) {
      return null
    }
  }

  const writePlayerState = (state) => {
    try {
      window.sessionStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(state))
    } catch (_) {
      // Private browsing or storage restrictions should never break playback.
    }
  }

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '0:00'
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
  }

  const escapeHtml = (value) => value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]))

  const initPlayer = () => {
    const root = document.querySelector('#sakura-player')
    if (!root || root.dataset.ready) return window.__sakuraPlayer

    root.dataset.ready = 'true'
    document.body.classList.add('has-sakura-player')

    const audio = root.querySelector('audio')
    const playButton = root.querySelector('[data-player-play]')
    const timeline = root.querySelector('.sakura-player__timeline input')
    const title = root.querySelector('[data-player-title]')
    const titleJa = root.querySelector('[data-player-title-ja]')
    const artist = root.querySelector('[data-player-artist]')
    const currentTime = root.querySelector('[data-player-current]')
    const duration = root.querySelector('[data-player-duration]')
    const status = root.querySelector('[data-player-status]')
    let currentIndex = 0
    let restoreState = readPlayerState()
    let lastSavedAt = 0
    let lastKnownTime = 0
    let suppressPersistence = true
    let restoreAttempts = 0

    if (!tracks.length) {
      status.textContent = '暂无可播放曲目。'
      return window.__sakuraPlayer
    }

    const saveState = (force = false) => {
      if (suppressPersistence) return
      if (!force && Date.now() - lastSavedAt < 500) return
      const track = tracks[currentIndex]
      if (!track || !audio.dataset.trackId) return
      lastSavedAt = Date.now()
      const measuredTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0
      const savedTime = measuredTime > 0 || lastKnownTime === 0 ? measuredTime : lastKnownTime
      writePlayerState({
        trackId: track.id,
        currentTime: savedTime,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
        wasPlaying: !audio.paused && !audio.ended,
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
      titleJa.textContent = track.titleJa
      artist.textContent = track.artist
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
        suppressPersistence = true
        audio.src = track.src
        audio.dataset.trackId = track.id
        timeline.value = 0
        currentTime.textContent = '0:00'
        duration.textContent = '—:—'
      }
      updateTrackUI()
      status.textContent = `${track.title} · 完整曲目`
      if (shouldPlay) {
        if (audio.ended) audio.currentTime = 0
        audio.play().catch(() => {
          status.textContent = '浏览器暂时阻止了播放，请再点一次播放按钮。'
          updatePlaybackUI()
        })
      }
      return track
    }

    const selectById = (id, shouldPlay = true) => {
      restoreState = null
      if (audio.dataset.trackId === id) suppressPersistence = false
      const index = tracks.findIndex((track) => track.id === id)
      const track = loadTrack(index < 0 ? 0 : index, shouldPlay)
      renderTrackDetail(track)
    }

    const restoreForUserGesture = () => {
      const pending = restoreState && restoreState.trackId === tracks[currentIndex].id ? restoreState : null
      if (!pending || !Number.isFinite(audio.duration) || audio.duration <= 0) return null
      const target = Number(pending.currentTime)
      if (!Number.isFinite(target)) return null
      const clampedTarget = Math.min(Math.max(target, 0), Math.max(audio.duration - 0.25, 0))
      audio.currentTime = clampedTarget
      restoreState = null
      suppressPersistence = false
      lastKnownTime = clampedTarget
      updateProgressUI(clampedTarget)
      return clampedTarget
    }

    playButton.addEventListener('click', () => {
      if (!audio.src) loadTrack(currentIndex)
      if (audio.paused) {
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
        updateProgressUI(nextTime)
      }
    })
    audio.addEventListener('play', () => {
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
        finish(`${track.title} · 已恢复上次位置`)
        return
      }

      status.textContent = '正在恢复播放…'
      let playPromise
      try {
        playPromise = audio.play()
      } catch (_) {
        finish('已恢复上次位置，浏览器拦截了自动播放，请点击播放继续。')
        return
      }

      Promise.resolve(playPromise).then(() => {
        finish(`${track.title} · 完整曲目`)
      }).catch(() => {
        // Keep the restored position visible when autoplay is blocked.
        audio.currentTime = target
        lastKnownTime = target
        updateProgressUI(target)
        finish('已恢复上次位置，浏览器拦截了自动播放，请点击播放继续。')
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
      lastKnownTime = audio.currentTime
      updateProgressUI(audio.currentTime)
      saveState()
    })
    audio.addEventListener('ended', () => {
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
    window.addEventListener('pagehide', () => saveState(true))
    window.addEventListener('beforeunload', () => saveState(true))
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveState(true)
    })

    const restoredIndex = restoreState ? tracks.findIndex((track) => track.id === restoreState.trackId) : -1
    const initialRestore = restoredIndex >= 0 ? restoreState : null
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
        <div class="listening-note__actions"><button type="button" data-detail-play="${track.id}">PLAY FULL TRACK <span>▶</span></button><a href="https://music.163.com/#/playlist?id=17682751304" target="_blank" rel="noopener">NETEASE PLAYLIST ↗</a></div>
      </div>`
    detail.classList.add('is-changing')
  }

  const initMidnight = () => {
    const player = initPlayer()
    const hero = document.querySelector('.midnight-hero')
    document.body.classList.toggle('is-midnight-home', Boolean(hero))
    if (!hero) return

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
