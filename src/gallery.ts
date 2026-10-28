import './gallery.css';

// Native modal owns focus and makes the underlying terminal inert.
export function initGallery() {
  const dialog = document.createElement('dialog');
  dialog.className = 'gallery-viewer';
  dialog.setAttribute('aria-label', '影像查看器');
  dialog.innerHTML = '<header><span data-gallery-count></span><button type="button" data-gallery-close aria-label="关闭影像查看器">关闭 ×</button></header><figure><img alt=""><figcaption></figcaption></figure><footer><button type="button" data-gallery-prev>← 上一张</button><a target="_blank" rel="noopener">原图 ↗</a><button type="button" data-gallery-next>下一张 →</button></footer>';
  document.body.append(dialog);
  let items: { src: string; alt: string }[] = [];
  let index = 0;
  const show = (next: number) => {
    index = (next + items.length) % items.length;
    const item = items[index];
    const img = dialog.querySelector('img')!;
    img.src = item.src; img.alt = item.alt;
    dialog.querySelector('figcaption')!.textContent = item.alt;
    dialog.querySelector('[data-gallery-count]')!.textContent = `${index + 1} / ${items.length}`;
    dialog.querySelector('a')!.href = item.src;
  };
  document.addEventListener('click', event => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('.blog-gallery a');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const grid = link.closest('.blog-gallery')!;
    const links = [...grid.querySelectorAll<HTMLAnchorElement>('a')];
    items = links.map(a => ({ src: a.href, alt: a.querySelector('img')?.alt ?? '' }));
    event.preventDefault();
    show(links.indexOf(link));
    dialog.showModal();
  });
  dialog.querySelector('[data-gallery-close]')!.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-gallery-prev]')!.addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-gallery-next]')!.addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); show(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
}
