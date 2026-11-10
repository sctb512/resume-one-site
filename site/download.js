"use strict";

(() => {
  const button = document.querySelector("#hero-download");
  const downloads = [...document.querySelectorAll("[data-download]")].map(link => ({
    link,
    platform: link.dataset.download,
    filename: new URL(link.href).pathname.split("/").pop(),
  }));
  const hints = navigator.userAgentData;
  const os = hints?.platform || navigator.platform;
  const mobile = hints?.mobile || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const platform = mobile ? null
    : /^mac/i.test(os) && navigator.maxTouchPoints < 2 ? "macos"
    : /^win/i.test(os) ? "windows"
    : null;
  let preferred = downloads.find(download => download.platform === platform);

  function updateButton() {
    button.href = preferred ? preferred.link.href : "#download";
    button.textContent = preferred ? `下载 ${preferred.link.textContent}` : "查看下载";
  }

  updateButton();
  if (preferred && hints?.getHighEntropyValues) {
    // Older browsers report the OS only. Keep the supported CPU in the label.
    hints.getHighEntropyValues(["architecture", "bitness", "wow64"]).then(cpu => {
      const unsupported = platform === "macos" ? cpu.architecture === "x86"
        : cpu.architecture === "arm" || (cpu.bitness === "32" && cpu.wow64 === false);
      if (unsupported) {
        preferred = undefined;
        updateButton();
      }
    }).catch(() => {});
  }

  const releaseBase = "https://github.com/sctb512/resume-one/releases/download/";
  fetch("https://api.github.com/repos/sctb512/resume-one/releases?per_page=10", {
    credentials: "omit",
    signal: AbortSignal.timeout?.(4000),
  }).then(response => response.ok ? response.json() : []).then(releases => {
    // Only promote a release when both packages are published. Retain the
    // checked-in links when the API is offline or rate-limited.
    const available = releases.filter(release =>
      !release.draft && /^v[\w.-]+$/.test(release.tag_name) &&
      downloads.every(({ filename }) => release.assets.some(asset =>
        asset.state === "uploaded" &&
        asset.browser_download_url === `${releaseBase}${release.tag_name}/${filename}`
      ))
    );
    const release = available.find(item => !item.prerelease) ?? available[0];
    if (!release) return;
    for (const { link, filename } of downloads) link.href = `${releaseBase}${release.tag_name}/${filename}`;
    updateButton();
  }).catch(() => {});
})();
