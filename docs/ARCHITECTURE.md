# Architecture

ascii/ui is one page with five views (tab panels: Home, Components, Blocks, Charts, Themes), a footer game on Home, five overlay dialogs and a fixed fx layer. It has no router, no components framework and no state library. State lives in DOM attributes (`aria-selected`, `aria-pressed`, `data-theme`, `data-preset`) and in a handful of module-level variables inside each script.

## Load order

```
css/01-tokens.css           colors, light/dark, --r (row height, 21px)
css/02-base-grid.css        body, main, grid overlay, scanlines, jolt keyframes
css/03-posters.css          .poster, .ptitle (bitmap titles)
css/04-frame.css            .frame, .mid  (borders made of strings)
css/05..10                  one file per primitive
css/11-views-onepager.css   view tabs, the lab pieces (now in Themes > Labs), details. The name is historical
css/12-toast.css
css/13-rules-shell-blocks-charts.css   site shell, badge/alert/select/skeleton, blocks, charts, invaders, overlays
css/14-docs-components-lcd.css         Preview/Code docs structure, 18 components added in v7, LCD, blocks added in v7
css/15-themes-play-menu-apps.css       presets, ramp editor, install. The name is historical: Play and Apps are gone
css/16-grid.css             page width, galleries, the Home page, .dochead, .grouph, docs section headings
css/17-nav.css              the top bar, the sidebar, the [=] menu
css/18-search.css           Search, the palette in #cmdDlg

js/00-tones.js              window.AUI_TONES(): writes the frame strings (--h-*, --s-*, --v-*) into a <style>. Runs in <head>.
                            Reads window.AUI_MAP to translate the canonical ramp into a custom one.

(body markup)

js/10-engine.js             THE ENGINE. window.AUI. Clock, sound synth, bitmap font, titles, layout (A.ROW), hero
                            (torus on canvas), fx sparks, button rims, checkbox develop, theme curtain, sliders,
                            tabs/views, toast, card+dialog, progress, the Themes labs, reveal-on-scroll + text decode.
js/20-glitch-play.js        window.AUI2, window.AUI3. Sound wrappers, tear, frames that draw themselves, datamosh,
                            boot, scroll-as-signal + idle rot, shatter/sand, photo/camera hero, VHS HUD, tilt,
                            signature + poster, run() (typed commands for Search), space invaders, character-grid charts,
                            sparklines, skeleton, blocks wiring (login, table, pricing), layout hook, start.
js/30-lcd-components-docs.js  LCD pictures, the 18 v7 components (calendar, dropdown, otp, pagination, spinner...),
                            the v7 blocks (profile, recipe, build, work orders, settings, crit, 404),
                            the shadcn-style docs builder (groups, sort, index, Preview/Code tabs, filters).
js/40-themes-ramp-code.js   presets, color pickers, ramp editor, Home (hero buttons, tiles, placeHero),
                            Code tab CSS/JS extraction, Get the kit section.
js/70-nav.js                navigation: the addresses (#view/section), the view links in the bar, the
                            sidebar, the [=] menu, the name, the skip link, the scroll spy and the landing.
js/80-search.js             Search: the palette in #cmdDlg (views, sections, settings, tricks, typed commands).
```

Every js file is an IIFE. They share these globals (see API.md):

- `window.AUI` (`A` inside scripts): the engine surface, from js/10, extended by the later files.
- `window.AUI2` (`B`): fx and transitions, from js/20.
- `window.AUI3` (`C`): invaders, poster, `run()` for typed commands, from js/20.
- `window.AUI_JS`: component source for the Code tab, and `window.AUI_WIDE()`, which marks tables wider than their box, from js/30.
- `window.AUI_NAV`: addresses, the sidebar and menu model, the search index, from js/70.
- `window.AUI_SEARCH`: Search `open()` and `close()`, from js/80.
- `window.AUI_TONES()` and `window.AUI_MAP`: the frame strings and the ramp translation, from js/00.

Later scripts attach to `A` (e.g. `A.shatter`, `A.lcdOf`, `A.codeExtra`, `A.onLayout`). Earlier scripts call these guarded (`if(window.AUI&&AUI.onLayout)`), because `layout()` runs before the later files load.

## Page skeleton

```
<span id="probe">           50 M's, used to measure the real character width
<a #skip>                   Skip to content, the first thing Tab reaches
<div class="topbar">        [=] (below 1024), the name (the way Home), 4 view links, then .barctl on the right:
                            #cmdBtn search field, a separator, #glitchBar, #soundBar, #themeToggle
<main id="main">
  <header>                  Home only (hidden on the other views). Hero canvas (the ring, COPY IT / OWN IT),
                            lede, who it is for, See components + Get the kit, facts line, #heroSw
                            (hidden, holds the real Show grid and Glitch inputs the menu and Search flip)
  <nav id="sidenav">        the sections of the view you are in (from 1024px, not on Home)
  <div id="view-home">      Where to start (s-go, four tiles, then #heroSrc: Feed the ring a photo, with
                            Camera and Back to the ring once a picture is in), Questions (s-faq)
  <div id="view-kit">       Components: .dochead, index, five groups of parts, Get the kit, Rules
  <div id="view-blocks">    Blocks: .dochead, filters, index, Login and Stats pinned first, the rest A to Z
  <div id="view-charts">    Charts (5): .dochead, then the charts
  <div id="view-themes">    .dochead, Presets, Colors, Ramp, Tokens, Labs (the old One pager toys)
  <footer id="foot">        Invaders (#footGame) on Home only, and #footLine on every view
</main>
<dialog #publishDialog>     card demo
<div #fx>                   sparks and tears (fixed, pointer-events:none)
<canvas #sand>              shattered characters and the pile
<div #rebuild>              Rebuild button, shown after a shatter
<div #hud> <div #track>     VHS timecode, rolling tracking band
<dialog #sheetDlg .sheet>   bottom sheet demo
<dialog #menuDlg>           the [=] menu, full screen, below 1024px
<dialog #cmdDlg>            Search (js/80, css/18)
<dialog #posterDlg>         generated poster / snapshot
<div #toast>
```

Views are links in a tablist (`#views`, `<a role="tab" href="#blocks">`). The Home tab (`#v-home`) is in the tablist for the router and the keyboard but is not drawn; the brand name is the way Home. Switching a view runs `mosh` (datamosh, horizontal slices); the theme and the presets run `wipe` (the color-bar curtain). Both hold one lock, see Navigation. Section reveal uses IntersectionObserver on `[data-rv]` elements; `reveal()` adds `.in`, plays the glitch-in keyframe, decodes text, draws frames, and calls `el._anim()` if the element has one (charts use this to grow in).

The header and the game belong to Home: `placeHero()` in js/40 runs on every view switch (`A.onView`) and hides the header and `#footGame` everywhere else, so each view starts one row under the bar. `#footLine` shows on every view.

**Docs views.** Components, Blocks, Charts and Themes open with a `.dochead`: one bitmap title per page (`data-nobars`) and one lede. The section posters inside those views are hidden by css (`css/16-grid.css`) and the section's `h2` shows instead, as a bold uppercase word. Components are grouped by `KIT_GROUPS` in js/30 (Form, Overlay, Display, Feedback, Navigation); `buildView()` sorts by group, then by name, and puts a `.grouph` label on the page where each group starts. Get the kit and Rules close the page, but the sidebar lists them first as Getting started. Blocks are one per row.

## The grid

Everything is a character. `--r` is 21px (14px type), everywhere, at every width, and the scripts read it as `A.ROW` instead of hard-coding it. `main` width is snapped to a whole number of `ch` in `layout()`. The hero canvas measures the real glyph width (`ctx.measureText('M')`) and sizes itself to `HC` columns. Titles are 5x7 bitmaps rendered at 2x2 characters per pixel, and `fitTitles()` drops the color bars or halves the scale when the box is too narrow.

## Navigation

All of it lives in `css/17-nav.css` and `js/70-nav.js`, except the view swap itself, which is the engine's (`A.showView`).

**The bar** lives outside `main`, so it spans the window and sticks from the first pixel. Inside it, a container the width of the content column keeps the name aligned with the page, and the rule underneath runs the full width, faint; the view you are in is the only heavy mark on it. Three zones: the name on the left (it is Home), the views in the middle (muted, the current one bold ink), and `.barctl` pinned right. By width:

```
under 768     [=] ascii/ui                                        [/]  <)))  -O-
768 to 1023   [=] ascii/ui  Components Blocks Charts Themes      [/]  /\/  <)))  -O-
1024 and up   ascii/ui  Components Blocks Charts Themes   [ Search...  Ctrl K ]  |  /\/  <)))  -O-
```

`#cmdBtn` is Search, drawn as a field from 1024px (`Cmd K` on a Mac) and as `[/]` below. Then three glyph buttons: `#glitchBar` (`/\/`, `___` when off), `#soundBar` (`<)))`, `<) x` when off) and `#themeToggle` (`-O-` or `(C`). From 1280px each glyph gets its word next to it. Sound and Theme stay in the bar at every width; Glitch leaves it under 768px and lives in the menu. There is no crumb any more (its node is still in the markup, hidden by css). `qa/breakpoints.py` checks that nothing in the bar overlaps and that the views never scroll out of sight.

**Addresses.** Every view and every section has one: `#components`, `#components/button`, `#themes/labs` (the section heading's id minus `s-` or `o-`; views are home, components, blocks, charts, themes). Old `#play`, `#apps` and `#onepager` links land on `#home`. The view tabs and the sidebar and menu entries are real links, so they can be copied or opened in a new tab. Picking a view or a section pushes a history entry, so Back works; the scroll spy only replaces the current entry as you read, so reading does not fill up Back. Loading an address, Back, Forward and a hand-typed hash all go through `route()`. It is only hashes, so it works from `file://`. Search's `goto` command takes the same names.

**The views** are links with `role="tab"`, so they keep the tablist's keyboard: arrows and Home/End move the focus, Enter or Space picks (manual activation, so reading the list does not switch pages under you). The swap is `A.showView(tab, then)`: one datamosh, and a pick made while it runs replaces where it goes instead of starting a second one. The curtain (theme, presets) and the datamosh share one lock in the engine (`hold`/`free`): a transition asked for while another runs waits its turn, and the overlay eats taps while it covers the page, except a tap on a view link, which becomes the new target. `AUI.onView(tab)` runs before the landing is measured (it shows or hides the Home header there), then `aui:view` fires on `document`. Reduced motion swaps instantly.

**The landing.** A jump puts the section's title (its first visible child) in the first row under the bar, measured from the title rather than from css margins, and under anything sticky in the view if there is one (found by looking, not by name; no view has one today). A link to Home lands at the top. For a moment after a jump the page is still moving (the font, charts sizing themselves, titles refitting), so the landing is redone whenever `main` changes size until you touch, scroll or press anything.

**The list.** The sidebar and the menu print the same model: the view and its count, then the sections. Home has no list. Where a view has a chip index, the count is what the index counts, and the sections it leaves out (Get the kit, Rules) come first as Getting started, wherever they sit on the page. Components then lists its parts under their groups. After a Blocks filter the heading says so, `Blocks, Personal 6`. It is built from the sections themselves, so it cannot drift from the page, and it is rebuilt by a MutationObserver watching `hidden` inside `main`, because views and the Blocks filter both work by toggling it.

**Reading position** is plain maths on scroll, rAF throttled: the last section whose title has reached the line a jump lands on. Above the first section nothing is marked. A gallery row shares one top, so ties keep whatever is already marked, and fall back to the row's first entry. Clicking a sidebar entry pins the mark for 1.2s while the smooth scroll arrives.

**The sidebar** appears from 1024px. `main` becomes a two column grid there: `26ch` for the sidebar, `4ch` gutter, the rest for the panels, which leaves whole character columns for the gallery beside it (66 at 1024px, 43 at 1280px, 41 at 1600px). Its rows are pinned, because the panels all share one cell and once one row is explicit the others have to be, or the footer flows into the gap. Chrome constrains a sticky grid item to the whole grid, not its row, so a sticky `#sidenav` rode down over the footer; the nav is a plain cell stretched to its row and the list inside it (`.side-in`) is what sticks, so it stops where the row does. Its heading sticks inside the list's own scroll. With a mouse each entry is one 21px row; on a touch screen the rows are 48px.

**The menu** (`[=]`, below 1024px) is the index on small screens: the whole screen, opaque. MENU and `[x]` (Escape too), then the five views as a row of tabs, then the list, one section per 48px row, with `> ` on the one you are reading, then Show grid and Glitch at the foot. The Home tab goes straight to Home; the others only refill the list; the page changes when you pick a section: the view swaps if it has to, the title lands under the bar, then the menu steps out and the focus goes to that section. It comes in and goes out with the same four-step wipe, none with reduced motion. The chip index inside each view starts closed below 1024px, since the menu does its job, and is hidden from 1024px, where the sidebar does.

A visually hidden `Skip to content` link is the first thing Tab reaches.

## Page width and the galleries

`css/16-grid.css` owns how wide the page gets. `--maxcols` is a cap in characters and steps up at four breakpoints: 80 by default (the width the kit was designed at), 100 from 1024px, 124 from 1280px, 165 from 1600px (about 1600 real pixels). `layout()` reads it and snaps `main` to that many whole characters, so the cap is a design decision in css, not a number in js.

Components and Charts are galleries: each panel is one css grid of columns at least `--galmin` (40ch) wide, so they hold one column on a phone and at 1024px (where the sidebar takes 30 characters), two from 1280px and three from 1600px. The steps are chosen so the columns land on whole characters: at 1600px, 165 columns minus 30 for the sidebar, 4 of padding and 8 of gutter leave three columns of 41ch. Blocks use the same grid but every block takes the whole row, since blocks are page-sized.

Sections keep their document order, row by row, left to right. A row is as tall as its tallest card, so short cards leave air under them. Masonry would close those gaps but it breaks the promise the alphabetical index makes, and it stops the cards in a row from starting at the same height, which is what lets their dashed rules line up. Plain rows, on purpose.

A section that cannot live in a narrow column carries `data-span`. `spanSections()` in js/30 sets `full` on anything holding a table, a phone frame, a timeline, a picture or a stat row. `index.html` sets it by hand on the three charts that draw to the page width (Bars, Line, Regions); Heatmap and Donut are fixed-size drawings and sit in a column. Opening a Code tab does not change the span: the section keeps its column and long lines scroll sideways inside the code box, so the gallery does not reshuffle under the cursor. Anything with a `data-span` takes the whole row.

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

Cadences: hero ~12 fps (85ms), LCDs 8 fps (125ms), invaders 20 fps (50ms). `qa/clock.py` asserts the invariants (no `setInterval` survives, tasks run, pause freezes them, finite tasks get reaped).

## Sound

One `AudioContext`, created on first pointerdown/keydown (browsers require a gesture). `tone(type,f0,f1,dur,vol,when)` and `noise(dur,vol,f0,f1)` are the primitives. `human()` randomizes pitch, duration and volume, and applies fatigue: the same sound within 2.2s gets 16 percent quieter each time, shorter after 3, skipped half the time after 5. `sfx.*` are named motifs. `A.live()` says whether sound is on and running.

## Shipping

You develop against `index.html`, which links `css/` and `js/`. `python3 build.py` inlines both, in load order, into `dist/ascii-ui.html`, then writes `site/`: the single file as the page, plus `kit/` (`ascii-ui.css`, `ascii-ui.js`, `starter.html`, the files people link from their own pages). `vercel.json` points Vercel at `site/`, so the deploy serves the single file and the kit and nothing else from the repo. Vercel deploys `main` on every push, to https://asciiui.vercel.app.

## What is intentionally not here
- No i18n. Copy is English, a couple of Rioplatense words in personal blocks.
- No persistence beyond `sessionStorage['aui-boot']` and `localStorage['aui-hi']` (invaders high score).
- No analytics, no network requests except the font.
