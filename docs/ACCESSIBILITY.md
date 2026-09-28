# Accessibility

This covers the site (https://ascii.fedekotek.design, v11.4) and the kit (`kit/`, 1.3.0). The target is WCAG 2.2 AA. The characters are paint: underneath every component is a native control with a label, a focus state and a keyboard, and the glyphs that only decorate are hidden from assistive tech.

What follows is what has been checked, how, and what is known not to work. It was last checked for v11.2, in September 2026.

## What is supported

**Keyboard.** Everything that works with a pointer works with a keyboard.
- `Skip to content` is the first thing Tab reaches.
- Views are a tablist: arrows, Home and End move, Enter or Space picks. Doc tabs (Preview, Code, Usage) walk with Left, Right, Home and End and wrap.
- Search is `/` or Ctrl K (Cmd K on a Mac), then arrows, Home, End, Page Up, Page Down, Enter and Escape.
- Dialogs, the sheet, the menu and every overlay close on Escape and give the focus back to what opened them. The context menu opens on Shift F10 or the Menu key.
- Charts and standalone pictures take a Tab stop: arrows pick, Enter acts, and the pick is said on a status line.
- Each component's keys are listed in its Usage tab, and `qa/usage.py` checks the list against what the kit actually handles.
- Focus is drawn in cyan, and cyan means focus and nothing else. Focus is also drawn in characters (a `@` wall on a panel, a `>` on a table row, `@` rims on fields and buttons), so it survives when colors are replaced.

**Screen readers.**
- Bitmap titles are `aria-hidden`, with a real, visually hidden `<h2>` for each section.
- Charts are `role="img"` with a label that says the data, and a status line for the pick. Pictures and the game are labeled. The kit's charts (`data-aui="chart"`) keep their data as a real table, clipped out of sight, and draw the characters `aria-hidden` above it; the chart is a named group with a Tab stop, the arrows move the pick and the nearest status line says it.
- Messages are read out through a hidden status region, failures through an alert region. The visible toast is hidden from assistive tech so nothing is read twice. Search reads out the result count once typing stops.
- Icons are characters in CSS content with empty alt text. One that means something alone is `role="img"` with an `aria-label` that says the meaning; one next to its word is `aria-hidden`. `qa/kit.py` fails an icon that is neither. They are text, so they stay in forced colors and in print, and every status icon has its own shape (`/!\`, `(x)`, `v/`), not only its color.
- The kit makes the ids that labels need at runtime, so a component pasted twice is two labeled copies, not one broken one.

**Reduced motion.** `prefers-reduced-motion` turns off every animation and every sound: the boot, the entrances, the datamosh, the curtain, the hero spin (drag still works), the long press shatter, the sparks and the tears. The sound switch starts off and cannot be turned on. The idle page runs no animation frames. The reel never autoplays; it waits for a press on play. `qa/reduced.py` checks this on the source and on what ships.

**Signal, the kit's effects.** Opt in, per element (`data-aui-signal`). Under reduced motion, forced colors and print, in a background tab and while a field that takes typing has the focus, none of them runs and its loop asks for no frame. Everything it draws is `aria-hidden` and takes no clicks, and no box moves. A scramble keeps its words in a visually hidden copy, so a screen reader never reads the noise, and live regions are never scrambled. At most three glitches a second on the page (WCAG 2.3.1). Noise is magenta and pink, never the focus color. `qa/kit.py` checks each of these. The Signal section in Themes shows them with the site's engine and holds still with Glitch off too.

**Glitch off.** The Glitch switch (in the bar, the `[=]` menu and Search) is the page's pause: it stops the ambient effects, the loaders, spinners, pictures and the attract screen, and blocks arrive without their entrance. Entrances never dip the opacity of a large block, so nothing flashes, and view transitions are at least 400ms apart.

**Forced colors (Windows High Contrast).** Slabs come back in system colors: CanvasText for what is picked, Highlight for focus. What is picked also carries a mark that is not a color (a `>`, brackets, a `!` on a wrong code). Checked in headless Chromium with forced colors on, element by element.

**More contrast.** `prefers-contrast:more` moves gray text most of the way to ink, makes faded rules solid and sets body type to 400. Light theme text clears 4.5:1 on paper; every preset was checked and adjusted (see TOKENS.md).

**Color is never the only signal.** Errors carry `!`, a failed message `!!`, a good one `@@`. Badges carry words. Donut slices each have their own glyph, and the picked bar is named under it.

**Print.** Every page prints black on white. The bar, sidebar, effects and canvases step out, content never scrolled into view prints, code prints at full length and outside links print their address.

**Touch and zoom.** Interactive elements have a 44px hit area (`qa/audit.py` fails anything under 40px). Sidebar and menu rows are 48px on touch. Text fields are 16px on touch, so phones do not zoom in on focus. Hover styles only apply to a real mouse. Taps act on release, not on touch down, and a slider that turns into a scroll gets its value back. The hero, the game, charts, labs and pictures allow pinch zoom. At 400% zoom (320 by 256) nothing scrolls sideways except tables and code, and under 400px of height the bar scrolls away instead of covering the page.

**Longer words.** Tested with pseudo-localization (40 percent longer, accented): buttons wrap inside their walls, label columns grow, the bar wraps a row.

## How it is checked
- `sh qa/release.sh` runs on every change: `audit.py` (targets and text size), `keyboard.py` (the phone keyboard only opens when asked), `reduced.py`, `usage.py` (every component's keys and accessibility notes), `nav.py` (navigation with real taps, focus after a jump).
- By hand, in headless Chromium: forced colors, more contrast, print, 400% zoom, pseudo-localization, color blindness simulation, and an axe run (WCAG 2.1 AA) during the v11.2 audit.
- On a phone: the owner's Android phone.

## Known limits
- **No screen reader audit.** The accessibility tree and the live regions were checked, but no one has used the site with VoiceOver, NVDA or TalkBack end to end.
- **Safari and iOS are not tested.** Firefox ran once, by hand. Everything else is Chromium.
- **The Avatar demo's picture** is a canvas marked `role="img"` with an empty label inside a span that is already labeled. axe flags it; a screen reader reads the name once from the span.
- **Text spacing** (WCAG 1.4.12): an override clips the charts on the right, since they assume the character cell.
- **Text-only zoom** (Firefox) overflows Components sideways at 200%. Full page zoom is fine. The browser's default font size setting changes nothing, since sizes are in px.
- **Right to left** is not supported. Positions are physical `left` and `right`.
- **Sound starts on** (unless reduced motion is set), so the first tap can make a noise. There are no captions for sounds and no per-sound mute; the Sound switch is the one control. Sounds carry no information that is not also on screen.
- **Site toasts** leave after 3.6 seconds and cannot be seen again; they are read out when they appear. Kit toasts stay longer for longer words and pause under the pointer or focus.
- **Idle rot**: after 14 seconds idle, frames and titles degrade a step. It is decoration; the text underneath does not change, and any touch repairs it. It stops with Glitch off or reduced motion.

The full list of fragile parts is in KNOWN-ISSUES.md.

## How to report a problem
Say what you used (browser, device, screen reader or setting), the address (every section has one, the `[#]` after its title copies it) and what happened. Send it through the contact on https://fedekotek.design (Say hi in the footer, or type `whoami` in Search).
