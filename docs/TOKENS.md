# Tokens

## Color roles (`css/01-tokens.css`)

| Variable | Role | Light (Paper) | Dark (Signal) |
|---|---|---|---|
| `--bg` | surface | `#ecebe4` | `#0a0612` |
| `--ink` | text, frames, primary slabs | `#111110` | `#f3eef7` |
| `--muted` | secondary text | `#5c5b55` | `#a79db5` |
| `--hot` | action (primary buttons, title bars, streaks) | `#d6156f` | `#ff3d9a` |
| `--pink` | secondary emphasis, halftone tails | `#e8478f` | `#ffb3d9` |
| `--cy` | focus and feedback (nothing else) | `#0b7f96` | `#35e6f0` |
| `--ok` | success, checked, on | `#3f6b00` | `#c8f02c` |
| `--warn` | danger, error | `#c0260f` | `#ffd23f` |
| `--deep` | structure, shadows | `#2b2bd1` | `#4a3dff` |
| `--violet` | dividers, walls, tab rules | `#6a45d9` | `#9b7bea` |
| `--t0..--t3` | bitmap title rows top to bottom | ink, ink, hot, deep | ink, pink, hot, violet |
| `--scan` | scanline overlay color | `rgba(17,17,16,.06)` | `rgba(0,0,0,.28)` |
| `--accent` | alias of `--cy` | | |
| `--danger` | alias of `--warn` | | |
| `--ptitle` | How big a bitmap pixel in a poster title may get, in px. 6 by default, 7 was the old size. Lower it and every title shrinks with it. |
| `--r` | row height | 24px (22px at 720px+) | |

Presets (`css/15`): `amber`, `gameboy`, `blueprint`, `hotdog` override the same ten on `:root[data-preset=...]`. Adding a preset is one CSS rule plus one entry in the `preset` toggle group in `index.html` (Themes view).

## Ramp
`" .:=+*#%@"`. Index 1..8. Named in code: `RAMP`, `CANON`. Tones map to indices: heavy 8, dense 7, mid 6, light 4/3, shade 3, faint `- `. Custom ramps translate at output time (see EFFECTS.md, Ramp editor).

## Type
Geist Mono 500 (body) and 700 (frames, slabs, posters). 16px/24px on mobile, 15px/22px at 720px+. Ligatures off, `text-size-adjust:100%`. Charts 12px/14px. Titles sized by `fit()`, roughly 7px at 390px wide. The whole system assumes a monospace font; swapping the family requires nothing else, but check `fitTitles()` and the hero measure.

## Spacing
Horizontal in `ch`, vertical in `var(--r)`. Sections are 5 rows apart with a faint divider (`css/02`). `.demo` is one row below its caption. Cards pad `var(--r) 4ch` (2ch for walls, 2ch for air).

## Glitch amount
`G.amt` 0..1 from the Slider component (`#speed`). Feeds: RGB split width, burst frequency, streak speed, spark count, tear probability, fx ambient sparks, drone detune. `G.on` from the Glitch switch; off adds `.calm` to `:root` which hides HUD/track and disables entrances.
