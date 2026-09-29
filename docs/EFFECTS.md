# Effects, one by one

Every trick on the site, what it does, where it lives, how it works, what would break it. Read this before touching js/10 or js/20.

## Frames made of strings (`js/00-tones.js`, `css/04-frame.css`)
`AUI_TONES()` builds, for each tone (heavy `@`, dense `%`, mid `#`, light `=`/`::`, shade `:`, faint `- `, danger `/`, error `!`), three CSS variables: `--h-*` a 180-char horizontal string, `--s-*` a 2-char side string, `--v-*` a vertical string of 90 lines (`\A` line breaks). `.frame::before/after` set `content:var(--h)` with `overflow:hidden`, so the string is clipped at the element's width. `.mid::before/after` use `--s`. `.body::before/after` use `--v` for walls. `.tone-*` classes just point `--h/--s/--v` at a tone. Animations (rim march, burst, ripple, draw-in, rot) set `--h`/`--hb`/`--s`/`--sr` inline with generated strings. Breaks if: a frame is wider than 180ch; a string contains `"` or `\`.

## Bitmap titles (`js/10` "5x7 bitmap face", "section titles")
`F` is a 5x7 font for A-Z, 0-9 and `/ - . ! ? space`. `bitmap(text, scale)` returns a matrix. `titleFrame(pre, f)` renders rows as `<span class="tr cN">` with a per-cell random delay `_n` so the title "develops" over 14 frames, rows shifted randomly while developing; `f=99` is final. Color rows `c0..c3` map to `--t0..--t3`. `makeBars()` adds the color-bar decoration on the right when there is room. `fitTitles()` (v9.3) measures columns available and picks: scale 2 with bars, scale 2 without bars, scale 1. It runs on layout, on view switch, and every 1.5s. Breaks if: a title exceeds 8 characters at 390px (it goes to scale 1, which is fine but small); unknown glyphs render as `O`.

## Layout snap (`js/10` "layout")
`#probe` (50 M's, fixed, invisible) gives the real character width. `main` width is snapped to whole columns. `fit(cols, W, maxFs)` finds the largest font size where `cols` glyphs fit. The hero uses `ctx.measureText` instead, because canvas text metrics differ from DOM.

## Hero: torus on a bad signal (`js/10` "hero")
A canvas on Home, in `main > header`. `HC x HR` cells (HR=58, cut down to fit a height cap of 16 rows, 12 under 720px wide). Per frame: (1) tearing shifts, a few random row bands offset by `shift[y]` during a burst; (2) streaks, magenta dashes moving horizontally; (3) blocks and color bars floating; (4) the torus, the classic donut.c projection with a z-buffer, lit, quantized to 7 levels and painted with a color map (`TOR_D` dark, `TOR_L` light, or `MAPS[HP.map]`), skipped inside the box around each word (one cell of air), and the blocks stop at that box and at the ring too, so a color bar never crosses a letter or the torus; or, if `A.src` is set, the photo/camera luminance instead; (5) the two words from the title mask (`HP.t1`, `HP.t2`: COPY IT and OWN IT) painted three times: cyan ghost left, magenta ghost right, ink on top (RGB split); (6) during a burst, corruption rectangles. Bursts come from `G.burst`, set by `kick()`, by the ambient timer (period shrinks with glitch amount), by fast scroll, by taps. Knobs in `HP` (no UI edits them since Play went). Runs at 85ms while visible.

## Photo and camera (`js/20` "photo / camera hero")
`A.src(w,h)` samples an image or video into an offscreen canvas at the hero's resolution, returns normalized luminance. Camera uses `getUserMedia` (fails from file:// and inside sandboxed frames, with a message). Nothing leaves the page. The controls are one quiet line in the Home hero: Feed the ring a photo, then Camera and Back to the ring, which stay hidden until a picture is in. The `photo` and `ring` commands in Search do the same.

## Sound (`js/10` "sound")
See ARCHITECTURE.md. Motifs live in `sfx`. `human()` is the variation + fatigue. The Sound lab in Themes plays ticks, noise, a chord and a buzz through the same primitives.

## Entrances (`js/10` "everything arrives broken")
Everything that matches `RV` (js/10, search `var RV=`) gets `data-rv`, and `js-rv` on `:root` holds those at opacity 0 (css/02). Under reduced motion nothing is armed. IntersectionObserver reveals each one once, with a 24ms stagger capped at eight, then stops watching it; a batch makes one tick, not one per element. `.in` runs the `rvin` keyframe (clip-path slices, translate, hue-rotate, `steps(1)`) and `animationend` adds `.done`. `decode()` resolves the text of paragraphs, list items and `h3`s left to right out of ramp noise (never inside labels, legends, buttons, status lines or anything `aria-hidden`: those are accessible names or live text), `AUI2.frameDraw()` draws frames around the perimeter, `el._anim()` runs chart growth, buttons `scramble()`. Glitch off (`.calm` on `:root`) hides the VHS layer.

## Theme curtain (`js/10` "theme: a halftone curtain")
`wipe(cb)` covers the viewport with a diagonal front of `.:=+*#%@` characters plus a solid strip of test-pattern color bars, calls `cb` while covered, then retreats. Used for the theme toggle and the presets. View switches use the datamosh.

## Datamosh (`js/20` "datamosh transition")
`mosh(cb)`: one absolutely positioned row per `A.ROW` (21px) of viewport, each a div with random ramp text and a random palette color, sliding in from a random side with a random duration, then out. Every view switch.

## Ambient sparks (`js/10` "fx layer")
Every 650ms, scaled by the glitch amount, a few runs of `=` in magenta or pink appear on the character grid and vanish after 80..300ms. They only land in the gutters either side of the column (when a gutter is at least 2ch) and over the hero, never over body text. Tap sparks and the cursor trail are characters too, magenta and pink, fading down the ramp.

## Tear (`js/20` "fx helpers")
`tear(n)`: n strips in `#fx`, each one or two grid rows of light ramp characters (about half the cells) in magenta or violet at .55 opacity, knocked one character sideways, removed after 80..220ms. No filter: it used to be a `backdrop-filter` hue turn. Fast scroll calls it (velocity > 1300 px/s).

## Jolt (`css/02` `@keyframes jolt`, `A.jolt`)
260ms `steps(1)` keyframe on `main`: translateX, skewX, hue-rotate, saturate. Fires on errors, shatter, hits in invaders, and the explicit glitch buttons. Success uses `A.flash(el)` instead: the nearest card or frame goes lime for 120ms (`.okflash`) and the hero bursts; nothing under reduced motion.

## Scroll is signal, idle is rot (`js/20`)
Scroll velocity feeds `G.scroll` (decays 28 percent per 100ms) which boosts `glitch()` and bursts the hero above 0.3. After 14s without pointer or key, every 1.1s up to 4 visible frames get characters degraded one ramp step, and one visible title is re-rendered at a lower develop frame. Frames degrade two ramp steps at a time. Any touch repairs everything (`touch()`), with an arpeggio; a scroll repairs quietly.

## Shatter and sand (`js/20` "destructible UI")
Long-press (900ms, cancelled by 10px movement or a scroll, off under reduced motion). A mouse reaches `.btn,.lift,.chart,.ptitle,.stat,.kpi,.badge,.tablewrap,.acc,.skel`; a finger only `.ptitle`, so a hold to read or select never breaks anything. While it holds, a row of characters under the target fills up the ramp (`.:=+*#%@`); letting go before it is full cancels. Dialogs, code, the context menu and floating panes are never targets. `harvest(el, cw)` (v9.4) collects the element's own characters: each text character via `Range.getBoundingClientRect` with the parent's color (or background color for slabs), pseudo-element strings (`::before/::after` content) laid along the top/bottom/sides, LCD canvases via `lcd.sample()` (real image colors), other canvases via pixel sampling. Capped at 900 pieces. Particles fall on `#sand` with gravity (a clock task, `A.every(16,sim)`, that stops when the last piece lands), bounce off the walls, and settle into a per-column height map; the pile keeps colors and caps at 34 percent of the viewport. `Rebuild` restores visibility and re-runs entrances. The typed command `rm -rf X` in Search uses the same path.

## LCD pictures (`js/30` "LCD pictures", `css/14`)
`LCD(canvas)` reads `data-scene|cols|rows|mode`. Scenes are procedural drawings (`SCENES.ba` Buenos Aires dusk with the Obelisco, `desk`, `mate`, `test`, `portrait`, `ui1..ui4`) into an offscreen canvas at cols x rows, sampled per cell. Modes: `rgb` (three subpixels with a gamma lift plus a dim full-color backing), `mono` (Game Boy palette with 4x4 Bayer dithering), `ascii` (ramp character in the pixel's color). The panel is split into sectors (4x3 for big panels, 2x2 small); each sector has its own scanline phase and can be tapped to cycle modes; glitch bursts shift rows and swap channels per sector. `setImage(file)` replaces the scene. 8 fps while in view.

## Character-grid charts
See CHARTS.md.

## Space invaders (`js/20` "space invaders")
64x46 cell canvas capped at 440px wide. Three alien types with 2-frame sprites drawn in `@#*` and palette colors, bunkers that erode, bombs, waves, lives, a high score in `localStorage['aui-hi']`. Pointer: drag to move, hold to fire. Keyboard: arrows, space (only when the canvas is in view and no dialog is open). Aliens jitter with RGB ghosts when glitch is on. Runs at 50ms while in view.

## Signature and poster (`js/20` "signature + poster")
`SEED` per visit (or `fnv(name)` via `sign NAME`). `makePoster()` renders a 1080x1350 PNG with a seeded PRNG: streaks, blocks, color bars, the split bitmap title, the signal code, scanlines. `picDialog(src, kind)` shows it in `#posterDlg`; a `'snap'` kind (a hero snapshot) is still supported but nothing asks for it since Play went.

## VHS layer (`js/20` "VHS layer", `css/13`)
`#hud`: REC blinking, timecode from page load, SIG percent (100 minus glitch), SND when audio is on. `#track`: three rows of `- =` characters that step down the screen a row at a time every 9s, moved by the `aui-track` CSS animation in `steps(rows)` (css/13), so a pass costs a few DOM changes, not one per row. Both hidden in `.calm`.

## Tilt (`js/20` "tilt")
`deviceorientation` feeds `A.spin()`. iOS needs `DeviceOrientationEvent.requestPermission()`, exposed as the `tilt` command in Search.

## Boot (`js/20` "boot")
Once per session. `#boot` is static markup at the top of `index.html`, so it is the first paint; an inline script under it removes it at once on a return visit or with reduced motion. `boot()` fills it: a glow of the ramp's three lightest steps in magenta behind everything (characters, not a gradient), the section-poster bitmap title developing (fitted to an 80ch column), a color strip one row tall, five log lines at 60ms with sounds, a halftone progress bar, magenta streaks, then a 150ms clip-path exit as soon as the bar hits 100% (about 1.3s from navigation). A tap or any key skips. While it is up, `aui-booting` on `:root` holds the page's entrances, so the header decodes once, after it leaves. The `boot` command (or Boot under Tricks in Search) replays. With the `crt` class on the root (CRT scanlines in Search), `body::before` draws the scanlines above it at z-index 250, and every `dialog` carries its own in `::after` and `::backdrop`, since the top layer is out of any z-index's reach. Without it there are no scanlines.

## Ramp editor (`js/40` "the ramp editor")
Presets and eight single-character inputs. `setRamp` validates (8 distinct, no space/quote/backslash/angle bracket), then `A.setRamp()` sets `AUI_MAP`, rebuilds tones, re-renders titles, sliders, charts, invaders (via `layout()`), and everything that goes through `A.TR()` or the patched `fillText`. Known gap: the progress bar and the ramp lab in Themes > Labs keep old characters until they next redraw.

## Presets and pickers (`js/40` "themes", `css/15`)
Presets set `data-preset` on `:root` (or clear it for Signal/Paper and set `data-theme`). Pickers write inline custom properties on `:root`. A MutationObserver on `data-theme|data-preset` calls `readPalette()` and redraws canvases. Tokens block regenerates from computed styles.

## Code tab (`js/30` docs builder, `js/40` `A.kitify` and `A.codeExtra`)
It prints the kit, not the site. HTML: a clone of the preview, cleaned (`cleanHTML()`), given the kit's `data-aui` attributes and stripped of ids (`KITIFY` and `neutral()` in js/40), pretty-printed by a tiny tokenizer, highlighted with placeholder markers (so the highlighter cannot mangle its own output). CSS: the blocks of `kit/ascii-ui.css` whose header line (`/* ==== name: selectors ==== */`) names a selector that matches the HTML, minus the base blocks. JS: one line per `data-aui` name and button attribute, then the source of `behaviors.NAME` from `kit/ascii-ui.js`. Both kit files are read from the copy in `KIT()` at the end of js/40, which `python3 qa/kit.py sync` writes. Copy uses the Clipboard API; when that is blocked (`file://`) it selects the text and says to press Ctrl C. Details in COMPONENTS.md, What the Code tab prints.

## Menu (`js/70` "the [=] menu", `css/17`)
Below 1024px only (`#menuBtn` is hidden from 1024px). Full screen, and only about the view you are in: Find a section (narrows the list), the sections (the same model as the sidebar, one row each, the groups folding under `[+]` headings on Components and Blocks), and Settings folded at the foot (Show grid, Glitch, Theme, the credit). Under 768px the views are the picker in the bar (`#viewBtn`). Sound stays in the bar. Rebuilt on every open. See ARCHITECTURE.md, Navigation.

## Search (`js/80`, `css/18`)
The palette behind `#cmdBtn`, `/` and Ctrl K (Cmd K). A combobox over a listbox, never blank: Views, On this page, Settings (live values that flip in place and confirm in lime), Tricks and About (Credits, Kit changelog). Typing searches every section of every view by name, poster title and caption; a word that starts with what you typed ranks first. A typed command gets a magenta Run row that hands the line to `run()` in js/20, which answers on the status line. Arrows, Home, End, PageUp and PageDown move the active row, Enter picks, Esc clears and then closes.

## Signal in the kit (`kit/ascii-ui.js` "Signal", `kit/ascii-ui.css` block `signal`)
The site's effects, ported to the kit as reusable, restrained pieces, all opt in. `data-aui-signal` on any element (it has its own context, `el.__auiSig`, next to the element's `data-aui` one, wired and torn down with it; `data-aui="signal"` works too, glitch when it names none). Four effects, several at once with spaces; an empty `data-aui-signal=""` is off:
- `glitch`, from the site's state-change glitch and tear: a MutationObserver on the element's subtree (`aria-selected`, `aria-pressed`, `aria-expanded`, `aria-checked`, `aria-current`, `open`) and a `change` listener. The part that changed gets `.aui-sig-g` (a `translate` of one `ch`, alternating) and one or two strips of light ramp characters on the layer, knocked a character off, one frame each, 50ms a frame, two frames (calm one, loud three). Ignored for the first 250ms after mounting, so a component setting its own state is not a change. At most three bursts a second on the page (`gHist`), one per element per 400ms.
- `scramble`, from `decode()` and the button scramble: once, when an IntersectionObserver sees it. Each text node with a letter or a digit is swapped for `<aui-noise aria-hidden="true">` and `<aui-sr>` (visually hidden, the final words) until it ends; only letters and digits become noise, from `=*#@`, the four ramp characters that are letters to line breaking, so no line gains or loses a place to wrap. Live regions, `aria-hidden` subtrees and fields are skipped. 800 characters at most. The noise is `aui-noise::before{content:attr(data-n)}`, not a text node, so `textContent` mid-decode is the words once (a chart reading its table, a sort, `data-aui-fill` saving its label).
- `band`, the tracking band (`#track`): three rows of `- = -` in a `.aui-sig-band` box on the layer, placed over the element by `transform`, moved by the `aui-sig-band` keyframe in `steps(rows)`. On `<html>` or `<body>` it covers the window. It follows its box on scroll. Every 9s or so (calm 18, loud 5).
- `rot`, from "idle is rot": after `data-rot` seconds (14) without pointer, key, wheel or scroll, the `--h`/`--hb` strings of the `.frame`s in it are rewritten two ramp steps lighter, a step every 1.1s, three steps (calm two, loud five); the old inline values are kept and put back by any input (`sigTouch`).

The layer is one `div.aui-sig` in `body` (and one inside an open modal dialog), fixed, `pointer-events:none`, `aria-hidden`. The level is `--aui-signal` (computed on the element, so it inherits) or the nearest `data-aui-signal-level`, which wins; `off` stops it. The kit's clock (`every`/`tick`, spinners, skeletons, a loading data table) sleeps the same way: an IntersectionObserver marks which elements are on screen, a frame is asked for only when one of those is due, a timer waits between, and with all of them off screen or the tab hidden it waits on nothing. Signal has its own loop, separate from the kit's clock: jobs `{at, fn}`, one `requestAnimationFrame` only when a job is due within a frame, one `setTimeout` for the next one otherwise, nothing with no job. It holds (no frame, no timer, running effects ended and rot repaired) under reduced motion, forced colors, print (`matchMedia('print')` and `beforeprint`) and a hidden tab. It also holds while a field that takes typing has the focus, and with the level `off`. `qa/kit.py` (`signal()`) checks each effect runs when asked, no box moves before, during and after (offsets, which ignore transforms), the aria snapshot of a scrambling paragraph is its words, the band takes no clicks, the flash cap, the focus hold, the level, rot and its repair, no frame asked for when idle, and nothing at all under reduced motion, forced colors and print. The site's Signal section (Themes) does the same with the site's engine (js/30, on `A.times`/`A.every`), and its Code tab prints the kit markup.

## Labs (`js/10` "labs (Themes)", Themes > Labs)
Five toys that used to be the One pager: the ramp (drag to move the light, a slider for exposure), frames are strings (type a character, the frame rebuilds from it), type is a bitmap (up to eight characters develop as a title), the glitch engine (Tear, Split, Shards, Curtain) and sound is oscillators (Ticks, Noise, Chord, Buzz).
