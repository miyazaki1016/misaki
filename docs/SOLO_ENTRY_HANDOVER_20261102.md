# Solo entry handover — 2026-11-02 JST

## Baseline and scope
- GitHub main: `4fb0e34fb534b269382d41b8ed99c13dcf7d56df`.
- Vercel latest production: `dpl_4VUQmnaZheiS23b8zCtoUQgwkwiZ`, READY, same Git SHA. Domain alias HTTP/content and live conversation were not revalidated in this run.
- Read main overview, ledger, operations index, lounge source and open PR states. PR #101 remains Draft/unmerged.
- Local `7f42677` exists and was inspected: it opens movie BEFORE lounge, so not copied wholesale. `90da64f` package exists as ZIP: synthetic static chat, not the existing live chat; not installed as product code.

## Proposed change
- Six LP CTAs now point to `/lounge/`.
- New single-Misaki lounge reuses the existing shortcut-lounge layout, embedded SVG background, Muse loop WebP, avatar and vertical 21-second MP4. No asset bytes added or changed.
- Selecting Misaki opens movie; ended/skip opens existing `/chat`. Autoplay/error leaves manual play/skip available. Escape closes movie back to lounge.
- Optional `misaki-opening-completed-v1` UI-only localStorage flag exposes chat shortcut and bypasses movie after completion/skip. This does NOT prove a conversation occurred, store conversation data, control auth or extend memory expiry. Storage failure still permits entry.
- pagehide pauses media; pageshow resets navigation/dialog, including BFCache return. Other app storage is untouched.
- No changes to chat, auth, API, DB, memory, personality/emotion/relationship, Push, service worker, manifest, env, workflows or PR #101. Future character boundary: `data-character-id="misaki"`; no second character.

## Verification
- Actual shipped navigation JS executed in DOM/media doubles: 10/10 tests pass, including first visit, revisit, ended, skip, storage denial, autoplay denial, cancel, error, back/pageshow, asset/LP links.
- `node --check public/lounge/entry.js`: pass.
- `npx tsc --noEmit`: pass.
- `npm run build`: pass (no runtime credentials configured or API calls made).
- Browser harness prepared but local Chromium launch failed: environment socket()/ptrace restrictions; WebKit binary absent. No browser/layout/screenshot/iPhone Safari or real conversation claim.

## Before production
1. Review this limited diff; do not merge unrelated branches or the static synthetic chat package.
2. Verify Preview config separation before opening /chat. Use existing production-safe testing policy for real conversation; do not create a new model credential or paid contract.
3. iPhone Safari: LP CTA -> lounge -> tap -> full-window video -> ended and skip -> existing chat -> send/receive; revisit shortcut; Back/BFCache; background/return; denied autoplay; short landscape viewport.
4. Recheck main and production SHA at release. Main is Vercel production-connected, so merge itself can trigger deployment; do NOT merge before the pre-deployment report is reviewed.
5. Rollback only this entry diff to prior main; no DB/memory rollback required. Existing direct /chat, PWA and notification entry remain available.

Production deployment and merge not performed. Live conversation and iPhone acceptance remain outstanding.
