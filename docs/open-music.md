# 音乐街区与开放曲库

页脚参考微缩建筑场景，以 SVG 绘制钢琴房、唱片店、电台塔和爵士店。图形无需 WebGL 或额外三维依赖；播放时转动唱片标签、呼吸电波，离开视口或启用减少动态效果时停止装饰动画。

## 音乐来源

采用 Internet Archive 的公开 Search 与 Metadata API，无需 API Key。仅筛选元数据明确标注 **CC BY 2.5 / 3.0 / 4.0** 的录音；不把整站内容视为免费授权。播放器和页脚保留曲名、作者、原作品页与授权链接，音频直接串流原始文件，不剪辑，不把音频文件提交进仓库。

- 元数据 API：https://archive.org/developers/md-read.html
- 搜索 API：https://archive.org/advancedsearch.php
- CC BY 4.0：https://creativecommons.org/licenses/by/4.0/

最初验证过 ccMixter Query API，元数据正常但本站实际跨站音频播放返回 403，因此未采用该来源。Jamendo 的非商业 API 可免费使用，但需要自行注册 Client ID，也未引入。

## 曲库刷新

运行 `npm run music:update`，再运行 `npm run check`。脚本分别检索 piano、ambient、electronic、jazz，每个频道目标 12 首，每张专辑最多 4 首；只收录 1–15 分钟且不超过 35 MB 的 MP3，并排除同一 MP3 的码率衍生版本。更新时逐首检查音频响应（24 小时内已检查的链接复用结果），每个频道不足 4 首时保留原曲库并失败退出。所有频道通过后原子替换 `source/_data/discovery.json`。

使用标准 `HTTPS_PROXY` / `https_proxy` 环境变量可让刷新脚本经过用户自己的代理；仓库不保存代理地址或凭据。正常构建只读已保存的元数据，不依赖 API 实时可用。当前没有添加后台定时任务；更新元数据并部署后才会更新公开曲池。API 与第三方音频仍受服务可用性、地区网络和原文件移除影响，加载失败时界面会提示换曲或返回私人收藏。

## 页面与随机规则

- 文章、归档、分类、标签：纸页之间 / piano。
- 图库：光影漫游 / ambient。
- 资源页：夜间编码 / electronic。
- 首页、听歌室、关于及其他页：街角偶遇 / jazz。

每次进入页面重新推荐相应频道的一首；单次页面会话内尽量不重复，曲池耗尽后重新洗牌。点击店名可以手动换频道；“换一首”仅更换推荐，“播放这首”才开始播放。页面切换保留当前歌曲和位置，不突然换歌。原有 6 首私人收藏保留，探索曲目同样支持收藏、分享和听歌签。

## 维护入口

- `themes/sakura/layout/includes/footer-music.pug`：导航与电台界面。
- `themes/sakura/layout/includes/footer-street.svg`：音乐建筑插画。
- `themes/sakura/source/css/music-neighborhood.css`：布局、移动端及动画。
- `themes/sakura/source/js/music-neighborhood.js`：频道与随机推荐。
- `tools/update-discovery-music.mjs`：获取和校验公开曲库。

曲风依赖来源标签，不保证每首都没有人声；此处是开放音乐探索，不是流行歌曲全曲搜索服务。
