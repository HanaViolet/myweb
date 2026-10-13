# 心情电台与声音书签

本轮在现有 Hexo / Sakura Listening Room 上增加交互，不引入新的播放器或动画依赖。

## 体验

- 首页、听歌室增加心情电台：夜读 88.3、专注 92.6、漫游 101.7、放空 106.2。频道按钮和旋钮可切台；「换一组相遇」轮换频道内的歌曲和文章。仅点击播放才改变播放状态。
- 频道配色、频率、文章和歌曲一起变化；频道偏好保存在本地浏览器。文章根据真实标签与分类匹配，没有匹配文章时退回归档入口。
- 文章配乐卡提供播放/暂停，悬浮阅读工具栏和配乐卡都能保存声音书签。书签按文章路径保存歌曲 ID、播放秒数和正文相对位置，支持刷新后恢复。存储不可用时明确提示仅本次有效。
- 唱片轻微跟随鼠标倾斜、频道切换淡入、播放状态带动装饰波形及小唱片。波形为装饰动画，不代表实际音频频谱。离开视口、后台标签页、减少动态效果设置都会停止相应持续动画。
- 沿用持久播放器和 Pjax 生命周期，翻页时清理观察器、事件、动画与待恢复音频监听。无 JavaScript 时保留电台默认文章入口并隐藏无效控件。

## 设计参考

浏览了用户提供的 [Landing Love](https://www.landing.love/categories/music/)、[Land-book](https://land-book.com/)、[One Page Love](https://onepagelove.com/)、[Lapa Ninja](https://www.lapa.ninja/)、[21st.dev](https://21st.dev/) 和 [Siteinspire](https://www.siteinspire.com/)。选择音乐主题、编辑式留白和可感知的交互反馈，结合本站已有暗绿、唱片与纸质札记语言，原创实现模拟收音机界面。Awwwards 首页本次读取失败，未依赖其不可访问内容。未复制第三方组件代码，也未新增外部媒体请求。

## 维护

- `themes/sakura/scripts/sonic-journal.js`：频道、歌曲映射、文章匹配、默认 HTML 和文章配乐 helper。
- `themes/sakura/source/js/sonic-journal.js`：交互、书签、动画生命周期。
- `themes/sakura/source/css/sonic-journal.css`：响应式样式与减少动画支持。
- `_config.sakura.yml`：新增 CSS / JS 引用。
- `themes/sakura/layout/post.pug`：配乐卡及悬浮书签入口。

## 验证

运行 `npm run check` 检查构建及本地链接。运行本地服务后执行 `node tools/check-sonic-journal.mjs`（需 Chrome；可用环境变量 `SONIC_TEST_URL` 指定测试地址）。检查真实音频、键盘旋钮、四频道映射、配对轮换、Pjax、书签中途保存/刷新/音频恢复、频道持久化、重复初始化、320/390px 布局、减少动画与无 JavaScript 降级。截图写入系统临时目录 `sakura-sonic-qa`。

本轮只更新本地源码，未提交、推送或发布生产站点；保留工作区中原有未提交改动。

## 第二轮：布局与滚动叙事

首页调整为「首屏 → 三段序曲 → 最新文章 → 心情电台 → 可展开唱片柜 → 听歌签 → 磁带 → 影像」。文章前移，完整歌单及热评按需展开；首屏 OPEN PLAYLIST 仍能自动打开唱片柜并定位。主要区域统一到 1200px 内容宽度，小屏使用 20px 边距。

- 新增章节导航：序曲、文字、电台、磁带、影像；跟随页面滚动高亮当前区域，细线显示页面进度，支持键盘导航和直接锚点访问。
- 三段序曲采用桌面 sticky 唱片装置，滚动控制唱片旋转、抽出距离和封套角度，邻近章节切换封面；标题随滚动逐步变亮。每段都连接真实文章与现有配乐。配乐仅由播放按钮触发。
- 首页文章封面与影像胶片增加轻微滚动视差。窄屏使用自然纵向布局，关闭大幅视差；减少动态效果时关闭转盘运动、渐变过渡及持续动画。
- 磁带新增 A/B 面翻转。A 面标题同步原有磁带命名，卷轴在播放已选曲目时旋转；B 面允许输入 120 字便笺，存储在当前浏览器，明确提示存储失败。非当前面设置 inert 和 aria-hidden，避免键盘进入隐藏表单。
- 动效使用原生 CSS、requestAnimationFrame、IntersectionObserver 和 ResizeObserver，没有增加依赖。滚动事件合并到每帧，后台不绘制；Pjax 离开时清理全部新增监听和观察器。

新增维护入口：`themes/sakura/scripts/journal-motion.js`、`themes/sakura/source/js/journal-motion.js`、`themes/sakura/source/css/journal-motion.css`。`tools/check-journal-motion.mjs` 验证布局顺序、唱片柜入口、滚动旋转、封面切换、sticky 定位、真实音频、导航焦点、翻面及便笺持久化、Pjax 往返、320/390/768px、减少动态效果和无 JS 降级。截图写入系统临时目录 `sakura-motion-qa`。此前电台及声音书签测试继续保留。
