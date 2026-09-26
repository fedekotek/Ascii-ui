# Contributing (to yourself, mostly)

## Workflow
1. Edit `index.html`, `css/*.css`, `js/*.js`. Serve with `python3 -m http.server 8000`.
2. Before a commit: `python3 qa/qa.py 390 844 dark m x` and `python3 qa/qa.py 1440 900 light d x` must print empty lists. `python3 qa/audit.py` prints, per view, the tap targets under 40px (`small`) and the text under 12px (`tiny`); both should be empty, and a native `select` is the only thing allowed to show up as small.
3. `python3 build.py`, open `dist/ascii-ui.html` from `file://` and click through once. It goes into `site/` with `kit/`, and that is what ships.
4. Commit the build output with the change. Vercel serves `site/` (see `vercel.json`) and deploys `main` on every push, to https://ascii.fedekotek.design.

## Style
- Vanilla, no transpile. ES2019 is fine (optional chaining is not used today; it would be fine).
- Files are one IIFE each with a banner comment per feature (`/* ---- name ---- */` in the engine, `/* ================= name ================= */` elsewhere). Keep it.
- Comments explain intent in one line, dry voice. No em dashes, no emojis, anywhere.
- CSS: one rule per line where the rule is short; tokens only; no magic pixels except the 12px/-12px hit-area pattern and the 2px aberration shadow.
- Copy: sentence case, uppercase only in slabs, captions are one sentence that names the trick.

## Adding things
See the recipes at the end of `docs/COMPONENTS.md`, `docs/BLOCKS.md`, `docs/CHARTS.md`. For a new effect, add a section to `docs/EFFECTS.md` at the same time.

## Versioning
Bump the version in `js/20` boot log (`ASCII/UI BIOS v0.9`) and add a line to `docs/CHANGELOG.md`. `archive/` holds the single files for v2 to v9.3 and stops there: from v10 the history is in git, so do not add to it.
