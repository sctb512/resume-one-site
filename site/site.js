"use strict";

const root = document.documentElement;
const themeSamples = document.querySelectorAll("[data-theme-sample]");
const themeCaptions = document.querySelectorAll("[data-theme-caption]");
const status = document.querySelector("#preview-status");
const themeColor = document.querySelector('meta[name="theme-color"]');
const themeChoices = [...document.querySelectorAll("[data-theme-choice]")];
const themeNames = { zhibai: "知白", qinghe: "青禾", moxu: "墨序" };
const themeColors = { zhibai: "#f6f3ea", qinghe: "#edf4e9", moxu: "#19282e" };
const themeKey = "resume-one-site-theme";
let selectedTheme = root.dataset.siteTheme;
const themeSample = document.querySelector("#theme-sample");
const motionImage = document.querySelector("#theme-motion-image");
const motionToggle = document.querySelector("#theme-motion-toggle");
const stillImage = motionImage.getAttribute("src");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function showThemeMotion(play) {
  if (play === !motionImage.hidden) return;
  motionImage.src = play ? motionImage.dataset.animation : stillImage;
  motionImage.hidden = !play;
  themeSample.hidden = play;
  motionToggle.setAttribute("aria-expanded", String(play));
  motionToggle.textContent = play ? "返回主题样张" : "播放切换演示";
}

motionToggle.hidden = false;
motionToggle.addEventListener("click", () => showThemeMotion(motionImage.hidden));
reduceMotion.addEventListener("change", ({ matches }) => {
  if (matches) showThemeMotion(false);
});

function showTheme(theme) {
  root.dataset.siteTheme = theme;
  themeColor.content = themeColors[theme];
  for (const sheet of themeSamples) {
    sheet.setAttribute("aria-label", `林清和的示例简历，${themeNames[theme]}主题的 PDF 首页节选`);
  }
  for (const caption of themeCaptions) caption.textContent = themeNames[theme];
}

function syncThemeChoices() {
  for (const button of themeChoices) {
    button.setAttribute("aria-pressed", String(button.dataset.themeChoice === selectedTheme));
  }
}

for (const button of themeChoices) {
  const theme = button.dataset.themeChoice;
  button.addEventListener("pointerenter", event => {
    if (event.pointerType !== "mouse") return;
    showThemeMotion(false);
    showTheme(theme);
  });
  button.addEventListener("pointerleave", event => {
    if (event.pointerType === "mouse") showTheme(selectedTheme);
  });
  button.addEventListener("click", () => {
    selectedTheme = theme;
    syncThemeChoices();
    showThemeMotion(false);
    showTheme(theme);
    status.textContent = `已选择${themeNames[theme]}主题`;
    try {
      localStorage.setItem(themeKey, theme);
    } catch {
      // The choice remains active for the current page.
    }
  });
}
syncThemeChoices();
showTheme(selectedTheme);
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("theme-transitions")));
window.addEventListener("pageshow", () => showTheme(selectedTheme));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && root.dataset.siteTheme !== selectedTheme) showTheme(selectedTheme);
});

const editor = document.querySelector(".demo-window");
const paper = editor.querySelector("#demo-paper");
const jsonView = editor.querySelector("#demo-json");
const source = editor.querySelector("#demo-source");
const highlight = editor.querySelector("#demo-highlight");
const guide = document.querySelector(".demo-guide");
const note = document.querySelector("#demo-guide-note");
const modeButtons = [...editor.querySelectorAll("[data-demo-mode]")];
const steps = [...guide.querySelectorAll("[data-demo-step]")];
const themeRail = editor.querySelector(".demo-theme-rail");
const experience = editor.querySelector("#demo-experience");
const toggle = editor.querySelector("#demo-edit-toggle");
const form = editor.querySelector("#demo-form");
const job = editor.querySelector("#demo-job");
const company = editor.querySelector("#demo-company");
const state = editor.querySelector("#demo-state");
let resume = JSON.parse(source.value);
let pinned = false;

function markActive(buttons, selectedButton) {
  for (const button of buttons) button.setAttribute("aria-pressed", String(button === selectedButton));
}

function displayForm(open) {
  open = open && !state.hasAttribute("data-invalid");
  form.inert = !open;
  toggle.setAttribute("aria-expanded", String(open));
}

function displayMode(mode) {
  const sourceMode = mode === "source";
  editor.dataset.mode = mode;
  markActive(modeButtons, modeButtons.find(button => button.dataset.demoMode === mode));
  themeRail.inert = sourceMode;
  paper.hidden = sourceMode;
  jsonView.hidden = !sourceMode;
  pinned = false;
  displayForm(false);
  if (sourceMode) {
    highlight.scrollTop = source.scrollTop;
    source.focus({ preventScroll: true });
  }
}

function paintSource() {
  const fragment = document.createDocumentFragment();
  const tokens = /"(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  let offset = 0;
  for (const match of source.value.matchAll(tokens)) {
    fragment.append(source.value.slice(offset, match.index));
    const token = document.createElement("span");
    token.className = match[0].startsWith('"')
      ? (match[0].endsWith(":") ? "demo-key" : "demo-string")
      : "demo-literal";
    token.textContent = match[0];
    fragment.append(token);
    offset = match.index + match[0].length;
  }
  fragment.append(source.value.slice(offset), "\n");
  highlight.replaceChildren(fragment);
  highlight.scrollTop = source.scrollTop;
}

function paintPaper() {
  const basics = resume.basics;
  const work = resume.work?.[0];
  const skill = resume.skills?.[0];
  const text = value => typeof value === "string" ? value : "";
  const join = (values, separator) => values.map(text).filter(Boolean).join(separator);
  const fields = {
    ...basics,
    location: join([basics?.location?.city, basics?.location?.countryCode], ", "),
    position: work?.position,
    company: work?.name,
    range: join([work?.startDate, work?.endDate], " – "),
    workSummary: work?.summary,
    skillName: skill?.name,
    skillKeywords: Array.isArray(skill?.keywords) ? join(skill.keywords, " · ") : "",
  };
  for (const field of paper.querySelectorAll("[data-resume-field]")) {
    field.textContent = text(fields[field.dataset.resumeField]);
  }
  job.value = text(fields.position);
  company.value = text(fields.company);
}

function readSource() {
  paintSource();
  try {
    const next = JSON.parse(source.value);
    if (!next || typeof next !== "object" || Array.isArray(next)) throw new Error("Object required");
    resume = next;
    state.removeAttribute("data-invalid");
    toggle.disabled = false;
    state.textContent = "网页演示 · 修改仅保存在本页";
    paintPaper();
  } catch {
    state.dataset.invalid = "";
    toggle.disabled = true;
    displayForm(false);
    state.textContent = "JSON 格式有误 · 保留上一次有效预览";
  }
}

function writeWork(key, value) {
  if (!Array.isArray(resume.work)) resume.work = [];
  if (!resume.work[0] || typeof resume.work[0] !== "object" || Array.isArray(resume.work[0])) resume.work[0] = {};
  resume.work[0][key] = value;
  source.value = JSON.stringify(resume, null, 2);
  readSource();
}

const notes = {
  source: "编辑姓名、职位或机构，再切回预览看变化。桌面版使用 ⌘ / 或 Ctrl /，也支持 JSON Resume Schema 校验。",
  paper: "把鼠标移到工作经历上。表单淡入，移开后回到干净纸面。也可以点击工作经历打开表单。",
  themes: "把鼠标移到知白、青禾或墨序上。移开恢复已选主题，点击后才应用。",
};

for (const button of steps) {
  button.addEventListener("click", () => {
    const step = button.dataset.demoStep;
    markActive(steps, button);
    note.textContent = notes[step];
    displayMode(step === "source" ? "source" : "paper");
    if (step === "paper") {
      pinned = true;
      displayForm(true);
    }
    if (step === "themes") {
      themeRail.querySelector('[aria-pressed="true"]').focus({ preventScroll: true });
    }
  });
}
for (const button of modeButtons) {
  button.addEventListener("click", () => {
    const mode = button.dataset.demoMode;
    const step = mode === "source" ? "source" : "paper";
    markActive(steps, steps.find(choice => choice.dataset.demoStep === step));
    note.textContent = notes[step];
    displayMode(mode);
  });
}
experience.addEventListener("pointerenter", event => {
  if (event.pointerType === "mouse") displayForm(true);
});
experience.addEventListener("pointerleave", event => {
  if (event.pointerType === "mouse") {
    pinned = false;
    if (!form.contains(document.activeElement)) displayForm(false);
  }
});
form.addEventListener("focusout", event => {
  if (!form.contains(event.relatedTarget) && !experience.matches(":hover") && !pinned) displayForm(false);
});
toggle.addEventListener("click", () => {
  pinned = !pinned;
  displayForm(pinned);
});
editor.addEventListener("keydown", event => {
  if ((event.metaKey || event.ctrlKey) && event.key === "/") {
    event.preventDefault();
    const to = editor.dataset.mode === "source" ? "paper" : "source";
    const button = modeButtons.find(choice => choice.dataset.demoMode === to);
    button.click();
    if (to === "paper") button.focus({ preventScroll: true });
  } else if (event.key === "Escape" && !form.inert) {
    pinned = false;
    displayForm(false);
    toggle.focus({ preventScroll: true });
  }
});
job.addEventListener("input", () => writeWork("position", job.value));
company.addEventListener("input", () => writeWork("name", company.value));
source.addEventListener("input", readSource);
source.addEventListener("scroll", () => { highlight.scrollTop = source.scrollTop; });
readSource();

const masthead = document.querySelector(".masthead");
const progressBar = masthead.querySelector(".reading-progress");
const chapters = [...masthead.querySelectorAll('nav a[href^="#"], #nav-download')].map(link => ({
  link,
  section: document.querySelector(link.id === "nav-download" ? "#download" : link.hash),
}));
let activeChapter;
let scrollFrame = 0;

function updateChapter() {
  scrollFrame = 0;
  const headerHeight = masthead.offsetHeight;
  const threshold = Math.max(headerHeight + 48, Math.min(window.innerHeight * 0.3, headerHeight + 180));
  const distance = root.scrollHeight - root.clientHeight;
  let nextChapter;
  for (const { link, section } of chapters) {
    if (section.getBoundingClientRect().top <= threshold) nextChapter = link;
  }
  if (distance > 0 && distance - window.scrollY < 8) nextChapter = chapters.at(-1).link;
  if (nextChapter !== activeChapter) {
    activeChapter?.removeAttribute("aria-current");
    nextChapter?.setAttribute("aria-current", "location");
    activeChapter = nextChapter;
  }
  const fraction = distance > 0 ? window.scrollY / distance : 0;
  progressBar.style.transform = `scaleX(${Math.max(0, Math.min(1, fraction))})`;
}

function scheduleChapterUpdate() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateChapter);
}

window.addEventListener("scroll", scheduleChapterUpdate, { passive: true });
window.addEventListener("resize", scheduleChapterUpdate);
window.addEventListener("pageshow", scheduleChapterUpdate);
scheduleChapterUpdate();

if ("IntersectionObserver" in window && !reduceMotion.matches) {
  const reveal = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      target.classList.add("revealed");
      reveal.unobserve(target);
    }
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.03 });
  for (const block of document.querySelectorAll("[data-reveal]")) reveal.observe(block);
}
