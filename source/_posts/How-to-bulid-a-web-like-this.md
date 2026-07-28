---
title: How to bulid a web like this
tags:
  - Hexo
  - Netlify
  - 教程
categories:
  - 技术杂谈
cover: /img/cover1.jpg
description: 记录我是如何从手写 Vue 博客转向使用 Hexo + Butterfly 主题，并成功部署到 Netlify 的全过程。
abbrlink: c029052
date: 2026-01-16 14:00:00
---

## 前言

作为一名人工智能专业的学生，我最初的想法是使用 **Vue 3 + Element Plus** 配合AI搭建一个博客。我成功配置了 Vite，写好了 Router，甚至搭建了一个简单的后台骨架。

但是，在折腾 Layout 和 CSS 的过程中，我意识到：**如果是为了写文章，我不应该在造轮子上花费太多时间。** 于是，我找到了一个更成熟的静态博客生成器 —— **Hexo**，并选择了颜值极高的 **Butterfly** 主题。

## 为什么选择 Hexo + Butterfly

1.  **极速生成**：基于 Node.js，生成静态页面非常快。
2.  **无需后端**：生成的全是 HTML/CSS/JS，可以直接部署在 Netlify 等免费托管平台。
3.  **Butterfly 主题**：这是我选择 Hexo 的最大动力。它自带了夜间模式、美观的卡片布局、社交图标，几乎不需要改代码就能拥有一个专业的博客外观。

---

## 🛠️ 本地搭建全流程

这是我成功搭建博客的完整命令记录，留作备忘。

### 1. 初始化 Hexo
首先需要安装 Hexo 的全局脚手架，并在空文件夹中初始化项目。

```bash
# 全局安装 Hexo 工具
npm install -g hexo-cli

# 初始化博客文件夹 (确保文件夹为空)
hexo init .

# 安装基础依赖
npm install

```

### 2. 安装 Butterfly 主题与必要插件

Butterfly 主题使用了 Pug 和 Stylus 渲染器，如果漏装了下面第二行命令，运行会报错。

```bash
# 下载主题
npm install hexo-theme-butterfly

# 安装渲染器 (关键步骤！)
npm install hexo-renderer-pug hexo-renderer-stylus --save

```

### 3. 启用主题

修改博客根目录下的 `_config.yml` 配置文件：

```yaml
# 找到 theme: landscape 修改为 butterfly
theme: butterfly

```

---

## 🚀 部署到 Cloudflare Pages

我选择了 **GitHub + Cloudflare Pages** 的自动化部署方案。只要我把代码推送到 GitHub，Cloudflare 就会自动构建并分发到全球 CDN 边缘节点。

### 1. 推送代码到 GitHub

```bash
git init
git add .
git commit -m "重构：迁移至 Hexo 博客"
git branch -M main
git remote add origin https://github.com/HanaViolet/MyWeb.git
git push -u origin main
```

### 2. Cloudflare Pages 的关键设置

在 Cloudflare Pages 后台创建项目并绑定 GitHub 仓库：

* **构建命令 (Build command)**：`npx hexo g`
* **输出目录 (Build output directory)**：`public`

### 3. 验证成果

保存设置后，Cloudflare Pages 会自动触发构建。当构建完成并绑定自定义域名 `sakura.luxe` 后，那只漂亮的蝴蝶就出现了！

---

## 📝 常用命令备忘

以后写博客只需要记住这三步：

1. **新建文章**：`hexo new "文章标题"`
2. **本地预览**：`hexo s` (访问 localhost:4000)
3. **发布上线**：
```bash
git add .
git commit -m "发布新文章"
git push

```



## 结语

虽然放弃了手写 Vue 博客有点遗憾，但通过这次迁移，我学会了 Git 的强制推送、Netlify 的持续集成配置，以及 Hexo 的插件机制。

现在的重点是：**可以好好写文章了！**