#!/usr/bin/env python3
"""Vercel Ignored Build Step: exit 0 to skip; exit 1 to build.

Never skip when prior deployment cannot be established or changes are unknown.
"""
import os
import subprocess

MANAGEMENT_FILES = {
    ".github/workflows/development-inventory.yml",
    ".github/workflows/pr-promotion-review.yml",
    ".github/workflows/ledger-facts-proposal.yml",
    "docs/DEVELOPMENT_LEDGER.md",
    "docs/DEVELOPMENT_OPERATIONS_INDEX.md",
    "docs/PR_PROMOTION_POLICY.md",
    "scripts/development_inventory.py",
    "scripts/development_inventory_delta.py",
    "scripts/development_ledger_proposal.py",
    "scripts/verify_ledger_proposal.py",
    "scripts/pr_promotion_policy.py",
    "scripts/pr_promotion_review.py",
    "scripts/pr_review_handoff.py",
    "scripts/pr_approval_routing.py",
    "tests/test_development_inventory.py",
    "tests/test_development_inventory_delta.py",
    "tests/test_development_ledger_proposal.py",
    "tests/test_inventory_delta_string_details.py",
    "tests/test_pr_promotion_policy.py",
    "tests/test_pr_promotion_review.py",
    "tests/test_pr_review_handoff.py",
    "tests/test_pr_approval_routing.py",
}

def may_skip(previous, git=subprocess.run):
    if not previous or len(previous) != 40 or any(ch not in "0123456789abcdefABCDEF" for ch in previous):
        return False
    try:
        result = git(["git", "diff", "--name-only", "--no-renames", previous, "HEAD", "--"],
                     capture_output=True, text=True, timeout=20, check=False)
    except (OSError, subprocess.TimeoutExpired):
        return False
    if result.returncode:
        return False
    paths = result.stdout.splitlines()
    return bool(paths) and all(path in MANAGEMENT_FILES for path in paths)

if __name__ == "__main__":
    if may_skip(os.environ.get("VERCEL_GIT_PREVIOUS_SHA")):
        print("Skip build: verified management-only change.")
        raise SystemExit(0)
    print("Run build: application/unknown change or missing baseline.")
    raise SystemExit(1)
