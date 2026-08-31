# Sakura Listening Room

<p align="center">
  <strong>Music for the quiet hours.</strong><br>
  一个以音乐为线索的个人博客：记录代码、游戏、阅读与生活。
</p>

<p align="center">
  <a href="https://sakura.luxe">在线访问</a> ·
  <a href="https://music.163.com/#/playlist?id=2203036705">网易云歌单</a> ·
  <a href="https://github.com/HanaViolet/MyWeb/issues">反馈问题</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Hexo-8.1.1-0f766e?style=flat-square&logo=hexo&logoColor=white" alt="Hexo 8.1.1">
  <img src="https://img.shields.io/badge/Theme-Sakura%20Listening%20Room-9bbfae?style=flat-square" alt="Sakura Listening Room theme">
  <img src="https://img.shields.io/badge/Hosted-Cloudflare%20Pages-f38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare Pages">
</p>

## ✨ 项目简介

这是 Sakura 的个人博客源码。网站由 Hexo 构建、Cloudflare Pages 发布，视觉上采用固定暗色、留白和唱片纹理，首页围绕 YORUSHIKA 等 J-pop 选曲展开。文章、资源、关于我和播放器共享同一套响应式布局，页面切换使用 Pjax，播放状态会在导航和登录返回后尽量恢复。

## 🎼 选曲档案图

<p align="center">
  <img src="./docs/listening-archive.svg" width="820" alt="Sakura Listening Room audio archive">
</p>

这张图展示歌单中每首音频的文件体积，数据直接从 [`source/_data/tracks.json`](source/_data/tracks.json) 和 `source/music/` 读取。它既能快速浏览这间 Listening Room 的声音库存，也能在迁移到 Cloudflare R2 前估算存储体积；不需要额外的统计权限或手工录入。

```bash
npm run listening:chart
```

新增歌曲、替换音频或修改标题后重新运行命令，README 图表就会同步更新。缺失的音频会标记为“音频文件未找到”，不会悄悄填入估算值。

## 🎧 音乐与内容

- `source/_data/tracks.json`：选曲元数据（日文标题、中文标题、专辑信息、短笺和音频路径）。
- `source/music/`：本地播放器使用的音频文件；只应提交你拥有或获准发布的音频，后续可迁移到 Cloudflare R2。
- `source/_data/netease-comments.json`：每首选曲缓存的少量网易云热门评论；首页切换歌曲时会显示对应热评，并提供原页面链接。
- `source/_data/netease-stats.json`：网易云同步的每周 / 总榜前 20 首歌曲，以及关于我页面使用的官方听歌时长。排行默认走公开接口；配置 Cookie 后会读取登录接口，并单独请求“云村听歌足迹”的本周与累计总时长。
- 网易云完整歌单：[Sakura 的收藏歌单](https://music.163.com/#/playlist?id=2203036705)。
- 网易云个人页：[Sakura 的听歌排行](https://music.163.com/#/user/home?id=1441471952)。
- `source/_posts/`：Markdown 文章；文章的 `cover` 会作为文章页顶部渐变背景。

## 🧩 主题结构

当前主题代码统一位于 [`themes/sakura/`](themes/sakura/)，站点入口配置为 [`_config.sakura.yml`](_config.sakura.yml)。旧的根目录注入文件已迁入主题目录；Git 变更中看到旧路径删除，是代码搬迁而不是功能删除。播放器、Pjax、搜索、Giscus 评论和移动端布局都由 Sakura 主题维护。

主题的渲染基础参考并改造自 [hexo-theme-butterfly 5.5.3](https://github.com/jerryc127/hexo-theme-butterfly)，原始 Apache-2.0 许可证和归属信息保留在 [`themes/sakura/LICENSE`](themes/sakura/LICENSE) 与 [`themes/sakura/NOTICE.md`](themes/sakura/NOTICE.md)。Sakura 的页面设计、音乐交互和适配代码为本项目新增内容。

## 📁 目录速览

```text
.
├─ source/                 # 文章、页面、图片与本地音乐
│  ├─ _posts/              # Markdown 文章
│  ├─ _data/tracks.json    # 播放器歌曲数据
│  └─ music/               # 音频文件（可迁移至 R2）
├─ themes/sakura/          # 独立主题：模板、样式、脚本与资源
├─ scripts/                # Hexo 扩展脚本
├─ tools/                  # README 图表等维护工具
├─ docs/                   # README 图表
├─ _config.yml             # Hexo 基础配置
├─ _config.sakura.yml      # Sakura 主题配置
└─ compress.py             # 图片/资源压缩工具
```

## 🛠️ 本地开发

环境要求：Node.js `>= 20.19.0`（Hexo 8）与 npm。

```bash
git clone https://github.com/HanaViolet/MyWeb.git
cd MyWeb
npm install
npm run server       # http://localhost:4000
```

常用命令：

```bash
npm run build         # 生成 public/
npm run clean         # 清理生成目录
npm run listening:chart # 从歌曲数据与音频文件生成 docs/listening-archive.svg
npm run netease:update  # 同步网易云周榜 / 总榜（可选 Cookie 页面抓取）
npm run netease:comments # 手动同步选曲的网易云热门评论
python compress.py    # 按脚本说明压缩图片资源
```

新增文章：

```bash
npx hexo new post "文章标题"
```

文章需要封面时，将图片放入同名资源文件夹，并在 Front Matter 中设置 `cover: /img/your-cover.jpg`。提交前建议执行 `npm run clean; npm run build`，确认生成成功后再推送。

## 🔐 发布与隐私

Cloudflare Pages 通过 Git 集成监听 `main` 分支并构建站点，因此普通提交和 `github-actions[bot]` 生成的数据提交都会自动触发生产部署。网易云更新任务在推送后还会轮询线上关于页，最多等待 10 分钟，只有确认本次 `updatedAt` 已经出现在 `https://sakura.luxe/about/` 才算完整成功；该校验不需要 Cloudflare API Token 或 Deploy Hook。若将音频迁移到 R2，建议使用公开只读对象 URL，并把管理凭据放在 Cloudflare Secrets 中；不要把 API Token、私有歌单或未获授权的音频提交到公开仓库。

`.github/workflows/update-netease-stats.yml` 会每天按北京时间 00:17 更新 `source/_data/netease-stats.json` 并提交变更，Cloudflare Pages 随后自动重新构建。GitHub 定时任务可能延迟执行，页面会把 ISO 时间按 `Asia/Shanghai` 转换后显示。脚本会请求公开排行；如果配置了 GitHub Actions Secret `NETEASE_COOKIE`，会优先用无头 Chrome 打开个人页，并把同一登录态传给排行接口，以读取登录后页面或接口返回的播放次数。同时，脚本会并行调用同一组网易云听歌足迹接口：`/api/content/activity/listen/data/realtime/report`（`type=week`）获取本周值，`/api/content/activity/listen/data/total` 获取累计值。个人页明确展示的“本周收听时长”和“总时长”会优先作为两项的可见值，接口作为备用；不会再使用 Top 20 播放次数估算冒充账户总时长。累计接口的 `totalDuration` 是秒，脚本会统一转换为分钟；旧快照若曾把原始秒数写进 `*Minutes` 字段，页面会临时兼容并在下次同步后被替换。累计值如果小于本周值会被拒绝写入。生成文件会保留脱敏的字段路径、单位和校验状态，便于接口变更时排查。Cookie 只在 Actions 运行时注入，不会写入仓库或生成数据文件；过期后删除 / 更新该 Secret 即可。

`.github/workflows/update-netease-comments.yml` 会每周按北京时间周一 00:31 更新 `source/_data/netease-comments.json`。它按 `tracks.json` 中的 `neteaseId` 请求热门评论，每首只缓存少量摘录，并保留网易云歌曲页链接；请求失败时会继续展示上一次缓存，不会让构建中断。评论内容来自网易云公开页面 / 接口，页面只展示必要的署名、获赞数和日期。

热评抓取的资源路径与流程参考了 [《抓取网易云音乐热门评论》](https://chengjun.github.io/mybook/04-crawler-netease-music.html)；本项目改为在 Actions 中低频执行并生成静态数据，避免访客浏览器直接请求网易云。

### 配置 Cookie 页面抓取（可选）

如果希望关于我页面显示网易云“云村听歌足迹”返回的本周与累计总时长：

1. 在浏览器登录网易云音乐，只复制自己账号的 Cookie 请求头内容，不要把 Cookie 发到聊天或提交到 Git。
2. 打开 GitHub 仓库的 **Settings → Secrets and variables → Actions**，新建 Secret，名称填写 `NETEASE_COOKIE`，值粘贴 Cookie 内容。
3. 手动运行 `Update NetEase listening stats`，确认生成的 `netease-stats.json` 中 `duration.available` 为 `true`，并检查 `duration.weeklyMinutes` 与 `duration.allTimeMinutes`。个人页两项都可见时，`duration.source` 为 `netease-profile-visible`；只有接口返回时为 `netease-listen-data`，混合使用时会同时标记两者。如果接口字段发生变化、页面抓取失败或 Cookie 过期，对应指标会显示 `—`，不会用 Top 20 播放次数估算冒充账户总时长；Actions 日志只出现字段摘要，不会打印 Cookie。

本地运行时可临时设置环境变量 `NETEASE_COOKIE`（PowerShell 示例：`$env:NETEASE_COOKIE = '这里粘贴 Cookie'`，运行后用 `Remove-Item Env:NETEASE_COOKIE` 清除），也可以设置 `NETEASE_STORAGE_STATE_FILE` 指向 Playwright 的登录态 JSON；这些文件已加入 `.gitignore`。需要自定义 Chrome 路径时设置 `NETEASE_BROWSER_PATH`。脚本只读取登录态可访问的网易云页面与听歌足迹数据，不绕过登录、付费或访问控制；如果接口没有返回官方总时长，会明确保留“暂不可读”，不会用猜测值冒充听歌时长。

## 📄 许可证与致谢

本站原创文章、Sakura 页面设计和项目代码按仓库实际文件声明使用。主题中由 Butterfly 改造而来的渲染层继续遵循 Apache-2.0；第三方字体、图标、Busuanzi、Giscus 与 CDN 服务各自遵循其许可和服务条款，详见 [`themes/sakura/NOTICE.md`](themes/sakura/NOTICE.md)。感谢 Butterfly 社区提供的 Hexo 主题基础。
