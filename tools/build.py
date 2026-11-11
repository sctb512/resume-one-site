"""Validate local page references and copy the static site for GitHub Pages."""

import argparse
import json
from hashlib import sha256
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
        self.themes = set()
        self.headings = 0
        self.resume = ""
        self.in_source = False
        self.source = ""

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html":
            self.resume = attrs.get("data-resume", "")
        if tag == "textarea" and attrs.get("id") == "demo-source":
            self.in_source = True
        if identifier := attrs.get("id"):
            if identifier in self.ids:
                raise ValueError(f"Duplicate page id {identifier}")
            self.ids.add(identifier)
        if tag == "h1":
            self.headings += 1
        if tag == "img" and not attrs.get("alt") and attrs.get("aria-hidden") != "true":
            raise ValueError("The sample needs meaningful alternative text")
        for attribute in ("href", "src", "data-animation"):
            if url := attrs.get(attribute):
                self.links.append(url)
        if tag == "button" and (theme := attrs.get("data-theme-choice")):
            self.themes.add(theme)

    def handle_endtag(self, tag):
        if tag == "textarea":
            self.in_source = False

    def handle_data(self, data):
        if self.in_source:
            self.source += data


PAGES = ("index.html", "en.html")


def check(filename):
    page = Page()
    page.feed((SOURCE / filename).read_text(encoding="utf-8"))
    if json.loads(page.source) != json.loads((SOURCE / page.resume).read_text(encoding="utf-8")):
        raise ValueError(f"The inline demo in {filename} differs from its localized JSON fixture")
    if page.headings != 1:
        raise ValueError("Expected a single homepage heading")
    css = (SOURCE / "site.css").read_text(encoding="utf-8")
    page.links.extend(re.findall(r'url\("([^"]+)"\)', css))
    page.links.append(page.resume)
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
    print(f"Validated {filename}, {len(page.themes)} sample themes and {len(page.links)} references.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, help="Copy the validated site to a new directory.")
    args = parser.parse_args()
    for filename in PAGES:
        check(filename)
    if args.out:
        shutil.copytree(SOURCE, args.out)
        # Pages can serve fresh HTML alongside cached assets during a deploy.
        # Change each asset URL whenever its contents change.
        for filename in PAGES:
            index = args.out / filename
            page = index.read_text(encoding="utf-8")
            for attribute, name in (("href", "site.css"), ("src", "language.js"), ("src", "download.js"), ("src", "site.js")):
                version = sha256((SOURCE / name).read_bytes()).hexdigest()[:12]
                page = page.replace(f'{attribute}="{name}"', f'{attribute}="{name}?v={version}"')
            index.write_text(page, encoding="utf-8")


if __name__ == "__main__":
    main()
