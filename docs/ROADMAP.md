# Roadmap

Decided direction (Sept 2026): a publishable kit plus a playground. Not a portfolio skin.

## Now (structural, do first)
- [ ] **ES modules.** One module per current IIFE, explicit imports instead of `window.AUI*`. Keep `build.py` producing the single file (esbuild-free: concatenate in order, or use a 20-line bundler).
- [x] **One scheduler.** Done: one rAF loop in js/10, `A.every(ms,fn,{gate,el,times,end,delay})` and `A.times(ms,n,fn,end)`, handles with `.stop()`, `A.clock.pause()/resume()/count()`. All 33 intervals migrated, `qa/clock.py` guards it.
- [ ] **Tokens as a JSON source of truth** that generates `css/01-tokens.css` and the Tokens block, so presets and docs cannot drift.
- [ ] **A real device pass** on iOS Safari and Firefox. Fix list in KNOWN-ISSUES.md #20.

## Next (layout)
- [ ] The Themes view still lays out for one column. It reads fine wide, but the pickers and the labs could use the space.
- [x] Rename css/11 and css/15 now that One pager, Play and Apps are gone, and drop the dead code they left (v10.10).

## Next (kit)
- [x] A real kit: `kit/ascii-ui.css` and `kit/ascii-ui.js`, and the Code tab prints from them (v11.0).
- [ ] Per-component files: `components/button/{button.html,button.css,button.js,README.md}` and a script that assembles `index.html` and the kit. The Code tab still starts from the live preview's DOM for the HTML.
- [ ] A copy-paste "registry" JSON like shadcn's, one entry per component with its files and dependencies. `docs/COMPONENTS-REFERENCE.md` (from `qa/reference.py`) already has the data: HTML, behaviors, CSS blocks.
- [ ] Components still missing versus shadcn: Carousel, Combobox, Context menu, Data table (sortable), Date picker (Calendar + Input), Hover card, Menubar, Navigation menu, Popover, Resizable, Scroll area, Toggle (a single pressed button).
- Exists under another name (Search finds these by the shadcn name): Accordion and Collapsible are Details, Drawer is Sheet, Dialog is Card and dialog, Radio group, Checkbox and Switch are in Toggles, Sonner is Toast, Table is a block, Command is Search.
- [ ] More charts: area, stacked bars, radar, radial gauge, sparkline table, live scatter.
- [ ] Code tab: show the token dependencies per component; a "copy as React" toggle is out of scope, a "copy as web component" one might not be.
- [ ] Command and Picture in the kit (a command palette, the LCD). Today they are site only.

## Next (playground)
- [x] Play, Apps and One pager removed (v10.9). The playground is Home's hero and Themes > Labs.
- [ ] Stress blocks instead of an Apps view: a weather screen (charts + LCD), a banking home (tables + slabs), a maps screen (ASCII map tiles).
- [ ] Hero knobs somewhere again (speed, split, words, color map): `HP` still has them, nothing on the page edits them.
- [ ] WebGL CRT pass over the hero: barrel distortion, bloom, phosphor persistence. The only item from the original list not built.
- [ ] Guestbook wall: visitors `sign NAME`, posters join a shared grid, invaders high score becomes a leaderboard. Needs shared storage.
- [ ] Sound design pass: motifs per component in one scale; a mute per category.
- [ ] Ramp editor: save/share a ramp + preset as a URL hash.
- [ ] Dot-grid effect from the playground project as a kit component (decided earlier; not started).

## Later
- [ ] i18n of UI copy (Rioplatense Spanish first).
- [ ] A print stylesheet (the Paper preset already reads as riso).
- [ ] An `npm` package that ships `dist/` plus the CSS/JS as importable files, no framework.
