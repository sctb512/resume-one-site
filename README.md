# Resume One 简里项目主页

这是简里的独立静态主页。知白、青禾和墨序的预览来自应用 CLI 对仓库示例简历的实际 PDF 导出，首屏展示这些首页节选。编辑体验区提供可修改的本地示例，覆盖 JSON/预览切换、纸面表单与主题试穿。主题区的 GIF 使用同一批实际导出图，模拟悬停、移出和点击。三处主题选择共用同一个网站配色和简历预览状态。悬停会临时试穿，点击会在浏览器记住选择。页面支持减少动态效果偏好。站点的显示字体是 Noto Serif SC 子集，许可位于 `site/assets/OFL-Jianli-Display.txt`。

## 本地预览

```sh
node --check site/site.js
python3 tools/build.py
python3 -m http.server 4173 --bind 127.0.0.1 --directory site
```

在浏览器打开 `http://127.0.0.1:4173/`。纯静态文件也可以部署到子路径。

重新生成主题切换动图时，安装 Pillow 后运行 `python3 tools/theme-motion.py ../resume_one/assets/fonts`。发布构建使用已提交的 GIF 和静态封面。

## 自动发布

在该仓库的 **Settings → Pages** 选择 **GitHub Actions**。推送到 `main` 会先检查链接和静态资源，再部署到 [项目主页](https://sctb512.github.io/resume-one-site/)。PR 只执行构建验证。应用下载与 CLI 文档由 [应用仓库](https://github.com/sctb512/resume-one) 提供，社区主题由 [主题仓库](https://github.com/sctb512/resume-one-themes) 发布。
