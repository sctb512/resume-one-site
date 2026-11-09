"""Build the theme walkthrough from the site's three real resume exports."""
import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ASSETS = Path(__file__).resolve().parents[1] / "site/assets"
SIZE = (960, 574)
THEMES = (
    ("zhibai", "知白", "无饰留白", "#f4f3ed", "#485851"),
    ("qinghe", "青禾", "青绿色强调线", "#e7ede3", "#40674f"),
    ("moxu", "墨序", "分栏页眉", "#e2e8e7", "#425863"),
)
POINTER = ((0, 0), (1, 29), (9, 21), (17, 34), (22, 31), (15, 18), (27, 18))


def render_assets(fonts):
    sans = ImageFont.truetype(str(fonts / "NotoSansSC-Regular.ttf"), 17)
    small = ImageFont.truetype(str(fonts / "NotoSansSC-Regular.ttf"), 13)
    serif = ImageFont.truetype(str(fonts / "NotoSerifSC-SemiBold.ttf"), 21)
    sheets = []
    for file, *_ in THEMES:
        with Image.open(ASSETS / f"{file}.webp") as raw:
            sheets.append(raw.convert("RGB").resize((622, 492), Image.Resampling.LANCZOS))

    def canvas(applied, hovered):
        shown = applied if hovered is None else hovered
        _, name, _, paper, ink = THEMES[shown]
        image = Image.new("RGB", SIZE, paper)
        draw = ImageDraw.Draw(image)
        draw.rectangle((0, 0, 960, 42), fill="#fbfaf6")
        draw.line((0, 42, 960, 42), fill="#d5d5ca")
        draw.rounded_rectangle((17, 11, 38, 32), 4, fill="#9d4638")
        draw.text((27, 21), "简", "#fff9f0", font=small, anchor="mm")
        draw.text((49, 21), "Resume One · 简里", "#23332b", font=sans, anchor="lm")
        draw.text((939, 21), "林清和.resume.json", "#555f55", font=small, anchor="rm")
        draw.rectangle((0, 43, 217, 574), fill="#fbfaf6")
        draw.line((217, 43, 217, 574), fill="#d5d5ca")
        draw.text((17, 67), "主题", "#23332b", font=serif)
        for index, (file, title, description, _, tint) in enumerate(THEMES):
            y = 117 + index * 124
            if index in (applied, hovered):
                draw.rounded_rectangle((10, y - 7, 204, y + 95), 8, fill="#edf0e8", outline="#c6d2c3")
            if index == applied:
                draw.rounded_rectangle((10, y + 5, 13, y + 83), 1, fill=tint)
            thumb = sheets[index].resize((64, 51), Image.Resampling.LANCZOS)
            draw.rectangle((22, y + 6, 86, y + 79), fill="white", outline="#d4d7cf")
            image.paste(thumb, (23, y + 7))
            draw.text((100, y + 11), title, tint, font=serif)
            draw.text((100, y + 49), description, "#4b594e", font=small)
            if index == applied:
                draw.text((183, y + 11), "✓", tint, font=sans)
        draw.rectangle((267, 59, 893, 552), fill="#d2d8cd")
        image.paste(sheets[shown], (269, 60))
        draw.text((935, 560), f"{'正在试穿' if hovered is not None and hovered != applied else '当前主题'} · {name}",
                  ink, font=small, anchor="rm")
        return image

    base_frames = {(a, h): canvas(a, h) for a in range(3) for h in (None, 0, 1, 2)}
    base_frames[0, None].save(ASSETS / "theme-switch-poster.webp", quality=87)
    frames, durations = [], []

    def frame(applied, hover, point, duration, ring=0):
        image = base_frames[applied, hover].copy()
        if point:
            x, y = point
            draw = ImageDraw.Draw(image)
            if ring:
                draw.ellipse((x - ring, y - ring, x + ring, y + ring), outline="#aa4d3c", width=2)
            draw.polygon([(x + dx, y + dy) for dx, dy in POINTER], fill="#182622", outline="#fffdf5", width=2)
        frames.append(image.quantize(colors=96, method=Image.Quantize.MEDIANCUT))
        durations.append(duration)

    def move(applied, start, end, hover=None):
        for index in range(1, 7):
            progress = 0.5 - 0.5 * math.cos(math.pi * index / 6)
            point = tuple(round(a + (b - a) * progress) for a, b in zip(start, end))
            frame(applied, hover if index == 6 else None, point, 45)

    outside, second, third, first = (230, 455), (133, 276), (133, 400), (133, 152)
    frame(0, None, outside, 550)
    move(0, outside, second, 1)
    frame(0, 1, second, 830)
    move(0, second, outside)
    frame(0, None, outside, 440)
    move(0, outside, third, 2)
    frame(0, 2, third, 550)
    for size in (9, 15, 22):
        frame(2, 2, third, 60, size)
    move(2, third, outside)
    frame(2, None, outside, 830)
    move(2, outside, first, 0)
    for size in (9, 15, 22):
        frame(0, 0, first, 60, size)
    move(0, first, outside)
    frames[0].save(ASSETS / "theme-switch.gif", save_all=True, append_images=frames[1:],
                   duration=durations, loop=0, optimize=True, disposal=1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("fonts", type=Path, help="The application repository's assets/fonts directory")
    render_assets(parser.parse_args().fonts)
