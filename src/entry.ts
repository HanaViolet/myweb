const reader = new URLSearchParams(location.search).has('reader');
const fallback = document.querySelector<HTMLElement>('#static-content');
if (!reader) {
  if (fallback) fallback.hidden = true;
  import('./main').then(() => fallback?.remove()).catch(error => {
    console.error(error);
    if (fallback) fallback.hidden = false;
    document.querySelector<HTMLElement>('#viewport')!.hidden = true;
    document.body.style.overflow = 'auto';
  });
} else {
  document.querySelector<HTMLElement>('#viewport')!.hidden = true;
  document.querySelectorAll<HTMLAnchorElement>('#static-content a[href]').forEach(a => {
    const url = new URL(a.href);
    if (url.origin === location.origin && url.pathname.endsWith('/') && !a.hasAttribute('data-interactive')) {
      url.searchParams.set('reader', '1'); a.href = url.href;
    }
  });
  document.querySelectorAll<HTMLButtonElement>('[data-blog-play]').forEach(button => {
    button.addEventListener('click', async () => {
      const { default: content } = await import('../.generated/blog.json');
      const track = content.tracks.find(t => t.id === button.dataset.blogPlay);
      if (!track) return;
      document.querySelectorAll('audio').forEach(a => a.pause());
      let audio = button.parentElement!.querySelector('audio');
      if (!audio) { audio = document.createElement('audio'); audio.controls = true; audio.src = track.src; button.after(audio); }
      audio.play().catch(() => { button.textContent = '请用播放器重试'; });
    });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-blog-copy]').forEach(button => {
    button.addEventListener('click', () => navigator.clipboard.writeText(button.dataset.blogCopy || '').then(() => { button.textContent = '已复制'; }).catch(() => { button.textContent = '请手动复制'; }));
  });
}
