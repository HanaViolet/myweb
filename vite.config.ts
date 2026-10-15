import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const models = ['archive-cassette', 'archive-assembly'].map(name => {
  const source = readFileSync(`static/rhine/assets/${name}.glb`);
  const hash = createHash('sha256').update(source).digest('hex').slice(0, 16);
  return { key: `assets/${name}.glb`, fileName: `assets/${name}.${hash}.glb`, source };
});
export default defineConfig({
  publicDir: '.generated/public',
  build: { outDir: 'public', emptyOutDir: true },
  server: { host: '127.0.0.1', port: 4000 },
  define: {
    __RHINE_MODELS__: JSON.stringify(Object.fromEntries(models.map(m => [m.key, m.fileName]))),
    __RHINE_NOVECENTO__: 'false',
  },
  plugins: [{
    name: 'blog-development-reader', apply: 'serve',
    transformIndexHtml(html, ctx) {
      const content = JSON.parse(readFileSync('.generated/blog.json', 'utf8'));
      const url = new URL(ctx.originalUrl || ctx.path, 'http://localhost');
      const page = content.pages.find((p: {route: string}) => decodeURIComponent(p.route) === decodeURIComponent(url.pathname));
      const escape = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
      return html.replace('<!-- BLOG_STATIC_CONTENT -->', `<main id="static-content"><nav class="reader-nav"><a href="/archives/?reader=1">文章</a><a href="/gallery/?reader=1">图库</a><a href="/listening/?reader=1">音乐</a><a href="/resources/?reader=1">资源</a><a href="/about/?reader=1">关于</a></nav><h1>${escape(page?.title || content.config.title)}</h1>${page?.html || ''}<p><a data-interactive href="${escape(url.pathname)}">进入三维档案终端 ↗</a></p></main>`);
    },
  }, {
    name: 'versioned-model-assets', apply: 'build',
    buildStart() { for (const m of models) this.emitFile({ type: 'asset', fileName: m.fileName, source: m.source }); },
  }],
});
