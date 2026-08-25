'use strict';

(() => {
  const tracks = [
    {
      id: 'music',
      title: '所以我放弃了音乐',
      titleJa: 'だから僕は音楽を辞めた',
      meta: '2019 / 1ST FULL ALBUM / LETTERS TO ELMA',
      about: '首张完整专辑的同名收束曲。专辑把青年写给 Elma 的信、照片与音乐连成一个完整故事，标题里的“放弃”也因此显得格外矛盾。',
      noteJa: 'まだ、音は夜の中に残っている。',
      noteZh: '声音仍旧留在夜色里。',
      artist: 'YORUSHIKA',
      src: '/music/01-dakara.mp3'
    },
    {
      id: 'kajin',
      title: '花人局',
      titleJa: '花人局',
      meta: '2020 / ALBUM “盗作” / THE BEAUTY OF DECEPTION',
      about: '收录在以“盗作家”为叙事核心的专辑《盗作》。花、骗局与美感被放在同一个标题里，让明亮的旋律从一开始就带着不安。',
      noteJa: '花は、秘密を抱いたまま咲く。',
      noteZh: '花怀抱着秘密，依然盛开。',
      artist: 'YORUSHIKA',
      src: '/music/02-kajin.mp3'
    },
    {
      id: 'oldman',
      title: '老人与海',
      titleJa: '老人と海',
      meta: '2021 / LITERARY PROJECT / INSPIRED MOVIES',
      about: '官方曾邀请多组创作者以这首歌为起点，制作不同风格的 Inspired Movie。同一段“向海而去”的想象，因此拥有了不止一种视觉答案。',
      noteJa: '想像力の向こうへ、海は続いている。',
      noteZh: '越过想象力的边界，海仍在延伸。',
      artist: 'YORUSHIKA',
      src: '/music/03-oldman.mp3'
    },
    {
      id: 'odoriko',
      title: '踊り子',
      titleJa: '踊り子',
      meta: '2021 / VAUNDY / LATE-NIGHT GROOVE',
      about: '克制的节拍和大量留白让这首歌拥有独特的悬浮感。它不急着抵达，更像在夜色里保持一段恰好的距离。',
      noteJa: '夜の余白に、リズムだけが残る。',
      noteZh: '夜的留白里，只剩下节奏。',
      artist: 'VAUNDY',
      src: '/music/04-odoriko.mp3'
    },
    {
      id: 'highway',
      title: 'Highway Driving Car',
      titleJa: 'Highway Driving Car',
      meta: 'ETSUCO / NIGHT DRIVE SELECTION',
      about: '像深夜公路上不断后退的灯光，声音平稳地向前流动。适合在城市安静下来以后，让思绪自由滑行。',
      noteJa: '光の線が、夜の向こうへ続いていく。',
      noteZh: '光的线条，一直通往夜的另一边。',
      artist: 'ETSUCO',
      src: '/music/05-highway.mp3'
    },
    {
      id: 'sss',
      title: 'S.S.S.',
      titleJa: 'S.S.S.',
      meta: '佐藤千亜妃 / AFTER-HOURS SELECTION',
      about: '清晰的声线与细腻的层次慢慢铺开，情绪没有被直白地说尽，却会在歌曲结束后继续停留。',
      noteJa: '言葉にならない気持ちほど、長く響く。',
      noteZh: '越是无法说成话的心情，越会长久回响。',
      artist: '佐藤千亜妃',
      src: '/music/06-sss.mp3'
    }
  ]

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
      const index = tracks.findIndex((track) => track.id === id)
      const track = loadTrack(index < 0 ? 0 : index, shouldPlay)
      renderTrackDetail(track)
    }

    playButton.addEventListener('click', () => {
      if (!audio.src) loadTrack(currentIndex)
      if (audio.paused) {
        if (audio.ended) audio.currentTime = 0
        audio.play().catch(() => { status.textContent = '音频加载失败，请刷新后重试。' })
      } else {
        audio.pause()
      }
    })
    root.querySelector('[data-player-prev]').addEventListener('click', () => selectById(tracks[(currentIndex - 1 + tracks.length) % tracks.length].id))
    root.querySelector('[data-player-next]').addEventListener('click', () => selectById(tracks[(currentIndex + 1) % tracks.length].id))
    timeline.addEventListener('input', () => {
      if (Number.isFinite(audio.duration)) audio.currentTime = (Number(timeline.value) / 100) * audio.duration
    })
    audio.addEventListener('play', updatePlaybackUI)
    audio.addEventListener('pause', updatePlaybackUI)
    audio.addEventListener('loadedmetadata', () => { duration.textContent = formatTime(audio.duration) })
    audio.addEventListener('timeupdate', () => {
      currentTime.textContent = formatTime(audio.currentTime)
      timeline.value = Number.isFinite(audio.duration) && audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0
    })
    audio.addEventListener('ended', () => {
      updatePlaybackUI()
      status.textContent = `${tracks[currentIndex].title} · 播放完毕，点击播放可从头聆听。`
    })
    audio.addEventListener('error', () => { status.textContent = '音频加载失败，请刷新后重试。' })

    loadTrack(0)
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
