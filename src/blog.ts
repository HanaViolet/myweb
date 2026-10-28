import content from '../.generated/catalog.json';
import { records, type ArchiveRecord } from './data';
import { escapeHtml as e } from './html';
import './blog.css';

type Bridge = { open: (index: number) => void; overview: () => void; body: () => void; music: (playing: boolean) => void; notify: (message: string) => void };
let bridge: Bridge;
let routing = false;
let activeRoute = '';
let current: ArchiveRecord | undefined;
const decodePath = (path: string) => { try { return decodeURIComponent(path).replace(/index\.html$/, '').replace(/\/?$/, '/'); } catch { return '/404/'; } };
const pageAt = (path: string) => content.pages.find(p => decodePath(p.route) === decodePath(path));
const audio = new Audio();
audio.preload = 'none';
let trackIndex = -1;
let player: HTMLElement;
const tracks = content.tracks;

const bodies = new Map<string, Promise<string>>();
function loadBody(url: string) {
  if (!bodies.has(url)) bodies.set(url, fetch(url).then(async response => {
    if (!response.ok) throw new Error('Content unavailable');
    const data = await response.json();
    if (typeof data.html !== 'string') throw new Error('Invalid content');
    return data.html as string;
  }).catch(error => { bodies.delete(url); throw error; }));
  return bodies.get(url)!;
}
export function blogBody(record: ArchiveRecord) {
  current = record;
  const alias = pageAt(activeRoute);
  const page = alias?.recordId === record.id ? alias : pageAt(record.route);
  if (!page) return '<p>内容暂不可用。</p>';
  const url = page.bodyUrl;
  void loadBody(url).then(html => {
    document.querySelectorAll<HTMLElement>('[data-content-url]').forEach(root => {
      if (root.dataset.contentUrl !== url) return;
      root.innerHTML = html;
      root.removeAttribute('aria-busy');
    });
  }).catch(() => {
    document.querySelectorAll<HTMLElement>('[data-content-url]').forEach(root => {
      if (root.dataset.contentUrl !== url) return;
      root.innerHTML = '<p>内容未能载入。</p><button type="button" data-content-retry>重试</button>';
      root.removeAttribute('aria-busy');
    });
  });
  return `<div class="blog-prose" data-content-url="${e(url)}" aria-busy="true"><p role="status">正在载入档案…</p></div>`;
}
export function blogNotes(record: ArchiveRecord) {
  const headings = record.headings;
  return `<div class="blog-prose"><div class="panel-label">DOCUMENT INDEX / 目录</div>${headings.length ? `<ol>${headings.map((h, i) => `<li><button type="button" data-blog-heading="${i}">${e(h.title)}</button></li>`).join('')}</ol>` : `<p>${e(record.abstract)}</p>`}<div class="blog-tags">${record.tags.map(t => `<a href="/tags/${encodeURIComponent(t)}/">#${e(t)}</a>`).join('')}</div><p><a href="${e(record.route)}?reader=1">专注阅读 ↗</a> · <button type="button" data-blog-share>复制链接</button></p><p><a href="/archives/">文章目录</a> · <a href="/categories/">分类</a> · <a href="/tags/">标签</a></p></div>`;
}
export function blogDiscussion(record: ArchiveRecord) {
  return `<div class="blog-prose"><p>${record.comments ? '在原有 GitHub Discussions 中继续交流。' : '这份档案未开启评论。'}</p>${record.comments ? '<button type="button" data-blog-comments>加载留言</button><div id="blog-comments"></div>' : ''}<p><a href="${e(record.route)}?reader=1">专注阅读 ↗</a> · <button type="button" data-blog-share>复制链接</button></p></div>`;
}
function metadata(record?: ArchiveRecord) {
  const page = pageAt(location.pathname);
  document.title = record ? `${page?.title || record.title} · Sakura` : content.config.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', record?.abstract || content.config.description);
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
  canonical.href = content.config.url + location.pathname;
}
export function blogMode(mode: string, record: ArchiveRecord) {
  if (!bridge || routing) return;
  if (mode === 'detail') {
    if (pageAt(location.pathname)?.recordId !== record.id || location.pathname === '/') {
      history.pushState({}, '', record.route); activeRoute = record.route;
    }
    current = record;
    metadata(record);
  } else if (mode === 'archive' && current) {
    history.pushState({}, '', '/'); activeRoute = ''; current = undefined; metadata();
  }
}
function route() {
  const query = new URLSearchParams(location.search);
  const track = query.get('track');
  const path = track && tracks.some(t => t.id === track)
    ? (pageAt(`/listening/${track}/`) ? `/listening/${track}/` : '/listening/discovery/') : location.pathname;
  const page = pageAt(path);
  if (!page || decodePath(path) === '/') return false;
  const index = records.findIndex(r => r.id === page.recordId);
  if (index < 0) return false;
  routing = true; activeRoute = path;
  bridge.open(index); current = records[index]; metadata(current);
  routing = false;
  return true;
}
export function startBlog() {
  const page = pageAt(location.pathname);
  if (page && !page.recordId && location.pathname !== '/' && !new URLSearchParams(location.search).has('reader')) {
    location.replace(`${page.route}?reader=1`);
    return false;
  }
  return route();
}
function updatePlayer() {
  const track = tracks[trackIndex];
  if (!player || !track) return;
  player.hidden = false;
  player.querySelector('[data-player-title]')!.textContent = track.title;
  player.querySelector('[data-player-meta]')!.textContent = track.artist;
  player.querySelectorAll<HTMLElement>('[data-queue-index]').forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.queueIndex) === trackIndex)));
  player.querySelector('[data-player-toggle]')!.textContent = audio.paused ? '播放' : '暂停';
  const range = player.querySelector<HTMLInputElement>('[data-player-seek]')!;
  range.value = String(Number.isFinite(audio.duration) ? audio.currentTime / audio.duration * 100 : 0);
  range.disabled = !Number.isFinite(audio.duration);
  const time = (v: number) => `${Math.floor((v || 0) / 60)}:${String(Math.floor((v || 0) % 60)).padStart(2, '0')}`;
  player.querySelector('[data-player-time]')!.textContent = `${time(audio.currentTime)} / ${time(Number.isFinite(audio.duration) ? audio.duration : 0)}`;
  const link = player.querySelector<HTMLAnchorElement>('[data-player-link]')!;
  link.href = `/listening/?track=${encodeURIComponent(track.id)}`;
  try { localStorage.setItem('sakura-rhine-player', JSON.stringify({ id: track.id, time: audio.currentTime, volume: audio.volume })); } catch {}
}
async function playTrack(index: number) {
  if (index < 0 || index >= tracks.length) return;
  if (trackIndex !== index) { trackIndex = index; audio.src = tracks[index].src; }
  updatePlayer();
  try { await audio.play(); } catch { bridge.notify('播放暂不可用，请重试或打开曲目来源。'); updatePlayer(); }
}
export function initBlog(api: Bridge) {
  bridge = api;
  document.querySelector('.system-footer > span:nth-child(2)')!.firstChild!.textContent = 'SAKURA ';
  document.querySelector('#stage')!.insertAdjacentHTML('beforeend', `<aside class="blog-player" aria-label="音乐播放器" hidden><div><a data-player-link><strong data-player-title></strong></a><small data-player-meta></small></div><div class="blog-player-controls"><button type="button" data-player-prev aria-label="上一首">←</button><button type="button" data-player-toggle>播放</button><button type="button" data-player-next aria-label="下一首">→</button><button type="button" data-player-close aria-label="停止并关闭播放器">×</button></div><input type="range" min="0" max="100" step="0.1" value="0" data-player-seek aria-label="播放进度"><small data-player-time></small><label>音量 <input type="range" min="0" max="1" step="0.05" value="0.65" data-player-volume aria-label="音乐音量"></label><details class="player-queue"><summary>播放队列</summary><ol>${tracks.map((t, i) => `<li><button type="button" data-queue-index="${i}">${e(t.title)} · ${e(t.artist)}</button></li>`).join('')}</ol></details></aside>`);
  player = document.querySelector('.blog-player')!;
  audio.volume = 0.65;
  try {
    const state = JSON.parse(localStorage.getItem('sakura-rhine-player') || 'null');
    const index = tracks.findIndex(t => t.id === state?.id);
    if (index >= 0) {
      trackIndex = index; audio.src = tracks[index].src;
      audio.volume = Math.min(1, Math.max(0, Number.isFinite(state.volume) ? state.volume : 0.65));
      audio.addEventListener('loadedmetadata', () => { if (Number.isFinite(state.time)) audio.currentTime = Math.min(state.time, audio.duration || 0); }, { once: true });
      player.querySelector<HTMLInputElement>('[data-player-volume]')!.value = String(audio.volume);
    }
  } catch {}
  for (const event of ['timeupdate', 'loadedmetadata', 'play', 'pause']) audio.addEventListener(event, updatePlayer);
  audio.addEventListener('play', () => api.music(true));
  audio.addEventListener('pause', () => api.music(false));
  audio.addEventListener('error', () => { api.music(false); api.notify('音频未能载入，可重试或查看原始来源。'); });
  audio.addEventListener('ended', () => void playTrack((trackIndex + 1) % tracks.length));
  player.addEventListener('input', event => {
    const input = event.target as HTMLInputElement;
    if (input.hasAttribute('data-player-seek') && Number.isFinite(audio.duration)) audio.currentTime = Number(input.value) / 100 * audio.duration;
    if (input.hasAttribute('data-player-volume')) audio.volume = Number(input.value);
  });
  document.addEventListener('click', async event => {
    const target = (event.target as Element).closest<HTMLElement>('a,button');
    if (!target) return;
    if (target.hasAttribute('data-content-retry') && current) { target.closest('[data-content-url]')!.outerHTML = blogBody(current); return; }
    if (target.dataset.queueIndex !== undefined) { await playTrack(Number(target.dataset.queueIndex)); return; }
    const play = target.dataset.blogPlay;
    if (play) { await playTrack(tracks.findIndex(t => t.id === play)); return; }
    if (target.hasAttribute('data-blog-heading')) {
      api.body();
      document.querySelectorAll('.blog-prose h2,.blog-prose h3')[Number(target.dataset.blogHeading)]?.scrollIntoView({ block: 'start' });
      return;
    }
    if (target.hasAttribute('data-player-toggle')) { if (audio.paused) await playTrack(trackIndex); else audio.pause(); }
    if (target.hasAttribute('data-player-prev')) await playTrack((trackIndex - 1 + tracks.length) % tracks.length);
    if (target.hasAttribute('data-player-next')) await playTrack((trackIndex + 1) % tracks.length);
    if (target.hasAttribute('data-player-close')) { audio.pause(); player.hidden = true; }
    if (target.dataset.blogCopy || target.hasAttribute('data-blog-share')) {
      try { await navigator.clipboard.writeText(target.dataset.blogCopy || content.config.url + (current?.route || '/')); api.notify('已复制'); }
      catch { api.notify('复制失败，请手动复制地址或提取码。'); }
    }
    if (target.hasAttribute('data-blog-comments') && current?.comments) {
      const root = document.querySelector('#blog-comments'); if (!root || root.childElementCount) return;
      const script = document.createElement('script'); script.src = 'https://giscus.app/client.js'; script.async = true; script.crossOrigin = 'anonymous';
      const attrs = { repo: content.config.giscus.repo, 'repo-id': content.config.giscus.repoId, category: content.config.giscus.category, 'category-id': content.config.giscus.categoryId, mapping: 'specific', term: current.route, strict: '0', 'reactions-enabled': '1', 'emit-metadata': '0', 'input-position': 'bottom', theme: 'preferred_color_scheme', lang: 'zh-CN' };
      for (const [key, value] of Object.entries(attrs)) script.setAttribute(`data-${key}`, value);
      root.append(script); target.hidden = true;
    }
    if (!(target instanceof HTMLAnchorElement) || target.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const url = new URL(target.href, location.href);
    const page = pageAt(url.pathname);
    if (url.origin !== location.origin || url.searchParams.has('reader') || !page) return;
    if (!page.recordId) {
      if (page.route === '/') return;
      event.preventDefault();
      location.href = `${page.route}?reader=1`;
      return;
    }
    if (url.pathname === location.pathname && url.hash) {
      const anchor = [...document.querySelectorAll<HTMLElement>('#detail-content [id]')].find(el => el.id === decodeURIComponent(url.hash.slice(1)));
      if (anchor) { event.preventDefault(); anchor.scrollIntoView({ block: 'start' }); }
      return;
    }
    event.preventDefault();
    history.pushState({}, '', url.pathname + url.search + url.hash);
    if (!route()) { routing = true; current = undefined; activeRoute = ''; api.overview(); metadata(); routing = false; }
  });
  window.addEventListener('popstate', () => {
    if (!route()) { routing = true; current = undefined; activeRoute = ''; api.overview(); metadata(); routing = false; }
  });
}
