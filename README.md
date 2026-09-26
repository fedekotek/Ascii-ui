# ascii/ui

shadcn-style components with a brutalist ASCII skin and a bad signal. The kit is two files (`kit/ascii-ui.css` and `kit/ascii-ui.js`), no dependencies, no build step. The whole site also ships as one HTML file. Frames, fills and shadows are strings of characters; weight comes from how dense the character is; every state change glitches a little; underneath it is plain HTML.

Live: https://ascii.fedekotek.design (Vercel deploys `main` on every push). The single-file build is `dist/ascii-ui.html`.

## How to use it

1. Link the kit once, in your page's `<head>` and before `</body>`:

   ```html
   <link rel="stylesheet" href="https://ascii.fedekotek.design/kit/ascii-ui.css">
   <script src="https://ascii.fedekotek.design/kit/ascii-ui.js"></script>
   ```

2. Open https://ascii.fedekotek.design, go to Components, open the Code tab on any component and copy its HTML into your page.
3. Or start from the starter page, which already links both: https://ascii.fedekotek.design/kit/starter.html

There is no package and nothing to install. Copy what you need and own the code. MIT license, see `LICENSE`.

Five views: Home (the ring, where to start, questions, invaders), Components (30, in five groups), Blocks (16), Charts (5) and Themes (presets, colors, ramp, tokens, labs). Search is `/` or Ctrl K.

```
index.html          the page, linking css/ and js/ (develop here)
css/                18 files, load order matters (numbered)
js/                 7 files, load order matters (numbered)
kit/                the kit you link from your own page: ascii-ui.css, ascii-ui.js, starter.html
build.py            inlines css/ and js/ into dist/ascii-ui.html and writes site/
dist/ascii-ui.html  the single-file build
site/               the deploy output, built by build.py: the single file plus kit/
vercel.json         tells Vercel to serve site/
qa/                 Playwright scripts used for every release
docs/               everything you need to keep going (start with docs/ARCHITECTURE.md)
archive/            published versions v2 to v9.3, as single files. From v10 the history is in git
assets/             screenshots used in reviews
LICENSE             MIT
CLAUDE.md           instructions for an AI agent working on this repo
```

## Run it

Open `index.html` in a browser. That's it. A local server is nicer because the file:// origin blocks the camera and the clipboard:

```
python3 -m http.server 8000     # then http://localhost:8000
```

## Build the single file

```
python3 build.py                # writes dist/ascii-ui.html and site/
```

`build.py` inlines the stylesheets and scripts in the order they appear in `index.html`, escapes `</script>` inside strings, and merges the adjacent `<style>` blocks. Then it writes `site/`, the folder Vercel serves (see `vercel.json`): the single file as the page, plus `kit/`. `dist/ascii-ui.html` also works on its own, anywhere that serves one HTML file.

## QA

```
pip install playwright && playwright install chromium
python3 qa/qa.py 390 844 dark m x     # errors + overflow, every view, mobile dark
python3 qa/qa.py 1440 900 light d x   # same on desktop light
python3 qa/breakpoints.py             # columns, overflow and overlap, 360 to 1920
python3 qa/clock.py                   # the single animation clock still holds
python3 qa/audit.py                   # tap targets under 40px, text under 12px
python3 qa/keyboard.py                # sliders and fields never open the phone keyboard by accident
python3 qa/kit.py                     # the kit files and the starter page load clean
python3 qa/reduced.py                 # reduced motion turns off every animation and sound
```

Drop the trailing `x` to also get one screenshot per screen. See `qa/README.md`.

## Where things are

| Want to | Go to |
|---|---|
| Change a color, the ramp, a preset | `css/01-tokens.css`, `js/00-tones.js`, `docs/TOKENS.md` |
| Add a component | `docs/COMPONENTS.md` (recipe at the end) |
| Add a block | `docs/BLOCKS.md` |
| Understand a trick (torus, tear, LCD, shatter, ramp swap) | `docs/EFFECTS.md` |
| See what is fragile | `docs/KNOWN-ISSUES.md` |
| Change the navigation (top bar, sidebar, menu) | `css/17-nav.css`, `js/70-nav.js` |
| Change Search | `css/18-search.css`, `js/80-search.js`, commands in `run()` in `js/20` |
| Change Home | `index.html` (`main > header`, `#view-home`), `css/16-grid.css`, `js/40` |
| Decide what to do next | `docs/ROADMAP.md` |
| Know why something is the way it is | `docs/DECISIONS.md` |
| See how it got here | `docs/CHANGELOG.md` |
| The JS surface (`window.AUI`) | `docs/API.md` |
