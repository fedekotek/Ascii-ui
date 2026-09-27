# JS surface

This page is the site's JS surface. All scripts are IIFEs. The public surface is six objects on `window` (`AUI`, `AUI2`, `AUI3`, `AUI_NAV`, `AUI_SEARCH`, `AUI_JS`), one function (`AUI_WIDE`), plus two hooks for the ramp (`AUI_TONES`, `AUI_MAP`).

The kit is separate: `window.ASCIIUI` exists only on a page that links `kit/ascii-ui.js`, never on the site itself (the site embeds the kit files as text, in `KIT()` at the end of js/40, only to print and download them). See the last section, and `kit/README.md` for the whole kit API.

## window.AUI (the engine, from js/10-engine.js)

| Member | What it is |
|---|---|
| `$(id)` | `document.getElementById` |
| `backdropClose(dialog)` | a tap on the backdrop closes the dialog: on click, and only when the press started on the backdrop too, so a drag out of the sheet does not close it. The sheet and Search use it |
| `ROW` | the row height in px, read from `--r` (21). Use it instead of a hard-coded number |
| `G` | glitch state: `{on, amt (0..1), burst (0..1, decays), next, scroll (0..1, scroll velocity)}` |
| `HP` | hero params: `{t1, t2 (the two words, COPY IT and OWN IT), speed, rad, split, tear, streaks, blocks, map}`. Nothing on the page edits them since Play went; they are still read on every frame |
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
| `every(ms, fn, opt)` | repeat `fn` on the clock. `opt`: `gate` (run only when it returns true), `el` (run only while the node is on screen), `times` (stop after n), `end` (called when the count runs out), `delay` (wait before the first run), `sleep` (how long a gated-off task waits before it asks its gate again, 1000ms; `Infinity` when whatever opens the gate calls `.wake()`). Returns a handle with `.stop()`, `.running()` and `.wake(ms)` |
| `times(ms, n, fn, end)` | `every` with a count, for finite animations |
| `clock` | `{pause(), resume(), paused(), count(), every, times, onScreen}` |
| `onScreen(el)` | laid out and inside the viewport |
| `reseed()` | rebuild hero streaks and blocks |
| `refresh()` | re-read palette, redraw hero |
| `src` | set by 20: `(w,h) => Float32Array luminance` when a photo/camera is loaded, else null |
| `onLayout` | set by 20: called with the content width after `layout()` |
| `onView` | set by 40 (`placeHero`): called with the new tab on every view switch, before the landing is measured. Shows the header and the game on Home only |

Attached by later files: `A.tear(n)`, `A.mosh(cb)`, `A.boot(force, done)`, `A.shatter(el)`, `A.rebuild()`, `A.lcdOf(canvas)`, `A.copy(text, what)`, `A.kitify(section, clone)` (js/40: runs the section's `KITIFY` entry, then strips ids and demo scaffolding, see COMPONENTS.md), `A.codeExtra(section, html)` (js/40: returns `{css, js}`, the kit CSS blocks and kit behavior text the Code tab prints under the HTML), `A.picDialog(src, 'poster'|'snap')` (the picture dialog, worded for what it shows; nothing asks for `'snap'` since Play's Snapshot went), `A.goTo(view, el, block, then)` (switch view, then land on `el` once the switch has scrolled), `A.jump(section)` (js/70: go to a section, land its title under the bar, add a history entry).

Events: `document` gets `aui:view` (detail: the view's tab) after a view has swapped in.

## window.AUI_NAV (from js/70)
`route(hash, push)` (go to `#view` or `#view/section`, returns false for an address that is not a view), `go(view, section, opt)`, `model(view)` (the list the sidebar and menu print: title, count, groups), `build()` (rebuild the sidebar), `index()` (every view and its named sections with keywords, what Search lists), `current()` (the view you are in).

## window.AUI2 (fx, from js/20)
`blip, noise, arp, tick` (wrappers over `A.tone`), `rearm(el)` (re-run an entrance), `show(viewName)`, `boot`, `tear(n)`, `mosh(cb)`, `frameDraw(el)` (frames draw themselves), `esc(str)`, `clamp(v,a,b)`, `inView(el)`.

## window.AUI3 (from js/20)
`INV {size(W), start(), draw()}`, `makePoster()` (returns a PNG data URL), `openCmd()` (opens Search; js/80 replaces it with its own open), `run(line)` (execute a typed command, answers on Search's status line). The old command prompt is gone; `run()` is the verb layer under Search.

## window.AUI_SEARCH (from js/80)
`open()`, `close()`. Search is the palette in `#cmdDlg` (js/80, css/18): a combobox input over a listbox. The list is rebuilt from `AUI_NAV.index()` each time it opens.

## window.AUI_JS (from js/30)
The site's own wiring for five demos: `{calendar, dropdown, otp, pagination, spinners}`, each a function that js/30 defines and calls once. Nothing reads it any more: the Code tab prints the kit's behaviors instead (`behaviors.NAME` from `kit/ascii-ui.js`, see COMPONENTS.md, What the Code tab prints). There is no `JSMAP`. New site wiring does not need to go here.

## window.AUI_WIDE() (from js/30)
Re-checks every `.tablewrap` and sets `data-wide` on the ones whose table is wider than the box, so CSS can say there is more to the side (on touch there is no scrollbar). Runs on load and after every view switch; call it after you change a table.

## window.AUI_TONES(), window.AUI_MAP
`AUI_TONES()` writes the frame strings to `<style id="aui-tones">`. `AUI_MAP` is `null` (canonical ramp) or `{'.':'x', ':':'y', ...}`. Do not set it directly; use `A.setRamp()`.

## Search (`/`, Ctrl K or Cmd K, `#cmdBtn` in the bar)
Nothing typed: Views (Home, Components, Blocks, Charts, Themes), On this page (the sections of the view you are in; Home offers Getting started), Settings (Theme, Sound, Glitch, Show grid, flipped in place), Components (Button, Input, Card and dialog, Select, Toast), Tricks (Tear, Jolt, Boot, Poster, Invaders, Feed the ring a photo, Rebuild). Typing searches every section of every view by name, poster title, caption and the other names people type (`ALIAS` in js/80: accordion finds Details, drawer finds Sheet, modal finds Card and dialog, install finds Get the kit), and a word four letters or longer may be one typo off. Once typing stops, the count is read out on the dialog's status line (`#cmdOut`), visually hidden. A typed command gets a Run row on top. The commands:
`help`, `glitch 0-100`, `theme`, `sound on|off`, `goto home|components|blocks|charts|themes` (alias `cd`; also `kit` and `view/section`; `play`, `apps`, `onepager` and `page` land on Home), `rm -rf button|card|chart|title|all`, `rebuild`, `tear`, `jolt`, `boot`, `poster`, `sign NAME`, `invaders` (goes to the game and starts it), `photo` (opens the picker and lands on the Home hero), `ring` (alias `torus`, back to the ring), `tilt`, `sudo`.

## Keyboard
`/` and Ctrl K (Cmd K) Search, then arrows, Home, End, PageUp, PageDown, Enter and Escape inside it, `g` glitch jolt, arrows + space in invaders, arrows/Home/End in tablists, arrows/Escape in the dropdown, Backspace/arrows/paste in OTP.

## Data attributes
Site: `data-text` (bitmap title), `data-nobars` (title without color bars), `data-rv` (element gets an entrance), `data-cat` (block category for filters), `data-scene|data-cols|data-rows|data-mode` on `canvas.lcd`, `data-spark` (sparkline values 0..7 comma separated), `data-v` (the view a Home tile goes to), `data-group` (set by the docs builder on each component: its group), `data-span` (`full`: the section takes the whole gallery row). Kit: `data-aui="NAME"` and the `data-aui-*` button attributes, listed in `kit/README.md` and per component in `docs/COMPONENTS-REFERENCE.md`. The Code tab adds them (`KITIFY`, js/40); the site's own demos do not use them.

## CSS classes worth knowing
`.frame` + `.tone-heavy|dense|mid|light|shade|faint|danger|error` (border character), `.mid` (row with side strings), `.lift` (offset shadow wrapper), `.card`, `.bar-title`, `.body` (walls), `.btn .btn-primary .btn-danger`, `.field .invalid .area`, `.check` (checkbox/radio/switch), `.slider .slider-track .bar`, `.progress`, `.tablist .tab .tabpanel`, `.badge .b-ok .b-warn .b-hot .b-out`, `.alert .info`, `.acc` (details), `.skel`, `.poster .ptitle`, `.lcd`, `.chart`, `.dochead` (a docs view's one title and lede), `.grouph` (a component group label), `.band` (a Home section label), `.tile` (Home link tiles), `.inl` (inline link), `.linkbtn` (a button that reads as a link), `.u .in` (entrance), `.calm` on `:root` when glitch is off. The kit uses the same class names for the same parts; its blocks are listed in `kit/ascii-ui.css` (`/* ==== name: selectors ==== */`).

## window.ASCIIUI (the kit, from kit/ascii-ui.js)
Only on pages that link the kit. `version` (a semver string; the kit engineer owns it, the changes are in the kit changelog next to it), `init(root)` (wire a part of the page by hand; elements added later are wired by a MutationObserver anyway), `toast(msg, err)`, `progress(el, pct)`, `bar(k, n)` and `colorize(str)` (halftone bars), `tones(map)` (swap the frame characters), `behaviors` (the functions `data-aui` names), `reduce`. Components fire bubbling `aui:*` events with details in `event.detail`. The lifecycle calls, validation API and the full event list are documented in `kit/README.md`; that file is the reference, this is a pointer.
