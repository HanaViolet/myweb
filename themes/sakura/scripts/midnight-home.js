'use strict'

const { readdirSync } = require('node:fs')
const path = require('node:path')

const NETEASE_PLAYLIST_URL = 'https://music.163.com/#/playlist?id=2203036705'
const NETEASE_PROFILE_URL = 'https://music.163.com/#/user/home?id=1441471952'
const CURRENT_YEAR = new Date().getFullYear()

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
    <div class="midnight-record">
      <svg class="midnight-record__tree" viewBox="0 0 500 500" role="presentation">
        <defs>
          <radialGradient id="midnight-tree-core" cx="46%" cy="43%" r="62%">
            <stop offset="0" stop-color="#1d2421"></stop>
            <stop offset="0.52" stop-color="#0b100f"></stop>
            <stop offset="1" stop-color="#050807"></stop>
          </radialGradient>
          <linearGradient id="midnight-bark-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#a8c0ad" stop-opacity=".52"></stop>
            <stop offset=".46" stop-color="#425149" stop-opacity=".78"></stop>
            <stop offset="1" stop-color="#c0d8c6" stop-opacity=".34"></stop>
          </linearGradient>
        </defs>
        <path class="midnight-record__bark" d="M248 11 C282 8 303 21 333 19 C364 18 382 37 407 49 C433 62 438 88 454 111 C472 137 462 166 476 193 C490 221 478 249 482 279 C486 309 465 330 456 358 C447 388 419 398 400 420 C379 445 349 445 321 459 C294 472 265 462 236 475 C207 486 181 466 151 462 C120 457 105 432 80 416 C54 399 53 370 39 346 C23 320 33 292 24 264 C15 236 31 210 31 181 C31 150 53 132 64 105 C76 76 104 69 127 50 C150 31 178 36 207 23 C222 16 235 13 248 11 Z"></path>
        <g id="midnight-tree-rings" class="midnight-record__rings">
          <path d="M248 24 C282 21 307 34 337 31 C369 28 385 53 410 67 C434 81 435 108 449 132 C463 157 450 184 462 211 C474 238 459 263 464 291 C468 319 447 338 438 364 C428 391 401 398 382 418 C362 438 333 435 307 448 C280 460 254 449 226 461 C197 469 177 449 149 445 C121 439 109 416 87 400 C64 383 64 356 52 333 C40 309 50 285 42 260 C34 234 48 212 47 185 C48 157 68 140 78 116 C89 91 113 84 134 67 C155 50 181 54 207 41 C222 33 235 28 248 24 Z"></path>
          <path d="M247 39 C275 35 300 48 327 45 C356 42 374 62 398 76 C421 89 423 115 436 137 C450 161 438 184 449 208 C461 232 447 257 451 282 C455 308 435 325 427 349 C418 374 393 382 375 400 C356 419 330 417 305 428 C281 440 256 430 230 440 C204 448 183 430 158 426 C132 422 120 400 99 386 C77 370 77 345 66 324 C55 301 64 279 57 256 C49 233 62 212 61 188 C62 162 81 147 90 124 C100 101 123 94 141 80 C161 64 184 68 208 56 C222 49 235 43 247 39 Z"></path>
          <path d="M246 57 C273 54 293 64 319 61 C346 59 362 77 385 88 C407 100 409 123 421 144 C433 165 422 188 432 210 C442 233 430 253 433 278 C436 301 419 317 411 339 C402 361 379 369 363 386 C345 403 321 400 299 411 C276 421 253 412 230 420 C207 428 188 411 166 408 C142 403 132 384 113 371 C94 356 94 334 84 314 C74 294 83 274 76 253 C70 231 81 213 81 191 C81 169 98 154 106 134 C115 114 135 108 152 94 C169 81 190 83 211 73 C223 66 236 60 246 57 Z"></path>
          <path d="M246 75 C269 72 289 81 311 79 C336 76 352 92 372 103 C392 113 394 135 405 153 C416 173 406 193 415 213 C424 233 413 252 416 273 C419 294 403 309 396 328 C388 348 368 355 352 370 C337 385 315 382 295 392 C275 401 254 393 233 400 C212 407 196 393 176 389 C155 386 144 369 127 356 C110 344 110 323 101 306 C92 287 100 270 94 251 C88 232 98 215 97 196 C98 175 113 162 121 145 C129 127 146 121 162 109 C177 97 196 99 215 90 C226 84 237 78 246 75 Z"></path>
          <path d="M246 94 C266 91 282 99 303 97 C324 95 338 109 356 118 C374 128 376 146 385 162 C395 180 386 197 394 215 C402 233 392 249 395 268 C398 287 384 299 377 316 C370 334 352 340 338 353 C324 366 306 364 288 372 C270 380 253 373 235 379 C216 386 202 373 185 370 C167 367 157 352 142 341 C127 330 127 313 119 297 C111 281 118 266 113 250 C107 233 116 219 115 202 C116 184 129 173 136 157 C143 141 158 136 171 126 C185 115 202 117 218 109 C228 103 238 98 246 94 Z"></path>
          <path d="M245 114 C262 111 277 118 294 116 C313 115 325 126 341 135 C357 143 360 158 368 173 C376 188 369 203 376 218 C383 234 375 248 377 264 C380 280 367 291 362 306 C355 321 340 326 328 337 C316 348 300 346 284 353 C269 360 253 354 238 360 C222 365 210 354 195 351 C179 348 171 335 158 326 C145 317 145 302 138 289 C132 275 138 262 133 248 C129 234 136 221 136 207 C136 191 148 182 154 168 C160 155 173 150 184 141 C196 132 210 134 224 127 C232 122 239 117 245 114 Z"></path>
          <path d="M245 135 C259 133 271 138 286 137 C301 135 311 145 325 151 C338 158 340 171 347 183 C354 196 348 208 354 221 C360 234 353 246 356 259 C357 273 347 282 342 294 C337 307 324 311 314 320 C304 330 290 328 278 334 C265 340 253 335 240 339 C227 344 217 335 204 333 C191 330 184 320 173 312 C163 304 163 291 157 280 C152 269 157 258 153 247 C149 235 156 225 155 214 C156 201 165 194 170 183 C175 172 186 168 195 160 C204 153 216 155 227 149 C234 145 240 139 245 135 Z"></path>
          <path d="M245 156 C256 154 267 159 278 158 C291 157 300 165 311 170 C323 176 324 187 330 197 C336 208 331 218 336 229 C341 240 335 250 338 261 C339 272 331 280 327 290 C323 301 312 304 304 312 C295 320 284 318 274 323 C263 328 253 324 242 328 C231 332 223 324 212 322 C201 320 195 311 186 305 C177 298 178 288 172 278 C168 269 172 260 169 251 C165 241 171 232 170 223 C171 212 179 206 183 197 C187 188 196 184 203 178 C211 172 221 173 231 168 C236 164 241 159 245 156 Z"></path>
          <path d="M245 178 C254 177 262 181 271 180 C281 179 288 185 297 190 C306 194 307 203 312 211 C317 220 313 228 317 237 C321 246 316 254 318 263 C319 272 313 278 309 286 C306 294 298 297 291 303 C284 309 276 307 267 311 C259 315 251 312 243 315 C234 318 228 312 219 310 C210 309 206 301 199 297 C192 291 192 283 188 276 C184 268 188 261 185 254 C182 246 187 239 186 232 C187 223 193 219 196 212 C200 205 207 202 213 197 C219 192 227 194 234 190 C239 187 242 182 245 178 Z"></path>
          <path d="M245 200 C252 198 257 202 264 201 C272 200 277 205 284 208 C291 212 292 219 296 225 C300 232 296 238 300 245 C303 252 299 258 301 265 C301 272 296 277 294 283 C291 289 285 291 279 296 C274 301 268 299 261 302 C255 305 249 302 243 305 C236 307 232 302 225 301 C219 300 215 294 210 290 C205 286 205 280 202 274 C199 268 202 263 200 257 C197 251 201 246 200 240 C201 233 206 230 208 225 C211 219 216 217 221 213 C225 209 231 211 237 207 C240 205 243 202 245 200 Z"></path>
        </g>
        <use class="midnight-record__rings-copy" href="#midnight-tree-rings" transform="translate(8 8) scale(.968)"></use>
        <g class="midnight-record__cracks">
          <path d="M248 252 C263 242 270 228 285 220 L293 208"></path>
          <path d="M248 252 C238 266 226 272 220 289 L209 299"></path>
          <path d="M248 252 C252 236 247 224 254 210 L252 198"></path>
          <path d="M248 252 C264 260 276 273 292 277 L304 286"></path>
        </g>
        <circle class="midnight-record__heart" cx="248" cy="252" r="4"></circle>
      </svg>
    </div>
    <svg class="midnight-tonearm" viewBox="0 0 500 500" aria-hidden="true">
      <g class="midnight-tonearm__assembly">
        <circle class="midnight-tonearm__base-shadow" cx="431" cy="69" r="31"></circle>
        <circle class="midnight-tonearm__base" cx="431" cy="69" r="26"></circle>
        <circle class="midnight-tonearm__base-ring" cx="431" cy="69" r="19"></circle>
        <path class="midnight-tonearm__base-detail" d="M431 50 V88 M412 69 H450"></path>
        <circle class="midnight-tonearm__pivot-halo" cx="431" cy="69" r="10"></circle>
        <circle class="midnight-tonearm__pivot" cx="431" cy="69" r="5.5"></circle>
        <circle class="midnight-tonearm__pivot-core" cx="431" cy="69" r="2.5"></circle>
        <path class="midnight-tonearm__counterweight" d="M423 58 L425 16 Q425 12 429 12 L437 14 Q440 15 439 19 L435 60 Z"></path>
        <path class="midnight-tonearm__arm-shadow" d="M431 69 C444 128 453 187 441 237 C431 282 405 327 371 365"></path>
        <path class="midnight-tonearm__arm" d="M431 69 C444 128 453 187 441 237 C431 282 405 327 371 365"></path>
        <path class="midnight-tonearm__arm-highlight" d="M431 69 C444 128 453 187 441 237 C431 282 405 327 371 365"></path>
        <path class="midnight-tonearm__headshell" d="M373 358 L346 371 Q342 373 345 378 L353 389 Q356 393 360 389 L380 369 Z"></path>
        <path class="midnight-tonearm__headshell-detail" d="M350 374 L365 367 M354 380 L369 373"></path>
        <path class="midnight-tonearm__needle" d="M353 387 L346 403"></path>
      </g>
    </svg>
  </div>
  <p class="midnight-scroll">SCROLL TO LISTEN <span aria-hidden="true">&#8595;</span></p>
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
    const siteUrl = String(hexo.config.url || '').replace(/\/$/, '')
    const socialImage = `${siteUrl}/img/og.png`
    result = result.replace(/(<meta property="og:image" content=")[^"]+("\s*\/?>)/, `$1${socialImage}$2`)
    result = result.replace(/(<meta name="twitter:image" content=")[^"]+("\s*\/?>)/, `$1${socialImage}$2`)
  }

  if (!result.includes('window.__SAKURA_TRACKS')) {
    result = result.replace('</head>', `<script>window.__SAKURA_TRACKS=${serializeTrackData(tracks)};</script></head>`)
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
