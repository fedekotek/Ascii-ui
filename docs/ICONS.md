# Icons

Thirty-nine icons drawn in characters. They are CSS only: each one is a pair of strings on `.icon[data-icon="name"]`, `--i` for the inline drawing and `--il` for the large one, and `.icon::before` prints the one the size asks for. No font of their own, no SVG, no script, so they work without JavaScript, in print and in Windows High Contrast.

```html
<span class="icon" data-icon="search" role="img" aria-label="Search"></span>          <!-- means something alone -->
<span class="icon" data-icon="download" aria-hidden="true"></span> Export              <!-- next to its word -->
<span class="icon icon-lg" data-icon="search" aria-hidden="true"></span>              <!-- large, an empty state -->
```

Where they live:

| What | Where |
|---|---|
| The set, the kit's copy | `kit/ascii-ui.css`, the `icon` block (before `kbd`) |
| The set, the site's copy | `css/25-icons.css`, the same rules, then the Icon section's own styles |
| The names, labels and search words | `ICONS` in js/30, "icons" (the browser in the Icon section) |
| The list people read | `kit/README.md`, Icons |
| The checks | `qa/kit.py`: the three copies agree, README lists every name, and every icon draws in the kit font at its size |

The site does not load the kit, so the table is written twice. Change both, or `qa/kit.py` fails.

## The drawing rules

1. **Printable ASCII only** (space to `~`). The site's font subset holds ASCII and three more characters; the kit's holds Latin-1. ASCII is the part both have, and any monospace font that stands in has it too, so nothing falls back to another font and nothing leaves the grid. No box drawing, no arrows, no dingbats.
2. **Inline is one row, one to three characters.** It sits in a line of text and in a button label, so it cannot be taller than the line. Three is the most a word can live next to. Two or three is the rule; the four chevrons are the one-character exception, because a chevron is one stroke and `>` is already it.
3. **Large is exactly three rows, five or six characters, every row the same width.** Pad with spaces. Five is the default; six only when the shape needs an even middle (the star). Three rows is what an empty state or a tile can give it without becoming a picture.
4. **A small grammar, so they read as one set.**
   - Square brackets are a thing you act on or a box: `[x]` close, `[=]` menu, `[+]` add, `[-]` remove, `[:]` calendar (a page of days), `[o]` lock, `[^]` home, `|[]` copy (a sheet on top of another).
   - Round brackets are a state or a note: `(!)` error, `(i)` info, `(?)` help, `(*)` favorite, `(')` time.
   - `!` is trouble and nothing else: the triangle `/!\` warns, the circle `(!)` is an error. `x` is only close, so an error never reads as a way out.
   - No two icons share a shape with a different mark in it when the mark is all that tells them apart at a glance: settings is three sliders (`-|-`), not a gear in brackets next to the eye `<o>` and the lock `[o]`; the eye struck through is `<\>`, not `<->`, which is an arrow.
   - `[#]` is not an icon: on the site it is the section's link, after every title.
   - Arrows have a shaft (`<-`, `->`, `/|\`, `\|/`); chevrons do not (`<`, `>`, `^`, `v`).
   - An underscore is a floor: `_v_` lands, `_^_` leaves, `_/` is a pencil on the line, `|_|` is a bin.
   - Large circles are ` .-. `, `(   )`, ` '-' `. Anything round uses that same circle (error, info, help, clock, search, refresh).
5. **Weight from the ramp.** The large ones use the ramp (` .:=+*#%@`) for fill and weight, and `|`, `-`, `_`, `/`, `\`, `(`, `)`, `[`, `]`, `<`, `>`, `^`, `v`, `.`, `'` and the backtick for lines. A fill is a ramp character (`:::` in the bin, `===` in the calendar head), never a run of slabs. Dots drawn bigger are round: `...` large is `o o o`.
6. **The same meaning in both sizes.** The large one is the inline one drawn bigger, not a different idea: `/!\` and its triangle, `(!)` and its circle, `[:]` and its page of days.
7. **One meaning per icon.** `[x]` closes. It never deletes; that is `|_|`. If a meaning needs a new shape, add an icon; do not stretch an old one.
8. **Color is the text's.** An icon takes `currentColor`. `.hot` acts, `.ok` confirms, `.warn` warns, `.violet` is structure. Never cyan: cyan is focus. The shape has to say it without the color (a warning is a triangle in print too).
9. **Say it, or hide it.** Alone, `role="img"` and an `aria-label` that says what it means ("Done", not "tick"). Next to its word, `aria-hidden="true"` and no label. The characters are CSS content with empty alt text (`content:var(--i) / ""`), so a screen reader never spells out the slashes.

## Adding one

1. Draw it in a monospace editor at 14px on a 21px line. Inline first, then large. Check it next to a word and inside a button label (labels are uppercase: the icon sets `text-transform:none`, so `v/` stays `v/`).
2. Add the rule to the kit's `icon` block, in the order of the list, one line:
   `.icon[data-icon="name"]{--i:"inline";--il:"row 1\A row 2\A row 3"}`
   `\A` and the one space after it start a row. A backslash is written `\\`. Double quotes cannot be used.
3. Copy the same line into `css/25-icons.css`, at the same place.
4. Add `['name','Label','search words']` to `ICONS` in js/30, at the same place.
5. Add its row to the Icons table in `kit/README.md`, and change "Thirty-nine" there, in the Icon caption in `index.html` and at the top of this file.
6. `python3 qa/kit.py sync`, then `python3 qa/kit.py`: it fails if a name is missing from a copy, if a drawing uses a character outside ASCII, or if an icon is the wrong number of rows or not a whole number of characters wide.

## The set

search, close, menu, plus, minus, check, warning, error, info, help, arrow-up, arrow-down, arrow-left, arrow-right, chevron-up, chevron-down, chevron-left, chevron-right, external, copy, download, upload, edit, delete, settings, user, home, bell, lock, unlock, eye, eye-off, calendar, clock, filter, sort, refresh, more, star. The drawings are in `kit/README.md` and on the site, under Components, Icon.
