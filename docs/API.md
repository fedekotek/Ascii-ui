# JS surface

All scripts are IIFEs. The public surface is three objects on `window`, plus two hooks for the ramp.

## window.AUI (the engine, from js/10-engine.js)

| Member | What it is |
|---|---|
| `$(id)` | `document.getElementById` |
| `G` | glitch state: `{on, amt (0..1), burst (0..1, decays), next, scroll (0..1, scroll velocity)}` |
| `HP` | hero params: `{t1, t2 (the two words), speed, rad, split, tear, streaks, blocks, map}` |
| `rnd(n)`, `rep(c,n)` | random int, repeat string |
| `RAMP` | `" .:=+*#%@"` |
| `reduce` | prefers-reduced-motion |
| `glitch()` | effective glitch amount (0 when off, boosted by scroll) |
| `jolt()` | 260ms page shake + hue rotate + `kick()` |
| `kick()` | one hero burst |
| `spark(x,y,w,h,colorKey,opacity,lifeMs)` | a colored shard in the fx layer |
| `bitmap(text, scale)` | 5x7 font to a 0/1 matrix |
| `scramble(btn)` | button label resolves out of ramp noise |
| `setLabel(btn, text)` | set a `.btn` label (keeps data-text/aria-label in sync) |
| `develop(pre)`, `titleFrame(pre, f)` | animate / draw a bitmap title (f=99 is final) |
| `titles` | array of every `.ptitle` |
| `fitTitles()` | re-measure titles, drop bars or halve scale to fit |
| `say(msg, err)` | toast; lime, or yellow with `!!` when `err` is true |
| `flash(el)` | success: the nearest card or frame goes lime for 120ms, plus a hero burst |
| `wipe(cb)` | theme curtain, calls `cb` under it. Waits its turn if a transition is running |
| `showView(tab, then, instant)` | swap to a view (datamosh), then run `then` once it shows; a call while one is pending replaces the target. js/70 is the caller, through the links |
| `hold(overlay)`, `free()` | the one transition lock: an overlay that holds it eats taps, except on a view link. `free()` runs whatever waited |
| `currentTheme()` | `'dark'|'light'` |
| `layout()` | remeasure everything, resize hero, then `onLayout(W)` |
| `colorize(txt)` | wrap a halftone bar string in colored spans |
| `barRow(k, jitter, n)` | halftone bar of `n` cells with `k` filled |
| `pal()` | current palette `{bg, ink, muted, hot, pink, cy, ok, warn, deep, violet}` as strings |
| `CH()` | current character width in px |
| `charWidth(fs)` | measured glyph width at font size `fs` |
| `fit(cols, W, maxFs)` | largest font size where `cols` glyphs fit in `W` |
| `drawHero()` | one hero frame |
| `spin(x,y)` | set torus spin bias (tilt uses it) |
| `tone(type,f0,f1,dur,vol,when)`, `noise(dur,vol,f0,f1)` | sound primitives |
| `sfx` | `{tick, blip, tab, on, off, ok, err, burst, open, wipe, dev, val(v)}` |
| `SND` | `{on, last}` |
| `live()` | sound on and context running |
| `decode(el)` | text nodes in `el` resolve out of ramp noise |
| `reveal(el, i)` | run the entrance on `el` now |
| `TR(str)` | translate canonical ramp characters to the active ramp |
| `setRamp(str8)`, `rampString()` | set / read the active ramp |
| `bindSlider(input, onChange)` | wire a `.slider` range to its halftone bar |
| `every(ms, fn, opt)` | repeat `fn` on the clock. `opt`: `gate` (run only when it returns true), `el` (run only while the node is on screen), `times` (stop after n), `end` (called when the count runs out), `delay` (wait before the first run). Returns a handle with `.stop()` and `.running()` |
| `times(ms, n, fn, end)` | `every` with a count, for finite animations |
| `clock` | `{pause(), resume(), paused(), count(), every, times, onScreen}` |
| `onScreen(el)` | laid out and inside the viewport |
| `reseed()` | rebuild hero streaks and blocks |
| `refresh()` | re-read palette, redraw hero |
| `src` | set by 20: `(w,h) => Float32Array luminance` when a photo/camera is loaded, else null |
| `onLayout` | set by 20: called with the content width after `layout()` |

Attached by later files: `A.tear(n)`, `A.mosh(cb)`, `A.boot(force, done)`, `A.shatter(el)`, `A.rebuild()`, `A.lcdOf(canvas)`, `A.copy(text, what)`, `A.codeExtra(section, panel)`, `A.picDialog(src, 'poster'|'snap')` (the picture dialog, worded for what it shows), `A.goTo(view, el, block, then)` (switch view, then land on `el` once the switch has scrolled), `A.jump(section)` (js/70: go to a section, land its title under the bar, add a history entry).

Events: `document` gets `aui:view` (detail: the view's tab) after a view has swapped in.

## window.AUI_NAV (from js/70)
`route(hash, push)` (go to `#view` or `#view/section`, returns false for an address that is not a view), `go(view, section, opt)`, `model(view)` (the list the sidebar and menu print: title, count, groups), `build()` (rebuild the sidebar), `index()` (every view and its named sections with keywords, what Search lists), `current()` (the view you are in).

## window.AUI2 (fx, from js/20)
`blip, noise, arp, tick` (wrappers over `A.tone`), `rearm(el)` (re-run an entrance), `show(viewName)`, `boot`, `tear(n)`, `mosh(cb)`, `frameDraw(el)` (frames draw themselves), `esc(str)`, `clamp(v,a,b)`, `inView(el)`.

## window.AUI3 (from js/20)
`INV {size(W), start(), draw()}`, `makePoster()` (returns a PNG data URL), `openCmd()` (opens Search; js/80 replaces it with its own open), `run(line)` (execute a typed command, answers on Search's status line).

## window.AUI_SEARCH (from js/80)
`open()`, `close()`. Search is the palette in `#cmdDlg`: a combobox over a listbox of views, sections, settings and tricks.

## window.AUI_JS (from js/30)
Registry of component source for the Code tab: `{calendar, dropdown, otp, pagination, spinners}`. Each is a function whose `toString()` is printed. To add one, wrap the component's wiring in `window.AUI_JS.name=function(){...};window.AUI_JS.name();` and map the section id in `JSMAP` (js/40).

## window.AUI_TONES(), window.AUI_MAP
`AUI_TONES()` writes the frame strings to `<style id="aui-tones">`. `AUI_MAP` is `null` (canonical ramp) or `{'.':'x', ':':'y', ...}`. Do not set it directly; use `A.setRamp()`.

## Search (`/`, Ctrl K or Cmd K, the search button in the bar)
Nothing typed: Views, On this page (Home: Getting started), Settings (Theme, Sound, Glitch, Show grid, flipped in place), Tricks (Tear, Jolt, Boot, Poster, Invaders, Load a photo, Rebuild). Typing searches every section of every view by name, poster title and caption. A typed command gets a Run row on top. The commands:
`help`, `glitch 0-100`, `theme`, `sound on|off`, `goto components|blocks|charts|themes|play|apps|onepager` (also `kit`, `page`, and `view/section`), `rm -rf button|card|chart|title|all`, `rebuild`, `tear`, `jolt`, `boot`, `poster`, `sign NAME`, `invaders` (goes to Components first), `photo` (opens the picker and lands on Play's Source), `ring` (alias `torus`), `tilt`, `sudo`.

## Keyboard
`/` and Ctrl K (Cmd K) Search, then arrows, Home, End, PageUp, PageDown, Enter and Escape inside it, `g` glitch jolt, arrows + space in invaders, arrows/Home/End in tablists, arrows/Escape in the dropdown, Backspace/arrows/paste in OTP.

## Data attributes
`data-text` (bitmap title), `data-nobars` (title without color bars), `data-rv` (element gets an entrance), `data-cat` (block category for filters), `data-scene|data-cols|data-rows|data-mode` on `canvas.lcd`, `data-spark` (sparkline values 0..7 comma separated), `data-go` (unused legacy nav hook).

## CSS classes worth knowing
`.frame` + `.tone-heavy|dense|mid|light|shade|faint|danger|error` (border character), `.mid` (row with side strings), `.lift` (offset shadow wrapper), `.card`, `.bar-title`, `.body` (walls), `.btn .btn-primary .btn-danger`, `.field .invalid .area`, `.check` (checkbox/radio/switch), `.slider .slider-track .bar`, `.progress`, `.tablist .tab .tabpanel`, `.badge .b-ok .b-warn .b-hot .b-out`, `.alert .info`, `.acc` (details), `.skel`, `.poster .ptitle`, `.lcd`, `.chart`, `.phone .app` (Apps), `.u .in` (entrance), `.calm` on `:root` when glitch is off.
