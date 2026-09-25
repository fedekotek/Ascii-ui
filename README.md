# ascii/ui

shadcn-style components with a brutalist ASCII skin and a bad signal. One HTML file, no dependencies, no build step required. Frames, fills and shadows are strings of characters; weight comes from how dense the character is; every state change glitches a little; underneath it is plain HTML.

Live: https://asciiui.vercel.app (Vercel deploys `main` on every push). The single-file build is `dist/ascii-ui.html`.

Five views: Home (the ring, a Try it strip, where to start, questions, invaders), Components (30, in five groups), Blocks (16), Charts (5) and Themes (presets, colors, ramp, tokens, labs). Search is `/` or Ctrl K.

```
index.html          the page, linking css/ and js/ (develop here)
css/                18 files, load order matters (numbered)
js/                 7 files, load order matters (numbered)
build.py            inlines css/ and js/ into dist/ascii-ui.html
dist/ascii-ui.html  the single-file build, what gets published
qa/                 Playwright scripts used for every release
docs/               everything you need to keep going (start with docs/ARCHITECTURE.md)
archive/            every published version, as single files
assets/             screenshots used in reviews
CLAUDE.md           instructions for an AI agent working on this repo
```

## Run it

Open `index.html` in a browser. That's it. A local server is nicer because the file:// origin blocks the camera and the clipboard:

```
python3 -m http.server 8000     # then http://localhost:8000
```

## Build the single file

```
python3 build.py                # writes dist/ascii-ui.html
```

`build.py` inlines the stylesheets and scripts in the order they appear in `index.html`, escapes `</script>` inside strings, and merges the adjacent `<style>` blocks. Publish `dist/ascii-ui.html` anywhere that serves one HTML file.

## QA

```
pip install playwright pillow && playwright install chromium
python3 qa/qa.py 390 844 dark m x     # errors + overflow, every view, mobile dark
python3 qa/qa.py 1440 900 light d x   # same on desktop light
python3 qa/breakpoints.py             # columns, overflow and overlap, 360 to 1920
python3 qa/clock.py                   # the single animation clock still holds
python3 qa/audit.py                   # tap targets under 40px, text under 12px
python3 qa/keyboard.py                # sliders and fields never open the phone keyboard by accident
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
