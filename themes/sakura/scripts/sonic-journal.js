'use strict'

// Keep the experience independent of the existing player and its persistence.
const escape = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
const names = collection => (collection?.data || []).map(item => item.name)
const stations = [
  { id: 'night', frequency: '88.3', name: '夜读', en: 'AFTER HOURS', line: '给世界按下暂停，给自己留一页。', color: '#bad6bd', tracks: ['music', 'kajin'], tags: ['书籍'], categories: [], image: '/img/cover4.jpg' },
  { id: 'focus', frequency: '92.6', name: '专注', en: 'IN THE FLOW', line: '把杂念调低，让灵感慢慢浮现。', color: '#b5cddd', tracks: ['odoriko', 'sss'], tags: ['Hexo', '教程', '网站更新'], categories: ['技术杂谈'], image: '/img/cover1.jpg' },
  { id: 'wander', frequency: '101.7', name: '漫游', en: 'SOMEWHERE ELSE', line: '沿着声音出发，去文字里的远方。', color: '#e2c59d', tracks: ['highway', 'oldman'], tags: ['游戏'], categories: ['游戏体验'], image: '/img/cover3.jpg' },
  { id: 'drift', frequency: '106.2', name: '放空', en: 'SLOW LIVING', line: '没有待办清单，只有此刻的生活。', color: '#d2bbd6', tracks: ['kajin', 'oldman'], tags: [], categories: ['流水账'], image: '/img/cover2.jpg' }
]
const matches = (post, station) => names(post.tags).some(tag => station.tags.includes(tag)) || names(post.categories).some(category => station.categories.includes(category))
const getStations = () => {
  const tracks = (hexo.locals.get('data') || {}).tracks || []
  const posts = hexo.locals.get('posts').sort('date', -1).toArray().filter(post => post.published !== false)
  return stations.map(station => ({
    ...station,
    tracks: station.tracks.map(id => tracks.find(track => track.id === id)).filter(Boolean).map(({ id, title, artist }) => ({ id, title, artist })),
    notes: posts.filter(post => matches(post, station)).map(post => ({ title: post.title, url: `/${post.path}`, description: post.description || '翻开这一页，听见文字之外的声音。' }))
  }))
}
const renderRadio = () => {
  const station = getStations()[0]
  const track = station.tracks[0]
  const note = station.notes[0]
  if (!track || !note) return ''
  return `<section class="sonic-radio" id="mood-radio" data-sonic-radio aria-labelledby="sonic-title">
    <header class="sonic-radio__heading"><div><p class="sonic-label">A FREQUENCY FOR EVERY FEELING</p><h2 id="sonic-title">此刻的你，<em>在哪个频率？</em></h2></div><p>一首歌，一篇文字。<br>调到你的心情，偶遇另一个故事。</p></header>
    <div class="sonic-console">
      <div class="sonic-console__top"><span>SAKURA FM / 心情电台</span><span data-sonic-onair>READY TO LISTEN</span></div>
      <div class="sonic-stations" role="group" aria-label="选择心情频道" hidden>${stations.map((item, i) => `<button type="button" data-sonic-station="${i}" aria-pressed="${i === 0}"><small>0${i + 1} / ${item.frequency}</small><span>${item.name}</span><i aria-hidden="true">↗</i></button>`).join('')}</div>
      <div class="sonic-console__body">
        <div class="sonic-tuner"><div class="sonic-tuner__display"><span class="sonic-label" data-sonic-en>${station.en}</span><p><strong data-sonic-frequency>${station.frequency}</strong><small>FM</small></p><div class="sonic-spectrum" aria-hidden="true">${Array.from({ length: 39 }, (_, i) => `<i style="--height:${18 + Math.round(Math.abs(Math.sin(i * 1.7)) * 68)}%;--delay:${i * -0.13}s"></i>`).join('')}</div></div>
          <div class="sonic-dial" hidden><button type="button" data-sonic-next aria-label="转动旋钮，切换下一个心情频道"><span aria-hidden="true"></span></button><p>TURN TO FEEL<br><span>转一下，换个心情</span></p></div>
          <p class="sonic-tuner__line" data-sonic-line>${station.line}</p>
        </div>
        <div class="sonic-pair" data-sonic-pair>
          <div class="sonic-pair__music"><p class="sonic-label">SIDE A / 耳边的声音</p><div class="sonic-pair__song"><div><strong data-sonic-song>${escape(track.title)}</strong><small data-sonic-artist>${escape(track.artist)}</small></div><button type="button" data-sonic-play hidden aria-label="播放推荐配乐">▶</button></div></div>
          <div class="sonic-pair__note"><div class="sonic-pair__art"><img data-sonic-image src="${station.image}" alt="" loading="lazy" width="420" height="240"></div><div class="sonic-pair__story"><p class="sonic-label">SIDE B / 刚好读到你</p><a data-sonic-note href="${escape(note.url)}">${escape(note.title)} <span aria-hidden="true">↗</span></a><p data-sonic-description>${escape(note.description)}</p></div></div>
        </div>
      </div>
      <footer class="sonic-console__footer"><p data-sonic-feedback role="status">先选心情，再按播放。让文字和音乐慢慢相遇。</p><button type="button" data-sonic-shuffle hidden>换一组相遇 <span aria-hidden="true">↝</span></button></footer>
    </div>
  </section>`
}

hexo.extend.helper.register('sonic_reading', function (post) {
  const station = stations.find(item => matches(post, item)) || stations[0]
  return `<section class="sonic-reading" data-sonic-reading data-station="${station.id}" aria-label="文章配乐" hidden><div class="sonic-reading__disc" aria-hidden="true"><i></i></div><div class="sonic-reading__copy"><span class="sonic-label">THIS PAGE HAS A SOUNDTRACK</span><strong data-sonic-reading-title></strong><small>一首歌的陪伴，慢慢读完这一页。</small></div><div class="sonic-reading__actions"><button type="button" data-sonic-reading-play>▶ 配乐阅读</button><button type="button" data-sonic-bookmark>＋ 留下声音书签</button></div><p data-sonic-reading-status role="status"></p></section>`
})

hexo.extend.filter.register('after_render:html', function (html, data) {
  if (!data) return html
  let result = html
  if (data.path === 'index.html') {
    result = result.replace('<div data-home-radio></div>', renderRadio())
  } else if (data.path === 'listening/index.html') {
    result = result.replace('<section class="listening-room ', `${renderRadio()}<section class="listening-room `)
  }
  const payload = JSON.stringify(getStations()).replace(/</g, '\\u003c')
  return result.replace('</head>', `<script>window.__SAKURA_STATIONS=${payload};</script></head>`)
}, 20)
