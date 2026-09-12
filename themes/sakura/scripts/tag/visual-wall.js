'use strict'

// Reuse the gallery's authored Markdown image list; no remote gallery dependency.
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))

hexo.extend.tag.register('visualWall', (args, content) => {
  const items = [...content.matchAll(/!\[([^\]]*)\]\(([^\s)]+)\)/g)].map((match, index) => ({
    title: match[1], src: match[2], series: match[1].replace(/\d+$/, '') || '片段', number: String(index + 1).padStart(2, '0')
  }))
  const series = [...new Set(items.map(item => item.series))]
  return `<section class="visual-wall" aria-labelledby="visual-wall-title">
    <header class="visual-wall__masthead">
      <div><p class="visual-wall__eyebrow">SAKURA / VISUAL COLLECTION</p><h1 id="visual-wall-title">那些让我停留的<span>画面。</span><i aria-hidden="true">✳</i></h1><p class="visual-wall__intro">照片、插画与一些舍不得关掉的瞬间。<br>戴上耳机，随意逛逛。</p></div>
      <div class="visual-wall__signature"><img class="no-lightbox" src="/img/avatar.jpg" alt="Sakura 的头像" width="42" height="42"><div><strong>collected by Sakura</strong><span>${items.length} frames · ${series.length} collections</span></div></div>
    </header>
    <div class="visual-wall__toolbar">
      <div class="visual-wall__filters" role="group" aria-label="按图片系列筛选"><button type="button" data-wall-filter="all" aria-pressed="true">全部 <small>${items.length}</small></button>${series.map(name => `<button type="button" data-wall-filter="${escape(name)}" aria-pressed="false">${escape(name)} <small>${items.filter(item => item.series === name).length}</small></button>`).join('')}</div>
      <div class="visual-wall__views" data-wall-views hidden role="group" aria-label="图库展示方式"><button type="button" data-wall-view="orbit" aria-pressed="true">◌ 环形</button><button type="button" data-wall-view="grid" aria-pressed="false">▦ 平铺</button></div>
      <p data-wall-count role="status">${items.length} 个片段</p>
    </div>
    <div class="visual-orbit-stage" data-wall-stage>
    <div class="visual-orbit-hub" aria-hidden="true"><span>SIDE C / VISUAL FREQUENCY</span><strong>把瞬间，<br><em>放进旋律。</em></strong><small>SAKURA'S ROTATING ARCHIVE</small></div>
    <div class="visual-wall__grid" data-wall-grid>${items.map(item => `<a class="visual-card" href="${escape(item.src)}" data-wall-card data-wall-series="${escape(item.series)}" data-wall-title="${escape(item.title)}" aria-label="查看 ${escape(item.title)}"><img class="no-lightbox" src="${escape(item.src)}" alt="${escape(item.title)}" loading="lazy" decoding="async"><span class="visual-card__number">${item.number}</span><span class="visual-card__caption"><span><strong>${escape(item.title)}</strong><small>${escape(item.series)} / SAKURA'S COLLECTION</small></span><b aria-hidden="true">↗</b></span></a>`).join('')}</div>
    </div>
    <div class="visual-orbit-controls" data-orbit-controls hidden>
      <p>横向拖动旋转 · 纵向拖动改变视角 · 点击图片放大</p>
      <div><button type="button" data-orbit-turn="-1" aria-label="向左旋转图片环">↶</button><button type="button" data-orbit-motion aria-pressed="false">自动旋转</button><button type="button" data-orbit-turn="1" aria-label="向右旋转图片环">↷</button><button type="button" data-orbit-reset>正面视角</button></div>
      <div><button type="button" data-orbit-batch="-1" aria-label="上一组画面">←</button><span data-orbit-range role="status"></span><button type="button" data-orbit-batch="1" aria-label="下一组画面">→</button></div>
    </div>
    <footer class="visual-wall__end"><span>END OF THIS LITTLE COLLECTION</span><p>画面留在这里，音乐还在继续。</p><a href="/listening/">去听一首歌 ↗</a></footer>
    <dialog class="visual-detail" data-wall-dialog aria-labelledby="visual-detail-title">
      <div class="visual-detail__top"><div><span>SAKURA'S COLLECTION</span><h2 id="visual-detail-title" data-wall-detail-title></h2></div><button type="button" data-wall-close aria-label="关闭图片">×</button></div>
      <div class="visual-detail__image"><img class="no-lightbox" data-wall-detail-image alt=""><p data-wall-image-error hidden>图片暂时无法加载，可以尝试查看原图。</p></div>
      <div class="visual-detail__bottom"><button type="button" data-wall-prev aria-label="上一张图片">←</button><span data-wall-position role="status"></span><button type="button" data-wall-next aria-label="下一张图片">→</button><a data-wall-original target="_blank" rel="noopener">查看原图 ↗</a></div>
      <div class="visual-detail__music"><span aria-hidden="true">♫</span><div><small>LET THE MUSIC STAY</small><strong data-wall-track></strong></div><button type="button" data-wall-music>播放音乐</button><button type="button" data-wall-postcard>做成明信片</button></div>
      <section class="visual-postcard-builder" data-wall-postcard-builder hidden aria-label="制作音乐明信片">
        <div class="visual-postcard__preview" data-wall-postcard-preview>
          <img data-wall-postcard-preview-image alt="">
          <div><small>SAKURA / VISUAL FREQUENCY</small><strong data-wall-postcard-preview-title></strong><p data-wall-postcard-preview-note>这张画面，也适合被一首歌记住。</p><span data-wall-postcard-preview-track></span></div>
        </div>
        <label>配一首歌<select data-wall-postcard-track aria-label="为明信片选择歌曲"></select></label>
        <label>写一句话<textarea data-wall-postcard-note maxlength="80" rows="2" placeholder="例如：在这段旋律里，夜色刚好停了一下。"></textarea></label>
        <div class="visual-postcard__actions"><button type="button" data-wall-postcard-share>复制明信片链接</button><input type="text" readonly data-wall-postcard-url aria-label="明信片链接" hidden></div>
        <p data-wall-postcard-status role="status"></p>
      </section>
    </dialog>
  </section>`
}, { ends: true })
