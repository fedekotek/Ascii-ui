# Contributing

Issues and pull requests are welcome at https://github.com/fedekotek/Ascii-ui. For a bug, say the browser, the window width, the theme and the address (`#components/button`); a screenshot helps. For a change, keep it small and run the release bar (below) before you open the pull request: it must end with `release: ok`. The rules that are not negotiable (no dependencies, no outside requests, no em dashes, cyan is focus only, everything on the character grid) are in `CLAUDE.md`, and they apply to people too.

The rest of this page is the maintainer's workflow.

## Workflow
1. Edit `index.html`, `css/*.css`, `js/*.js`. Serve with `python3 -m http.server 8000`.
2. While you work: `python3 qa/qa.py 390 844 dark m x` and `python3 qa/qa.py 1440 900 light d x` must print empty lists. `python3 qa/audit.py` prints, per view, the tap targets under 40px (`small`) and the text under 12px (`tiny`); both should be empty, and a native `select` is the only thing allowed to show up as small.
3. `python3 build.py`, open `dist/ascii-ui.html` from `file://` and click through once. It goes into `site/` with `kit/`, and that is what ships.
4. Before a commit: `sh qa/release.sh`, the whole release bar in order. It must end with `release: ok`.
5. Commit the build output with the change. Vercel serves `site/` (see `vercel.json`) and deploys `main` on every push, to https://ascii.fedekotek.design.

## Style
- Vanilla, no transpile. ES2019 is fine (optional chaining is not used today; it would be fine).
- Files are one IIFE each with a banner comment per feature (`/* ---- name ---- */` in the engine, `/* ================= name ================= */` elsewhere). Keep it.
- Comments explain intent in one line, dry voice. No em dashes, no emojis, anywhere.
- CSS: one rule per line where the rule is short; tokens only; no magic pixels except the 12px/-12px hit-area pattern. Slabs have no colored edge shadows any more.
- Copy: sentence case, uppercase only in slabs, captions are one sentence that names the trick.

## Adding things
See the recipes in `docs/COMPONENTS.md` (a checklist: site, kit, docs), `docs/BLOCKS.md`, `docs/CHARTS.md`. To change the palette, `docs/ARCHITECTURE.md`, Rebrand. For a new effect, add a section to `docs/EFFECTS.md` at the same time.

## Versioning
Two numbers. The site's is `<meta name="aui-version">` in `index.html`, and the footer line (`#footLine`) must say the same (`v11.5` today): `build.py` refuses to build when they disagree. Bump both and add a line to `docs/CHANGELOG.md`. The kit's is `ASCIIUI.version` in `kit/ascii-ui.js`, semver, with its own changelog; how and when to bump it is in `kit/README.md`. The `ASCII/UI BIOS v0.9` line in the boot log is a joke, not a version. The history is in git. When the kit version changes, `python3 qa/sri.py` writes the new `integrity` hashes into the pinned links in `README.md` and `kit/README.md`.
