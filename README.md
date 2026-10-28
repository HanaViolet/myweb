# Sakura · Rhine Archive

Sakura 的个人博客，直接使用 [LBEILC/RhineLabUI](https://github.com/LBEILC/RhineLabUI) 的 TypeScript + Three.js + Vite 实现。保留原版开场、莱茵生命品牌、玻璃档案模型、五列循环阵列、抽取 / 解密 / 360° 查看器、声音、明暗主题和画质设置，把博客接入原生阅读与检索界面。

## 本地运行

Node.js >= 20.19（推荐 22），npm：

```sh
npm ci
npm run dev          # http://127.0.0.1:4000
npm run check        # 内容转换、TypeScript、生产构建、内容完整性、站内链接
npm run preview      # 预览生产构建
npm run check:browser # 预览服务运行时执行 Chrome 端到端检查
```

`npm run server` 等价于开发预览。修改 `source/` 后运行 `npm run content:build`，Vite 会加载新生成的数据。开发与生产均支持 `?reader=1` 直接阅读。三维模式加载失败时提供直接阅读入口；生产 HTML 含完整正文，无 JavaScript 也能阅读。

## 内容维护

内容平台的新结构、旅行日志格式和后续里程碑见 [平台改造说明](docs/platform-roadmap.md)。旅行日志模板在 `scaffolds/trip.md`；复制到 `source/_trips/` 后填写内容，确认发布时将 `published` 改为 `true`。

- `source/_posts/*.md`：继续写 Markdown，保留原有 Front Matter。`abbrlink` 是稳定的文章地址，必须唯一，不要修改已发布文章的值。同名目录保存文章配图。
- `source/gallery/index.md`：图库图片清单，系列从图片 alt 中提取。
- `source/resources/index.md`：资源名称、说明、网盘地址与提取码。
- `source/about/index.md`、`source/_data/link.yml`：个人介绍与友链。
- `source/_data/tracks.json`、`source/music/`：私人选曲与音频。
- `source/_data/discovery.json`、`netease-stats.json`、`netease-comments.json`：开放音乐、官方听歌记录和热评，原更新任务仍可使用。
- `blog.config.json`：新站名称、域名、作者和 Giscus 配置。
- `content/blog-ids.json`：档案编号，`X-001` 固定为“关于 Sakura”，其余固定栏目依次编号，文章按时间顺序放在最后；新增文章自动获得下一个编号并追加到文章栏末尾。重排编号会改变可见档案身份，需同时迁移收藏和旧导出链接。

五列分别为影像、音乐、文章、资源、个人档案。全文检索支持标题、标签与正文；原 `/posts/:abbrlink/`、归档、分类、标签、图库、听歌室、资源、关于和友链地址继续生成。音乐在站内导航时持续播放；选曲开始播放时暂时关闭终端环境音乐。评论沿用 GitHub Discussions 与原文章路径，通过“留言”加载。

生成目录 `.generated/` 和 `public/` 不提交。旧主题、旧配置和旧工具保留为迁移历史，新的构建不再依赖 Hexo。此前站点说明保存在 [legacy-listening-room.md](docs/legacy-listening-room.md)。

## 发布

Cloudflare Pages 构建命令设置为 **`npm run build`**，输出目录仍为 **`public`**。如果后台仍配置 `npx hexo g`，需要先更新构建命令。线上更新状态以 Cloudflare Pages 的部署结果为准。

站点生成静态页面、Atom RSS、sitemap、search.xml、逐档 TXT 导出、404 和 PWA。PWA 按版本缓存界面、模型、字体与正文；图库原图和私人音乐按需联网加载，不在首页预下载整套媒体库。网易云更新任务所需的 `/about/` 同步时间标记已保留。

## 来源与改动边界

上游固定版本：`12cc5e4013acb9408f753ff71de6b8492299b7c8`。详细来源、可回退说明与验证记录见 [迁移说明](docs/rhine-migration.md)。上游 MIT 许可证、Rolling Number 许可、MiSans 许可及 PR #15 贡献署名保留于 `static/rhine/`。上游需要独立授权、未进入 Git 的 Novecento 字体没有抓取或打包，使用原项目自带的固定图形回退。

这是基于非官方《明日方舟》莱茵生命界面的个人博客改编，与鹰角网络无隶属关系。
