'use strict'

const { readdirSync } = require('node:fs')
const path = require('node:path')

const NETEASE_PLAYLIST_URL = 'https://music.163.com/#/playlist?id=2203036705'
const NETEASE_PROFILE_URL = 'https://music.163.com/#/user/home?id=1441471952'
const CURRENT_YEAR = new Date().getFullYear()

const HOME_HERO = `
<section class="midnight-hero archive-hero" data-personal-archive aria-labelledby="midnight-title">
  <div class="midnight-hero__copy archive-hero__copy" data-hero-layer="copy">
    <p class="midnight-eyebrow"><span>SAKURA / PERSONAL ARCHIVE</span><span>FIELD INDEX / 001—004</span></p>
    <h1 id="midnight-title">把日常，<br><em>调成一首歌。</em></h1>
    <p class="midnight-intro">音乐是入口，故事在下一页。<br>读书、游戏、代码与生活，都被放进这册私人档案。</p>
    <div class="midnight-actions">
      <button class="midnight-play" type="button" data-midnight-target="#listening-room" aria-label="前往我的音乐收藏">
        <span class="midnight-play__icon" aria-hidden="true">&#9654;</span>
        <span>打开唱片柜</span>
      </button>
      <a href="#recent-posts">检索手记 <span aria-hidden="true">&#8599;</span></a>
    </div>
    <div class="archive-index" role="group" aria-label="个人档案分类">
      <p class="archive-index__head"><span>PERSONAL ARCHIVE / CONTENTS</span><span>CHOOSE A FILE</span></p>
      <div class="archive-index__items">
        <a href="#mood-radio" data-archive-mode="sound" aria-current="true"><small>01</small><span>声音</span><i>FM / TRACKS</i></a>
        <a href="#recent-posts" data-archive-mode="notes"><small>02</small><span>手记</span><i>TEXT / LOGS</i></a>
        <a href="#fragments-title" data-archive-mode="frames"><small>03</small><span>影像</span><i>FRAME / 24</i></a>
        <a href="/about/" data-archive-mode="about"><small>04</small><span>关于</span><i>PROFILE / SKR</i></a>
      </div>
    </div>
  </div>
  <div class="midnight-record-stage archive-stage" data-hero-layer="board">
    <div class="archive-board" data-archive-board data-mode="sound">
      <div class="archive-board__topline"><span>SAKURA <b>／</b> <span data-archive-system>SYNTHESIS / LISTENING OS</span></span><span>LOCAL RECORD <i>●</i></span></div>
      <div class="archive-board__canvas" data-archive-canvas>
        <svg class="archive-diagram" viewBox="0 0 720 580" aria-hidden="true" focusable="false">
          <defs>
            <pattern id="archive-dot-grid" width="11" height="11" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r=".8" fill="#28353a" fill-opacity=".16"></circle></pattern>
            <radialGradient id="archive-disc-fill" cx="43%" cy="36%" r="72%"><stop offset="0" stop-color="#6f91f4"></stop><stop offset=".48" stop-color="#315fd2"></stop><stop offset="1" stop-color="#1d3d98"></stop></radialGradient>
            <linearGradient id="archive-disc-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".22"></stop><stop offset=".55" stop-color="#ffffff" stop-opacity="0"></stop><stop offset="1" stop-color="#e68155" stop-opacity=".27"></stop></linearGradient>
            <clipPath id="archive-disc-clip"><circle cx="392" cy="282" r="158"></circle></clipPath>
          </defs>
          <rect x="0" y="0" width="720" height="580" fill="url(#archive-dot-grid)"></rect>
          <g class="archive-diagram__axis"><path d="M360 22V550M22 282H698"></path><circle cx="392" cy="282" r="206"></circle><circle cx="392" cy="282" r="244"></circle><ellipse cx="392" cy="282" rx="282" ry="166" transform="rotate(-26 392 282)"></ellipse></g>
          <g class="archive-diagram__orbit"><circle cx="392" cy="282" r="178"></circle><circle cx="392" cy="282" r="194"></circle><circle cx="392" cy="282" r="228" stroke-dasharray="1 5"></circle><circle cx="392" cy="282" r="249" stroke-dasharray="45 4 8 4"></circle><path d="M139 392C215 349 253 176 381 132S557 246 640 175"></path><path d="M105 218C181 256 226 393 357 436S538 345 654 393"></path></g>
          <g class="archive-diagram__ticks"><circle cx="392" cy="282" r="168" stroke-dasharray="1 5"></circle><circle cx="392" cy="282" r="216" stroke-dasharray="1 11"></circle><path d="M392 48v28m0 412v28M158 282h28m412 0h28M226 116l18 18m296 296 18 18M558 116l-18 18M244 430l-18 18"></path></g>
          <circle class="archive-diagram__disc-shadow" cx="398" cy="290" r="162"></circle>
          <circle class="archive-diagram__disc" cx="392" cy="282" r="158"></circle>
          <g class="archive-diagram__grooves" clip-path="url(#archive-disc-clip)"><circle cx="392" cy="282" r="150"></circle><circle cx="392" cy="282" r="138"></circle><circle cx="392" cy="282" r="126"></circle><circle cx="392" cy="282" r="114"></circle><circle cx="392" cy="282" r="102"></circle><circle cx="392" cy="282" r="90"></circle><circle cx="392" cy="282" r="78"></circle><circle cx="392" cy="282" r="66"></circle><circle cx="392" cy="282" r="54"></circle><path d="M239 232H545M271 343H522M329 126V434M446 126V434"></path></g>
          <circle class="archive-diagram__gloss" cx="392" cy="282" r="158"></circle>
          <g class="archive-diagram__core"><circle cx="392" cy="282" r="46"></circle><circle cx="392" cy="282" r="38"></circle><path d="M392 249v66m-28-33h56M375 266l34 34m0-34-34 34"></path><circle cx="392" cy="282" r="4"></circle></g>
          <g class="archive-diagram__route"><path d="M88 174C183 114 197 145 258 187S347 224 392 282 505 397 593 365 619 245 650 195"></path><circle cx="88" cy="174" r="3"></circle><circle cx="258" cy="187" r="3"></circle><circle cx="593" cy="365" r="3"></circle><circle cx="650" cy="195" r="3"></circle></g>
          <g class="archive-diagram__labels"><text x="44" y="86">FIG. 01 / PERSONAL FREQUENCY</text><text x="511" y="80">SAKURA • 33⅓ RPM</text><text x="40" y="514">SOUND / MEMORY / DAILY LIFE</text><text x="537" y="510">ARCHIVE SYSTEM · 2026</text><text x="347" y="291">S</text></g>
        </svg>
        <div class="archive-board__avatar"><img src="/img/avatar.jpg" alt="" width="88" height="88" loading="eager"><span>SAKURA<br>INDEX 001</span></div>
        <span class="archive-board__stamp" aria-hidden="true">SOUND<br>IS A<br>PLACE</span>
        <a class="archive-pin archive-pin--one" href="#mood-radio" data-archive-mode="sound" aria-label="打开声音档案"><span>01</span><i>FREQUENCY</i></a>
        <a class="archive-pin archive-pin--two" href="#recent-posts" data-archive-mode="notes" aria-label="打开文字手记"><span>02</span><i>FIELD NOTE</i></a>
        <a class="archive-pin archive-pin--three" href="#fragments-title" data-archive-mode="frames" aria-label="打开影像图录"><span>03</span><i>FRAGMENTS</i></a>
        <a class="archive-pin archive-pin--four" href="/about/" data-archive-mode="about" aria-label="打开关于我"><span>04</span><i>ABOUT</i></a>
        <span class="archive-board__measurement archive-board__measurement--left" aria-hidden="true">02° 18′ / LISTEN</span>
        <span class="archive-board__measurement archive-board__measurement--right" data-archive-progress aria-hidden="true">TRACE / 000%</span>
        <span class="archive-board__scanline" aria-hidden="true"></span>
      </div>
      <div class="archive-board__readout" aria-live="polite" aria-atomic="true">
        <div class="archive-board__readout-head"><span data-archive-label>FILE 01 / FREQUENCY</span><span class="archive-board__signal"><i></i> <b data-archive-signal>SYNTHESIS / READY</b></span></div>
        <div class="archive-board__readout-body"><div><strong data-archive-title>此刻的你，在哪个频率？</strong><p data-archive-description>调到你的心情，让一首歌和一段文字在此相遇。</p></div><a data-archive-link href="#mood-radio"><span data-archive-cta>进入心情电台</span><span aria-hidden="true">↗</span></a></div>
      </div>
      <div class="archive-boot" data-archive-boot hidden aria-hidden="true">
        <div class="archive-boot__top"><span>SAKURA / ARCHIVE INTERFACE</span><span>LOCAL ACCESS / NO ACCOUNT</span></div>
        <div class="archive-boot__core">
          <svg class="archive-boot__glyph" viewBox="0 0 120 72" aria-hidden="true" focusable="false">
            <path d="M60 36C46 17 34 12 23 17 7 24 9 48 25 55c13 6 25-3 35-19 14-19 26-24 37-19 16 7 14 31-2 38-13 6-25-3-35-19Z"></path>
            <path d="M60 13v46M38 36h44M48 24l24 24m0-24L48 48"></path>
            <circle cx="60" cy="36" r="4"></circle>
          </svg>
          <p class="archive-boot__eyebrow">SIGNAL / PERSONAL FREQUENCY</p>
          <h2 data-archive-boot-title>正在接入声音档案</h2>
          <p class="archive-boot__step" data-archive-boot-step role="status" aria-live="polite">ESTABLISHING PERSONAL CHANNEL</p>
          <div class="archive-boot__progress" data-archive-boot-progress role="progressbar" aria-label="档案接入进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
          <span class="archive-boot__percent" data-archive-boot-percent>000%</span>
        </div>
        <div class="archive-boot__foot"><span>THIS IS A LOCAL VISUAL SEQUENCE</span><button type="button" data-archive-boot-close>取消进入 <b aria-hidden="true">×</b></button></div>
      </div>
      <div class="archive-board__foot"><span>AN INTERACTIVE INDEX OF SOUND & DAILY LIFE</span><span>MOVE / SELECT / LISTEN</span></div>
    </div>
  </div>
  <p class="midnight-scroll archive-scroll">SCROLL TO EXPLORE <span aria-hidden="true">&#8595;</span></p>
</section>`

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character]))

const formatShanghaiDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date).replace(/\//g, '-')
}

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
  const comments = Array.isArray(payload.comments) ? payload.comments.slice(0, 4) : []
  const updated = formatShanghaiDate(payload.updatedAt)
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
  <div class="listening-note__index"><span>${String(index + 1).padStart(2, '0')}</span><small>LINER NOTES / SIDE A</small></div>
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
<section class="listening-room listening-room--gatefold" id="listening-room" aria-labelledby="listening-title">
  <div class="listening-room__heading">
    <p>PERSONAL SELECTION / ${CURRENT_YEAR}</p>
    <h2 id="listening-title">夜晚适合把世界<br>调成静音，只留下音乐。</h2>
  </div>
  <div class="listening-tools" data-listening-tools>
    <div class="listening-tools__buttons">
      <button type="button" data-room-shuffle>↝ 随手放一首</button>
      <button type="button" data-room-favorite aria-pressed="false">♡ 收藏这首</button>
      <button type="button" data-room-share>↗ 分享这首</button>
    </div>
    <p data-room-feedback role="status">从私人收藏与开放音乐里，找到今晚的声音。</p>
    <a class="room-explore-link" href="#music-neighborhood-title">去音乐街区，探索更多声音 ↘</a>
    <div class="listening-tools__saved" data-room-saved aria-label="我收藏的选曲"></div>
    <div class="listening-tools__share" data-room-share-fallback hidden><label>复制歌曲链接 <input type="text" readonly data-room-share-url></label></div>
  </div>
  <div class="listening-gatefold">
    <div class="listening-gatefold__folio" aria-hidden="true">
      <span>SAKURA LISTENING ARCHIVE</span>
      <span>CAT. NO. SKR-${String(selection.length).padStart(2, '0')} / ${CURRENT_YEAR}</span>
    </div>
    <div class="listening-gatefold__page listening-gatefold__page--index">
      <div class="listening-selection">
        <div class="listening-selection__label"><span>SIDE A / ${selection.length} TRACKS</span><span>SELECT A TRACK</span></div>
        <ol class="listening-tracks" aria-label="Sakura 的代表曲目">${list}
        </ol>
        <a class="listening-collection" href="${NETEASE_PLAYLIST_URL}" target="_blank" rel="noopener">
          <span class="listening-collection__mark" aria-hidden="true">♬</span>
          <span><small>FULL COLLECTION / NETEASE CLOUD MUSIC</small><strong>我的网易云收藏歌单</strong></span>
          <span class="listening-collection__open">OPEN PLAYLIST ↗</span>
        </a>
      </div>
    </div>
    <div class="listening-gatefold__page listening-gatefold__page--notes">
      <div class="listening-note" data-track-detail aria-live="polite">${renderTrackDetail(first, 0)}</div>
    </div>
  </div>
</section>`
}

const renderRoomPostcard = () => `
<section class="room-postcard" aria-labelledby="room-postcard-title">
  <div class="room-postcard__identity"><img src="/img/avatar.jpg" alt="Sakura 的头像" width="64" height="64" loading="lazy"><span>A NOTE FROM<br>SAKURA</span></div>
  <div class="room-postcard__copy"><p>一首歌的时间 / SIDE B</p><h2 id="room-postcard-title">让声音，带你翻到某一页。</h2><p>这里也放着我读过的书、玩过的游戏，和慢慢写出来的代码。听歌的时候，可以顺路读一篇。</p><a data-room-note href="/archives/">去看看我的旧文 ↗</a></div>
  <div class="room-postcard__actions">
    <p class="room-postcard__theme-prompt">今晚想翻哪一面？</p>
    <div class="room-postcard__themes" role="group" aria-label="听歌签主题">
      <button type="button" data-room-theme="all" aria-pressed="true">随手</button>
      <button type="button" data-room-theme="books" aria-pressed="false">读书</button>
      <button type="button" data-room-theme="games" aria-pressed="false">游戏</button>
      <button type="button" data-room-theme="web" aria-pressed="false">做网站</button>
      <button type="button" data-room-theme="life" aria-pressed="false">生活</button>
    </div>
    <button type="button" data-room-discover>抽一张听歌签 <span aria-hidden="true">↝</span></button>
    <p data-room-pairing role="status">一首私人选曲，一篇随手翻到的旧文。</p>
    <a href="/about/">认识房间的主人 ↗</a>
  </div>
</section>`

const renderMixTape = () => `
<section class="room-mixtape" data-mixtape aria-labelledby="mixtape-title">
  <header class="room-mixtape__header">
    <div><p>PERSONAL MIXTAPE / SIDE C</p><h2 id="mixtape-title">把今晚录成一盘带。</h2></div>
    <p>挑三首歌，给它一个名字。它会留在这台浏览器里，也可以带走一个分享链接。</p>
  </header>
  <div class="room-mixtape__builder">
    <div class="room-mixtape__identity">
      <label for="mixtape-name">磁带标题</label>
      <input id="mixtape-name" data-mixtape-name type="text" maxlength="36" value="SAKURA / AFTER HOURS" autocomplete="off">
      <p data-mixtape-status role="status">先选一首，慢慢把今晚的声音放进去。</p>
      <div class="room-mixtape__actions">
        <button type="button" data-mixtape-random>↝ 随手选三首</button>
        <button type="button" data-mixtape-save>保存这盘带</button>
        <button type="button" data-mixtape-share>↗ 分享</button>
      </div>
      <div class="room-mixtape__share" data-mixtape-share-fallback hidden><label>复制磁带链接 <input type="text" readonly data-mixtape-share-url></label></div>
    </div>
    <div class="room-mixtape__slots" data-mixtape-slots aria-label="磁带曲目">
      <div class="room-mixtape__slot" data-mixtape-slot="0"><span>A1</span><strong>留一个位置</strong><small>点击右侧曲目</small></div>
      <div class="room-mixtape__slot" data-mixtape-slot="1"><span>A2</span><strong>留一个位置</strong><small>点击右侧曲目</small></div>
      <div class="room-mixtape__slot" data-mixtape-slot="2"><span>A3</span><strong>留一个位置</strong><small>点击右侧曲目</small></div>
    </div>
    <div class="room-mixtape__tracks" data-mixtape-track-list role="list" aria-label="可选曲目"></div>
  </div>
  <div class="room-mixtape__saved" data-mixtape-saved hidden><span>LAST SAVED TAPE</span><strong data-mixtape-saved-name></strong><small data-mixtape-saved-tracks></small></div>
</section>`

const PERSISTENT_PLAYER = `
<aside class="sakura-player" id="sakura-player" aria-label="Sakura 的持续音乐播放器">
  <audio preload="metadata"></audio>
  <div class="sakura-player__inner">
    <div class="sakura-player__disc" aria-hidden="true"><i></i></div>
    <div class="sakura-player__meta">
      <span class="sakura-player__eyebrow">CURRENT TRACK · FULL LENGTH</span>
      <strong data-player-title>所以我放弃了音乐</strong>
      <small data-player-subline>だから僕は音楽を辞めた · YORUSHIKA</small>
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
      <a href="/listening/">听歌室 ↗</a>
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
  <div class="midnight-filmstrip" data-random-gallery="4">
    <figure><img src="/img/gallery/季09.jpg" alt="相册中的季节片段" loading="lazy"><figcaption>FRAME / 01</figcaption></figure>
    <figure><img src="/img/gallery/小缘03.jpg" alt="相册中的人物片段" loading="lazy"><figcaption>FRAME / 02</figcaption></figure>
    <figure><img src="/img/gallery/彼岸花04.jpg" alt="相册中的彼岸花片段" loading="lazy"><figcaption>FRAME / 03</figcaption></figure>
    <figure><img src="/img/gallery/花鸟11.jpg" alt="相册中的花鸟片段" loading="lazy"><figcaption>FRAME / 04</figcaption></figure>
  </div>
</section>
<script data-sakura-gallery-init>
(function () {
  var strip = document.querySelector('[data-random-gallery]')
  var pool = Array.isArray(window.__SAKURA_GALLERY)
    ? window.__SAKURA_GALLERY.filter(function (item) { return item && typeof item.src === 'string' && item.src })
    : []
  var frames = strip ? Array.prototype.slice.call(strip.querySelectorAll('figure')) : []
  if (!strip || !pool.length || !frames.length) return

  var previous = ''
  try { previous = window.sessionStorage.getItem('sakura-gallery-selection-v1') || '' } catch (_) {}
  var shuffled = pool.slice()
  var selectionKey = ''
  for (var attempt = 0; attempt < 10; attempt += 1) {
    shuffled = pool.slice()
    for (var index = shuffled.length - 1; index > 0; index -= 1) {
      var randomIndex = Math.floor(Math.random() * (index + 1))
      var current = shuffled[index]
      shuffled[index] = shuffled[randomIndex]
      shuffled[randomIndex] = current
    }
    selectionKey = shuffled.slice(0, frames.length).map(function (item) { return item.src }).join('|')
    if (selectionKey !== previous || pool.length <= frames.length) break
  }

  frames.forEach(function (frame, frameIndex) {
    var item = shuffled[frameIndex]
    if (!item) {
      frame.hidden = true
      return
    }
    frame.hidden = false
    var image = frame.querySelector('img')
    var caption = frame.querySelector('figcaption')
    if (image) {
      image.setAttribute('data-lazy-src', item.src)
      image.setAttribute('src', item.src)
      image.alt = item.alt || '图库片段 / FRAME ' + String(frameIndex + 1).padStart(2, '0')
    }
    if (caption) caption.textContent = 'FRAME / ' + String(frameIndex + 1).padStart(2, '0')
  })
  try { window.sessionStorage.setItem('sakura-gallery-selection-v1', selectionKey) } catch (_) {}
  strip.setAttribute('data-gallery-ready', 'true')
}())
</script>
<section class="midnight-manifesto">
  <p>END OF SIDE A</p>
  <h2>“有些无法说出口的事，<br>就让音乐替我们记住。”</h2>
  <a href="/archives/">CONTINUE TO THE ARCHIVE <span aria-hidden="true">&#8594;</span></a>
</section>`

const PAGE_INTROS = {
  'listening/index.html': ['THE LISTENING ROOM / SIDE A', '由 Sakura 选曲。挑一首喜欢的，让音乐陪你翻过下一页。'],
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

const getGalleryPool = () => {
  const galleryDir = path.join(hexo.source_dir, 'img', 'gallery')
  const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp'])
  try {
    return readdirSync(galleryDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => {
        const title = entry.name.replace(/\.[^.]+$/, '')
        return {
          src: `/img/gallery/${encodeURI(entry.name)}`,
          alt: `图库片段：${title}`
        }
      })
      .sort((left, right) => left.src.localeCompare(right.src, 'zh-CN'))
  } catch (_) {
    return []
  }
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
  const updated = formatShanghaiDate(stats.updatedAt) || '等待首次同步'
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
const serializeGalleryData = (gallery) => JSON.stringify(gallery).replace(/</g, '\\u003c')
const collectionNames = (collection) => {
  const values = Array.isArray(collection)
    ? collection
    : Array.isArray(collection?.data)
      ? collection.data
      : (typeof collection?.toArray === 'function' ? collection.toArray() : [])
  return values.map((item) => String(item?.name ?? item ?? '')).filter(Boolean)
}

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
    if (data.path === 'listening/index.html') {
      result = result.replace('<div data-listening-page></div>', `<div class="listening-page">${renderListeningRoom(tracks)}${renderRoomPostcard()}${renderMixTape()}</div>`)
    }
  } else {
    result = result.replace('</header><main', `${HOME_HERO}</header><main`)
    result = result.replace('<div class="recent-posts', `${NOTES_HEADING}<div class="recent-posts`)
    result = result.replace('</main><footer', `</main><div data-home-radio></div><details class="journal-library" id="record-library"><summary><span>THE RECORD COLLECTION / 私人选曲</span><strong>打开唱片柜，翻翻每首歌背后的故事。</strong><i aria-hidden="true">＋</i></summary>${renderListeningRoom(tracks)}</details>${renderRoomPostcard()}${renderMixTape()}${HOME_CODA}<footer`)
    const siteUrl = String(hexo.config.url || '').replace(/\/$/, '')
    const socialImage = `${siteUrl}/img/og.png`
    result = result.replace(/(<meta property="og:image" content=")[^"]+("\s*\/?>)/, `$1${socialImage}$2`)
    result = result.replace(/(<meta name="twitter:image" content=")[^"]+("\s*\/?>)/, `$1${socialImage}$2`)
  }

  if (!result.includes('window.__SAKURA_TRACKS')) {
    const discovery = (hexo.locals.get('data') || {}).discovery || {}
    const catalogue = Array.isArray(discovery.tracks) ? discovery.tracks : []
    result = result.replace('</head>', `<script>window.__SAKURA_TRACKS=${serializeTrackData([...tracks, ...catalogue])};</script></head>`)
  }
  if (!result.includes('window.__SAKURA_NOTES=')) {
    const notes = hexo.locals.get('posts').sort('date', -1).toArray().filter(post => post.published !== false).map(post => ({
      title: post.title,
      url: `/${post.path}`,
      categories: collectionNames(post.categories),
      tags: collectionNames(post.tags)
    }))
    result = result.replace('</head>', `<script>window.__SAKURA_NOTES=${serializeTrackData(notes)};</script></head>`)
  }
  // The inline gallery initializer references the global name too. Check for
  // the actual assignment so it cannot suppress the data payload injection.
  if (!result.includes('window.__SAKURA_GALLERY=')) {
    result = result.replace('</head>', `<script>window.__SAKURA_GALLERY=${serializeGalleryData(getGalleryPool())};</script></head>`)
  }
  if (!result.includes('id="sakura-player"')) {
    result = result.replace('</body>', `${PERSISTENT_PLAYER}</body>`)
  }
  if (!result.includes('class="nav-frequency"')) {
    result = result.replace('<div id="menus">', `${NAV_FREQUENCY}<div id="menus">`)
  }
  return result
})
