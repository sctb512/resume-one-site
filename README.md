# Resume One Website

**English** · [简体中文](./README.zh-CN.md)

[Visit the website](https://sctb512.github.io/resume-one-site/en.html?lang=en) · [Desktop app](https://github.com/sctb512/resume-one) · [Community themes](https://github.com/sctb512/resume-one-themes)

This is the source for the bilingual Resume One website. The hero and theme gallery use excerpts from real PDF exports of the sample résumés, styled with White Space, Green Grain, and Ink Ledger. The editor demo uses the same sample data and lets you edit JSON, change fields on the page, and try themes. All three theme pickers update the previews and the site palette together. Hover to preview a theme or click to remember it. The gallery also includes a short animation made from the exports. The display font is a subset of Noto Serif SC. See its [font license](./site/assets/OFL-Jianli-Display.txt).

The main download button uses the browser’s platform and processor information to select an archive. It uses the macOS Universal build when the Mac processor cannot be determined. Visitors without a matching download are taken to the full list.

The site follows the browser’s language preference on first visit. Use the footer picker to choose Simplified Chinese, English, or the browser default. Each language has its own sample JSON and PDF excerpts, generated with the same version of the app.

The published pages and assets live in [`site/`](./site/). Build checks and asset generators live in [`tools/`](./tools/).

## Local preview

```sh
node --check site/language.js
node --check site/site.js
node --check site/download.js
python3 tools/build.py
python3 -m http.server 4173 --bind 127.0.0.1 --directory site
```

Open `http://127.0.0.1:4173/` in your browser. The site can also be hosted under a subpath.

To regenerate the theme animation, install Pillow and run `python3 tools/theme-motion.py ../resume_one/assets/fonts`. The production build uses the committed GIF and still images.

## Deployment

In **Settings → Pages**, select **GitHub Actions** as the source. Pushes to `main` validate the links and static assets, then deploy the website. Pull requests run the build checks. The [app repository](https://github.com/sctb512/resume-one) provides downloads and CLI documentation, and the [theme repository](https://github.com/sctb512/resume-one-themes) publishes community themes.
