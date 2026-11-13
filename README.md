# 简里 · 项目官网

**简体中文** · [English](./README.en.md)

[访问官网](https://sctb512.github.io/resume-one-site/) · [应用仓库](https://github.com/sctb512/resume-one) · [主题仓库](https://github.com/sctb512/resume-one-themes)

这是简里的独立静态主页。首屏和主题区展示知白、青禾和墨序的 PDF 首页节选，由应用 CLI 导出仓库中的示例简历生成。编辑体验区使用同一份示例的数据节选，可修改 JSON、使用纸面表单并试穿主题。三处主题选择同步切换纸面和网站配色。悬停会临时试穿，点击会在浏览器记住选择。主题区可手动播放由实际导出图制作的动图，再次选择主题会回到样张。站点的显示字体是 Noto Serif SC 子集，许可位于 `site/assets/OFL-Jianli-Display.txt`。

首页的「下载简里」会根据浏览器提供的系统和处理器信息直接下载对应版本。无法区分 Mac 处理器时下载通用版。无法匹配平台时，按钮会跳转到下载区的版本列表。

首页会根据浏览器首选语言打开简体中文或英文。可在页脚选择「跟随浏览器」「简体中文」或「English」，偏好在浏览器中保留。两个语言页面使用独立的示例 JSON 和同版本的真实 PDF 节选。

## 本地预览

```sh
node --check site/language.js
node --check site/site.js
node --check site/download.js
python3 tools/build.py
python3 -m http.server 4173 --bind 127.0.0.1 --directory site
```

在浏览器打开 `http://127.0.0.1:4173/`。纯静态文件也可以部署到子路径。

重新生成主题切换动图时，安装 Pillow 后运行 `python3 tools/theme-motion.py ../resume_one/assets/fonts`。发布构建使用已提交的 GIF 和静态封面。

## 自动发布

在该仓库的 **Settings → Pages** 选择 **GitHub Actions**。推送到 `main` 会先检查链接和静态资源，再部署到 [项目主页](https://sctb512.github.io/resume-one-site/)。PR 只执行构建验证。应用下载与 CLI 文档由 [应用仓库](https://github.com/sctb512/resume-one) 提供，社区主题由 [主题仓库](https://github.com/sctb512/resume-one-themes) 发布。
