'use strict';

(() => {
  let cleanup = null
  const preference = (key, fallback) => { try { return localStorage.getItem(key) || fallback } catch (_) { return fallback } }
  const save = (key, value) => { try { localStorage.setItem(key, value) } catch (_) {} }
  const init = () => {
    cleanup?.()
    const controller = new AbortController()
    const listen = (element, event, callback) => element.addEventListener(event, callback, { signal: controller.signal })
    let frame = 0
    let resizeObserver = null
    const post = document.querySelector('#body-wrap.post')

    const notes = document.querySelector('#recent-posts')
    if (notes) {
      const toolbar = notes.querySelector('[data-notes-toolbar]')
      toolbar.hidden = false
      const setView = value => {
        const mode = value === 'list' ? 'list' : 'covers'
        notes.dataset.notesView = mode
        toolbar.querySelectorAll('[data-notes-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.notesView === mode)))
      }
      setView(preference('sakura-notes-view', 'covers'))
      listen(toolbar, 'click', event => {
        const button = event.target.closest('[data-notes-view]')
        if (!button) return
        setView(button.dataset.notesView)
        save('sakura-notes-view', button.dataset.notesView)
      })
    }

    const finder = document.querySelector('[data-resource-finder]')
    if (finder) {
      finder.hidden = false
      document.querySelector('[data-resource-nav]').hidden = true
      const input = finder.querySelector('input')
      const groups = [...document.querySelectorAll('.resource-group')]
      const entries = groups.flatMap(group => [...group.querySelectorAll('.resource-item')].map(card => ({ card, group, text: card.textContent.toLocaleLowerCase() })))
      let category = 'all'
      const filter = () => {
        const terms = input.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
        let count = 0
        entries.forEach(({ card, group, text }) => {
          card.hidden = (category !== 'all' && group.id !== category) || !terms.every(term => text.includes(term))
          if (!card.hidden) count += 1
        })
        groups.forEach(group => { group.hidden = !entries.some(entry => entry.group === group && !entry.card.hidden) })
        finder.querySelector('[data-resource-count]').textContent = `${count} / ${entries.length} 份资料`
        finder.querySelector('[data-resource-empty]').hidden = count > 0
        finder.querySelector('[data-resource-clear]').disabled = !input.value && category === 'all'
        finder.querySelectorAll('[data-resource-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.resourceFilter === category)))
      }
      listen(input, 'input', filter)
      listen(finder, 'click', event => {
        const button = event.target.closest('button')
        if (!button) return
        if (button.hasAttribute('data-resource-filter')) category = button.dataset.resourceFilter
        if (button.hasAttribute('data-resource-clear')) { input.value = ''; category = 'all'; input.focus() }
        filter()
      })
      entries.forEach(({ card }) => {
        const code = card.querySelector('.resource-item__footer code')
        const value = code?.textContent.match(/CODE\s*\/\s*(\S+)/)?.[1]
        if (!value) return
        let button = card.querySelector('[data-resource-copy]')
        if (!button) {
          button = document.createElement('button')
          button.type = 'button'
          button.dataset.resourceCopy = ''
          button.textContent = '复制提取码'
          button.setAttribute('aria-label', `复制${card.querySelector('h3').textContent}的提取码`)
          code.after(button)
        }
        listen(button, 'click', async () => {
          try {
            await navigator.clipboard.writeText(value)
            if (!controller.signal.aborted) {
              button.textContent = '已复制 ✓'
              finder.querySelector('[data-resource-feedback]').textContent = `已复制「${card.querySelector('h3').textContent}」的提取码：${value}`
            }
          } catch (_) {
            // Keep the original code selectable when Clipboard access is unavailable.
            if (!controller.signal.aborted) finder.querySelector('[data-resource-feedback]').textContent = `请手动复制卡片中的提取码：${value}`
          }
        })
      })
      filter()
    }

    if (post) {
      const toolbar = post.querySelector('[data-reading-desk]')
      const article = post.querySelector('article#article-container')
      toolbar.hidden = false
      let size = Number(preference('sakura-reading-size', '0'))
      if (!Number.isFinite(size) || size < 16 || size > 24) size = Math.round(parseFloat(getComputedStyle(article).fontSize))
      const updateProgress = () => {
        frame = 0
        const bounds = article.getBoundingClientRect()
        const readingTop = toolbar.getBoundingClientRect().bottom
        const playerHeight = document.querySelector('#sakura-player')?.getBoundingClientRect().height || 0
        const readingHeight = Math.max(1, window.innerHeight - readingTop - playerHeight)
        const distance = bounds.height - readingHeight
        const value = distance <= 0 ? (bounds.bottom <= window.innerHeight - playerHeight ? 100 : 0) : Math.round(Math.max(0, Math.min(1, (readingTop - bounds.top) / distance)) * 100)
        toolbar.querySelector('[data-reading-progress]').value = value
        toolbar.querySelector('[data-reading-percent]').textContent = `${value}%`
      }
      const scheduleProgress = () => { if (!frame) frame = requestAnimationFrame(updateProgress) }
      const setSize = () => {
        article.style.fontSize = `${size}px`
        toolbar.querySelector('[data-reading-size="smaller"]').disabled = size <= 16
        toolbar.querySelector('[data-reading-size="larger"]').disabled = size >= 24
        scheduleProgress()
      }
      const focus = toolbar.querySelector('[data-reading-focus]')
      const setFocus = active => {
        post.classList.toggle('desk-focus', active)
        focus.setAttribute('aria-pressed', String(active))
        focus.textContent = active ? '退出沉浸' : '沉浸阅读'
        scheduleProgress()
      }
      setSize()
      setFocus(preference('sakura-reading-focus', 'off') === 'on')
      listen(toolbar, 'click', event => {
        const button = event.target.closest('button')
        if (!button) return
        if (button.hasAttribute('data-reading-focus')) {
          const active = !post.classList.contains('desk-focus')
          setFocus(active)
          save('sakura-reading-focus', active ? 'on' : 'off')
        }
        if (button.dataset.readingSize) {
          size = Math.max(16, Math.min(24, size + (button.dataset.readingSize === 'larger' ? 2 : -2)))
          setSize()
          save('sakura-reading-size', String(size))
        }
      })
      window.addEventListener('scroll', scheduleProgress, { passive: true, signal: controller.signal })
      listen(window, 'resize', scheduleProgress)
      if ('ResizeObserver' in window) { resizeObserver = new ResizeObserver(scheduleProgress); resizeObserver.observe(article) }
      listen(article, 'load', scheduleProgress)
      scheduleProgress()
    }
    cleanup = () => { controller.abort(); resizeObserver?.disconnect(); if (frame) cancelAnimationFrame(frame) }
  }
  document.addEventListener('DOMContentLoaded', init)
  document.addEventListener('pjax:complete', init)
  document.addEventListener('pjax:send', () => { cleanup?.(); cleanup = null })
})()
