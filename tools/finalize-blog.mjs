import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
const content = JSON.parse(await readFile('.generated/blog.json', 'utf8'));
const { config, records, pages } = content;
const template = await readFile('public/index.html', 'utf8');
const e = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nav = '<nav class="reader-nav"><a href="/">SAKURA / ARCHIVE</a><a href="/archives/">文章</a><a href="/gallery/">影像</a><a href="/listening/">音乐</a><a href="/resources/">资源</a><a href="/about/">关于</a><a href="/link/">友链</a></nav>';
for (const page of pages) {
  const canonical = config.url + encodeURI(page.route);
  const record = records.find(r => r.id === page.recordId);
  const $ = load(template);
  $('title').text(page.route === '/' ? config.title : `${page.title} · Sakura`);
  $('meta[name="description"]').attr('content', page.description);
  $('head').append(`<link rel="canonical" href="${e(canonical)}"><link rel="alternate" type="application/atom+xml" href="/atom.xml" title="Sakura"><meta property="og:title" content="${e(page.title)}"><meta property="og:description" content="${e(page.description)}"><meta property="og:url" content="${e(canonical)}"><meta property="og:image" content="${config.url}/img/og.png"><meta property="og:type" content="${record?.kind === 'post' ? 'article' : 'website'}">`);
  const ld = { '@context': 'https://schema.org', '@type': record?.kind === 'post' ? 'BlogPosting' : 'WebPage', headline: page.title, url: canonical, author: { '@type': 'Person', name: config.author }, ...(record?.kind === 'post' ? { datePublished: record.date + 'T00:00:00+08:00' } : {}) };
  $('head').append(`<script type="application/ld+json">${JSON.stringify(ld).replaceAll('<', '\\u003c')}</script>`);
  $('body').append(`<main id="static-content">${nav}<p>SAKURA / PERSONAL ARCHIVE</p><h1>${e(page.title)}</h1>${page.html}<hr><p><a data-interactive href="${e(page.route)}">进入三维档案终端 ↗</a></p><p>© Sakura · Interface by <a href="https://github.com/LBEILC/RhineLabUI">RhineLabUI</a> · <a href="/credits/">许可与致谢</a></p></main>`);
  const target = path.join('public', decodeURIComponent(page.route), 'index.html');
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, $.html());
}
const $404 = load(template);
$404('title').text('档案未找到 · Sakura');
$404('body').append(`<main id="static-content">${nav}<h1>404 / 档案未找到</h1><p>这份档案不在目录中。</p><a href="/archives/?reader=1">返回文章目录</a></main>`);
$404('script[type="module"]').remove();
await writeFile('public/404.html', $404.html());
await writeFile('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p => `<url><loc>${e(config.url + encodeURI(p.route))}</loc></url>`).join('')}</urlset>`);
const posts = records.filter(r => r.kind === 'post');
await writeFile('public/atom.xml', `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>${e(config.title)}</title><id>${config.url}/</id><link href="${config.url}/atom.xml" rel="self"/><link href="${config.url}/"/><updated>${posts[0].date}T00:00:00+08:00</updated>${posts.map(r => `<entry><title>${e(r.title)}</title><id>${e(r.source)}</id><link href="${e(r.source)}"/><updated>${r.date}T00:00:00+08:00</updated><author><name>${e(config.author)}</name></author><content type="html">${e(r.html)}</content></entry>`).join('')}</feed>`);
await writeFile('public/search.xml', `<?xml version="1.0" encoding="UTF-8"?><search>${posts.map(r => `<entry><title>${e(r.title)}</title><url>${e(r.route)}</url><content>${e(r.searchText)}</content></entry>`).join('')}</search>`);
// Keep the shell, article HTML and model in one atomic offline version. Images and
// personal MP3s stay on demand; visiting the homepage never downloads the music library.
const all = (await readdir('public', { recursive: true })).map(p => p.replaceAll('\\', '/'));
const files = all.filter(p => /\.(?:html|css|js|woff2|txt|webmanifest)$/.test(p) || /^assets\/.*\.(glb|png|jpg)$/.test(p) || /^audio\//.test(p) || /^icons\//.test(p)).filter(p => !['sw.js', '404.html'].includes(p) && !/^assets\/archive-(cassette|assembly)\.glb$/.test(p));
const concrete = [];
for (const file of files) if ((await stat(`public/${file}`)).isFile()) concrete.push(file);
const worker = await readFile('tools/rhine/pwa-worker.js', 'utf8');
const hash = createHash('sha256').update(worker);
for (const file of concrete.sort()) hash.update(file).update(await readFile(`public/${file}`));
await writeFile('public/sw.js', worker.replace('__CACHE_VERSION__', JSON.stringify(hash.digest('hex').slice(0, 16))).replace('__PRECACHE_FILES__', JSON.stringify(concrete)));
const headers = await readFile('public/_headers', 'utf8');
await writeFile('public/_headers', headers + '\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/sw.js\n  Cache-Control: no-cache\n/*.html\n  Cache-Control: no-cache\n');
console.log(`Prerendered ${pages.length} pages; preserved post URLs, sitemap, Atom feed and search XML.`);
