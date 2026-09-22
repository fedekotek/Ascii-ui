# Working on ascii/ui

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
- Everything on screen snaps to the character grid: `1ch` wide, `var(--r)` (24px) tall. Do not introduce free pixel sizes for layout.

## Before you change anything
1. `python3 qa/qa.py 390 844 dark m x` must print `m []` (no errors, no overflow) before and after your change.
2. Load order is the numbering in `css/` and `js/`. New files go at the end of the sequence unless they are tokens.
3. Each `js/` file is one IIFE. They talk through `window.AUI` (engine), `window.AUI2` (fx), `window.AUI3` (invaders, poster, command palette), `window.AUI_JS` (component source registry for the Code tab), `window.AUI_TONES` and `window.AUI_MAP` (ramp translation). See `docs/API.md`.
4. Any text you put on the canvas or into `.bar`/`.chart`/`.ptitle` must go through `A.TR()` so the ramp editor can re-skin it. Text nodes in normal HTML are fine.
5. New interactive elements need a 44px hit area (use the `padding:12px 0;margin:-12px 0` pattern), a `:focus-visible` style, and keyboard operation.
6. New sounds go through `A.tone`/`A.noise` (they are humanized and fatigue-limited there). Never create an AudioContext yourself.
7. Anything that repeats goes through `A.every(ms,fn,opt)` or `A.times(ms,n,fn,end)`. Never call `setInterval`; `qa/clock.py` fails if you do.
8. Run `python3 build.py` and check `dist/ascii-ui.html` also loads clean. That is what ships.

## How to add a component (short version, long one in docs/COMPONENTS.md)
Add a `<section aria-labelledby="s-NAME">` inside `#view-kit` with an `<h2 class="vh">`, a `<pre class="poster ptitle" data-text="NAME">`, a `<p class="muted">` caption, and the demo. The docs builder sorts sections alphabetically, adds Preview/Code tabs and puts it in the index. If it needs JS, register it in `window.AUI_JS.NAME` so the Code tab can print it.

## Things that look like bugs and are not
- The boot screen only runs once per session (`sessionStorage['aui-boot']`). Type `boot` in the palette to see it again.
- The `Torus` button in the hero is hidden until a photo or camera is loaded.
- Titles drop their color bars, then go to single scale, on narrow screens or with large accessibility font sizes. That is `fitTitles()`, on purpose.
- Sounds get quieter when repeated fast. That is the fatigue curve in `human()`.
- Frames and titles "rot" after 14 seconds idle. Any touch repairs them.

## Things that are actually fragile
See `docs/KNOWN-ISSUES.md`. The top three: the file is stitched from five IIFEs with a shared global, every animation shares one rAF clock (a throwing callback costs that frame), and the Code tab's CSS extraction is regex-based.
