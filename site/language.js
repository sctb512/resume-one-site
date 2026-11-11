"use strict";

(() => {
  const key = "resume-one-site-language";
  const current = document.documentElement.lang;
  const supported = new Set(["auto", "zh-CN", "en"]);
  const isSupported = (value) => value === "zh-CN" || value === "en";
  let preference = "auto";
  try {
    const saved = localStorage.getItem(key);
    if (supported.has(saved)) preference = saved;
  } catch {
    // Language choices can still be carried in the URL.
  }

  const explicit = new URL(location.href).searchParams.get("lang");
  const browserLanguage = () => {
    for (const tag of navigator.languages?.length ? navigator.languages : [navigator.language]) {
      const base = tag?.toLowerCase().split("-")[0];
      if (base === "zh") return "zh-CN";
      if (base === "en") return "en";
    }
    return "en";
  };
  const go = (language, replace, pin = false) => {
    const currentUrl = new URL(location.href);
    const next = new URL(language === "en" ? "en.html" : "./", currentUrl);
    next.search = currentUrl.search;
    if (pin) next.searchParams.set("lang", language);
    else next.searchParams.delete("lang");
    next.hash = currentUrl.hash;
    if (next.href !== currentUrl.href) {
      if (replace) location.replace(next);
      else location.assign(next);
    }
  };

  // The English URL can be shared directly. Only the entry page negotiates
  // the browser locale when a visitor has never chosen a language.
  const initial = isSupported(explicit) ? explicit
    : preference !== "auto" ? preference
    : current === "en" ? "en" : browserLanguage();
  if (current !== initial) go(initial, true, isSupported(explicit));

  document.addEventListener("DOMContentLoaded", () => {
    const pickers = [...document.querySelectorAll("[data-language-picker]")];
    const syncPickers = value => {
      for (const picker of pickers) picker.value = value;
    };
    syncPickers(isSupported(explicit) ? explicit : preference);
    for (const picker of pickers) {
      picker.addEventListener("change", () => {
        preference = picker.value;
        syncPickers(preference);
        let saved = false;
        try {
          localStorage.setItem(key, preference);
          saved = true;
        } catch {}
        go(preference === "auto" ? browserLanguage() : preference, false, !saved);
      });
    }
  });
})();
