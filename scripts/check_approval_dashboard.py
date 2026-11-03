#!/usr/bin/env python3
"""Offline structural check of the static approval dashboard."""
from html.parser import HTMLParser
from pathlib import Path
import subprocess
import tempfile

class Scripts(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_script = False
        self.scripts = []
    def handle_starttag(self, tag, attrs):
        if tag == "script":
            self.in_script = True
            self.scripts.append("")
    def handle_endtag(self, tag):
        if tag == "script":
            self.in_script = False
    def handle_data(self, data):
        if self.in_script:
            self.scripts[-1] += data

html = Path("docs/approval-dashboard/index.html").read_text(encoding="utf-8")
parser = Scripts()
parser.feed(html)
assert len(parser.scripts) == 1, "Exactly one inline script expected"
assert "https://api.github.com/" in html
assert "noopener noreferrer" in html
assert "localStorage" not in html and "access_token" not in html
assert "fetchRepo" in parser.scripts[0]
with tempfile.TemporaryDirectory() as directory:
    path = Path(directory) / "dashboard.js"
    path.write_text(parser.scripts[0], encoding="utf-8")
    subprocess.run(["node", "--check", str(path)], check=True)
print("Dashboard structure and JavaScript syntax OK")
