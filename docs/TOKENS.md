# Tokens

## Color roles (`css/01-tokens.css`)

| Variable | Role | Light (Paper) | Dark (Signal) |
|---|---|---|---|
| `--bg` | surface | `#ecebe4` | `#0a0612` |
| `--ink` | text, frames, primary slabs | `#111110` | `#f3eef7` |
| `--muted` | secondary text | `#5c5b55` | `#a79db5` |
| `--hot` | action (primary buttons, title bars, streaks) | `#c91468` | `#ff3d9a` |
| `--pink` | secondary emphasis, halftone tails. 3.07:1 on paper, marks only, never body text (darker reads as magenta) | `#e8478f` | `#ffb3d9` |
| `--cy` | Focus: keyboard focus and nothing else. Info alerts, timestamps and slab edges use `--violet` | `#0a7287` | `#35e6f0` |
| `--ok` | success, checked, on | `#3f6b00` | `#c8f02c` |
| `--warn` | Warning: errors, degraded. Amber in both themes, so Degraded reads milder than Down (`--hot`). 4.96:1 on paper | `#8a5a00` | `#ffd23f` |
| `--deep` | structure, shadows | `#2b2bd1` | `#4a3dff` |
| `--violet` | dividers, walls, tab rules | `#6a45d9` | `#9b7bea` |
| `--t0..--t3` | bitmap title rows top to bottom | ink, ink, hot, deep | ink, pink, hot, violet |
| `--tbar` | the fifth colour bar behind titles | hot (ink would be a black censor bar on paper) | ink |
| `--on-pink` | text on a pink slab | `var(--ink)` | `var(--bg)` |
| `--scan` | scanline overlay color | `rgba(17,17,16,.06)` | `rgba(0,0,0,.28)` |
| `--accent` | alias of `--cy` | | |
| `--danger` | alias of `--warn` | | |
| `--ptitle` | How big a bitmap pixel in a poster title may get, in px. 6 by default, 7 was the old size. Lower it and every title shrinks with it. |
| `--r` | row height | 21px, every width. JS reads it as `A.ROW` | |

Six color roles (surface, text, action, focus, success, warning) and four support shades (`--muted`, `--pink`, `--deep`, `--violet`) make the ten colors. Slab edges are `-2px violet, 2px hot` on ink slabs and `-2px violet, 2px deep` on magenta slabs.

Presets (`css/15`): `amber`, `gameboy`, `blueprint`, `hotdog` override the same ten on `:root[data-preset=...]`. Preset changes for contrast: Game Boy `--deep` `#306230` to `#6a9a35` (1.83 to 3.95:1), Amber `--deep` `#7a4a00` to `#a06400` (2.68 to 4.12:1), Hot dog `--t2`/`--t3` black to `#ffd0a0`/`#ffb3d1` (2.66 to 5.55 and 4.74:1). Hot dog keeps `--deep` black for shadows, and `.chart` redefines it as `--violet` so chart marks read (4.74:1). Adding a preset is one CSS rule plus one entry in the `preset` toggle group in `index.html` (Themes view).

## Ramp
`" .:=+*#%@"`. Index 0..8, space is 0. Named in code: `RAMP` (with the space), `CANON` (without). Tones map to indices: heavy 8 (`@`), dense 7 (`%`), mid 6 (`#`), light 3 (`=`, sides `::` at 2), shade 2 (`:`), faint `- `, danger `/`, error `!`. The Foundations section in Components shows all of this, the color table and the state matrix as static HTML (`css/19-foundations.css`); keep it in step when a value here changes. Custom ramps translate at output time (see EFFECTS.md, Ramp editor).

## Type
Geist Mono 300 (body), 400 (gray text, the bar and the sidebar, which read thin at 300) and 700 (frames, slabs, posters). 14px/21px at every width (1.5, the ratio it always had). Ligatures off, `text-size-adjust:100%`. Charts 12px/14px. Titles sized by `fit()`, roughly 7px at 390px wide. The whole system assumes a monospace font; swapping the family requires nothing else, but check `fitTitles()` and the hero measure.

## Spacing
Horizontal in `ch`, vertical in `var(--r)`. Sections are separated by a faint divider row (`css/02`); in the galleries from 1024px that is one row of air, the rule, one row of air (`css/16`). Docs views open with a `.dochead`, and Components groups start two rows down (`.grouph`). `.demo` is one row below its caption. Cards pad `var(--r) 4ch` (2ch for walls, 2ch for air).

## Glitch amount
`G.amt` 0..1 from the Slider component (`#speed`). Feeds: RGB split width, burst frequency, streak speed, spark count, tear probability, fx ambient sparks, drone detune. `G.on` from the Glitch switch (`#glitchToggle`), which the bar's `/\/` button, the menu and Search all flip; off adds `.calm` to `:root` which hides HUD/track and disables entrances.
