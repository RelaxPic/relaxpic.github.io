# 网站维护与部署

当前仓库已迁移到 VitePress。首页编辑 `index.md`，其他文档文件名保持不变。`readme.md` 用于 GitHub 仓库介绍，不参与站点构建。图片与 App 运行资源位于 `public/static/`。

```sh
npm ci
npm run dev
npm run build
npm test
npm run preview
```

`npm run build` 自动生成 Pagefind 中文搜索索引。搜索弹窗支持 Ctrl/Cmd+K、方向键选择、Enter 跳转和 Esc 关闭。开发模式不生成索引，体验搜索请运行 `npm run build && npm run preview`。

GitHub Pages Source 使用 GitHub Actions。推送 `master` 后，`.github/workflows/deploy.yml` 安装依赖、构建、检查并发布 `.vitepress/dist`，无需提交构建产物。自定义域名沿用 `relaxpic.com`，配置位于 `public/CNAME`。

旧 App 的 `/#/download`、协议、帮助及更新日志入口保留兼容；`//#/changelog` 需要服务器返回新站首页或生成的 `404.html`。其他服务器也需支持 `/download` 返回 `download.html`。`.cn` 服务器不由本仓库的 GitHub Pages 发布自动更新。

`public/static/js/segmentit.js` 是安卓 App 运行资源，不得删除或重新压缩；测试核对 App 固定的 SHA-256。`public/sw.js` 用于停用历史 Docsify Service Worker，请保留该路径。

英文内容以后可放在 `/en/`，目前没有英文文档。完整迁移前文件（包含当时尚未提交的修改）备份在本机 `/home/song/GolandProjects/relaxpic-before-vitepress.vl8F5O/site-before-migration.tar.gz`，Git 提交历史也保留旧站源码。独立 VitePress 副本仍位于 `../relaxpic-vitepress`，此后以本仓库为维护入口。
