'use strict'

const NETEASE_PLAYLIST_URL = 'https://music.163.com/#/playlist?id=2203036705'
const NETEASE_PROFILE_URL = 'https://music.163.com/#/user/home?id=1441471952'

const HOME_HERO = `
<section class="midnight-hero" aria-labelledby="midnight-title">
  <div class="midnight-hero__copy">
    <p class="midnight-eyebrow"><span>SAKURA.LUXE</span><span>LISTENING ROOM / 01</span></p>
    <h1 id="midnight-title">Music for<br><em>the quiet hours.</em></h1>
    <p class="midnight-intro">在代码、音乐与生活之间，<br>收集那些值得被反复播放的瞬间。</p>
    <div class="midnight-actions">
      <button class="midnight-play" type="button" data-midnight-target="#listening-room" aria-label="前往我的音乐歌单">
        <span class="midnight-play__icon" aria-hidden="true">&#9654;</span>
        <span>OPEN PLAYLIST</span>
      </button>
      <a href="#recent-posts">READ THE NOTES <span aria-hidden="true">&#8599;</span></a>
    </div>
  </div>
  <div class="midnight-record-stage" aria-hidden="true">
    <p class="midnight-record-caption">NOW SPINNING<br>YORUSHIKA / SELECTION</p>
    <div class="midnight-record">
      <div class="midnight-record__grooves"></div>
      <div class="midnight-record__label">
        <span>SAKURA</span>
        <small>夜の選曲</small>
      </div>
    </div>
    <span class="midnight-orbit midnight-orbit--one"></span>
    <span class="midnight-orbit midnight-orbit--two"></span>
  </div>
  <p class="midnight-scroll">SCROLL TO LISTEN <span aria-hidden="true">&#8595;</span></p>
</section>`

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character]))

const formatCommentLikes = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return '—'
  if (number >= 10000) {
    const digits = number >= 100000 ? 0 : 1
    return `${(number / 10000).toFixed(digits)}万`
  }
  return new Intl.NumberFormat('zh-CN').format(number)
}

const renderTrackComments = (track) => {
  const payload = track?.neteaseComments || {}
  const comments = Array.isArray(payload.comments) ? payload.comments.slice(0, 3) : []
  const updated = payload.updatedAt ? String(payload.updatedAt).slice(0, 10) : ''
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

const renderTrackDetail = (track, index) => `
  <div class="listening-note__index"><span>${String(index + 1).padStart(2, '0')}</span><small>ABOUT THE TRACK</small></div>
  <div class="listening-note__copy">
    <p class="listening-note__meta">${escapeHtml(track.meta)}</p>
    <h3>${escapeHtml(track.title)}</h3>
    <p class="listening-note__about">${escapeHtml(track.about)}</p>
    <blockquote><span>聆听札记 · 非原歌词</span><p lang="ja">${escapeHtml(track.noteJa)}</p><p>${escapeHtml(track.noteZh)}</p></blockquote>
    ${renderTrackComments(track)}
    <div class="listening-note__actions"><button type="button" data-detail-play="${escapeHtml(track.id)}">PLAY FULL TRACK <span>▶</span></button><a href="${NETEASE_PLAYLIST_URL}" target="_blank" rel="noopener">NETEASE PLAYLIST ↗</a></div>
  </div>`

const renderListeningRoom = (tracks) => {
  const selection = Array.isArray(tracks) ? tracks : []
  const first = selection[0]
  if (!first) return ''
  const list = selection.map((track, index) => `
      <li>
        <button class="track-trigger${index === 0 ? ' is-active' : ''}" type="button" data-track-id="${escapeHtml(track.id)}" aria-pressed="${index === 0}">
          <span class="track-no">${String(index + 1).padStart(2, '0')}</span><span class="track-title">${escapeHtml(track.title)}<small>${escapeHtml(track.titleJa)}</small></span><span class="track-artist">${escapeHtml(track.artist)}</span><span class="track-action"><i>DISCOVER</i><em>SELECTED</em><b>+</b></span>
        </button>
      </li>`).join('')
  return `
<section class="listening-room" id="listening-room" aria-labelledby="listening-title">
  <div class="listening-room__heading">
    <p>PERSONAL SELECTION / 2026</p>
    <h2 id="listening-title">夜晚适合把世界<br>调成静音，只留下音乐。</h2>
  </div>
  <div class="listening-selection">
    <div class="listening-selection__label"><span>SAKURA'S ${selection.length} PICKS</span><span>CLICK TO LISTEN</span></div>
    <ol class="listening-tracks" aria-label="Sakura 的代表曲目">${list}
    </ol>
    <a class="listening-collection" href="${NETEASE_PLAYLIST_URL}" target="_blank" rel="noopener">
      <span class="listening-collection__mark" aria-hidden="true">♬</span>
      <span><small>FULL COLLECTION / NETEASE CLOUD MUSIC</small><strong>我的网易云收藏歌单</strong></span>
      <span class="listening-collection__open">OPEN PLAYLIST ↗</span>
    </a>
  </div>
  <div class="listening-note" data-track-detail aria-live="polite">${renderTrackDetail(first, 0)}</div>
</section>`
}

const PERSISTENT_PLAYER = `
<aside class="sakura-player" id="sakura-player" aria-label="Sakura 的持续音乐播放器">
  <audio preload="metadata"></audio>
  <div class="sakura-player__inner">
    <div class="sakura-player__disc" aria-hidden="true"><i></i></div>
    <div class="sakura-player__meta">
      <span class="sakura-player__eyebrow">CURRENT TRACK · FULL LENGTH</span>
      <strong data-player-title>所以我放弃了音乐</strong>
      <small><span data-player-title-ja>だから僕は音楽を辞めた</span> · <span data-player-artist>YORUSHIKA</span></small>
    </div>
    <div class="sakura-player__transport">
      <button type="button" data-player-prev aria-label="上一首">←</button>
      <button class="sakura-player__play" type="button" data-player-play aria-label="播放"><span>▶</span></button>
      <button type="button" data-player-next aria-label="下一首">→</button>
    </div>
    <div class="sakura-player__timeline">
      <span data-player-current>0:00</span>
      <input type="range" min="0" max="100" value="0" step="0.1" aria-label="播放进度">
      <span data-player-duration>—:—</span>
    </div>
    <div class="sakura-player__links">
      <a href="${NETEASE_PLAYLIST_URL}" target="_blank" rel="noopener">NETEASE LIST ↗</a>
    </div>
  </div>
  <p class="sakura-player__status" data-player-status aria-live="polite">选择一首歌，音乐会在页面之间继续播放。</p>
</aside>`

const NAV_FREQUENCY = `
<span class="nav-frequency" aria-label="当前频道：Yorushika 夜间选曲">
  <i aria-hidden="true"></i>
  <span><b>ON AIR</b><small>YORUSHIKA / NIGHT SELECTION</small></span>
</span>`

const NOTES_HEADING = `
<header class="midnight-section-title">
  <div><span>02</span><span>SELECTED NOTES</span></div>
  <h2>最近写下的事</h2>
  <p>生活、技术、游戏与读过的书。<br>像 B 面曲目一样，被留在这里。</p>
</header>`

const HOME_CODA = `
<section class="midnight-coda" aria-labelledby="fragments-title">
  <header class="midnight-coda__heading">
    <div><span>03</span><span>VISUAL FRAGMENTS</span></div>
    <h2 id="fragments-title">一些被保存的瞬间</h2>
    <a href="/gallery/">VIEW THE GALLERY <span aria-hidden="true">&#8599;</span></a>
  </header>
  <div class="midnight-filmstrip">
    <figure><img src="/img/gallery/季09.jpg" alt="相册中的季节片段" loading="lazy"><figcaption>FRAME / 01</figcaption></figure>
    <figure><img src="/img/gallery/小缘03.jpg" alt="相册中的人物片段" loading="lazy"><figcaption>FRAME / 02</figcaption></figure>
    <figure><img src="/img/gallery/彼岸花04.jpg" alt="相册中的彼岸花片段" loading="lazy"><figcaption>FRAME / 03</figcaption></figure>
    <figure><img src="/img/gallery/花鸟11.jpg" alt="相册中的花鸟片段" loading="lazy"><figcaption>FRAME / 04</figcaption></figure>
  </div>
</section>
<section class="midnight-manifesto">
  <p>END OF SIDE A</p>
  <h2>“有些无法说出口的事，<br>就让音乐替我们记住。”</h2>
  <a href="/archives/">CONTINUE TO THE ARCHIVE <span aria-hidden="true">&#8594;</span></a>
</section>`

const PAGE_INTROS = {
  'resources/index.html': ['RESOURCE ARCHIVE / 04', '课程、代码与学习资料，被整理成一座可以慢慢浏览的档案馆。'],
  'about/index.html': ['ABOUT SAKURA / PROFILE', '关于音乐、代码，以及我愿意留在这里的生活片段。'],
  'gallery/index.html': ['VISUAL FRAGMENTS / 05', '照片与插画是另一种记忆方式。'],
  'link/index.html': ['FREQUENCIES / 06', '互联网上偶然相遇的人与地方。'],
  'categories/index.html': ['COLLECTIONS / 07', '沿着不同主题，重新进入这些文字。'],
  'tags/index.html': ['INDEX / 08', '一些反复出现的关键词。'],
  'archives/index.html': ['COMPLETE CATALOGUE / 09', '按时间保存的全部记录。']
}

const POST_SIDEBAR_NOTE = `
<section class="post-listening-note" aria-label="阅读模式提示">
  <div class="post-listening-note__disc" aria-hidden="true"><i></i></div>
  <p>READING MODE / SIDE B</p>
  <h2>把页面调暗，<br>让文字慢一点。</h2>
  <span>底部试听会在翻页时继续保留，适合搭配一首歌慢慢阅读。</span>
  <div class="post-listening-note__links">
    <a href="/about/">MEET SAKURA ↗</a>
    <a href="/#listening-room">LISTENING ROOM ↗</a>
  </div>
</section>`

const getNeteaseComments = () => {
  const data = hexo.locals.get('data') || {}
  return data.neteaseComments || data['netease-comments'] || {}
}

const getTrackData = () => {
  const data = hexo.locals.get('data') || {}
  const comments = getNeteaseComments()
  const entries = comments && typeof comments.tracks === 'object' ? comments.tracks : {}
  return Array.isArray(data.tracks)
    ? data.tracks.map((track) => ({ ...track, neteaseComments: entries[track.id] || null }))
    : []
}

const getNeteaseStats = () => {
  const data = hexo.locals.get('data') || {}
  return data.neteaseStats || data['netease-stats'] || {}
}

const formatMinutes = (minutes) => {
  if (minutes === null || minutes === undefined || minutes === '') return '—'
  const value = Number(minutes)
  if (!Number.isFinite(value) || value < 0) return '—'
  const hours = Math.floor(value / 60)
  const remaining = Math.round(value % 60)
  return hours ? `${hours}h ${String(remaining).padStart(2, '0')}m` : `${remaining}m`
}

// Older workflow snapshots briefly stored the raw `totalDuration` seconds
// in a `*Minutes` field. Keep those snapshots readable while the next Action
// run replaces them with canonical minutes. New snapshots have a diagnostic
// raw value, so this conversion is only applied when the stored value is
// exactly that raw seconds/milliseconds value.
const readDurationMinutes = (duration, key, field) => {
  const rawStoredValue = duration?.[key]
  if (rawStoredValue === null || rawStoredValue === undefined || rawStoredValue === '') return null
  const value = Number(rawStoredValue)
  if (!Number.isFinite(value) || value < 0) return null
  const diagnostic = duration?.fields?.[field] || {}
  const rawValue = Number(diagnostic.rawValue)
  const unit = String(diagnostic.unit || '').toLowerCase()
  if (Number.isFinite(rawValue) && rawValue === value) {
    if (/^(?:seconds?|秒)$/.test(unit)) return Math.floor(value / 60)
    if (/^(?:milliseconds?|毫秒)$/.test(unit)) return Math.round(value / 60000)
  }
  return Math.round(value)
}

const formatSongDuration = (durationMs) => {
  const seconds = Math.max(0, Math.round(Number(durationMs) / 1000))
  if (!Number.isFinite(seconds) || seconds === 0) return '—'
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

const formatCount = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? new Intl.NumberFormat('zh-CN').format(number) : '—'
}

const renderNeteaseRanking = (label, rows) => {
  const entries = Array.isArray(rows) ? rows.slice(0, 8) : []
  const items = entries.length
    ? entries.map((track, index) => {
      const title = track.title || '未命名歌曲'
      const subtitle = track.alias && track.alias !== title ? track.alias : (track.album || track.artist || '')
      const metric = Number(track.playCount) > 0
        ? `${formatCount(track.playCount)} 次`
        : (Number.isFinite(Number(track.score)) ? `SCORE ${track.score}` : formatSongDuration(track.durationMs))
      return `<li><span class="about-netease__rank-no">${String(index + 1).padStart(2, '0')}</span><span class="about-netease__rank-song"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(subtitle)}</small></span><span class="about-netease__rank-artist">${escapeHtml(track.artist || '')}</span><em>${escapeHtml(metric)}</em></li>`
    }).join('')
    : '<li class="about-netease__empty">等待网易云数据同步。</li>'
  return `<article class="about-netease__ranking"><header><span>${escapeHtml(label)}</span><small>TOP ${entries.length || '—'}</small></header><ol>${items}</ol></article>`
}

const fingerprintWeight = (track) => {
  const playCount = Number(track?.playCount)
  if (Number.isFinite(playCount) && playCount > 0) return playCount
  const score = Number(track?.score)
  return Number.isFinite(score) && score > 0 ? score : 1
}

const renderListeningFingerprint = (weekly, allTime) => {
  const useWeekly = weekly.length > 0
  const source = (useWeekly ? weekly : allTime).slice(0, 8)
  const scope = useWeekly ? '本周声纹' : '总榜信号'
  if (!source.length) {
    return `<div class="about-netease__fingerprint is-empty"><span class="about-netease__fingerprint-label">LISTENING FINGERPRINT / ${scope}</span><strong>等待数据同步</strong><small>网易云排行准备好后，这里会生成你的听歌声纹。</small></div>`
  }

  const weights = source.map(fingerprintWeight)
  const maximum = Math.max(...weights, 1)
  // Interpolate the ranking weights into a denser waveform so the signal reads
  // clearly on wide desktop cards as well as on compact mobile layouts.
  const waveform = Array.from({ length: 16 }, (_, index) => {
    if (weights.length === 1) return weights[0]
    const position = (index / 15) * (weights.length - 1)
    const left = Math.floor(position)
    const right = Math.min(left + 1, weights.length - 1)
    const ratio = position - left
    return weights[left] + ((weights[right] - weights[left]) * ratio)
  })
  const bars = waveform.map((weight, index) => {
    const height = Math.max(22, Math.round((weight / maximum) * 100))
    return `<i style="--bar-height:${height}%;--bar-index:${index}" aria-hidden="true"></i>`
  }).join('')

  const artistWeights = new Map()
  source.forEach((track) => {
    const artist = String(track?.artist || '').trim()
    if (!artist) return
    artistWeights.set(artist, (artistWeights.get(artist) || 0) + fingerprintWeight(track))
  })
  const leadArtist = [...artistWeights.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0]
  const leadTrack = String(source[0]?.title || '未命名歌曲')
  const leadLabel = leadArtist || leadTrack
  const firstPlayCount = Number(source[0]?.playCount)
  const playLabel = Number.isFinite(firstPlayCount) && firstPlayCount > 0
    ? `${formatCount(firstPlayCount)} 次循环`
    : 'TOP 01'
  const ariaLabel = `${scope}：${leadLabel}，${leadTrack}`
  return `<div class="about-netease__fingerprint"><span class="about-netease__fingerprint-label">LISTENING FINGERPRINT / ${scope}</span><div class="about-netease__fingerprint-head"><strong title="${escapeHtml(leadLabel)}">${escapeHtml(leadLabel)}</strong><small>${escapeHtml(playLabel)}</small></div><div class="about-netease__fingerprint-bars" role="img" aria-label="${escapeHtml(ariaLabel)}">${bars}</div><small class="about-netease__fingerprint-meta">${escapeHtml(leadTrack)} · ${source.length} 首上榜</small></div>`
}

const renderNeteaseStats = () => {
  const stats = getNeteaseStats()
  const duration = stats.duration || {}
  const available = duration.available === true
  const weeklyMinutes = available ? formatMinutes(readDurationMinutes(duration, 'weeklyMinutes', 'weekly')) : '—'
  const allTimeMinutes = available ? formatMinutes(readDurationMinutes(duration, 'allTimeMinutes', 'allTime')) : '—'
  const weekly = Array.isArray(stats.weekly) ? stats.weekly : []
  const allTime = Array.isArray(stats.allTime) ? stats.allTime : []
  const updated = stats.updatedAt ? String(stats.updatedAt).slice(0, 10) : '等待首次同步'
  const note = duration.message || stats.notes || '排行榜会由 GitHub Actions 每日同步。'
  const scrape = stats.scrape || {}
  const sourceLabel = String(duration.source || '').includes('profile-visible')
    ? 'NETEASE PROFILE DURATION + LISTEN DATA'
    : String(scrape.mode || '').includes('listen-data')
    ? 'NETEASE LISTEN DATA + COOKIE API'
    : scrape.mode === 'cookie-api+public-api'
      ? 'COOKIE API + PUBLIC FALLBACK'
      : scrape.succeeded
        ? 'COOKIE PAGE + PUBLIC FALLBACK'
        : 'PUBLIC API FALLBACK'
  const profileUrl = stats.profileUrl || NETEASE_PROFILE_URL
  return `<section class="about-netease" id="netease-listening" aria-labelledby="about-netease-title">
  <header class="about-netease__header">
    <div><p>NETEASE CLOUD / LISTENING LOG</p><h2 id="about-netease-title">我的听歌轨迹</h2></div>
    <a href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener">OPEN NETEASE PROFILE <span aria-hidden="true">↗</span></a>
  </header>
  <div class="about-netease__metrics">
    <div><span>THIS WEEK</span><strong>${weeklyMinutes}</strong><small>本周听歌时长</small></div>
    <div><span>ALL TIME</span><strong>${allTimeMinutes}</strong><small>累计听歌时长</small></div>
    ${renderListeningFingerprint(weekly, allTime)}
  </div>
  <div class="about-netease__rankings">
    ${renderNeteaseRanking('WEEKLY RANKING / 本周', weekly)}
    ${renderNeteaseRanking('ALL-TIME RANKING / 总榜', allTime)}
  </div>
  <footer class="about-netease__footer"><p>${escapeHtml(note)}<span class="about-netease__source">${escapeHtml(sourceLabel)}</span></p><time datetime="${escapeHtml(String(stats.updatedAt || ''))}">UPDATED ${escapeHtml(updated)}</time></footer>
</section>`
}

const serializeTrackData = (tracks) => JSON.stringify(tracks).replace(/</g, '\\u003c')

hexo.extend.filter.register('after_render:html', function (html, data) {
  if (!data) return html

  let result = html
  const tracks = getTrackData()

  if (data.path !== 'index.html') {
    const intro = PAGE_INTROS[data.path]
    if (intro) {
      result = result.replace('<div id="page-site-info">', `<div id="page-site-info"><p class="midnight-page-kicker">${intro[0]}</p><p class="midnight-page-desc">${intro[1]}</p>`)
    }
    if (/^posts\/[^/]+\/index\.html$/.test(data.path)) {
      result = result.replace('<div id="post-info"><h1', '<div id="post-info"><p class="post-issue">LISTENING NOTES / SIDE B</p><h1')
      result = result.replace('<div class="aside-content" id="aside-content">', `<div class="aside-content" id="aside-content">${POST_SIDEBAR_NOTE}`)
    }
    if (data.path === 'about/index.html') {
      result = result.replace('<section class="about-interests"', `${renderNeteaseStats()}<section class="about-interests"`)
    }
  } else {
    result = result.replace('</header><main', `${HOME_HERO}</header>${renderListeningRoom(tracks)}<main`)
    result = result.replace('<div class="recent-posts', `${NOTES_HEADING}<div class="recent-posts`)
    result = result.replace('</main><footer', `</main>${HOME_CODA}<footer`)
    result = result.replace(/(<meta property="og:image" content=")[^"]+("\s*\/?>)/, '$1https://sakura.luxe/img/og.png$2')
    result = result.replace(/(<meta name="twitter:image" content=")[^"]+("\s*\/?>)/, '$1https://sakura.luxe/img/og.png$2')
  }

  if (!result.includes('window.__SAKURA_TRACKS')) {
    result = result.replace('</head>', `<script>window.__SAKURA_TRACKS=${serializeTrackData(tracks)};</script></head>`)
  }
  if (!result.includes('id="sakura-player"')) {
    result = result.replace('</body>', `${PERSISTENT_PLAYER}</body>`)
  }
  if (!result.includes('class="nav-frequency"')) {
    result = result.replace('<div id="menus">', `${NAV_FREQUENCY}<div id="menus">`)
  }
  return result
})
