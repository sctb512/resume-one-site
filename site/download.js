"use strict";

(() => {
  const button = document.querySelector("#hero-download");
  const navLink = document.querySelector("#nav-download");
  const platformPicker = document.querySelector(".hero-other-platforms");
  const choices = document.querySelector("#hero-download-choices");
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
  const universal = downloads.find(download => download.platform === "macos-universal");
  let preferred = platform === "macos" ? universal : null;

  function updateButton() {
    const href = preferred ? preferred.link.href : "#download";
    button.href = navLink.href = href;
    for (const link of [button, navLink]) {
      if (preferred) link.download = preferred.filename;
      else link.removeAttribute("download");
    }
    platformPicker.hidden = !preferred;
    if (preferred) {
      hideChoices();
      button.removeAttribute("aria-controls");
      button.removeAttribute("aria-expanded");
    } else {
      button.setAttribute("aria-controls", choices.id);
      button.setAttribute("aria-expanded", String(!choices.hidden));
    }
  }

  function selectArchitecture(architecture) {
    preferred = downloads.find(download => download.platform === `${platform}-${architecture}`)
      ?? (platform === "macos" ? universal : null);
    updateButton();
  }

  function hideChoices() {
    choices.hidden = true;
    if (!preferred) button.setAttribute("aria-expanded", "false");
  }

  function showChoices() {
    const options = downloads.filter(item => item.platform === "macos-universal" || item.platform.startsWith("windows-"));
    choices.replaceChildren(...options.map(item => {
      const link = document.createElement("a");
      link.href = item.link.href;
      link.download = item.filename;
      link.textContent = item.link.getAttribute("aria-label");
      link.addEventListener("click", () => { hideChoices(); button.focus(); });
      return link;
    }));
    choices.hidden = false;
    button.setAttribute("aria-expanded", "true");
    choices.querySelector("a")?.focus();
  }

  function legacyArchitecture() {
    if (/\b(?:arm64|aarch64)\b/i.test(navigator.userAgent)) return "arm64";
    if (platform === "windows" && /\b(?:Win64|WOW64|x64)\b/i.test(navigator.userAgent)) return "x64";
    return null;
  }

  let recommendation;
  if (platform && hints?.getHighEntropyValues) {
    const detected = Promise.resolve().then(() => hints.getHighEntropyValues(["architecture", "bitness", "wow64"])).then(cpu => {
      if (cpu.architecture === "arm") {
        return cpu.bitness === "64" ? "arm64" : null;
      }
      if (cpu.architecture === "x86") {
        return cpu.bitness === "64" || cpu.wow64 === true ? "x64" : null;
      }
      return legacyArchitecture();
    }).catch(legacyArchitecture);
    let timeout;
    const fallback = new Promise(resolve => {
      timeout = setTimeout(() => resolve(legacyArchitecture()), 1000);
    });
    recommendation = Promise.race([detected, fallback]).then(architecture => {
      clearTimeout(timeout);
      selectArchitecture(architecture);
      recommendation = null;
    });
  }
  selectArchitecture(legacyArchitecture());

  let downloadRequested = false;
  button.addEventListener("click", async event => {
    if (preferred || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (downloadRequested) return;
    if (recommendation) {
      downloadRequested = true;
      await recommendation;
      downloadRequested = false;
      if (preferred) {
        preferred.link.click();
        return;
      }
    }
    if (choices.hidden) showChoices();
    else hideChoices();
  });
  document.addEventListener("pointerdown", event => {
    if (!choices.hidden && !button.contains(event.target) && !choices.contains(event.target)) hideChoices();
  });
  document.addEventListener("keydown", event => {
    if (!choices.hidden && event.key === "Escape") {
      hideChoices();
      button.focus();
    }
  });
  for (const {link, filename} of downloads) link.download = filename;

  const releaseBase = "https://github.com/sctb512/resume-one/releases/download/";
  fetch("https://api.github.com/repos/sctb512/resume-one/releases?per_page=10", {
    credentials: "omit",
    signal: AbortSignal.timeout?.(4000),
  }).then(response => response.ok ? response.json() : []).then(releases => {
    // Only promote a release when every architecture is published. Retain the
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
