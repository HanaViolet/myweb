'use strict';

(() => {
  const stations = window.__SAKURA_STATIONS || []
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const player = () => window.__sakuraPlayer
  const read = key => { try { return JSON.parse(localStorage.getItem(key)) } catch (_) { return null } }
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true } catch (_) { return false } }
  const time = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
  let cleanup = () => {}
  const init = () => {
    cleanup()
    const controller = new AbortController()
    const on = (target, name, callback, options = {}) => target?.addEventListener(name, callback, { ...options, signal: controller.signal })
    const animations = new Set()
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('sonic-in-view', entry.isIntersecting))
    })
    const animate = element => {
      if (motion.matches || !element?.animate) return
      const animation = element.animate([{ opacity: 0.3, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)' })
      animations.add(animation)
      animation.finished.then(() => animations.delete(animation)).catch(() => {})
    }
    const radio = document.querySelector('[data-sonic-radio]')
    let syncRadio = () => {}
    if (radio && stations.length) {
      observer.observe(radio)
      let index = Math.max(0, stations.findIndex(item => item.id === read('sakura-station-v1')))
      let pairing = 0
      let track
      const find = selector => radio.querySelector(selector)
      radio.querySelectorAll('[hidden]').forEach(element => { element.hidden = false })
      syncRadio = () => {
        const playing = player()?.currentTrack?.id === track?.id && !player()?.audio.paused && !player()?.audio.ended
        radio.classList.toggle('is-on-air', Boolean(playing))
        find('[data-sonic-play]').textContent = playing ? 'Ⅱ' : '▶'
        find('[data-sonic-play]').setAttribute('aria-label', `${playing ? '暂停' : '播放'}推荐配乐：${track?.title || ''}`)
        find('[data-sonic-onair]').textContent = playing ? '● ON AIR / 正在播放' : 'READY TO LISTEN'
      }
      const render = (transition = true) => {
        const station = stations[index]
        track = station.tracks[pairing % station.tracks.length]
        const note = station.notes[pairing % station.notes.length]
        radio.style.setProperty('--sonic-accent', station.color)
        radio.style.setProperty('--dial-angle', `${-45 + index * 90}deg`)
        radio.querySelectorAll('[data-sonic-station]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.sonicStation) === index)))
        find('[data-sonic-en]').textContent = station.en
        find('[data-sonic-frequency]').textContent = station.frequency
        find('[data-sonic-line]').textContent = station.line
        find('[data-sonic-image]').src = station.image
        find('[data-sonic-song]').textContent = track?.title || '频道暂无曲目'
        find('[data-sonic-artist]').textContent = track?.artist || ''
        find('[data-sonic-play]').disabled = !track
        find('[data-sonic-note]').textContent = note ? `${note.title} ↗` : '翻阅全部文章 ↗'
        find('[data-sonic-note]').href = note?.url || '/archives/'
        find('[data-sonic-description]').textContent = note?.description || '这个频道的故事还在慢慢收集。'
        if (transition) {
          find('[data-sonic-feedback]').textContent = `已调至「${station.name}」${station.frequency} FM。按播放，听听这次相遇。`
          animate(find('[data-sonic-pair]'))
        }
        syncRadio()
      }
      on(radio, 'click', event => {
        const button = event.target.closest('button')
        if (!button) return
        if (button.hasAttribute('data-sonic-station') || button.hasAttribute('data-sonic-next')) {
          index = button.hasAttribute('data-sonic-next') ? (index + 1) % stations.length : Number(button.dataset.sonicStation)
          pairing = 0
          save('sakura-station-v1', stations[index].id)
          render()
        }
        if (button.hasAttribute('data-sonic-shuffle')) { pairing++; render() }
        if (button.hasAttribute('data-sonic-play') && track && player()) {
          if (player().currentTrack.id === track.id && !player().audio.paused) player().pause()
          else player().selectById(track.id)
        }
      })
      render(false)
    }

    const reading = document.querySelector('[data-sonic-reading]')
    let syncReading = () => {}
    let pendingSeek = null
    if (reading) {
      const station = stations.find(item => item.id === reading.dataset.station) || stations[0]
      const track = station?.tracks[0]
      const key = `sakura-soundmark-v1:${location.pathname}`
      const status = reading.querySelector('[data-sonic-reading-status]')
      const button = reading.querySelector('[data-sonic-reading-play]')
      const bookmarkButtons = document.querySelectorAll('[data-sonic-bookmark]')
      const bookmark = read(key)
      const knownTracks = window.__SAKURA_TRACKS || []
      let saved = bookmark && knownTracks.some(item => item.id === bookmark.id) && Number.isFinite(bookmark.seconds) && bookmark.seconds >= 0 && Number.isFinite(bookmark.progress) ? bookmark : null
      if (track) {
        observer.observe(reading)
        reading.hidden = false
        reading.querySelector('[data-sonic-reading-title]').textContent = `${track.title} / ${track.artist}`
        const resume = document.createElement('button')
        resume.type = 'button'
        resume.dataset.sonicResume = ''
        resume.textContent = '↗ 回到声音书签'
        resume.hidden = !saved
        // Reuse the slot across repeated Pjax initialization.
        reading.querySelector('[data-sonic-resume]')?.remove()
        reading.querySelector('.sonic-reading__actions').append(resume)
        if (saved) status.textContent = `上次停在 ${Math.round(saved.progress * 100)}% · ${time(saved.seconds)}。`
        syncReading = () => {
          const active = player()?.currentTrack?.id === track.id && !player()?.audio.paused
          reading.classList.toggle('is-playing', Boolean(active))
          button.textContent = active ? 'Ⅱ 暂停配乐' : '▶ 配乐阅读'
        }
        on(button, 'click', () => {
          if (!player()) return
          if (player().currentTrack.id === track.id && !player().audio.paused) player().pause()
          else player().selectById(track.id)
        })
        bookmarkButtons.forEach(bookmarkButton => {
          bookmarkButton.hidden = false
          on(bookmarkButton, 'click', () => {
          if (!player()) return
          const article = document.querySelector('#article-container')
          const top = article.getBoundingClientRect().top + scrollY
          const progress = Math.max(0, Math.min(1, (scrollY - top) / Math.max(1, article.offsetHeight - innerHeight)))
          const seconds = player().audio.currentTime
          saved = { id: player().currentTrack.id, seconds: Number.isFinite(seconds) ? seconds : 0, progress }
          const persisted = save(key, saved)
          resume.hidden = false
          status.textContent = `${persisted ? '声音书签已保存' : '浏览器无法保存，书签仅本次有效'}：${Math.round(progress * 100)}% · ${player().currentTrack.title} ${time(saved.seconds)}。`
          bookmarkButton.textContent = persisted ? '✓ 书签已保存' : '✓ 本次已记下'
          bookmarkButton.setAttribute('aria-label', status.textContent)
          })
        })
        on(resume, 'click', () => {
          if (!saved || !player()) return
          const target = { ...saved }
          const audio = player().audio
          const restore = () => {
            if (audio.dataset.trackId !== target.id || !Number.isFinite(audio.duration)) return
            audio.currentTime = Math.min(target.seconds, Math.max(0, audio.duration - 0.25))
            audio.removeEventListener('loadedmetadata', restore)
            pendingSeek = null
          }
          if (pendingSeek) audio.removeEventListener('loadedmetadata', pendingSeek)
          pendingSeek = restore
          on(audio, 'loadedmetadata', restore)
          player().selectById(target.id)
          if (audio.readyState >= 1) restore()
          const article = document.querySelector('#article-container')
          scrollTo({ top: article.getBoundingClientRect().top + scrollY + Math.max(0, Math.min(1, target.progress)) * Math.max(1, article.offsetHeight - innerHeight), behavior: motion.matches ? 'instant' : 'smooth' })
        })
        syncReading()
      }
    }
    on(document, 'sakura:trackchange', () => { syncRadio(); syncReading() })
    on(document, 'sakura:playbackchange', () => { syncRadio(); syncReading() })
    const stage = document.querySelector('.midnight-record-stage')
    let frame = 0
    const resetTilt = () => { cancelAnimationFrame(frame); if (stage) { stage.style.rotate = ''; stage.style.translate = '' } }
    if (stage && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      on(stage, 'pointermove', event => {
        if (motion.matches) return
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          const bounds = stage.getBoundingClientRect()
          const x = (event.clientX - bounds.left) / bounds.width - 0.5
          const y = (event.clientY - bounds.top) / bounds.height - 0.5
          stage.style.rotate = `${-y} ${x} 0 5deg`
          stage.style.translate = `${x * 8}px ${y * 8}px`
        })
      })
      on(stage, 'pointerleave', resetTilt)
    }
    on(motion, 'change', () => { resetTilt(); animations.forEach(animation => animation.cancel()) })
    const visibility = () => document.body.classList.toggle('sonic-page-hidden', document.hidden)
    on(document, 'visibilitychange', visibility)
    visibility()
    cleanup = () => { controller.abort(); observer.disconnect(); cancelAnimationFrame(frame); animations.forEach(animation => animation.cancel()); resetTilt() }
  }
  document.addEventListener('DOMContentLoaded', init)
  document.addEventListener('pjax:send', () => cleanup())
  document.addEventListener('pjax:complete', init)
})()
