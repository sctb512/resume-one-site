"use strict";

const preview = document.querySelector(".preview-window");
const sheet = document.querySelector("#preview-sheet");
const caption = document.querySelector("#preview-theme");
const status = document.querySelector("#preview-status");
const choices = [...document.querySelectorAll(".theme-options button")];
let selected = choices[0];

function show(choice) {
  const theme = choice.dataset.theme;
  const name = choice.textContent.trim();
  preview.dataset.theme = theme;
  sheet.src = `assets/${theme}.webp`;
  sheet.alt = `林清和的示例简历，${name}主题的 PDF 首页节选`;
  caption.textContent = name;
}

for (const choice of choices) {
  const preload = new Image();
  preload.src = `assets/${choice.dataset.theme}.webp`;
  choice.addEventListener("click", () => {
    selected = choice;
    for (const button of choices) button.setAttribute("aria-pressed", String(button === selected));
    show(selected);
    status.textContent = `已选择${selected.textContent.trim()}主题`;
  });
  choice.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") show(choice);
  });
  choice.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") show(selected);
  });
}

const editor = document.querySelector(".demo-window");
const paper = editor.querySelector("#demo-paper");
const jsonView = editor.querySelector("#demo-json");
const source = editor.querySelector("#demo-source");
const highlight = editor.querySelector("#demo-highlight");
const guide = document.querySelector(".demo-guide");
const note = document.querySelector("#demo-guide-note");
const modeButtons = [...editor.querySelectorAll("[data-demo-mode]")];
const steps = [...guide.querySelectorAll("[data-demo-step]")];
const themes = [...editor.querySelectorAll("[data-demo-theme]")];
const themeRail = editor.querySelector(".demo-theme-rail");
const experience = editor.querySelector("#demo-experience");
const toggle = editor.querySelector("#demo-edit-toggle");
const form = editor.querySelector("#demo-form");
const job = editor.querySelector("#demo-job");
const company = editor.querySelector("#demo-company");
const state = editor.querySelector("#demo-state");
let resume = JSON.parse(source.value);
let selectedTheme = themes[0];
let pinned = false;

function markActive(buttons, selectedButton) {
  for (const button of buttons) button.setAttribute("aria-pressed", String(button === selectedButton));
}

function displayForm(open) {
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
  const work = resume.work?.[0];
  const fields = { ...resume.basics, position: work?.position, company: work?.name };
  const text = value => typeof value === "string" ? value : "";
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
    state.textContent = "网页演示 · 修改仅保存在本页";
    paintPaper();
  } catch {
    state.dataset.invalid = "";
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
  themes: "把鼠标移到纸白、青禾或墨序上。移开恢复已选主题，点击后才应用。",
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
    if (step === "themes") selectedTheme.focus({ preventScroll: true });
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
for (const button of themes) {
  button.addEventListener("pointerenter", event => {
    if (event.pointerType === "mouse") editor.dataset.theme = button.dataset.demoTheme;
  });
  button.addEventListener("pointerleave", event => {
    if (event.pointerType === "mouse") editor.dataset.theme = selectedTheme.dataset.demoTheme;
  });
  button.addEventListener("click", () => {
    selectedTheme = button;
    markActive(themes, button);
    editor.dataset.theme = button.dataset.demoTheme;
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
