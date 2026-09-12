'use strict';

(() => {
  const tracks = (window.__SAKURA_TRACKS || []).filter(track => track.source === 'Internet Archive')
  const labels = { reading: '纸页之间 / PIANO', gallery: '光影漫游 / AMBIENT', coding: '夜间编码 / ELECTRONIC', wandering: '街角偶遇 / JAZZ' }
  const seen = new Map()
  let mood = 'wandering'
  let selected = null
  let root = null
  let observer = null
  const player = () => window.__sakuraPlayer
  const pageMood = () => {
    const path = location.pathname
    if (/^\/(posts|archives|categories|tags)(\/|$)/.test(path)) return 'reading'
    if (/^\/gallery(\/|$)/.test(path)) return 'gallery'
    if (/^\/resources(\/|$)/.test(path)) return 'coding'
    return 'wandering'
  }
  const status = message => { const element = root?.querySelector('[data-discovery-status]'); if (element) element.textContent = message }
  const sync = () => {
    if (!root || !selected) return
    const current = player()?.currentTrack
    const active = current?.id === selected.id
    const playing = Boolean(active && !player().audio.paused && !player().audio.ended)
    root.classList.toggle('is-on-air', Boolean(player() && player().audio.readyState >= 2 && !player().audio.paused && !player().audio.ended))
    root.querySelector('[data-discovery-play]').textContent = playing ? 'Ⅱ 暂停这首' : '▶ 播放这首'
    root.querySelector('[data-discovery-channel]').textContent = `${playing ? 'ON AIR' : 'NEXT DISCOVERY'} · ${labels[mood]}`
  }
  const recommend = () => {
    const pool = tracks.filter(track => track.channel === mood)
    let history = seen.get(mood) || new Set()
    let available = pool.filter(track => !history.has(track.id) && track.id !== selected?.id && track.id !== player()?.currentTrack?.id)
    if (!available.length) {
      history = new Set()
      available = pool.filter(track => track.id !== selected?.id && track.id !== player()?.currentTrack?.id)
    }
    selected = available[Math.floor(Math.random() * available.length)] || pool[0]
    if (!selected || !root) return
    history.add(selected.id)
    seen.set(mood, history)
    root.querySelector('[data-discovery-title]').textContent = selected.title
    root.querySelector('[data-discovery-artist]').textContent = selected.artist
    root.querySelector('[data-discovery-source]').href = selected.sourceUrl
    const license = root.querySelector('[data-discovery-license]')
    license.href = selected.licenseUrl
    license.textContent = selected.licenseLabel
    root.querySelectorAll('[data-discovery-mood]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.discoveryMood === mood)))
    root.querySelector('[data-discovery-caption]').textContent = `${tracks.length} 首开放音乐 · 点击店名切换频道 · 音频来自 Internet Archive，保留作者署名。`
    status(`为${labels[mood].split(' / ')[0]}挑选的一首。点击播放开始聆听。`)
    sync()
  }
  const init = () => {
    observer?.disconnect()
    root = document.querySelector('[data-music-neighborhood]')
    if (!root || !tracks.length) return
    root.querySelector('[data-discovery-radio]').hidden = false
    mood = pageMood()
    recommend()
    // Decorative motion only runs while the street is visible and music plays.
    observer = new IntersectionObserver(entries => root?.classList.toggle('street-in-view', entries[0].isIntersecting))
    observer.observe(root)
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button')
    if (!button || !root?.contains(button)) return
    if (button.matches('[data-discovery-mood]')) { mood = button.dataset.discoveryMood; recommend() }
    if (button.matches('[data-discovery-next]')) recommend()
    if (button.matches('[data-discovery-play]') && selected && player()) {
      if (player().currentTrack.id === selected.id && !player().audio.paused) {
        player().pause()
        status('暂停一下，旋律还在这里。')
      } else {
        player().selectById(selected.id)
        status('正在连接这首歌…')
      }
    }
  })
  document.addEventListener('sakura:trackchange', sync)
  document.addEventListener('sakura:playbackchange', () => {
    sync()
    if (selected && player()?.currentTrack.id === selected.id && !player().audio.paused && player().audio.readyState >= 2) status('正在播放。你可以继续浏览，音乐会陪着你。')
  })
  document.addEventListener('DOMContentLoaded', () => {
    init()
    player()?.audio.addEventListener('playing', () => {
      sync()
      if (selected && player()?.currentTrack.id === selected.id) status('正在播放。你可以继续浏览，音乐会陪着你。')
    })
    player()?.audio.addEventListener('waiting', () => {
      if (selected && player()?.currentTrack.id === selected.id) status('正在缓冲音乐，请稍候…')
    })
    player()?.audio.addEventListener('error', () => {
      if (player()?.currentTrack.source === 'Internet Archive') status('这首歌暂时连接不上。可以换一首，或去私人唱片架听收藏。')
    })
  })
  document.addEventListener('pjax:send', () => { observer?.disconnect(); root = null })
  document.addEventListener('pjax:complete', init)
})()
