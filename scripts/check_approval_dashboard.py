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
assert html.count("<script>") == 1 and html.count("</script>") == 1, "Script tags must be balanced and unique"
assert html.rstrip().endswith("</script></body></html>"), "No content may leak after the closing HTML"
assert "https://api.github.com/" in html
assert "noopener noreferrer" in html
assert "localStorage" not in html and "access_token" not in html
assert "fetchRepo" in parser.scripts[0]
assert "owner-decision" in html and "needs-owner-decision" in html
assert 'data-view="untriaged"' in html
assert "判断してほしいこと" in html and "推奨と理由" in html
assert "needsDecision(p)" in parser.scripts[0]
assert "p.body||''" in parser.scripts[0]
assert "eval(" not in parser.scripts[0]
with tempfile.TemporaryDirectory() as directory:
    path = Path(directory) / "dashboard.js"
    path.write_text(parser.scripts[0], encoding="utf-8")
    subprocess.run(["node", "--check", str(path)], check=True)
    # Run pure decision helpers against representative owner-approval PRs.
    js = parser.scripts[0]
    start = js.index("  const decisionLabels=")
    end = js.index("  const status=byId(", start)
    helpers = js[start:end]
    smoke = r"""
const assert = require("node:assert/strict");
assert.equal(needsDecision({labels:["owner-decision"]}), true);
assert.equal(needsDecision({labels:["routine-maintenance"]}), false);
assert.equal(needsDecision({labels:[]}), false);
const body = ["### 変更概要","会話の表示を変更","### 判断してほしいこと","AかB","### 推奨と理由","Aが安全"].join(String.fromCharCode(10));
const facts = decisionFacts({body});
assert.equal(facts.summary, "会話の表示を変更");
assert.equal(facts.question, "AかB");
assert.equal(facts.recommendation, "Aが安全");
assert.equal(decisionFacts({body:""}).question, "");
"""
    path.write_text(helpers + chr(10) + smoke, encoding="utf-8")
    subprocess.run(["node", str(path)], check=True)
# The optional merge screen must also be self-contained and never leak source.
merge_file = Path("docs/approval-dashboard/merge.html")
if merge_file.exists():
    merge_html = merge_file.read_text(encoding="utf-8")
    assert merge_html.count("<script>") == 1 and merge_html.count("</script>") == 1
    assert merge_html.rstrip().endswith("</script></main></body></html>")
    assert "owner-merge-pkce-verifier" in merge_html
    assert "APPROVAL_GITHUB_TOKEN" not in merge_html
    assert "localStorage" not in merge_html
    parsed = Scripts()
    parsed.feed(merge_html)
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "owner-merge.js"
        path.write_text(parsed.scripts[0], encoding="utf-8")
        subprocess.run(["node", "--check", str(path)], check=True)
    config = Path("docs/approval-dashboard/merge-config.json").read_text(encoding="utf-8")
    assert '"enabled": false' in config, "Direct merge must remain disabled until verified"
print("Dashboard structure and JavaScript syntax OK")
