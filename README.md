# ascii/ui

shadcn-style components with a brutalist ASCII skin and a bad signal. The kit is two files (`kit/ascii-ui.css` and `kit/ascii-ui.js`), no dependencies, no build step. The whole site also ships as one HTML file. Frames, fills and shadows are strings of characters; weight comes from how dense the character is; every state change glitches a little; underneath it is plain HTML.

Live: https://ascii.fedekotek.design (Vercel deploys `main` on every push). The single-file build is `dist/ascii-ui.html`.

## How to use it

1. Link the two kit files in the `<head>` of your page. Pinned to 1.2.1, so they never change under you:

   ```html
   <link rel="stylesheet" href="https://ascii.fedekotek.design/kit/1.2.1/ascii-ui.css" integrity="sha384-ZHTaaRXXL6BInLsx2TDMfJR25fXH4INZ9qqjTzACeCdYwcxaZ7m3Uc7YDv8KjTi6" crossorigin="anonymous">
   <script defer src="https://ascii.fedekotek.design/kit/1.2.1/ascii-ui.js" integrity="sha384-fUykAdiWa73RXAYsHWycOPsd3p9xB0keaQNLd19TQbM7r5bRrYGAhwH+aEHxfkqb" crossorigin="anonymous"></script>
   ```

   Or the latest, which moves with every version: `https://ascii.fedekotek.design/kit/ascii-ui.css` and `https://ascii.fedekotek.design/kit/ascii-ui.js`. The font (Geist Mono) comes from `kit/fonts/` next to the CSS; nothing asks Google or anyone else.

2. Open https://ascii.fedekotek.design/#components, pick the Code tab on any component and copy its HTML into your page. It works as pasted, twice on one page too.
3. Or start from the starter page, which already links both and has every kit component on it: https://ascii.fedekotek.design/kit/starter.html

The kit's own README, with the `data-aui` attributes, the `window.ASCIIUI` API, versions and pinned URLs, is `kit/README.md` (also at https://ascii.fedekotek.design/kit/README.md). 32 of the 34 components are in the kit; Command and Picture need the site's engine. Every component has three tabs on the site: Preview, Code and Usage (when to use it, anatomy, states, keys, accessibility, do and don't).

There is no package and nothing to install. Copy what you need and own the code. MIT license, see `LICENSE`.

Five views: Home (the ring, where to start, questions, how it was made, invaders), Components (34, in five groups), Blocks (16), Charts (5) and Themes (presets, colors, ramp, tokens, labs). Search is `/` or Ctrl K.

```
index.html          the page, linking css/ and js/ (develop here)
css/                23 files, load order matters (numbered, 29-print last)
js/                 8 files, load order matters (numbered)
kit/                the kit you link from your own page: ascii-ui.css, ascii-ui.js, starter.html, README.md
build.py            inlines css/ and js/ into dist/ascii-ui.html and writes site/
dist/ascii-ui.html  the single-file build
site/               the deploy output, built by build.py: the single file plus kit/
vercel.json         tells Vercel to serve site/
qa/                 Playwright scripts, the release bar (qa/release.sh) and the reference generator
docs/               everything you need to keep going (start with docs/ARCHITECTURE.md)
archive/            old published versions (v2 to v9.3) as single files, not every point release. From v10 the history is in git
assets/             og.png (the link preview) and icon-180.png (the home screen icon), both made by qa/shots.py and
                    shipped in site/, favicon.ico, reel.mp4 and reel-poster.jpg (the reel on Home), and fonts/
                    (the Geist Mono subset build.py inlines); the other pictures are old review screenshots
llms.txt            a one-page map of the repo and the kit for an AI agent (llms-full.txt: every component in full)
LICENSE             MIT
CLAUDE.md           instructions for an AI agent working on this repo (the rules, the checklist, the release bar)
```

## Run it

Open `index.html` in a browser. That's it. The page makes no requests to anyone else, so it works offline. A local server is nicer because the file:// origin blocks the camera and the clipboard:

```
python3 -m http.server 8000     # then http://localhost:8000
```

## Build the single file

```
python3 build.py                # writes dist/ascii-ui.html and site/
```

`build.py` inlines the stylesheets and scripts in the order they appear in `index.html`, escapes `</script>` inside strings, merges the adjacent `<style>` blocks, minifies, and inlines the font. Then it rebuilds `site/`, the folder Vercel serves (see `vercel.json`): the single file as the page (with a Content-Security-Policy, and the Code tab's kit text fetched on first use) and as the Download (everything embedded), a 404 page, `robots.txt`, `sitemap.xml`, `favicon.ico`, `LICENSE.txt`, `llms.txt` and `llms-full.txt`, the pictures and the reel in `assets/`, plus `kit/` with every pinned version. Analytics are off (`ANALYTICS` in `build.py`). `dist/ascii-ui.html` also works on its own, anywhere that serves one HTML file. The version is the `aui-version` meta in `index.html`; `build.py` refuses to build when the footer says another. `python3 build.py --check` fails when the committed `site/` or `dist/` is not what the source builds.

## QA

```
pip install playwright && playwright install chromium
python3 qa/qa.py 390 844 dark m x     # errors + overflow, every view, mobile dark (the quick check)
python3 build.py                      # then the release bar, all of it, in order:
sh qa/release.sh                      # ends with `release: ok`, or stops at the first failure
```

Every script is described in `qa/README.md`. Drop the trailing `x` from `qa.py` to also get one screenshot per screen.

## Where things are

| Want to | Go to |
|---|---|
| Change a color, the ramp, a preset | `css/01-tokens.css`, `js/00-tones.js`, `docs/TOKENS.md` |
| Rebrand (every place a color lives) | `docs/ARCHITECTURE.md`, Rebrand |
| Add a component | `docs/COMPONENTS.md` (the checklist) |
| See every component's code, as printed | `docs/COMPONENTS-REFERENCE.md` (generated by `qa/reference.py`) |
| Change the kit | `kit/`, then `python3 qa/kit.py sync`; `kit/README.md` |
| Add a block | `docs/BLOCKS.md` |
| Understand a trick (torus, tear, LCD, shatter, ramp swap) | `docs/EFFECTS.md` |
| See what is fragile | `docs/KNOWN-ISSUES.md` |
| Know what is accessible and what is not | `docs/ACCESSIBILITY.md` |
| Write a component's Usage tab | `AUI_DOCS` in `js/90-usage.js`, checked by `qa/usage.py` |
| Change the navigation (top bar, sidebar, menu) | `css/17-nav.css`, `js/70-nav.js` |
| Change Search | `css/18-search.css`, `js/80-search.js`, commands in `run()` in `js/20` |
| Change Home | `index.html` (`main > header`, `#view-home`), `css/16-grid.css`, `css/22-home.css`, `js/40`, `js/70` (the reel, No signal) |
| Decide what to do next | `docs/ROADMAP.md` |
| Know why something is the way it is | `docs/DECISIONS.md` |
| See how it got here | `docs/CHANGELOG.md` |
| The JS surface (`window.AUI`) | `docs/API.md` |
