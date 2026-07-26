from pathlib import Path
from html.parser import HTMLParser
import json, sys

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / "index.html"

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
        self.ids = set()
        self.hashes = []
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if "id" in values:
            self.ids.add(values["id"])
        for key in ("href", "src"):
            value = values.get(key)
            if not value:
                continue
            if value.startswith("#"):
                self.hashes.append(value[1:])
            elif not value.startswith(("http://", "https://", "mailto:", "tel:", "data:", "javascript:")):
                self.refs.append(value.split("#", 1)[0].split("?", 1)[0])

if not INDEX.exists():
    raise SystemExit("portfolio/index.html ausente")

parser = Parser()
parser.feed(INDEX.read_text(encoding="utf-8"))

missing = []
for ref in parser.refs:
    if not ref:
        continue
    candidate = (ROOT / ref).resolve()
    if not candidate.exists():
        missing.append(ref)

bad_hashes = sorted({anchor for anchor in parser.hashes if anchor and anchor not in parser.ids})
if missing:
    raise SystemExit(f"Referências locais ausentes: {sorted(set(missing))}")
if bad_hashes:
    raise SystemExit(f"Âncoras inexistentes: {bad_hashes}")

json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
required = ["assets/styles.css", "assets/app.js", "assets/favicon.svg", "assets/og-orderflow.png", "404.html", ".nojekyll"]
for item in required:
    if not (ROOT / item).exists():
        raise SystemExit(f"Arquivo obrigatório ausente: {item}")

print("Portfolio validation: OK")
