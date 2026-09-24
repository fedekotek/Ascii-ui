# Known issues and fragile parts

Ordered by how much they will hurt the next person.

## Structural
1. **Five IIFEs stitched by patches.** The scripts were written by editing one file with string replacement over nine versions. Names are consistent but there is no module system; `A.onLayout`, `A.src`, `A.codeExtra` are late-bound hooks and the engine calls them guarded. Moving to ES modules is the right fix; the `window.AUI*` objects are the seams.
2. **One clock, so mind the cadences.** The 33 `setInterval`s are gone; everything repeating is a task on the rAF loop in js/10 (`A.every`, `A.times`). Two things to know: a task never fires faster than a frame, so a cadence under 16ms is rounded up by the display, and a task whose callback throws is dropped from the loop (the error is rethrown out of band so it still reaches the console and QA), so a broken task goes quiet rather than loud. `A.clock.pause()` stops everything at once.
3. **`fillText` is monkey-patched** on `CanvasRenderingContext2D.prototype` so the ramp editor reaches canvases. Any library that also patches it, or code that expects raw characters on canvas, will be surprised. `A.TR` is the explicit path.
4. **Code tab CSS extraction is regex over `cssText`.** Nested `@media` rules are flattened; rules inside `@layer` or `@container` would be missed; the base-class exclusion list (`BASE` in js/40) is hand-maintained.
5. **Reveal system and the docs builder both move DOM.** The builder moves demo nodes into Preview panels after the engine has already armed `[data-rv]` elements; it works because IntersectionObserver follows the node. Keep that order (js/10 then js/30) if you reorganize.

## Behavior
6. **Camera and clipboard fail from `file://` and inside the artifact sandbox.** They fail with a toast, not an error. Serve over http(s) to test them.
7. **Android keyboard on sliders.** Fixed in 9.2 with `inputmode="none"` and blur-after-touch. If a keyboard still appears on some device, replace the native range with a pointer-driven bar.
8. **Text autosizing / accessibility font scale.** Titles adapt (9.3). The hero canvas does not: it computes from measured px, so with a 130 percent system scale the canvas is correct but the body text around it is larger than designed. Untested above 130.
9. **Ramp swap does not reach:** the Progress component's bar until it runs, the One pager ramp lab, the boot title (uses `A.TR` but only if the ramp was set before boot). Low priority, all self-heal on next draw.
10. **Shatter of very large elements** is capped at 900 pieces by decimation, so a full table loses some characters. Pseudo-element characters are laid out by estimation, not measurement; side walls can be a few px off.
11. **Long-press vs scroll.** 560ms with a 10px cancel radius. On some phones a slow scroll start can trigger it. If it annoys, raise to 700ms or require a still finger (already partly done).
12. **Invaders keyboard capture.** Arrows/space are only captured while the canvas is in view and no dialog is open. Space still scrolls the page when the game is idle and unfocused; that is intentional.
13. **The one-pager `.ticker`** is decorative and its content is static.
14. **Placeholder copy** (see BLOCKS.md).

## Performance
15. Everything on at once on a mid phone: hero (85ms canvas), up to 8 LCDs visible in Blocks, invaders when in view, entrance decodes. Measured only in headless Chromium. If it drops frames, the first lever is the hero cadence (85 to 120ms) and LCD cadence (125 to 200ms); the second is the shatter particle cap.
16. `harvest()` calls `getBoundingClientRect` per character. Fine up to a few thousand; the cap protects it.

## Accessibility
17. Bitmap titles are `aria-hidden` with a visually hidden `<h2>`; charts have `role="img"` + `aria-label` and a status line, and the ones you can tap take a Tab stop (arrows pick, Enter acts), as do standalone LCD pictures; games and posters are labeled. Toasts are `role="status"`. Focus is visible everywhere tested. Not audited by a screen reader user yet.
18. Sound has no captions and no per-sound mute; the master switch is the only control.
19. `prefers-reduced-motion` disables animation, boot, entrances, hero spin (drag still works), long-press destruction and all sound (one gate in `audio()`, and the sound switch starts off). The tearing backdrop filter is also off.

## Browser
20. Tested: headless Chromium (Playwright) at 320/360/390/430/820/1440, dark and light; the owner's Android phone in the claude.ai artifact frame. Not tested: Safari/iOS, Firefox. Suspects for Safari: `color-mix()`, `:has()` in slider focus styling, `caret-shape`, `backdrop-filter` prefix (present), `dialog` animations, `AudioContext` unlock rules (should be fine, unlock is on pointerdown).
