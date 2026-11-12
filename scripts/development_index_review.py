#!/usr/bin/env python3
"""Generate review-only main index proposal from inventory facts."""
import json
import re
from pathlib import Path

INDEX = Path("docs/DEVELOPMENT_OPERATIONS_INDEX.md")
REPORT = Path("inventory-output/report.json")
OUTPUT = Path("inventory-output/index-review.md")

def render(index, report):
    snap = report.get("snapshot")
    if not isinstance(snap, dict):
        raise ValueError("Missing snapshot")
    branches = snap.get("branches")
    prs = snap.get("prs")
    issues = snap.get("issues")
    if not all(isinstance(x, dict) for x in (branches, prs, issues)):
        raise ValueError("Incomplete snapshot")
    cases = re.findall(r"^\| ([MA]-[0-9]+) \|", index, flags=re.M)
    if not cases:
        raise ValueError("No canonical cases")
    candidates = report.get("review_candidates")
    if not isinstance(candidates, list):
        raise ValueError("Missing branch candidates")
    lines = ["# Main index reconciliation proposal (review only)", "",
             "This is a proposal, not an edit to the canonical index.",
             "Branch presence is not evidence of missing implementation.", "",
             "## Snapshot", "",
             f"- Existing case IDs: {len(cases)}",
             f"- Branches including main: {len(branches)}",
             f"- Historical PRs: {len(prs)}",
             f"- Open issues: {len(issues)}", "",
             "## Branches requiring manual comparison with main and ledger", "",
             "| Branch | Head SHA | Historical PR |",
             "|---|---|---|"]
    for item in sorted(candidates, key=lambda x: str(x.get("name", ""))):
        name = item.get("name")
        if not isinstance(name, str) or name not in branches:
            raise ValueError("Candidate not in snapshot")
        safe_name = name.replace("|", "&#124;").replace("\n", " ")
        sha = branches[name]
        if not isinstance(sha, str):
            raise ValueError("Missing branch SHA")
        lines.append(f"| `{safe_name}` | `{sha[:12]}` | {bool(item.get('historical_pr_found'))} |")
    lines += ["", "## Review rules", "",
              "Compare changes against main, merged/closed PRs and the ledger before updating case IDs.",
              "Do not infer completion, deployment, deletion eligibility or duplicate implementations.",
              "Update only changed cases through a separate human-reviewed PR.", ""]
    return "\n".join(lines)

def main():
    index = INDEX.read_text(encoding="utf-8")
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    proposal = render(index, report)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(proposal, encoding="utf-8")

if __name__ == "__main__":
    main()
