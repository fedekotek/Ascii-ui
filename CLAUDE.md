# Working on ascii/ui

## What this is
A component kit: shadcn-style components wearing a brutalist ASCII skin with a bad signal. Frames, fills and shadows are strings of characters, weight comes from how dense a character is, every state change glitches, and underneath it is plain HTML. It is for designers and developers who want to copy a component and own the code, plus a Home page (the ring, where to start, questions) and Labs in Themes that show the kit under stress. Five views: Home, Components, Blocks, Charts, Themes. Published as one HTML file, plus the kit files (`kit/`) people link from their own pages.

## Stack
No frameworks, no bundler, no package manager, no dependencies. Vanilla HTML, one page (`index.html`), 24 stylesheets in `css/` (01 to 22, 25-icons, then 29-print last) and 8 scripts in `js/` (00, 10, 20, 30, 40, 70, 80, 90), both loaded in the order their filenames are numbered. `build.py` (Python 3, standard library only) inlines and minifies them into `dist/ascii-ui.html` and writes `site/`, the deploy output: the single file plus `kit/`. `site/` is what ships (`vercel.json` points Vercel at it). The page makes no external requests: Geist Mono is self-hosted, a subset inlined in the page (`assets/fonts/`) and a copy next to the kit (`kit/fonts/`). QA is Playwright for Python in `qa/`.

The kit is separate from the site: `kit/ascii-ui.css` and `kit/ascii-ui.js` (global `window.ASCIIUI`, wired by `data-aui` attributes), `kit/starter.html` and `kit/README.md` (the kit's reference, API and versions). The site does not load it. The Code tab prints it, from a copy embedded at the end of js/40 (`KIT()`) that `python3 qa/kit.py sync` rewrites. 33 of the 35 components are in the kit; Command and Picture are site only. `llms.txt` is the one-page map for an agent.

## Run and test
```
python3 -m http.server 8000      # then http://localhost:8000 (file:// works too)
python3 build.py                 # writes dist/ascii-ui.html and site/, run before shipping
python3 build.py --check         # site/ and dist/ match the source (exit 1 lists stale files)
pip install playwright && playwright install chromium
python3 qa/qa.py 390 844 dark m x      # errors and overflow, every view, mobile dark
python3 qa/qa.py 1440 900 light d x    # same on desktop light
python3 qa/breakpoints.py              # columns, overflow and overlap, 360 to 1920
python3 qa/clock.py                    # the single animation clock still holds
python3 qa/audit.py                    # tap targets under 40px, text under 12px
python3 qa/keyboard.py                 # sliders and field frames never open the phone keyboard by accident
python3 qa/kit.py                      # the kit files and the starter page load clean
python3 qa/reduced.py                  # reduced motion turns off every animation and sound
python3 qa/usage.py                    # every component's Usage tab is complete and agrees with the kit
python3 qa/budget.py --idle            # size caps for site/, no outside requests, idle work per view
python3 qa/kit.py sync                 # after editing kit/: copy the kit into js/40 for the Code tab
python3 qa/reference.py                # after changing a component: regenerate docs/COMPONENTS-REFERENCE.md
sh qa/release.sh                       # THE release bar: every check below, in order, stops at the first failure
```
There is no unit test suite, no linter and no type checker. The QA scripts are the test suite. The release bar is one command, `sh qa/release.sh`, and it must end with `release: ok`. It runs 22 steps, in order: `qa.py` at 390 and 1440 in both themes, `qa.py --site` (what ships loads clean), `lazykit.py` (the published Code tab waits for the kit), `breakpoints.py`, `clock.py`, `audit.py`, `keyboard.py`, `kit.py`, `tokens.py` (tokens.json matches the page), `pages.py` (every Download page opens and runs the kit), `usage.py`, `reduced.py` (source and `--site`), `reel.py` (the reel plays, loads only on tap), `nav.py quick`, `reference.py --check` (the component reference is current), `build.py --check` (what is committed in `site/` and `dist/` is what the source builds) `facts.py` (the numbers How it was made prints are true) and `budget.py --idle` (sizes, no outside requests, a page that rests when idle). It checks and never writes: run `python3 build.py` (and `kit.py sync`, `reference.py` when they apply) before it.

Read `docs/ARCHITECTURE.md` first. Then the doc for the area you are touching. What the site promises about accessibility is in `docs/ACCESSIBILITY.md`; keep it true.

## Rules that are not negotiable
- Never use em dashes in any text (UI copy, docs, commit messages). Use commas, periods or parentheses.
- Never use emojis.
- Metric units everywhere (kg, g, ml, l).
- Voice for UI copy: plain, declarative, a little dry. Short jokes are fine, hedging is not. Read the existing captions before writing new ones.
- No frameworks, no bundler, no npm dependencies. Vanilla HTML, CSS, JS. No external requests at all: no CDN, no font service. The one exception is Vercel Web Analytics (cookieless, same origin, `ANALYTICS` in `build.py`): off until it is switched on in the Vercel dashboard, and even then only on https://ascii.fedekotek.design, never from `file://` or in `dist/`. Geist Mono is self-hosted and inlined. `qa/budget.py` fails on a request to anyone else.
- Everything must keep working from `file://`. Features that need an origin (camera, clipboard) must fail with a message, never with an error.
- `prefers-reduced-motion` must turn off every animation and sound. Check `A.reduce` before starting any timer.
- Cyan (`--cy`, the focus color) means focus and nothing else. Magenta acts, lime confirms, yellow warns. Magenta and yellow must stay clearly distinct (see Rebrand in `docs/ARCHITECTURE.md`).
- Everything on screen snaps to the character grid: `1ch` wide, `var(--r)` (21px, 14px type) tall. In JS use `A.ROW`, never a number. Do not introduce free pixel sizes for layout.

## Before you change anything
1. `python3 qa/qa.py 390 844 dark m x` must print `m []` (no errors, no overflow) before and after your change.
2. Load order is the numbering in `css/` and `js/`. New files go at the end of the sequence unless they are tokens.
3. Each `js/` file is one IIFE. They talk through `window.AUI` (engine), `window.AUI2` (fx), `window.AUI3` (invaders, poster, `run()` for typed commands), `window.AUI_NAV` (router, sidebar model, search index), `window.AUI_SEARCH` (Search open and close), `window.AUI_JS` (the site's own wiring for five demos; the Code tab no longer reads it), `window.AUI_WIDE` (re-checks which tables are wider than their box), `window.AUI_DOCS` (js/90: the Usage tab's words, one entry per component), `window.AUI_TONES` and `window.AUI_MAP` (ramp translation). See `docs/API.md`.
4. Any text you put on the canvas or into `.bar`/`.chart`/`.ptitle` must go through `A.TR()` so the ramp editor can re-skin it. Text nodes in normal HTML are fine.
5. New interactive elements need a 44px hit area (use the `padding:12px 0;margin:-12px 0` pattern), a `:focus-visible` style, and keyboard operation.
6. New sounds go through `A.tone`/`A.noise` (they are humanized and fatigue-limited there). Never create an AudioContext yourself.
7. Anything that repeats goes through `A.every(ms,fn,opt)` or `A.times(ms,n,fn,end)`. Never call `setInterval`; `qa/clock.py` fails if you do.
8. Run `python3 build.py` and check `dist/ascii-ui.html` also loads clean. It goes into `site/`, which is what ships. `python3 build.py --check` fails if you forgot.
9. After editing anything in `kit/`, run `python3 qa/kit.py sync`, then `python3 qa/kit.py`. The Code tab reads the synced copy, not the files.

## How to add a component (short version, the full checklist is in docs/COMPONENTS.md)
1. `index.html`: a `<section aria-labelledby="s-NAME">` inside `#view-kit` with an `<h2 class="vh">`, a `<pre class="poster ptitle" data-text="NAME">`, a `<p class="muted">` caption, and the demo. `data-span="full"` if it holds a table, a chart or a picture (gallery columns are 66 characters at 1024px, 43 at 1280px, 41 at 1600px, never under 40). Update the count strings ("35 components", "Thirty-five", "33 in the kit", README, llms.txt).
2. Its id in a group of `KIT_GROUPS` (js/30: Form, Overlay, Display, Feedback, Navigation). The docs builder sorts, adds Preview/Code tabs, the index and the sidebar.
3. Site wiring: CSS at the end of css/14 or a new file after css/22 (29-print stays last); JS in js/30.
4. `KITIFY` in js/40: the `data-aui` attributes the kit needs, set on the Code tab's clone. Or a `SITEONLY` note if the kit cannot run it.
5. Kit CSS: a block in `kit/ascii-ui.css` opening with `/* ==== NAME: .selectors ==== */`.
6. Kit JS: `NAME:function(el){...}` in `behaviors` in `kit/ascii-ui.js`, plus a `BEHAVE` line in js/40, plus the row in `kit/README.md`.
7. `python3 qa/kit.py sync`.
8. `kit/starter.html`: a `<section class="part" id="NAME">` in its group.
9. `qa/kit.py`: an `ALIVE` check, and a `TWICE_JS` check if two copies could collide.
10. `ALIAS` in js/80 for the other names people type.
11. Usage: an entry for its section id in `AUI_DOCS` (js/90) with use, avoid, anatomy, states, keys, a11y, dos and see, and the id in `COMPONENTS` in `qa/usage.py`. Then `python3 qa/usage.py`.
12. The table in `docs/COMPONENTS.md`, then `python3 qa/reference.py`.
13. `python3 build.py`, then `sh qa/release.sh`.

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
- No scanlines. They are off unless the root has the `crt` class: CRT scanlines under Settings in Search, remembered in `localStorage['aui-crt']`.
- A long press does nothing on most things on a phone. On touch only titles break, after a 900ms hold while a row fills up the ramp. A mouse can still shatter buttons, cards, charts and the rest.
- The page runs almost no frames when idle. The clock sleeps until the next task is due, and a gated task looks again every half second or waits for `wake()`. With reduced motion it runs none.
- The reel on Home is a poster and a button. The video is made and fetched only on tap, muted, never autoplayed.
- An unknown address (`#bogus`) shows NO SIGNAL at the top of Home, drawn in characters, with the way back. A missing section (`#components/nope`) lands on its view and says so in yellow. A missing file on the server gets `site/404.html`.

## Things that are actually fragile
See `docs/KNOWN-ISSUES.md`. The top three: the file is stitched from eight IIFEs with shared globals, every animation shares one rAF clock (a throwing callback drops that task), and the Code tab reads the kit by comment markers and indentation, from a copy in js/40 that goes stale without `qa/kit.py sync`.

## Definition of done
- `sh qa/release.sh` ends with `release: ok`, before and after the change.
- No console errors, no horizontal overflow at any width from 360 to 1920.
- Empty, loading and error states are handled and reachable.
- Works on a phone and on a desktop, and from `file://`.
- Reviewer findings are addressed. Nothing is called done before that.

## Working style
The person you are working with is a product designer, not an engineer. Explain decisions in plain language, skip the jargon, keep answers short. Prefer small changes you can verify over large ones you cannot. Every change gets merged and published, it does not sit in a branch.

After any non-trivial change, run the `reviewer` agent. After any UI change, run the `ux-critic` agent.

Every change is merged to `main` and published. Vercel deploys `main` on every push, to https://ascii.fedekotek.design. End every reply with that link, updated, always.
