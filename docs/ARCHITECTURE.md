# Architecture

ascii/ui is one page with seven views (tab panels), a footer game, five overlay dialogs and a fixed fx layer. It has no router, no components framework and no state library. State lives in DOM attributes (`aria-selected`, `aria-pressed`, `data-theme`, `data-preset`) and in a handful of module-level variables inside each script.

## Load order

```
css/01-tokens.css           colors, light/dark, --r (row height)
css/02-base-grid.css        body, main, grid overlay, scanlines, jolt keyframes
css/03-posters.css          .poster, .ptitle (bitmap titles)
css/04-frame.css            .frame, .mid  (borders made of strings)
css/05..12                  one file per primitive
css/13-rules-shell-blocks-charts.css   site shell, badge/alert/select/skeleton, blocks, charts, invaders, overlays
css/14-docs-components-lcd.css         Preview/Code docs structure, 18 components added in v7, LCD, blocks added in v7
css/15-themes-play-menu-apps.css       presets, ramp editor, Play view, menu sheet, Apps view

js/00-tones.js              window.AUI_TONES(): writes the frame strings (--h-*, --s-*, --v-*) into a <style>. Runs in <head>.
                            Reads window.AUI_MAP to translate the canonical ramp into a custom one.

(body markup)

js/10-engine.js             THE ENGINE. window.AUI. Sound synth, bitmap font, titles, layout, hero (torus on canvas),
                            fx sparks, button rims, checkbox develop, theme curtain, sliders, tabs/views, toast,
                            card+dialog, progress, one-pager wiring, reveal-on-scroll + text decode.
js/20-glitch-play.js        window.AUI2, window.AUI3. Sound wrappers, tear, frames that draw themselves, datamosh,
                            boot, scroll-as-signal + idle rot, shatter/sand, photo/camera hero, VHS HUD, tilt,
                            signature + poster, command palette, space invaders, character-grid charts,
                            sparklines, skeleton, blocks wiring (login, table, pricing), layout hook, start.
js/30-lcd-components-docs.js  LCD pictures, the 18 v7 components (calendar, dropdown, otp, pagination, spinner...),
                            the v7 blocks (profile, recipe, build, work orders, settings, crit, 404),
                            the shadcn-style docs builder (sort, index, Preview/Code tabs, filters).
js/40-themes-ramp-code.js   presets, color pickers, ramp editor, Play view knobs, Code tab CSS/JS extraction, Install section.
js/50-menu-apps.js          mobile menu sheet, Chirp (feed), Tape (player), Static support (chat).
```

Every js file is an IIFE. They share three globals created by `10-engine.js` and extended later:

- `window.AUI` (`A` inside scripts): the engine surface. See API.md.
- `window.AUI2` (`B`): fx and transitions.
- `window.AUI3` (`C`): invaders, poster, command palette.

Later scripts attach to `A` (e.g. `A.shatter`, `A.lcdOf`, `A.codeExtra`, `A.onLayout`). Earlier scripts call these guarded (`if(window.AUI&&AUI.onLayout)`), because `layout()` runs before the later files load.

## Page skeleton

```
<span id="probe">           50 M's, used to measure the real character width
<main id="main">
  <header>                  hero canvas, load photo / camera / torus, lede, grid + glitch + sound toggles, theme button, hint, SIG + poster
  <div class="viewsbar">    [=] menu button (mobile), tablist of 7 views, >_ command button
  <div id="view-kit">       Components (30 sections + Rules)
  <div id="view-blocks">    Blocks (16 sections, category filters)
  <div id="view-charts">    Charts (5)
  <div id="view-themes">    Presets, Colors, Ramp, Tokens
  <div id="view-play">      #playStage (the hero moves here), Words, Knobs
  <div id="view-apps">      Feed, Player, Chat
  <div id="view-page">      One pager (Static, the fake uptime monitor) + Lab toys
  <footer id="foot">        Invaders
</main>
<dialog #publishDialog>     card demo
<div #fx>                   sparks and tears (fixed, pointer-events:none)
<canvas #sand>              shattered characters and the pile
<div #rebuild>              Rebuild button, shown after a shatter
<div #hud> <div #track>     VHS timecode, rolling tracking band
<dialog #sheetDlg .sheet>   bottom sheet demo
<dialog #menuDlg .sheet>    mobile menu
<dialog #cmdDlg>            command palette
<dialog #posterDlg>         generated poster / snapshot
<div #toast>
```

Views are a tablist (`.views`). Switching runs `wipe` (color-bar curtain) or `mosh` (datamosh), alternating. Section reveal uses IntersectionObserver on `[data-rv]` elements; `reveal()` adds `.in`, plays the glitch-in keyframe, decodes text, draws frames, and calls `el._anim()` if the element has one (charts use this to grow in).

## The grid

Everything is a character. `--r` is 24px, everywhere, at every width. `main` width is snapped to a whole number of `ch` in `layout()`. The hero canvas measures the real glyph width (`ctx.measureText('M')`) and sizes itself to `HC` columns. Titles are 5x7 bitmaps rendered at 2 characters per pixel, and `fitTitles()` drops the color bars or halves the scale when the box is too narrow.

## Page width and the galleries

`css/16-grid.css` owns how wide the page gets. `--maxcols` is a cap in characters and steps up at four breakpoints: 80 by default (the width the kit was designed at), 100 from 1024px, 124 from 1280px, 166 from 1600px (about 1600 real pixels). `layout()` reads it and snaps `main` to that many whole characters, so the cap is a design decision in css, not a number in js.

Components, Blocks and Charts are galleries: each panel is one css grid of columns at least `--galmin` (46ch) wide, so they hold one column on a phone, two from 1024px and three from 1600px. The steps are chosen so the columns land on whole characters: at 165 columns, minus 4 of padding and 8 of gutter, three columns of 51ch.

Sections keep their document order, row by row, left to right. A row is as tall as its tallest card, so short cards leave air under them. Masonry would close those gaps but it breaks the promise the alphabetical index makes, and it stops the cards in a row from starting at the same height, which is what lets their dashed rules line up. Plain rows, on purpose.

A section that cannot live in a narrow column carries `data-span`. `spanSections()` in js/30 sets `full` on anything holding a table, a phone frame, a timeline, a picture or a stat row. `index.html` sets it by hand on the three charts that draw to the page width (Bars, Line, Regions); Heatmap and Donut are fixed-size drawings and sit in a column. `docify()` sets `code` on a section while its Code tab is open, because code lines are long and a 46ch column would show half of each one. Anything with a `data-span` takes the whole row.

## The ramp

`RAMP = " .:=+*#%@"` (index 0 is space, 1..8 lightest to heaviest). Every fill, fade, chart and explosion is an index into it. The ramp editor does not touch that code: `A.setRamp()` stores a translation map in `window.AUI_MAP`, `A.TR(str)` applies it, `AUI_TONES()` rebuilds the frame strings, and `CanvasRenderingContext2D.prototype.fillText` is patched to translate. Anything drawn with raw characters that bypasses `TR()` will not follow the ramp; that is the one rule to keep when adding output.

## Color

Ten variables: `--bg --ink --muted --hot --pink --cy --ok --warn --deep --violet`, plus `--t0..--t3` (title rows) and `--scan`. Presets override all of them on `:root[data-preset]`. Pickers write inline `--x` on `:root`. Canvas code reads them through `readPalette()` into `PAL` and must call `A.refresh()` after a change. Rule: `--cy` is focus and feedback only.

## Timing

One clock, in `js/10-engine.js`. Every repeating animation is a task on a single `requestAnimationFrame` loop; there are no `setInterval`s left in the page. A task is `{ms, fn, gate}`: the loop runs `fn` when its cadence is due, the tab is visible, the clock is not paused and its gate returns true. Missed frames are dropped instead of queued, so nothing stampedes after the tab comes back. The loop stops itself when the task list empties and restarts when a task is added or the tab becomes visible again.

```js
var t = A.every(125, draw, {el: canvas});   // repeats while the node is on screen
A.every(85, frame, {gate: function(){return visible}});
A.times(45, 15, paintFrame, function(){ done() });   // 15 frames, then the end callback
t.stop();                                   // handles stop themselves
A.clock.pause(); A.clock.resume(); A.clock.count();
```

Cadences are unchanged: hero ~12 fps (85ms), LCDs 8 fps (125ms), invaders 20 fps (50ms), the tape 4 fps (250ms). `qa/clock.py` asserts the invariants (no `setInterval` survives, tasks run, pause freezes them, finite tasks get reaped).

## Sound

One `AudioContext`, created on first pointerdown/keydown (browsers require a gesture). `tone(type,f0,f1,dur,vol,when)` and `noise(dur,vol,f0,f1)` are the primitives. `human()` randomizes pitch, duration and volume, and applies fatigue: the same sound within 2.2s gets 16 percent quieter each time, shorter after 3, skipped half the time after 5. `sfx.*` are named motifs. `A.live()` says whether sound is on and running.

## What is intentionally not here
- No i18n. Copy is English, a couple of Rioplatense words in personal blocks.
- No persistence beyond `sessionStorage['aui-boot']` and `localStorage['aui-hi']` (invaders high score).
- No analytics, no network requests except the font.
