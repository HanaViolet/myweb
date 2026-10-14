'use strict'

// Apply the new print-atlas art direction at render time so the theme class is
// present before the first paint and remains available without client JS.
hexo.extend.filter.register('after_render:html', (html, data) => {
  if (!data) return html

  let result = html.replace(/<body([^>]*)>/i, (opening, attributes) => {
    if (/\bclass\s*=\s*(["'])/.test(attributes)) {
      return opening.replace(/\bclass\s*=\s*(["'])(.*?)\1/i, (attribute, quote, value) => `class=${quote}${value} atlas-theme${quote}`)
    }
    return `<body class="atlas-theme"${attributes}>`
  })
  result = result.replace(/(<meta\s+name="theme-color"\s+content=")[^"]*("\s*\/?>)/i, '$1#f1eddf$2')

  if (data.path === 'index.html') {
    result = result.replace('SAKURA.LUXE', 'SAKURA / FIELD NOTES')
    result = result.replace('LISTENING ROOM / 01', 'SOUND ATLAS / MAP 01')
    result = result.replace('Music for<br><em>the quiet hours.</em>', '循着声音，<br><em>去生活里漫游。</em>')
    result = result.replace('在代码、音乐与生活之间，<br>收集那些值得被反复播放的瞬间。', '一首歌是路标，文字、游戏与日常，是沿途的风景。')
    result = result.replace('OPEN PLAYLIST', '从一首歌开始')
    result = result.replace('READ THE NOTES', '翻开沿途手记')
  }

  return result
}, 40)
