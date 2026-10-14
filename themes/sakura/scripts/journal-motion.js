'use strict'

const escape = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
const chapters = [
  { title: '让一首歌，\n翻开一本书。', label: '01 / BETWEEN THE LINES', text: '有些旋律像读到一半的句子。停一停，在书页之间，听见故事的另一种回声。', track: 'music', tag: '书籍', image: '/img/cover4.jpg', color: '#bdd2b3' },
  { title: '把灵感，\n写进下一行。', label: '02 / MAKE SOMETHING', text: '敲下一行代码，修好一个小问题。创造的乐趣，有时就在这些安静又具体的时刻。', track: 'odoriko', tag: 'Hexo', image: '/img/gallery/花鸟11.jpg', color: '#adccd5' },
  { title: '走远一点，\n再回到自己。', label: '03 / A LITTLE ESCAPE', text: '游戏里的森林，耳机里的海。在另一个世界短暂停留，把一点光带回日常。', track: 'oldman', tag: '游戏', image: '/img/cover3.jpg', color: '#dfc397' }
]
const journey = () => {
  const tracks = (hexo.locals.get('data') || {}).tracks || []
  const posts = hexo.locals.get('posts').sort('date', -1).toArray().filter(post => post.published !== false)
  return `<nav class="journal-nav" aria-label="首页章节"><span>EXPLORE THE ROOM</span><div>${[['journal-journey', '序曲'], ['recent-posts', '文字'], ['mood-radio', '电台'], ['journal-workshop', '磁带'], ['fragments-title', '影像']].map(([id, label], i) => `<a href="#${id}" data-journal-anchor="${id}"><small>0${i + 1}</small>${label}</a>`).join('')}</div><i aria-hidden="true"></i></nav>
    <section class="journal-journey" id="journal-journey" aria-labelledby="journey-title"><header><span class="journal-kicker">SCROLL THROUGH THE QUIET HOURS</span><h2 id="journey-title">生活有很多面，<em>慢慢听，慢慢看。</em></h2><p>向下滚动，让一张唱片带你经过三个小世界。</p></header>
    <div class="journal-journey__layout"><div class="journal-scene"><div class="journal-scene__halo" aria-hidden="true"></div><div class="journal-scene__record" aria-hidden="true"><span>SAKURA<br>33⅓ RPM</span></div><div class="journal-scene__sleeve" aria-hidden="true">${chapters.map((chapter, i) => `<img src="${chapter.image}" alt="" width="600" height="700" loading="lazy" data-journal-cover="${i}">`).join('')}<span>STORIES<br>ON REPEAT.</span></div><div class="journal-scene__route" role="group" aria-label="跳转到旅行章节"><span>FIELD ROUTE</span><div>${chapters.map((chapter, i) => `<button type="button" data-journal-route="${i}" aria-label="跳转到第 ${i + 1} 站：${chapter.title.replace('\n', '')}"${i === 0 ? ' aria-current="location"' : ''}><span>0${i + 1}</span></button>`).join('')}</div></div><div class="journal-scene__caption"><span data-journal-scene-label>01 / BETWEEN THE LINES</span><span>SCROLL TO TURN ↘</span></div></div>
    <div class="journal-chapters">${chapters.map((chapter, i) => {
      const track = tracks.find(item => item.id === chapter.track)
      const post = posts.find(item => item.tags?.data?.some(tag => tag.name === chapter.tag))
      return `<article class="journal-chapter" data-journal-chapter="${i}" data-journal-color="${chapter.color}"><span class="journal-kicker">${chapter.label}</span><h3>${chapter.title.split('\n').map(line => `<span>${line}</span>`).join('')}</h3><p>${chapter.text}</p><div class="journal-chapter__track"><span aria-hidden="true">♫</span><span>${escape(track?.title)}<small>${escape(track?.artist)}</small></span><button type="button" data-journal-play="${escape(track?.id)}" hidden aria-label="播放${escape(track?.title)}">▶</button></div><a href="${post ? `/${escape(post.path)}` : '/archives/'}">${escape(post?.title || '翻阅全部文字')} <span aria-hidden="true">↗</span></a></article>`
    }).join('')}</div></div></section>`
}
const tape = `<div class="journal-tape" data-journal-tape><div class="journal-tape__object"><div class="journal-tape__front"><div class="journal-tape__label"><span>SAKURA / PERSONAL RECORDING</span><strong data-journal-tape-name>AFTER HOURS</strong><small>SIDE A · 三首歌的时间</small></div><div class="journal-tape__window" aria-hidden="true"><i></i><span>HIGH POSITION / TYPE II</span><i></i></div><div class="journal-tape__foot"><span>STEREO</span><span>把今晚留在这里。</span><span>C—30</span></div></div><div class="journal-tape__back" hidden><span class="journal-kicker">SIDE B / 写给今晚</span><label for="journal-tape-message">如果声音有背面，你想留下什么？</label><textarea id="journal-tape-message" data-journal-tape-message maxlength="120" rows="3" placeholder="今天的心情，或想对未来的自己说的话……"></textarea><span data-journal-tape-feedback role="status">最多 120 字，只保存在这台浏览器。</span></div></div><button type="button" data-journal-flip aria-pressed="false" hidden>翻到 B 面，留一句话 ↻</button></div>`

hexo.extend.filter.register('after_render:html', (html, data) => {
  if (!data) return html
  let result = html
  if (data.path === 'index.html') result = result.replace('</header><main', `</header>${journey()}<main`)
  if (data.path === 'index.html' || data.path === 'listening/index.html') {
    result = result.replace('class="room-mixtape" data-mixtape', 'class="room-mixtape" id="journal-workshop" data-mixtape')
    result = result.replace('<div class="room-mixtape__builder">', `${tape}<div class="room-mixtape__builder">`)
  }
  return result
}, 30)
