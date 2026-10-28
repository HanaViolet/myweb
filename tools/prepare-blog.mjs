import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir, cp, stat, rm } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { marked } from 'marked';
import { load } from 'cheerio';
import sanitizeHtml from 'sanitize-html';

const read = file => readFile(file, 'utf8');
const json = async file => JSON.parse(await read(file));
const config = await json('blog.config.json');
const output = path.resolve('.generated/public');
// Only generated assets are replaced. Author sources and the legacy theme are untouched.
if (output !== path.join(process.cwd(), '.generated', 'public')) throw Error('Unexpected asset output');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp('static/rhine', output, { recursive: true });
for (const name of ['img', 'music', 'CNAME', 'robots.txt', '_headers']) {
  await cp(`source/${name}`, `${output}/${name}`, { recursive: true });
}
await cp('static/reader.css', `${output}/reader.css`);
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const text = html => load(html).text().replace(/\s+/g, ' ').trim();
function clean(html) {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'figure', 'figcaption', 'section', 'article', 'nav', 'header', 'footer', 'audio', 'source', 'button'],
    allowedAttributes: { '*': ['id', 'class', 'aria-label'], p: ['data-netease-comments-updated'], section: ['data-netease-updated'], a: ['href', 'target', 'rel'], img: ['src', 'alt', 'title', 'loading', 'width', 'height'], audio: ['src', 'controls', 'preload'], source: ['src', 'type'], button: ['type', 'data-blog-play', 'data-blog-copy', 'data-blog-comments'], time: ['datetime'] },
    allowedSchemes: ['https', 'http', 'mailto'],
  });
}
async function markdown(file, route) {
  const original = await read(file);
  const match = original.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw Error(`Missing front matter: ${file}`);
  const data = parse(match[1]);
  const body = match[2].replace(/\{%\s*(?:endvisualWall|visualWall)\s*%\}/g, '');
  if (/\{%/.test(body)) throw Error(`Unsupported legacy tag in ${file}; migrate explicitly.`);
  const $ = load(marked.parse(body), null, false);
  // Older posts place Markdown images inside raw HTML divs. CommonMark leaves
  // those as text, so render image-only text nodes without touching code blocks.
  $('*').contents().filter((_, node) => node.type === 'text').each((_, node) => {
    if ($(node).parents('pre,code').length) return;
    const value = $(node).text();
    if (/^\s*!\[[^\]]*\]\([^\n]+\)\s*$/.test(value)) $(node).replaceWith(marked.parse(value.trim()));
  });
  $('img').each((_, node) => {
    const el = $(node); const src = el.attr('src') || '';
    if (src && !/^(?:[a-z]+:|\/|#)/i.test(src)) el.attr('src', new URL(src, config.url + route).pathname);
    el.attr('loading', 'lazy');
  });
  $('a[target="_blank"]').attr('rel', 'noopener noreferrer');
  // Retire controls belonging to the old theme while retaining author content.
  $('[data-resource-finder], [data-listening-page]').remove();
  $('[data-now-track]').text('私人选曲 / YORUSHIKA');
  $('[data-now-track-meta]').text('在音乐档案中收听');
  $('[data-now-latest-title]').text('文章档案');
  $('[data-now-latest-meta]').text('代码、阅读、游戏与生活');
  $('[data-now-latest-link]').attr('href', '/archives/');
  return { data, html: clean($.html()), original, body };
}
await mkdir('content', { recursive: true });
let ids = {};
try { ids = await json('content/blog-ids.json'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
let nextId = Math.max(0, ...Object.values(ids)) + 1;
const records = [], pages = [];
function add(route, title, category, html, extra = {}) {
  if (!ids[route]) ids[route] = nextId++;
  const record = {
    id: `X-${String(ids[route]).padStart(3, '0')}`, title, en: 'SAKURA / PERSONAL ARCHIVE',
    department: category, category, date: '', lead: config.author, clearance: 'PUBLIC ARCHIVE',
    abstract: text(html).slice(0, 160), findings: [], source: config.url + route,
    route, kind: 'page', html: clean(html), tags: [], comments: false, ...extra,
  };
  record.searchText = [record.title, record.department, ...record.tags, text(record.html)].join(' ');
  records.push(record);
  pages.push({ route, recordId: record.id, title, html: record.html, description: record.abstract });
  return record;
}
function addPageOnly(route, title, html, description) {
  pages.push({ route, title, html: clean(html), recordId: '', description });
}
const list = items => `<div class="blog-list">${items.map(r => `<a href="${e(r.route)}"><small>${e(r.date || r.department)}</small><strong>${e(r.title)}</strong><span>${e(r.abstract)}</span></a>`).join('')}</div>`;
const posts = [];
for (const file of (await readdir('source/_posts')).filter(f => f.endsWith('.md'))) {
  const raw = await markdown(`source/_posts/${file}`, '/');
  if (raw.data.published === false || Date.parse(String(raw.data.date).replace(' ', 'T') + '+08:00') > Date.now()) continue;
  if (!raw.data.abbrlink) throw Error(`Missing stable permalink: ${file}`);
  const route = `/posts/${raw.data.abbrlink}/`;
  const { data, html } = await markdown(`source/_posts/${file}`, route);
  const assetDir = `source/_posts/${file.slice(0, -3)}`;
  try { if ((await stat(assetDir)).isDirectory()) await cp(assetDir, `${output}${route}`, { recursive: true }); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const tags = [data.tags || []].flat();
  const categories = [data.categories || []].flat();
  const cover = data.cover ? new URL(data.cover, config.url + route).pathname : '';
  posts.push({ route, title: data.title, html, tags, categories, cover, date: String(data.date).slice(0, 10), abstract: data.description || text(html).slice(0, 140), comments: data.comments !== false, related: data.related || [], sourceFile: `source/_posts/${file}` });
}
// Optional travel journals use the article lane and the same stable URL contract.
await mkdir('source/_trips', { recursive: true });
for (const file of (await readdir('source/_trips')).filter(f => f.endsWith('.md'))) {
  const raw = await markdown(`source/_trips/${file}`, '/');
  if (raw.data.published === false) continue;
  const { title, slug, date, destination, related = [] } = raw.data;
  if (!title || !/^[a-z0-9-]+$/.test(slug || '') || !destination || !/^\d{4}-\d{2}-\d{2}/.test(String(date)))
    throw Error(`Travel journal requires title, slug, date and destination: ${file}`);
  if (Date.parse(String(date).slice(0, 10)) > Date.now()) continue;
  const route = `/travel/${slug}/`;
  const { html } = await markdown(`source/_trips/${file}`, route);
  add(route, title, '文章档案', html, { kind: 'trip', en: 'TRAVEL JOURNAL', date: String(date).slice(0, 10),
    department: destination, destination, related, tags: [raw.data.tags || []].flat(), abstract: raw.data.description || text(html).slice(0, 140) });
}
posts.sort((a, b) => a.date.localeCompare(b.date));
for (const p of posts) add(p.route, p.title, '文章档案', p.html, { ...p, kind: 'post', en: 'JOURNAL / SAKURA', department: p.categories.join(' · ') || '随笔' });
const postRecords = records.filter(r => r.kind === 'post');
const archive = add('/archives/', '文章目录', '文章档案', list([...postRecords].reverse()), { en: 'JOURNAL INDEX', abstract: `${posts.length} 篇文章，记录音乐、代码、游戏、阅读与生活。` });
const homeHtml = `<p>${e(config.description)}</p><nav class="blog-tags"><a href="/archives/">文章</a><a href="/gallery/">图库</a><a href="/listening/">听歌室</a><a href="/resources/?reader=1">资源</a><a href="/about/">关于</a><a href="/link/">友链</a></nav>${list([...postRecords].reverse())}`;
addPageOnly('/', config.title, homeHtml, config.description);
function alias(route, title, html, recordId = archive.id) { pages.push({ route, title, html: clean(html), recordId, description: title }); }
for (const [type, key, name] of [['tags', 'tags', '标签'], ['categories', 'categories', '分类']]) {
  const values = [...new Set(posts.flatMap(p => p[key]))];
  alias(`/${type}/`, name, `<div class="blog-tags">${values.map(v => `<a href="/${type}/${encodeURIComponent(v)}/">${e(v)}</a>`).join('')}</div>${list(postRecords)}`);
  for (const value of values) alias(`/${type}/${value}/`, `${name} / ${value}`, list(postRecords.filter(p => p[key]?.includes(value))));
}
for (const year of new Set(posts.map(p => p.date.slice(0, 4)))) {
  alias(`/archives/${year}/`, `${year} 年文章`, list(postRecords.filter(p => p.date.startsWith(year))));
  for (const month of new Set(posts.filter(p => p.date.startsWith(year)).map(p => p.date.slice(5, 7))))
    alias(`/archives/${year}/${month}/`, `${year} / ${month}`, list(postRecords.filter(p => p.date.startsWith(`${year}-${month}`))));
}
for (let page = 2; page <= Math.ceil(posts.length / 4); page++) alias(`/page/${page}/`, `文章 / ${page}`, list(postRecords.slice((page - 1) * 4, page * 4)));

const gallery = await markdown('source/gallery/index.md', '/gallery/');
const $gallery = load(gallery.html);
const images = $gallery('img').map((_, el) => ({ src: $gallery(el).attr('src'), alt: $gallery(el).attr('alt') || '', series: ($gallery(el).attr('alt') || '').replace(/\d+$/, '') })).get();
const imageGrid = items => `<div class="blog-gallery">${items.map(i => `<a href="${e(i.src)}" target="_blank" rel="noopener"><figure><img src="${e(i.src)}" alt="${e(i.alt)}" loading="lazy"><figcaption>${e(i.alt)}</figcaption></figure></a>`).join('')}</div>`;
const series = [...new Set(images.map(i => i.series))];
add('/gallery/', '影像收藏', '影像档案', `<nav class="blog-tags">${series.map(s => `<a href="/gallery/${encodeURIComponent(s)}/">${e(s)}</a>`).join('')}</nav>${imageGrid(images)}`, { en: 'VISUAL ARCHIVE', abstract: `${images.length} 张影像，${series.length} 个系列。`, kind: 'gallery' });
for (const s of series) add(`/gallery/${s}/`, s, '影像档案', imageGrid(images.filter(i => i.series === s)), { kind: 'gallery', en: 'VISUAL COLLECTION', abstract: `${s}系列 · ${images.filter(i => i.series === s).length} 张影像` });

const tracks = await json('source/_data/tracks.json');
const discovery = await json('source/_data/discovery.json');
const comments = await json('source/_data/netease-comments.json');
const stats = await json('source/_data/netease-stats.json');
const trackList = items => `<div class="blog-tracks">${items.map(t => `<section><small>${e(t.artist)}</small><h3>${e(t.title)}</h3><p>${e(t.about)}</p><button type="button" data-blog-play="${e(t.id)}">播放 ↗</button>${t.sourceUrl ? ` <a href="${e(t.sourceUrl)}" target="_blank" rel="noopener">${e(t.source)}</a> · <a href="${e(t.licenseUrl)}" target="_blank" rel="noopener">${e(t.licenseLabel)}</a>` : ` <a href="/listening/${e(t.id)}/">曲目档案 →</a>`}</section>`).join('')}</div>`;
add('/listening/', '私人听歌室', '音乐档案', `<p data-netease-comments-updated="${e(comments.updatedAt)}">随手放一首，带着音乐读一篇旧文。</p><p><a href="/listening/discovery/">开放音乐</a> · <a href="/listening/stats/">听歌记录</a> · <a href="https://music.163.com/#/playlist?id=2203036705" target="_blank" rel="noopener">网易云歌单 ↗</a></p>${trackList(tracks)}`, { en: 'LISTENING ROOM', kind: 'music' });
for (const t of tracks) {
  const hot = comments.tracks[t.id]?.comments || [];
  add(`/listening/${t.id}/`, t.title, '音乐档案', `${trackList([t])}<p>${e(t.titleJa)} · ${e(t.meta)}</p><blockquote>${e(t.noteJa)}<br>${e(t.noteZh)}</blockquote><p><a href="https://music.163.com/#/song?id=${t.neteaseId}" target="_blank" rel="noopener">在网易云音乐打开 ↗</a></p><h3>听众留言</h3>${hot.map(c => `<blockquote><p>${e(c.content)}</p><footer>${e(c.nickname)} · ${e(c.date)} · ${c.likedCount} 赞</footer></blockquote>`).join('')}`, { en: 'MUSIC / SELECTION', kind: 'music', department: t.artist, abstract: t.about, trackId: t.id });
}
add('/listening/discovery/', '开放音乐', '音乐档案', trackList(discovery.tracks), { en: 'OPEN MUSIC', kind: 'music', date: discovery.updatedAt.slice(0, 10), abstract: '来自 Internet Archive 的开放授权录音，保留作者、来源和许可链接。' });
const ranks = (title, items) => `<h3>${title}</h3><ol>${(items || []).map(t => `<li><a href="https://music.163.com/#/song?id=${t.songId}" target="_blank" rel="noopener">${e(t.title)}</a> — ${e(t.artist)}</li>`).join('')}</ol>`;
const statsHtml = `<section data-netease-updated="${e(stats.updatedAt)}"><h3>网易云听歌记录</h3><p>本周 ${stats.duration?.weeklyMinutes ?? '—'} 分钟 · 累计 ${stats.duration?.allTimeMinutes ?? '—'} 分钟</p><p>同步时间：${e(stats.updatedAt)} <a href="${e(stats.profileUrl)}" target="_blank" rel="noopener">个人主页 ↗</a></p>${ranks('本周排行', stats.weekly)}${ranks('累计排行', stats.allTime)}</section>`;
add('/listening/stats/', '听歌记录', '音乐档案', statsHtml, { en: 'LISTENING LOG', date: stats.updatedAt.slice(0, 10), abstract: '网易云音乐官方听歌时长、周榜与总榜。' });

const resource = await markdown('source/resources/index.md', '/resources/');
const $resource = load(resource.html);
$resource('.resource-item').each((i, el) => {
  const code = $resource(el).find('code').text().replace('CODE / ', '').trim();
  $resource(el).find('code').after(`<button type="button" data-blog-copy="${e(code)}">复制提取码</button>`);
});
const resourcesHtml = $resource('body').html();
addPageOnly('/resources/', '资源目录', resourcesHtml, resource.data.description);
$resource('.resource-item').each((i, el) => {
  add(`/resources/${String(i + 1).padStart(3, '0')}/`, $resource(el).find('h3').text(), '资源档案', $resource.html(el), { en: 'RESOURCE / COLLECTION', department: $resource(el).closest('.resource-group').find('header h2').text(), abstract: $resource(el).find('p').text() });
});
const about = await markdown('source/about/index.md', '/about/');
const aboutRecord = add('/about/', '关于 Sakura', '个人档案', about.html + statsHtml, { en: 'SAKURA / PROFILE', comments: true, abstract: about.data.description });
const links = parse(await read('source/_data/link.yml'));
add('/link/', '友情链接', '个人档案', links.map(g => `<h3>${e(g.class_name)}</h3><p>${e(g.class_desc)}</p><div class="blog-list">${g.link_list.map(l => `<a href="${e(l.link)}" target="_blank" rel="noopener"><strong>${e(l.name)}</strong><span>${e(l.descr)}</span></a>`).join('')}</div>`).join(''), { en: 'FRIENDS / NETWORK', abstract: '互联网上偶然相遇的人与地方。' });
add('/credits/', '关于这个终端', '个人档案', '<p>界面、三维模型与交互基于 LBEILC 的 RhineLabUI。博客内容属于 Sakura。</p><p><a href="https://github.com/LBEILC/RhineLabUI" target="_blank" rel="noopener">RhineLabUI 源项目 ↗</a> · <a href="/licenses/RhineLabUI-MIT.txt">MIT 许可证</a> · <a href="/fonts/MiSans-license.pdf">MiSans 许可</a></p><p>这是非官方同人界面的个人博客改编，与鹰角网络无隶属关系。</p>', { en: 'CREDITS / SOURCES' });
// About Sakura is X-001. Keep the fixed collections next, then the article
// index, and leave articles at the end in chronological order. A new post then
// receives the next number and appears after the existing articles.
const displayRecords = [
  ...records.filter(r => r.category === '个人档案'),
  ...records.filter(r => r.category === '影像档案'),
  ...records.filter(r => r.category === '音乐档案'),
  ...records.filter(r => r.category === '资源档案'),
  archive,
  ...records.filter(r => r.kind === "trip"),
  ...postRecords,
];
records.splice(0, records.length, ...displayRecords);
for (const r of records) {
  if (!r.title || !config.columns.includes(r.category)) throw Error(`Invalid content metadata: ${r.route}`);
  r.related ??= [];
  if (!Array.isArray(r.related) || r.related.some(route => !pages.some(p => p.route === route)))
    throw Error(`Unknown related content route: ${r.route}`);
  if (r.related.length) r.html += `<nav class="blog-tags" aria-label="相关内容">${r.related.map(route => `<a href="${e(route)}">${e(pages.find(p => p.route === route).title)}</a>`).join('')}</nav>`;
  const page = pages.find(p => p.route === r.route);
  if (page) page.html = r.html;
}
const manifest = { config, records, categories: config.columns, columns: config.columns, pages, tracks: [...tracks, ...discovery.tracks], statsUpdatedAt: stats.updatedAt, inventory: { posts: posts.length, images: images.length, tracks: tracks.length, discovery: discovery.tracks.length, resources: $resource('.resource-item').length, friends: links.reduce((n, g) => n + g.link_list.length, 0) } };
if (new Set(records.map(r => r.id)).size !== records.length) throw Error('Duplicate archive IDs');
if (new Set(pages.map(p => p.route)).size !== pages.length) throw Error('Duplicate routes');
await writeFile('content/blog-ids.json', JSON.stringify(ids, null, 2) + '\n');
await writeFile('.generated/blog.json', JSON.stringify(manifest, null, 2) + '\n');
// Stable content identity is independent of the visual X-number.
for (const r of records) {
  r.uid = `content:${r.route}`;
  r.readingMinutes = Math.max(1, Math.ceil(text(r.html).length / 420));
  r.headings = load(r.html)('h2,h3').map((_, el) => ({ title: load(el).text(), level: el.tagName })).get();
}
await mkdir(`${output}/content`, { recursive: true });
const runtimePages = [];
for (const page of pages) {
  const bytes = JSON.stringify({ html: page.html });
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 20);
  const bodyUrl = `/content/${hash}.json`;
  await writeFile(`${output}${bodyUrl}`, bytes);
  const { html, ...meta } = page;
  runtimePages.push({ ...meta, bodyUrl });
}
const runtimeRecords = records.map(({ html, searchText, ...r }) => ({ ...r, html: '', searchText: '' }));
await writeFile('.generated/catalog.json', JSON.stringify({ ...manifest, records: runtimeRecords, pages: runtimePages }));
await writeFile('.generated/search.json', JSON.stringify(Object.fromEntries(records.map(r => [r.uid, r.searchText]))));
// Keep the full build manifest for prerendering and content validation only.
await writeFile('.generated/blog.json', JSON.stringify(manifest, null, 2) + '\n');

await mkdir(`${output}/archives`, { recursive: true });
for (const r of records) await writeFile(`${output}/archives/RHINE-LAB-${r.id}.txt`, `${r.title}\n${r.source}\n${r.date}\n\n${load(r.html.replace(/<\/(p|h[1-6]|li|section|blockquote)>/g, '</$1>\n\n')).text()}`);
await writeFile(`${output}/manifest.webmanifest`, JSON.stringify({ name: config.title, short_name: 'Sakura', start_url: '/', scope: '/', display: 'standalone', background_color: '#e8e5e1', theme_color: '#e8e5e1', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }] }));
console.log(`Blog content: ${records.length} archives, ${pages.length} routes. ${JSON.stringify(manifest.inventory)}`);
