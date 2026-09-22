# Changelog

Versions as published to the artifact URL. Single files for each are in `archive/`.

- **v1** Hybrid prototype: semantic HTML on a character grid, CSS lines through cell centers, ASCII state glyphs. Button, input, checkbox, radio, switch, slider, tabs, card, dialog, progress, toast. Light and dark.
- **v2** Brutalist rewrite: ramp as hierarchy, frames as strings, bitmap titles, posterized hero, halftone bars, paper and ink palette.
- **v3** "Más rosca": spinning torus hero, theme curtain, developing titles, rim march/burst, input ripple, ramp checkbox marks, diagonal bar edges.
- **v4** Glitch: signal palette, canvas hero with streaks/blocks/RGB split/tearing, shard sparks, jolt, glitchy dialog, color-bar curtain, glitch slider and switch, scanlines.
- **v5** (unpublished, no approval) Site: views, Blocks, Charts, boot, destructible UI, command palette, photo hero, scroll-as-signal, VHS HUD, signature + poster, tilt, invaders.
- **v6** Same as v5 plus fixes; published later as part of v8.
- **v7** shadcn structure: index chips, Preview/Code tabs, Installation; 18 new components; 12 new blocks (personal content); sectorized LCD pictures; QA passes at 390/820/1440.
- **v8** Themes (6 presets, pickers, ramp editor, tokens), Play (hero knobs, words, snapshot), Code tab with CSS+JS, install steps. First publish that went through.
- **v9** Humanized sound with fatigue, mobile menu sheet, more air between sections, Apps view (Chirp, Tape, Static support), mobile tap-target and text-size audits.
- **v9.1** Boot screen gets the poster treatment (split bitmap title, color bars, halftone progress, streaks).
- **v9.2** Sliders no longer open the Android keyboard (`inputmode="none"`, blur after touch).
- **v9.3** Titles fit: drop bars, then halve scale, based on measured columns; handles accessibility font scaling.
- **v9.4** Shatter uses the component's own characters, frames, glyphs and LCD pixels, with their colors.
- **v10** This repo: split into `index.html` + `css/` + `js/`, `build.py`, docs, QA scripts, archive.
- **v10.1** One clock: the 33 `setInterval`s become tasks on a single `requestAnimationFrame` loop (`A.every`, `A.times`), with gates, self-stopping handles, a global pause and `qa/clock.py` to keep it that way. No visible change, same cadences.
- **v10.4** Navigation. The top bar gets the name of the kit, and from 1280px a sticky sidebar lists the sections of the view you are in and marks the one you are reading. The hero stops cutting its scene at the edges, six characters of fade on the sides and two rows top and bottom.
- **v10.3** The width pass, reviewed. Cards keep alphabetical order in rows instead of packing masonry-style, so the index and the page agree and the rules line up. Less air above each card. Installation opens the view at full width instead of competing with the first component. Heatmap and Donut sit in columns, only the charts that draw to the page width take the row, and the footer game is centred. A Code tab takes the whole row while it is open. An open menu covers its neighbour instead of blending into it.
- **v10.2** The page uses the screen. `--maxcols` caps the width in characters and steps up at 1024, 1280 and 1600px (80, 100, 124, 165 characters). Components and Blocks become galleries of one, two or three columns, packed against the 24px rows so short sections do not leave holes. Sections with a table, a chart, a picture or a timeline stay full width, and Charts stays one column because charts draw to the page width. `qa/breakpoints.py` checks the column counts, the character snap, overflow and overlap at eight widths.
