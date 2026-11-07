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
