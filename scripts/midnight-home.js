'use strict'

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

const LISTENING_ROOM = `
<section class="listening-room" id="listening-room" aria-labelledby="listening-title">
  <div class="listening-room__heading">
    <p>PERSONAL SELECTION / 2026</p>
    <h2 id="listening-title">夜晚适合把世界<br>调成静音，只留下音乐。</h2>
  </div>
  <div class="listening-selection">
    <div class="listening-selection__label"><span>SAKURA'S 6 PICKS</span><span>CLICK TO LISTEN</span></div>
    <ol class="listening-tracks" aria-label="Sakura 的代表曲目">
      <li>
        <button class="track-trigger is-active" type="button" data-track-id="music" aria-pressed="true">
          <span class="track-no">01</span><span class="track-title">所以我放弃了音乐<small>だから僕は音楽を辞めた</small></span><span class="track-artist">YORUSHIKA</span><span class="track-action"><i>DISCOVER</i><em>SELECTED</em><b>+</b></span>
        </button>
      </li>
      <li>
        <button class="track-trigger" type="button" data-track-id="kajin" aria-pressed="false">
          <span class="track-no">02</span><span class="track-title">花人局<small>花人局</small></span><span class="track-artist">YORUSHIKA</span><span class="track-action"><i>DISCOVER</i><em>SELECTED</em><b>+</b></span>
        </button>
      </li>
      <li>
        <button class="track-trigger" type="button" data-track-id="oldman" aria-pressed="false">
          <span class="track-no">03</span><span class="track-title">老人与海<small>老人と海</small></span><span class="track-artist">YORUSHIKA</span><span class="track-action"><i>DISCOVER</i><em>SELECTED</em><b>+</b></span>
        </button>
      </li>
      <li>
        <button class="track-trigger" type="button" data-track-id="odoriko" aria-pressed="false">
          <span class="track-no">04</span><span class="track-title">踊り子<small>踊り子</small></span><span class="track-artist">VAUNDY</span><span class="track-action"><i>DISCOVER</i><em>SELECTED</em><b>+</b></span>
        </button>
      </li>
      <li>
        <button class="track-trigger" type="button" data-track-id="highway" aria-pressed="false">
          <span class="track-no">05</span><span class="track-title">Highway Driving Car<small>Highway Driving Car</small></span><span class="track-artist">ETSUCO</span><span class="track-action"><i>DISCOVER</i><em>SELECTED</em><b>+</b></span>
        </button>
      </li>
      <li>
        <button class="track-trigger" type="button" data-track-id="sss" aria-pressed="false">
          <span class="track-no">06</span><span class="track-title">S.S.S.<small>S.S.S.</small></span><span class="track-artist">佐藤千亜妃</span><span class="track-action"><i>DISCOVER</i><em>SELECTED</em><b>+</b></span>
        </button>
      </li>
    </ol>
    <a class="listening-collection" href="https://music.163.com/#/playlist?id=17682751304" target="_blank" rel="noopener">
      <span class="listening-collection__mark" aria-hidden="true">♬</span>
      <span><small>FULL COLLECTION / NETEASE CLOUD MUSIC</small><strong>我的网易云收藏歌单</strong></span>
      <span class="listening-collection__open">OPEN PLAYLIST ↗</span>
    </a>
  </div>
  <div class="listening-note" data-track-detail aria-live="polite">
    <div class="listening-note__index"><span>01</span><small>ABOUT THE TRACK</small></div>
    <div class="listening-note__copy">
      <p class="listening-note__meta">2019 / 1ST FULL ALBUM / LETTERS TO ELMA</p>
      <h3>所以我放弃了音乐</h3>
      <p class="listening-note__about">首张完整专辑的同名收束曲。专辑把青年写给 Elma 的信、照片与音乐连成一个完整故事，标题里的“放弃”也因此显得格外矛盾。</p>
      <blockquote><span>聆听札记 · 非原歌词</span><p lang="ja">まだ、音は夜の中に残っている。</p><p>声音仍旧留在夜色里。</p></blockquote>
      <div class="listening-note__actions"><button type="button" data-detail-play="music">PLAY FULL TRACK <span>▶</span></button><a href="https://music.163.com/#/playlist?id=17682751304" target="_blank" rel="noopener">NETEASE PLAYLIST ↗</a></div>
    </div>
  </div>
</section>`

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
      <a href="https://music.163.com/#/playlist?id=17682751304" target="_blank" rel="noopener">NETEASE LIST ↗</a>
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

hexo.extend.filter.register('after_render:html', function (html, data) {
  if (!data) return html

  let result = html

  if (data.path !== 'index.html') {
    const intro = PAGE_INTROS[data.path]
    if (intro) {
      result = result.replace('<div id="page-site-info">', `<div id="page-site-info"><p class="midnight-page-kicker">${intro[0]}</p><p class="midnight-page-desc">${intro[1]}</p>`)
    }
    if (/^posts\/[^/]+\/index\.html$/.test(data.path)) {
      result = result.replace('<div id="post-info"><h1', '<div id="post-info"><p class="post-issue">LISTENING NOTES / SIDE B</p><h1')
      result = result.replace('<div class="aside-content" id="aside-content">', `<div class="aside-content" id="aside-content">${POST_SIDEBAR_NOTE}`)
    }
  } else {
    result = result.replace('</header><main', `${HOME_HERO}</header>${LISTENING_ROOM}<main`)
    result = result.replace('<div class="recent-posts', `${NOTES_HEADING}<div class="recent-posts`)
    result = result.replace('</main><footer', `</main>${HOME_CODA}<footer`)
    result = result.replace(/(<meta property="og:image" content=")[^"]+("\s*\/?>)/, '$1https://sakura.luxe/img/og.png$2')
    result = result.replace(/(<meta name="twitter:image" content=")[^"]+("\s*\/?>)/, '$1https://sakura.luxe/img/og.png$2')
  }

  if (!result.includes('id="sakura-player"')) {
    result = result.replace('</body>', `${PERSISTENT_PLAYER}</body>`)
  }
  if (!result.includes('class="nav-frequency"')) {
    result = result.replace('<div id="menus">', `${NAV_FREQUENCY}<div id="menus">`)
  }
  return result
})
