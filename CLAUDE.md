# Working on ascii/ui

## What this is
A component kit: shadcn-style components wearing a brutalist ASCII skin with a bad signal. Frames, fills and shadows are strings of characters, weight comes from how dense a character is, every state change glitches, and underneath it is plain HTML. It is for designers and developers who want to copy a component and own the code, plus a Home page (the ring, where to start, questions) and Labs in Themes that show the kit under stress. Five views: Home, Components, Blocks, Charts, Themes. Published as one HTML file, plus the kit files (`kit/`) people link from their own pages.

## Stack
No frameworks, no bundler, no package manager, no dependencies. Vanilla HTML, one page (`index.html`), 18 stylesheets in `css/` and 7 scripts in `js/` (00, 10, 20, 30, 40, 70, 80), both loaded in the order their filenames are numbered. `build.py` (Python 3, standard library only) inlines them into `dist/ascii-ui.html` and writes `site/`, the deploy output: the single file plus `kit/`. `site/` is what ships (`vercel.json` points Vercel at it). Google Fonts (Geist Mono) is the only external request. QA is Playwright for Python in `qa/`.

## Run and test
```
python3 -m http.server 8000      # then http://localhost:8000 (file:// works too)
python3 build.py                 # writes dist/ascii-ui.html and site/, run before shipping
pip install playwright && playwright install chromium
python3 qa/qa.py 390 844 dark m x      # errors and overflow, every view, mobile dark
python3 qa/qa.py 1440 900 light d x    # same on desktop light
python3 qa/breakpoints.py              # columns, overflow and overlap, 360 to 1920
python3 qa/clock.py                    # the single animation clock still holds
python3 qa/audit.py                    # tap targets under 40px, text under 12px
python3 qa/keyboard.py                 # sliders and field frames never open the phone keyboard by accident
python3 qa/kit.py                      # the kit files and the starter page load clean
python3 qa/reduced.py                  # reduced motion turns off every animation and sound
```
There is no unit test suite, no linter and no type checker. The QA scripts are the test suite. Release bar: `qa.py` clean at 390 and 1440 in both themes, `breakpoints.py` ok, `clock.py` ok, `audit.py` clean, `keyboard.py` clean, `kit.py` ok, `reduced.py` ok, and `dist/ascii-ui.html` loads clean.

Read `docs/ARCHITECTURE.md` first. Then the doc for the area you are touching.

## Rules that are not negotiable
- Never use em dashes in any text (UI copy, docs, commit messages). Use commas, periods or parentheses.
- Never use emojis.
- Metric units everywhere (kg, g, ml, l).
- Voice for UI copy: plain, declarative, a little dry. Short jokes are fine, hedging is not. Read the existing captions before writing new ones.
- No frameworks, no bundler, no npm dependencies. Vanilla HTML, CSS, JS. Google Fonts (Geist Mono) is the only external request.
- Everything must keep working from `file://`. Features that need an origin (camera, clipboard) must fail with a message, never with an error.
- `prefers-reduced-motion` must turn off every animation and sound. Check `A.reduce` before starting any timer.
- Blue (`--cy`, the focus color) means focus and nothing else. Magenta acts, lime confirms, yellow warns.
- Everything on screen snaps to the character grid: `1ch` wide, `var(--r)` (21px, 14px type) tall. In JS use `A.ROW`, never a number. Do not introduce free pixel sizes for layout.

## Before you change anything
1. `python3 qa/qa.py 390 844 dark m x` must print `m []` (no errors, no overflow) before and after your change.
2. Load order is the numbering in `css/` and `js/`. New files go at the end of the sequence unless they are tokens.
3. Each `js/` file is one IIFE. They talk through `window.AUI` (engine), `window.AUI2` (fx), `window.AUI3` (invaders, poster, `run()` for typed commands), `window.AUI_NAV` (router, sidebar model, search index), `window.AUI_SEARCH` (Search open and close), `window.AUI_JS` (component source registry for the Code tab), `window.AUI_WIDE` (re-checks which tables are wider than their box), `window.AUI_TONES` and `window.AUI_MAP` (ramp translation). See `docs/API.md`.
4. Any text you put on the canvas or into `.bar`/`.chart`/`.ptitle` must go through `A.TR()` so the ramp editor can re-skin it. Text nodes in normal HTML are fine.
5. New interactive elements need a 44px hit area (use the `padding:12px 0;margin:-12px 0` pattern), a `:focus-visible` style, and keyboard operation.
6. New sounds go through `A.tone`/`A.noise` (they are humanized and fatigue-limited there). Never create an AudioContext yourself.
7. Anything that repeats goes through `A.every(ms,fn,opt)` or `A.times(ms,n,fn,end)`. Never call `setInterval`; `qa/clock.py` fails if you do.
8. Run `python3 build.py` and check `dist/ascii-ui.html` also loads clean. It goes into `site/`, which is what ships.

## How to add a component (short version, long one in docs/COMPONENTS.md)
Add a `<section aria-labelledby="s-NAME">` inside `#view-kit` with an `<h2 class="vh">`, a `<pre class="poster ptitle" data-text="NAME">`, a `<p class="muted">` caption, and the demo. Add its id to a group in `KIT_GROUPS` (js/30: Form, Overlay, Display, Feedback, Navigation). In the docs views the poster is hidden and the `h2` shows as a bold uppercase word. From 1024px that section gets a gallery column (66 characters at 1024px, 43 at 1280px, 41 at 1600px, never under 40), so if it holds a table, a chart or a picture give it `data-span="full"`. The docs builder sorts sections by group, then alphabetically, adds Preview/Code tabs and puts it in the index and the sidebar. If it needs JS, register it in `window.AUI_JS.NAME` so the Code tab can print it.

## Things that look like bugs and are not
- The boot screen only runs once per session (`sessionStorage['aui-boot']`). Type `boot` in Search (`/` or Ctrl K), or pick Boot under Tricks, to see it again.
- The `Back to the ring` link on Home (and `Camera`), next to `Feed the ring a photo` under the Where to start tiles, is hidden until a photo is loaded.
- The Home tab (`#v-home`) is in the tablist but not drawn. The brand name is the way Home.
- Old `#play`, `#apps` and `#onepager` links land on `#home`. Those views are gone.
- The invaders game shows on Home only. Every other view ends with the one footer line.
- Glitch leaves the bar under 768px. It is in the `[=]` menu and in Search.
- Titles drop their color bars, then go to single scale, on narrow screens or with large accessibility font sizes. That is `fitTitles()`, on purpose.
- Sounds get quieter when repeated fast. That is the fatigue curve in `human()`.
- Frames and titles "rot" after 14 seconds idle. Any touch repairs them.

## Things that are actually fragile
See `docs/KNOWN-ISSUES.md`. The top three: the file is stitched from seven IIFEs with shared globals, every animation shares one rAF clock (a throwing callback drops that task), and the Code tab's CSS extraction is regex-based.

## Definition of done
- The QA scripts above pass, before and after the change.
- No console errors, no horizontal overflow at any width from 360 to 1920.
- Empty, loading and error states are handled and reachable.
- Works on a phone and on a desktop, and from `file://`.
- Reviewer findings are addressed. Nothing is called done before that.

## Working style
The person you are working with is a product designer, not an engineer. Explain decisions in plain language, skip the jargon, keep answers short. Prefer small changes you can verify over large ones you cannot. Every change gets merged and published, it does not sit in a branch.

After any non-trivial change, run the `reviewer` agent. After any UI change, run the `ux-critic` agent.

Every change is merged to `main` and published. Vercel deploys `main` on every push, to https://asciiui.vercel.app. End every reply with that link, updated, always.
