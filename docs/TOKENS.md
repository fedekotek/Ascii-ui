# Tokens

## Color roles (`css/01-tokens.css`)

| Variable | Role | Light (Paper) | Dark (Signal) |
|---|---|---|---|
| `--bg` | surface | `#ecebe4` | `#0a0612` |
| `--ink` | text, frames, primary slabs | `#111110` | `#f3eef7` |
| `--muted` | secondary text | `#5c5b55` | `#a79db5` |
| `--hot` | action (primary buttons, title bars, streaks), and the worst state (Down, an outage) | `#c91468` | `#ff3d9a` |
| `--pink` | secondary emphasis, halftone tails. 3.07:1 on paper, marks only, never body text (darker reads as magenta) | `#e8478f` | `#ffb3d9` |
| `--cy` | Focus: keyboard focus and nothing else. Info alerts, timestamps and slab edges use `--violet` | `#0a7287` | `#35e6f0` |
| `--ok` | success, checked, on | `#3f6b00` | `#c8f02c` |
| `--warn` | Warning: errors, degraded. Yellow (amber on paper), so Degraded reads milder than Down (`--hot`). 4.96:1 on paper | `#8a5a00` | `#ffd23f` |
| `--deep` | structure, shadows | `#2b2bd1` | `#4a3dff` |
| `--violet` | dividers, walls, tab rules | `#6a45d9` | `#9b7bea` |
| `--t0..--t3` | bitmap title rows top to bottom | ink, ink, hot, deep | ink, pink, hot, violet |
| `--tbar` | the fifth colour bar behind titles | hot (ink would be a black censor bar on paper) | ink |
| `--on-pink` | text on a pink slab | `var(--ink)` | `var(--bg)` |
| `--scan` | scanline color, drawn only with the `crt` class (see below) | `rgba(17,17,16,.06)` | `rgba(0,0,0,.28)` |
| `--accent` | alias of `--cy` | | |
| `--danger` | alias of `--warn` | | |
| `--ptitle` | How big a bitmap pixel in a poster title may get, in px. 6 by default, 7 was the old size. Lower it and every title shrinks with it. |
| `--r` | row height | 21px, every width. JS reads it as `A.ROW` | |

Six color roles (surface, text, action, focus, success, warning) and four support shades (`--muted`, `--pink`, `--deep`, `--violet`) make the ten colors. Slabs are plain reverse video; the 2px colored edges they had are gone. Decoration (title bars, button rims, halftone bars, the wipe, sparks, the poster, the invaders) uses magenta, pink, violet, deep and ink only, never cyan, lime or yellow, so those three keep their meaning.

**Error or worst state.** Two colors carry bad news and they mean different things:
- Yellow (`--warn`) is an error you can fix or a thing that is degraded: a field that is wrong (a `!` rim), a failed toast (`!!`), a wrong OTP code, a Degraded badge, a latency spike.
- Magenta (`--hot`) is the worst state, where nothing is left to fix on your side: Down, an outage in Regions. It is also the action color, which is why Down is a slab with a word on it, never a color alone.

A field error next to a Publish button is yellow next to magenta, which is the reason the two must stay clearly apart (see Rebrand in ARCHITECTURE.md). No state rests on color alone: errors carry `!`, a pick carries a slab, a `>` or brackets.

Presets (`css/15`): `amber`, `gameboy`, `blueprint`, `hotdog` override the same ten on `:root[data-preset=...]`. Preset changes for contrast: Game Boy `--deep` `#306230` to `#6a9a35` (1.83 to 3.95:1), Amber `--deep` `#7a4a00` to `#a06400` (2.68 to 4.12:1), Hot dog `--t2`/`--t3` black to `#ffd0a0`/`#ffb3d1` (2.66 to 5.55 and 4.74:1). Hot dog keeps `--deep` black for shadows, and `.chart` redefines it as `--violet` so chart marks read (4.74:1). Adding a preset is one CSS rule plus one entry in the `preset` toggle group in `index.html` (Themes view).

## Scanlines (`crt`)
Off by default. They striped every slab, printed as blank pages and are not characters. `:root.crt` turns them on: `body::before` draws `--scanlines` (built from `--scan`, one line in four) over the page, and every dialog draws its own in `::after` and `::backdrop`. On the site the switch is CRT scanlines under Settings in Search, remembered in `localStorage['aui-crt']`. In the kit it is `class="crt"` on `<html>`.

## Motion (kit only, `kit/ascii-ui.css`)
Every animation in the kit takes its time and its steps from these. Motion is steps, never eased: a step is a whole character or a whole row. Set a duration to `0s` to turn that motion off; reduced motion turns off all of it.

| Token | Value | Used by |
|---|---|---|
| `--aui-quick` | `.16s` | a switch flips, a tooltip types in, a panel opens (popover, combobox, context menu) |
| `--aui-base` | `.24s` | a toast types in, an alert dialog nudges |
| `--aui-slow` | `.28s` | a sheet comes up |
| `--aui-toast` | `3.6s` | the shortest a toast stays; longer words stay longer, and it pauses under the pointer or focus (`ascii-ui.js` reads it) |
| `--aui-ease-flip` | `steps(2)` | the switch thumb |
| `--aui-ease-type` | `steps(12)` | the tooltip and the toast, typed in from the left |
| `--aui-ease-wipe` | `steps(4)` | a panel, a row a step |
| `--aui-ease-rise` | `steps(7)` | the sheet, from the bottom |
| `--aui-ease-jolt` | `steps(1,end)` | the nudge, no in-betweens |

The site does not read these; its own timings are in css/ and the engine (see EFFECTS.md).

## Print, high contrast, more contrast (`css/29-print.css`)
Print sets every token to black on white and drops the bar, sidebar, effects and canvases. Forced colors (Windows High Contrast) brings slabs back in system colors: CanvasText for what is picked, Highlight for focus. `prefers-contrast:more` moves gray text two thirds of the way to ink, makes faded rules solid and sets body type to 400. The kit has the same three blocks.

## Ramp
`" .:=+*#%@"`. Index 0..8, space is 0. Named in code: `RAMP` (with the space), `CANON` (without). Tones map to indices: heavy 8 (`@`), dense 7 (`%`), mid 6 (`#`), light 3 (`=`, sides `::` at 2), shade 2 (`:`), faint `- `, danger `/`, error `!`. The Foundations section in Components shows all of this, the color table and the state matrix as static HTML (`css/19-foundations.css`); keep it in step when a value here changes. Custom ramps translate at output time (see EFFECTS.md, Ramp editor).

## Type
Geist Mono 300 (body), 400 (gray text, the bar and the sidebar, which read thin at 300) and 700 (frames, slabs, posters). 14px/21px at every width (1.5, the ratio it always had). Ligatures off, `text-size-adjust:100%`. Charts 12px/14px. Titles sized by `fit()`, roughly 7px at 390px wide. The whole system assumes a monospace font; swapping the family requires nothing else, but check `fitTitles()` and the hero measure.

## Spacing
Horizontal in `ch`, vertical in `var(--r)`. Sections are separated by a faint divider row (`css/02`); in the galleries from 1024px that is one row of air, the rule, one row of air (`css/16`). Docs views open with a `.dochead`, and Components groups start two rows down (`.grouph`). `.demo` is one row below its caption. Cards pad `var(--r) 4ch` (2ch for walls, 2ch for air).

## Glitch amount
`G.amt` 0..1 from the Slider component (`#speed`). Feeds: RGB split width, burst frequency, streak speed, spark count, tear probability, fx ambient sparks, drone detune. `G.on` from the Glitch switch (`#glitchToggle`), which the bar's `/\/` button, the menu and Search all flip; off adds `.calm` to `:root` which hides HUD/track and disables entrances.
