"""Validate local page references and copy the static site for GitHub Pages."""

import argparse
from html.parser import HTMLParser
from pathlib import Path
import re
import shutil
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "site"


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []
        self.themes = []
        self.headings = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if identifier := attrs.get("id"):
            if identifier in self.ids:
                raise ValueError(f"Duplicate page id {identifier}")
            self.ids.add(identifier)
        if tag == "h1":
            self.headings += 1
        if tag == "img" and not attrs.get("alt"):
            raise ValueError("The sample needs meaningful alternative text")
        for attribute in ("href", "src"):
            if url := attrs.get(attribute):
                self.links.append(url)
        if tag == "button" and (theme := attrs.get("data-theme")):
            self.themes.append(theme)


def check():
    page = Page()
    page.feed((SOURCE / "index.html").read_text(encoding="utf-8"))
    if page.headings != 1:
        raise ValueError("Expected a single homepage heading")
    css = (SOURCE / "site.css").read_text(encoding="utf-8")
    page.links.extend(re.findall(r'url\("([^"]+)"\)', css))
    page.links.extend(f"assets/{theme}.webp" for theme in page.themes)
    for reference in page.links:
        url = urlsplit(reference)
        if url.netloc:
            if url.scheme != "https" or url.hostname != "github.com":
                raise ValueError(f"Unexpected external link: {reference}")
            continue
        if url.fragment and url.fragment not in page.ids:
            raise ValueError(f"Missing anchor: {reference}")
        if not url.path or url.path == "./":
            continue
        target = (SOURCE / url.path).resolve()
        if not target.is_relative_to(SOURCE) or not target.is_file():
            raise ValueError(f"Missing or invalid local asset: {reference}")
    print(f"Validated the homepage, {len(page.themes)} sample themes and {len(page.links)} references.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, help="Copy the validated site to a new directory.")
    args = parser.parse_args()
    check()
    if args.out:
        shutil.copytree(SOURCE, args.out)


if __name__ == "__main__":
    main()
