'use strict';

(() => {
  const tracks = Array.isArray(window.__SAKURA_TRACKS) ? window.__SAKURA_TRACKS.filter(track => track && track.id && track.title) : []
  const byId = new Map(tracks.map(track => [track.id, track]))
  const MIXTAPE_KEY = 'sakura-mixtape-v1'
  const VISIT_KEY = 'sakura-visit-v1'
  let bound = false

  const player = () => window.__sakuraPlayer
  const read = (storage, key, fallback) => {
    try { return JSON.parse(storage.getItem(key) || '') || fallback } catch (_) { return fallback }
  }
  const write = (storage, key, value) => { try { storage.setItem(key, JSON.stringify(value)) } catch (_) {} }
  const copy = value => {
    if (!navigator.clipboard?.writeText) return Promise.reject(new Error('clipboard unavailable'))
    return navigator.clipboard.writeText(value)
  }
  const randomTracks = (count) => {
    const pool = tracks.slice()
    const result = []
    while (pool.length && result.length < count) result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
    return result
  }

  const renderMixtape = root => {
    if (!root || root.dataset.funReady === 'true') return
    root.dataset.funReady = 'true'
    const fromUrl = new URLSearchParams(location.search).get('mixtape')?.split(',').map(id => byId.get(id)).filter(Boolean) || []
    const saved = read(localStorage, MIXTAPE_KEY, {})
    const savedTracks = Array.isArray(saved.ids) ? saved.ids.map(id => byId.get(id)).filter(Boolean) : []
    const state = root.__mixtapeState = {
      name: new URLSearchParams(location.search).get('name') || saved.name || root.querySelector('[data-mixtape-name]')?.value || 'SAKURA / AFTER HOURS',
      ids: [...new Set((fromUrl.length ? fromUrl : savedTracks).map(track => track.id))].slice(0, 3)
    }
    const name = root.querySelector('[data-mixtape-name]')
    const status = root.querySelector('[data-mixtape-status]')
    const setStatus = message => { if (status) status.textContent = message }
    const render = () => {
      if (name) name.value = state.name
      root.querySelectorAll('[data-mixtape-slot]').forEach((slot, index) => {
        const track = byId.get(state.ids[index])
        slot.replaceChildren()
        const side = document.createElement('span'); side.textContent = `A${index + 1}`; slot.append(side)
        const title = document.createElement('strong'); title.textContent = track?.title || '留一个位置'; slot.append(title)
        const artist = document.createElement('small'); artist.textContent = track?.artist || '点击右侧曲目'; slot.append(artist)
        if (track) slot.dataset.trackId = track.id; else delete slot.dataset.trackId
      })
      const list = root.querySelector('[data-mixtape-track-list]')
      if (list && !list.childElementCount) {
        tracks.slice(0, 18).forEach((track, index) => {
          const button = document.createElement('button')
          button.type = 'button'; button.dataset.mixtapeTrack = track.id; button.setAttribute('aria-pressed', String(state.ids.includes(track.id)))
          const no = document.createElement('span'); no.textContent = String(index + 1).padStart(2, '0')
          const copyBlock = document.createElement('span')
          const title = document.createElement('strong'); title.textContent = track.title
          const artist = document.createElement('small'); artist.textContent = track.artist
          copyBlock.append(title, artist); button.append(no, copyBlock); list.append(button)
        })
      }
      root.querySelectorAll('[data-mixtape-track]').forEach(button => button.setAttribute('aria-pressed', String(state.ids.includes(button.dataset.mixtapeTrack))))
      const savedPanel = root.querySelector('[data-mixtape-saved]')
      const lastSaved = read(localStorage, MIXTAPE_KEY, {})
      if (savedPanel && Array.isArray(lastSaved.ids) && lastSaved.ids.length) {
        savedPanel.hidden = false
        savedPanel.querySelector('[data-mixtape-saved-name]').textContent = lastSaved.name || 'SAKURA / AFTER HOURS'
        savedPanel.querySelector('[data-mixtape-saved-tracks]').textContent = lastSaved.ids.map(id => byId.get(id)?.title).filter(Boolean).join(' · ')
      }
    }
    name?.addEventListener('input', () => { state.name = name.value.trim().slice(0, 36) || 'SAKURA / AFTER HOURS' })
    root.addEventListener('click', event => {
      const trackButton = event.target.closest('[data-mixtape-track]')
      if (trackButton) {
        const id = trackButton.dataset.mixtapeTrack
        if (state.ids.includes(id)) state.ids = state.ids.filter(value => value !== id)
        else if (state.ids.length < 3) state.ids.push(id)
        else { setStatus('一盘带最多放三首歌。先取下一首，再放进新的声音。'); return }
        render(); setStatus(state.ids.length ? `已放入 ${state.ids.length} 首，还可以再选 ${3 - state.ids.length} 首。` : '先选一首，慢慢把今晚的声音放进去。')
      }
      if (event.target.closest('[data-mixtape-random]')) {
        state.ids = randomTracks(3).map(track => track.id); render(); setStatus('今晚的三首声音已经替你抽好了。')
      }
      const slot = event.target.closest('[data-mixtape-slot]')
      if (slot?.dataset.trackId && player()) player().selectById(slot.dataset.trackId)
      if (event.target.closest('[data-mixtape-save]')) {
        if (!state.ids.length) { setStatus('至少选择一首歌，才能保存这盘带。'); return }
        write(localStorage, MIXTAPE_KEY, { name: state.name, ids: state.ids })
        render(); setStatus(`《${state.name}》已经留在这台浏览器里。`)
      }
      if (event.target.closest('[data-mixtape-share]')) {
        if (!state.ids.length) { setStatus('至少选择一首歌，才能分享这盘带。'); return }
        const url = new URL('/listening/', window.location.origin)
        url.searchParams.set('mixtape', state.ids.join(',')); url.searchParams.set('name', state.name)
        const value = url.href
        const fallback = root.querySelector('[data-mixtape-share-fallback]')
        const input = root.querySelector('[data-mixtape-share-url]')
        copy(value).then(() => setStatus('磁带链接已复制，可以发给朋友。')).catch(() => { if (fallback) fallback.hidden = false; if (input) { input.value = value; input.focus(); input.select() }; setStatus('请从下方输入框复制磁带链接。') })
      }
    })
    render()
  }

  const initNow = root => {
    if (!root || root.dataset.funReady === 'true') return
    root.dataset.funReady = 'true'
    const sync = () => {
      const current = player()?.currentTrack
      const title = root.querySelector('[data-now-track]')
      const meta = root.querySelector('[data-now-track-meta]')
      if (title) title.textContent = current?.title || '等待下一首歌'
      if (meta) meta.textContent = current ? `${current.artist} · ${!player()?.audio.paused ? '正在播放' : '已放在唱机上'}` : '跨页持续播放的当前曲目'
    }
    root.addEventListener('click', event => {
      const card = event.target.closest('[data-now-card]')
      if (!card || event.target.closest('a')) return
      const open = !card.classList.contains('is-open')
      root.querySelectorAll('[data-now-card]').forEach(item => { item.classList.remove('is-open'); item.setAttribute('aria-expanded', 'false') })
      card.classList.toggle('is-open', open); card.setAttribute('aria-expanded', String(open))
    })
    root.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('[data-now-card]')) { event.preventDefault(); event.target.closest('[data-now-card]').click() } })
    sync(); document.addEventListener('sakura:trackchange', sync); document.addEventListener('sakura:playbackchange', sync)
  }

  const visitState = () => {
    const state = read(sessionStorage, VISIT_KEY, { startedAt: Date.now(), pages: [], trackIds: [], frames: [] })
    state.pages = Array.isArray(state.pages) ? state.pages : []; state.trackIds = Array.isArray(state.trackIds) ? state.trackIds : []; state.frames = Array.isArray(state.frames) ? state.frames : []
    return state
  }
  const recordVisit = (patch = {}) => {
    const state = visitState()
    if (location.pathname && !state.pages.includes(location.pathname)) state.pages.push(location.pathname)
    if (patch.trackId && !state.trackIds.includes(patch.trackId)) state.trackIds.push(patch.trackId)
    if (patch.frame && !state.frames.includes(patch.frame)) state.frames.push(patch.frame)
    write(sessionStorage, VISIT_KEY, state); return state
  }
  const initReceipt = root => {
    if (!root || root.dataset.funReady === 'true') return
    root.dataset.funReady = 'true'
    const dialog = root.querySelector('[data-visit-receipt-dialog]')
    const render = () => {
      const state = recordVisit()
      const minutes = Math.max(1, Math.floor((Date.now() - Number(state.startedAt || Date.now())) / 60000))
      const titles = state.trackIds.map(id => byId.get(id)?.title).filter(Boolean)
      root.querySelector('[data-receipt-date]').textContent = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())
      root.querySelector('[data-receipt-track-count]').textContent = `${titles.length} 首`
      root.querySelector('[data-receipt-page-count]').textContent = `${state.pages.length} 页`
      root.querySelector('[data-receipt-duration]').textContent = `${minutes} 分钟`
      root.querySelector('[data-receipt-tracks]').textContent = titles.length ? titles.join(' · ') : '还没有播放记录，先放一首吧。'
      root.querySelector('[data-receipt-note]').textContent = state.frames.length ? `你还看过：${state.frames.slice(-2).join('、')}` : '音乐会在页面之间继续。'
    }
    const open = () => { render(); if (typeof dialog?.showModal === 'function') dialog.showModal(); else if (dialog) dialog.setAttribute('open', '') }
    root.querySelector('[data-visit-receipt-trigger]')?.addEventListener('click', open)
    root.querySelector('[data-visit-receipt-close]')?.addEventListener('click', () => dialog?.close())
    root.querySelector('[data-visit-receipt-copy]')?.addEventListener('click', event => {
      const state = recordVisit(); const titles = state.trackIds.map(id => byId.get(id)?.title).filter(Boolean)
      const text = `SAKURA / VISIT RECEIPT\n${new Date().toLocaleDateString('zh-CN')} · ${state.pages.length} 页 · ${titles.length} 首歌\n${titles.join(' · ') || '今晚还没有播放歌曲'}\nMUSIC FOR THE QUIET HOURS`
      copy(text).then(() => { event.target.textContent = '已复制 ✓' }).catch(() => { root.querySelector('[data-receipt-status]').textContent = text })
    })
    recordVisit(); document.addEventListener('sakura:trackchange', event => { recordVisit({ trackId: event.detail?.track?.id || player()?.currentTrack?.id }); if (dialog?.open) render() })
    document.addEventListener('sakura:galleryview', event => { recordVisit({ frame: event.detail?.title }); if (dialog?.open) render() })
    document.addEventListener('pjax:complete', () => { recordVisit(); if (dialog?.open) render() })
  }

  const init = () => {
    document.querySelectorAll('[data-mixtape]').forEach(renderMixtape)
    initNow(document.querySelector('[data-sakura-now]'))
    initReceipt(document.querySelector('[data-visit-receipt-trigger]')?.closest('[data-music-neighborhood]'))
  }
  const bind = () => {
    if (bound) return
    bound = true
    document.addEventListener('DOMContentLoaded', init)
    document.addEventListener('pjax:complete', init)
    document.addEventListener('pjax:send', () => { document.querySelectorAll('[data-mixtape], [data-sakura-now]').forEach(root => { delete root.dataset.funReady }) })
    document.addEventListener('sakura:trackchange', event => recordVisit({ trackId: event.detail?.track?.id || player()?.currentTrack?.id }))
  }
  bind(); init()
})()
