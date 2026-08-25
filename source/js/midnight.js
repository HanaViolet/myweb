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
      preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/30/dc/12/30dc12b6-4bbb-83d1-d180-5c65f2cddbc8/mzaf_4917871650336997598.plus.aac.p.m4a',
      apple: 'https://music.apple.com/jp/album/%E3%81%A0%E3%81%8B%E3%82%89%E5%83%95%E3%81%AF%E9%9F%B3%E6%A5%BD%E3%82%92%E8%BE%9E%E3%82%81%E3%81%9F/1648876058?i=1648877323&uo=4'
    },
    {
      id: 'kajin',
      title: '花人局',
      titleJa: '花人局',
      meta: '2020 / ALBUM “盗作” / THE BEAUTY OF DECEPTION',
      about: '收录在以“盗作家”为叙事核心的专辑《盗作》。花、骗局与美感被放在同一个标题里，让明亮的旋律从一开始就带着不安。',
      noteJa: '花は、秘密を抱いたまま咲く。',
      noteZh: '花怀抱着秘密，依然盛开。',
      preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/16/c7/e5/16c7e59e-58a9-2eaf-3ed5-236dca014710/mzaf_9484164237995548523.plus.aac.p.m4a',
      apple: 'https://music.apple.com/jp/album/%E8%8A%B1%E4%BA%BA%E5%B1%80/1519740112?i=1519740251&uo=4'
    },
    {
      id: 'oldman',
      title: '老人与海',
      titleJa: '老人と海',
      meta: '2021 / LITERARY PROJECT / INSPIRED MOVIES',
      about: '官方曾邀请多组创作者以这首歌为起点，制作不同风格的 Inspired Movie。同一段“向海而去”的想象，因此拥有了不止一种视觉答案。',
      noteJa: '想像力の向こうへ、海は続いている。',
      noteZh: '越过想象力的边界，海仍在延伸。',
      preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/62/5c/29/625c2925-b7d8-020f-c1de-96f3ccc0958f/mzaf_1636909761622859565.plus.aac.p.m4a',
      apple: 'https://music.apple.com/jp/album/%E8%80%81%E4%BA%BA%E3%81%A8%E6%B5%B7/1674467767?i=1674467772&uo=4'
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
    const apple = root.querySelector('[data-player-apple]')
    const currentTime = root.querySelector('[data-player-current]')
    const duration = root.querySelector('[data-player-duration]')
    const status = root.querySelector('[data-player-status]')
    let currentIndex = 0

    const updateTrackUI = () => {
      const track = tracks[currentIndex]
      title.textContent = track.title
      titleJa.textContent = track.titleJa
      apple.href = track.apple
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
        audio.src = track.preview
        audio.dataset.trackId = track.id
        timeline.value = 0
        currentTime.textContent = '0:00'
        duration.textContent = '0:30'
      }
      updateTrackUI()
      status.textContent = `${track.title} · Apple Music 官方 30 秒试听`
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
        audio.play().catch(() => { status.textContent = '无法加载试听，请使用右侧完整曲目入口。' })
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
      status.textContent = `${tracks[currentIndex].title} · 试听结束，点击播放可重新聆听。`
    })
    audio.addEventListener('error', () => { status.textContent = '试听加载失败，请使用完整曲目入口。' })

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
        <div class="listening-note__actions"><button type="button" data-detail-play="${track.id}">PLAY 30S PREVIEW <span>▶</span></button><a href="${track.apple}" target="_blank" rel="noopener">OPEN FULL TRACK ↗</a></div>
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
