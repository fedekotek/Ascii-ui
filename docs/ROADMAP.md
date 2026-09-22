# Roadmap

Decided direction (Sept 2026): a publishable kit plus a playground. Not a portfolio skin.

## Now (structural, do first)
- [ ] **ES modules.** One module per current IIFE, explicit imports instead of `window.AUI*`. Keep `build.py` producing the single file (esbuild-free: concatenate in order, or use a 20-line bundler).
- [ ] **One scheduler.** `tick(now)` on rAF, features register `{cadence, visible(), draw()}`. Replace the 33 intervals. Global pause when hidden or `.calm`.
- [ ] **Tokens as a JSON source of truth** that generates `css/01-tokens.css` and the Tokens block, so presets and docs cannot drift.
- [ ] **A real device pass** on iOS Safari and Firefox. Fix list in KNOWN-ISSUES.md #20.

## Next (kit)
- [ ] Per-component files: `components/button/{button.html,button.css,button.js,README.md}` and a script that assembles `index.html`. The Code tab can then read the files instead of scraping the DOM.
- [ ] A copy-paste "registry" JSON like shadcn's, one entry per component with its files and dependencies (tokens, tones, engine helpers used).
- [ ] Components still missing versus shadcn: Accordion (exists as Details), Carousel, Collapsible, Combobox, Context menu, Data table (sortable), Date picker (Calendar + Input), Drawer (exists as Sheet), Hover card, Menubar, Navigation menu, Popover, Radio group (exists in Toggles), Resizable, Scroll area, Sonner (Toast), Switch (exists), Table (exists as block), Toggle.
- [ ] More charts: area, stacked bars, radar, radial gauge, sparkline table, live scatter.
- [ ] Code tab: show the token dependencies per component; a "copy as React" toggle is out of scope, a "copy as web component" one might not be.

## Next (playground)
- [ ] More apps in the Apps view: a weather app (stress charts + LCD), a banking home (stress tables + slabs), a maps screen (ASCII map tiles).
- [ ] WebGL CRT pass over the hero: barrel distortion, bloom, phosphor persistence. The only item from the original list not built.
- [ ] Guestbook wall: visitors `sign NAME`, posters join a shared grid, invaders high score becomes a leaderboard. Needs shared storage.
- [ ] Sound design pass: motifs per component in one scale; a mute per category.
- [ ] Ramp editor: save/share a ramp + preset as a URL hash.
- [ ] Dot-grid effect from the playground project as a kit component (decided earlier; not started).

## Later
- [ ] i18n of UI copy (Rioplatense Spanish first).
- [ ] A print stylesheet (the Paper preset already reads as riso).
- [ ] An `npm` package that ships `dist/` plus the CSS/JS as importable files, no framework.
