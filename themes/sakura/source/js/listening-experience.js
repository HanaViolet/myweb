'use strict';

(() => {
  const tracks = Array.isArray(window.__SAKURA_TRACKS) ? window.__SAKURA_TRACKS : []
  const notes = Array.isArray(window.__SAKURA_NOTES) ? window.__SAKURA_NOTES : []
  const storageKey = 'sakura-saved-tracks-v1'
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let saved = new Set()
  let lastNote = ''
  let lastDrawnTrack = ''
  let activeTheme = 'all'
  let revealTimer = 0
  let navigationTimer = 0
  const player = () => window.__sakuraPlayer
  const themeNames = { all: '随手', books: '读书', games: '游戏', web: '做网站', life: '生活' }
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
  const pick = (items, previous, key) => {
    const candidates = items.filter(item => item[key] !== previous)
    const pool = candidates.length ? candidates : items
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const readSaved = () => {
    try {
      const values = JSON.parse(localStorage.getItem(storageKey) || '[]')
      saved = new Set(Array.isArray(values) ? values.filter(id => tracks.some(track => track.id === id)) : [])
    } catch (_) { saved = new Set() }
  }

  const feedback = message => document.querySelectorAll('[data-room-feedback]').forEach(element => { element.textContent = message })

  const sync = () => {
    const current = player()?.currentTrack
    if (!current) return
    const playing = !player().audio.paused && !player().audio.ended
    document.body.classList.toggle('room-is-playing', playing)
    document.querySelectorAll('.nav-frequency').forEach(element => {
      element.setAttribute('aria-label', `${playing ? '正在播放' : '已暂停'}：${current.title} / ${current.artist}`)
      element.querySelector('b').textContent = playing ? 'ON AIR' : 'ON THE TURNTABLE'
      element.querySelector('small').textContent = `${current.artist} / ${current.title}`
    })
    document.querySelectorAll('[data-room-favorite]').forEach(button => {
      button.setAttribute('aria-pressed', String(saved.has(current.id)))
      button.textContent = saved.has(current.id) ? '♥ 已收藏这首' : '♡ 收藏这首'
    })
    document.querySelectorAll('[data-room-saved]').forEach(element => {
      // Preserve keyboard focus when only the current selection changes.
      const signature = tracks.filter(track => saved.has(track.id)).map(track => track.id).join(',')
      if (element.dataset.signature === signature) return
      element.dataset.signature = signature
      element.innerHTML = signature
        ? `<span>我的收藏 · 保存在此浏览器</span>${tracks.filter(track => saved.has(track.id)).map(track => `<button type="button" data-room-saved-track="${escape(track.id)}">${escape(track.title)} <span aria-hidden="true">↗</span></button>`).join('')}`
        : '<span>喜欢的歌可以留在这里，下次再来听。</span>'
    })
  }

  const select = track => {
    if (!track || !player()) return
    player().selectById(track.id)
    feedback(`今晚这一首：${track.title} / ${track.artist}`)
  }

  const share = async () => {
    const current = player()?.currentTrack
    if (!current) return
    const url = new URL('/listening/', window.location.origin)
    url.searchParams.set('track', current.id)
    try {
      await navigator.clipboard.writeText(url.href)
      feedback(`已复制《${current.title}》的链接。对方打开后可自行播放。`)
    } catch (_) {
      const fallback = document.querySelector('[data-room-share-fallback]')
      if (!fallback) return
      fallback.hidden = false
      const input = fallback.querySelector('input')
      input.value = url.href
      input.focus()
      input.select()
      feedback('可以从下方复制歌曲链接。')
    }
  }

  const noteMatchesTheme = note => {
    if (activeTheme === 'all') return true
    const tags = Array.isArray(note.tags) ? note.tags : []
    const categories = Array.isArray(note.categories) ? note.categories : []
    const book = tags.includes('书籍')
    const game = tags.includes('游戏')
    const website = categories.includes('技术杂谈') || tags.some(tag => ['Hexo', '教程', '网站更新'].includes(tag))
    if (activeTheme === 'books') return book
    if (activeTheme === 'games') return game
    if (activeTheme === 'web') return website
    if (activeTheme === 'life') return categories.includes('流水账') && !book && !game && !website
    return true
  }

  const syncThemeButtons = () => {
    document.querySelectorAll('[data-room-theme]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.roomTheme === activeTheme))
    })
  }

  const discover = () => {
    const track = pick(tracks, lastDrawnTrack || player()?.currentTrack?.id, 'id')
    const matchingNotes = notes.filter(noteMatchesTheme)
    const note = pick(matchingNotes.length ? matchingNotes : notes, lastNote, 'url')
    if (!track || !note) return
    lastDrawnTrack = track.id
    lastNote = note.url
    // Drawing a card previews a pairing; only an explicit play control starts audio.
    document.querySelectorAll('[data-room-pairing]').forEach(element => {
      const theme = themeNames[activeTheme] || themeNames.all
      element.textContent = matchingNotes.length
        ? `「${theme}」签：${track.title} / ${track.artist}，配一篇旧文。`
        : `「${theme}」主题还没有文章，先为你抽到一篇旧文和 ${track.title}。`
    })
    document.querySelectorAll('[data-room-note]').forEach(link => {
      link.textContent = `${note.title} ↗`
      link.href = note.url
    })
    document.querySelectorAll('.room-postcard__actions').forEach(element => {
      let play = element.querySelector('[data-room-pair-play]')
      if (!play) {
        play = document.createElement('button')
        play.type = 'button'
        element.querySelector('[data-room-pairing]').after(play)
      }
      play.dataset.roomPairPlay = track.id
      play.textContent = `▶ 播放这张签的歌`
    })
  }

  const finishNavigation = () => {
    clearTimeout(navigationTimer)
    document.documentElement.classList.remove('room-is-navigating')
  }

  const init = () => {
    finishNavigation()
    clearTimeout(revealTimer)
    document.body.classList.toggle('is-listening-page', Boolean(document.querySelector('.listening-page')))
    const sharedId = new URLSearchParams(location.search).get('track')
    if (location.pathname.replace(/\/$/, '') === '/listening' && tracks.some(track => track.id === sharedId)) {
      // Cancel any restored autoplay intent before presenting an incoming shared track.
      player()?.pause()
      player()?.selectById(sharedId, false)
      feedback('这首歌已放上唱机，点击播放开始聆听。')
    }
    sync()
    if (document.querySelector('.room-postcard')) {
      syncThemeButtons()
      discover()
    }
    const body = document.querySelector('#body-wrap')
    if (!motion.matches && body) {
      body.classList.remove('room-page-enter')
      void body.offsetWidth
      body.classList.add('room-page-enter')
      revealTimer = window.setTimeout(() => body.classList.remove('room-page-enter'), 450)
    }
  }

  readSaved()
  document.addEventListener('click', event => {
    const button = event.target.closest('button')
    if (!button) return
    if (button.matches('[data-room-shuffle]')) select(pick(tracks, player()?.currentTrack?.id, 'id'))
    if (button.matches('[data-room-saved-track]')) select(tracks.find(track => track.id === button.dataset.roomSavedTrack))
    if (button.matches('[data-room-pair-play]')) select(tracks.find(track => track.id === button.dataset.roomPairPlay))
    if (button.matches('[data-room-share]')) share()
    if (button.matches('[data-room-theme]')) {
      activeTheme = themeNames[button.dataset.roomTheme] ? button.dataset.roomTheme : 'all'
      syncThemeButtons()
      discover()
    }
    if (button.matches('[data-room-discover]')) discover()
    if (button.matches('[data-room-favorite]')) {
      const current = player()?.currentTrack
      if (!current) return
      saved.has(current.id) ? saved.delete(current.id) : saved.add(current.id)
      try {
        localStorage.setItem(storageKey, JSON.stringify([...saved]))
        feedback(saved.has(current.id) ? `已收藏《${current.title}》，下次还在这里。` : `已取消收藏《${current.title}》。`)
      } catch (_) { feedback('浏览器无法保存收藏，本次打开期间仍可使用。') }
      sync()
    }
  })
  document.addEventListener('sakura:trackchange', () => {
    document.querySelectorAll('[data-room-share-fallback]').forEach(element => { element.hidden = true })
    sync()
  })
  document.addEventListener('sakura:playbackchange', sync)
  document.addEventListener('pjax:send', () => {
    document.documentElement.classList.add('room-is-navigating')
    clearTimeout(navigationTimer)
    navigationTimer = window.setTimeout(finishNavigation, 12000)
  })
  document.addEventListener('pjax:error', finishNavigation)
  document.addEventListener('pjax:complete', init)
  document.addEventListener('DOMContentLoaded', init)
  window.addEventListener('storage', event => { if (event.key === storageKey || event.key === null) { readSaved(); sync() } })
})()
