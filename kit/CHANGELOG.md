# Changelog

The kit's versions, newest first. Every version lives at its own address that never changes, `https://ascii.fedekotek.design/kit/VERSION/ascii-ui.css` and `.../ascii-ui.js`. The plain `/kit/` address is always the latest.

## 1.3.1, 2026-09-29

Fixed
- Pagination: a `data-href` that starts with `javascript:`, `data:` or `vbscript:` (spaced out or not) is not a link. The pages draw as buttons instead. It only mattered on a page that puts text a visitor typed into `data-href`, but a kit should not turn an attribute into a way to run script.

## 1.3.0, 2026-09-28

Added
- Charts, `data-aui="chart"` on a `.chart` around a `<table>`: `data-type="bars"`, `line`, `hbars`, `heatmap` or `donut`, drawn in ramp characters on the grid, as wide as the box. The table is the data: it shows without the script and stays for screen readers with it. A Tab stop; the arrows, Home, End and Escape move the pick, said in the nearest status line and marked `[Thu]`; a glyph per series and per slice, not only a color. `data-max`, `data-min`, `data-rows`, `data-pick`. `aui:pick`, `ASCIIUI.chart(el)`. It grows in once, not under reduced motion.
- Sparkline, `data-type="spark"` on a `.spark`: `data-values`, one ramp character a value, an image named by its numbers.
- Data table, `data-aui="datatable"` on the box around a `.tablewrap` and its `.tbl`. A `<button class="dt-sort">` in a `<th>` sorts the column (ascending, descending, then the order the rows came in) and says so in `aria-sort`, with `^` and `v` as paint, on the sorted column only. Numbers (units and currency signs aside) and `yyyy-mm-dd` dates sort as values; `data-sort="num|date|text|none"` on the th and `data-value` on a td decide instead. An input with `data-aui-filter` narrows the rows to the ones holding every word, a `.dt-count` says "12 of 40 rows, 3 selected.", and a row across every column says "No rows match." (`data-no-match`) or "No rows yet." (`data-empty`). `data-select` adds a checkbox column drawn like the Toggles, a select-all with an indeterminate `[-]`, Shift for a range, and picked rows bold on a tint, their box a slab. `data-page-size` pages the rows through the Pagination inside the box. `aria-busy="true"` draws skeleton rows. On a phone it scrolls sideways inside its box and says so. `aui:sort`, `aui:select`, `ASCIIUI.datatable(el)`.
- The checkbox glyph says `[-]` while `indeterminate`.
- **Icon.** Thirty-nine icons drawn in characters, CSS only: `<span class="icon" data-icon="search" role="img" aria-label="Search"></span>`. Inline is one row and one to three characters; `.icon-lg` is three rows and five or six characters, for empty states and tiles. Printable ASCII only, so they draw in the kit font and in any monospace that stands in. They take the text color; `.hot`, `.ok`, `.warn` and `.violet` give a role color. The names are in README, Icons. New classes: `icon`, `icon-lg`, `violet`, `warn` (on `.icon` only).
- The Blocks run on the kit: every Block's Code tab offers Download page, except one with a part the kit cannot draw yet (Stats, until its sparklines are in).
- Block pieces in the CSS: `.kpis` and `.kpi` (stat tiles), `.poster.ptitle` (a bitmap title held in the HTML as rows of characters), `.grid2` and `.grid3` (cards side by side), `.pricing` with `.price`, `.feat`, `.popular` and `.row.full`, `.checklist` and `.meta`, `.navlist`, `.kv` and `.qty`, `.progress[role="meter"]`, `.stepper` and `.steps`, `.tags` with `.b-violet` and `.b-pink`, `.thumb`, `.profile`, and `a.btn`. README has them under Blocks.
- Checklist, `data-aui="checklist"`: the share of ticked boxes goes into the progress bar next to the list; `data-done` is a toast when the last one is ticked. `aui:change` with `{ done, total }`.
- Pick, `data-aui="pick"`: one of a group of buttons, links or cards is the pick, by click, Enter or Space. It moves `aria-current` when the HTML uses it, `aria-pressed` otherwise, and says the pick's `data-say` in the status line. `aui:change` with `{ item, index }`.
- Stepper, `data-aui="stepper"`: a number between two buttons, `data-min` to `data-max`, that scales the `[data-each]` amounts in its card, in metric (g to kg, ml to l). `aui:change` with `{ value }`.
- A progress bar with `data-cells` draws that many cells without the 24 character floor when it is a `role="meter"`.
- **Signal**, the bad signal, opt in. `data-aui-signal` on any element, next to its own `data-aui` or not: `glitch` (a state change inside it, `aria-selected`, `aria-pressed`, `aria-expanded`, `aria-checked`, `aria-current`, `open` or a checkbox, breaks up for two frames), `scramble` (the words decode into place once, on screen), `band` (a band of `- = -` rolls through now and then; on `<html>` down the window) and `rot` (`data-rot` seconds idle and its frames decay; any input repairs them). Several at once with spaces. How loud: `--aui-signal: calm | normal | loud | off` on `:root`, or `data-aui-signal-level` on any element around it. The calls: `ASCIIUI.glitch(el)`, `scramble(el)`, `band(el)`, `rot(el)`, `repair(el)` and `signal(level)`. README has it under Signal.
- It is paint: strips and bands on one fixed layer that takes no clicks and is `aria-hidden`, a `translate`, a frame's string. No box moves. A scramble keeps its words for a screen reader (`<aui-sr>`) and hides the noise (`<aui-noise>`); live regions are left alone. At most three glitches a second on the page. Noise is magenta and pink, never cyan. Still under reduced motion, forced colors and print, while a field has the focus and in a background tab. Its loop asks for a frame only while an effect draws.
- `<html class="crt interlace">`: the scanlines every other pixel, fainter.
- `data-aui-signal=""` is off. `data-aui="signal"` works as well as the attribute alone (glitch when it names no effect).
- `data-aui-toggle` on a button with `aria-pressed`: a click flips it (the change a glitch answers), fires `aui:change` with `{ pressed }`, and `data-aui-toggle="On.|Off."` says the words in its status line.
- A scramble's noise is CSS content, so a script reading `textContent` mid-decode (a chart, a sort, a progress button's label) gets the words.

Changed
- Data table: the columns keep one width through the rows, the loading rows, the empty row, a filter and every page. The skeleton has a strip in every column. A column of numbers lines up on the right (`.dt-num`). A picked row is bold on a darker tint with its box as the slab, and a badge in it keeps its color. The sort mark shows on the sorted column only. The count sits on the field's typing row. No rows match: a Clear the filter button, and no pager.
- Pagination: a gap of one page shows that page instead of `..`.
- Heatmap: Up and Down keep the column and stop at the top and the bottom row.
- Icons redrawn so each reads as its own thing: `error` is `(!)`, `settings` is sliders `-|-`, `eye-off` is `<\>`, `copy` is `|[]`, `calendar` is `[:]` (`[#]` is the site's section link), `refresh` is `(->`, and a large `more` is `o o o`.
- A `.stack` inside a `.stack` takes the width, so a chart in a page made from the Code tab fills it. `.aui-nokit` is hidden by the kit: a downloaded page says so when the kit did not load.
- A search field's clear x is the text's color, magenta under a pointer.
- The spinner and skeleton clock sleeps while its elements are off screen and between steps; a chart grows in on `requestAnimationFrame`.

## 1.2.1, 2026-09-27

Fixed
- Context menu: when a scroll or a click away closes it with the focus still inside, the focus goes back to the row it opened on. It used to fall to the top of the page, or, when the close landed before the browser moved it, stay on an item in the hidden menu, where a letter typed next ran that item.

## 1.2.0, 2026-09-27

Added
- Popover, `data-aui="popover"` on a `.pop`: a button and a small panel next to it, not modal. The focus goes in and comes back on Escape or a `data-aui-close`; a click outside or Tab past the end put it away. A `<form method="dialog">` inside closes it once the form is valid. `aui:toggle`, `ASCIIUI.popover(el)`.
- Combobox, `data-aui="combobox"` on a `.combo`: a field that narrows a list as you type, with `role="combobox"`, a listbox and `aria-activedescendant`. Case and accents do not count, the best match comes first, `data-empty` says when nothing matches and `data-error-list` when the words are not an option. `data-name`, `data-value`, `data-free`. `aui:change`, `ASCIIUI.combobox(el)`.
- Context menu, `data-aui="contextmenu"` on a `.ctx`: opens on a right-click, a long press or Shift F10 where you are, arrows and letters move, the `<kbd>` letter picks. `aui:select`, `ASCIIUI.contextmenu(el)`.
- Alert dialog, `<dialog role="alertdialog">`: a tap around it is not an answer, it nudges and puts the focus back on the safe button. `data-aui="confirm"` with `data-match` keeps the danger button off until the name is typed.
- `pane`: the floating panel under the three above. It goes to the top layer where the browser has the Popover API and sits on the grid, below its button or above it when there is no room.
- `data-aui-close="value"` sets the dialog's `returnValue`.
- Segment, `data-aui="segment"` on a `.tgroup`: writes the pick into its status line, the label's words or `data-say="{label} view."`, and fires `aui:change` with `{ value, label, input }`.
- Toasts have `[x]` to put them away (the focus goes back to where it was), stay longer for longer words (`--aui-toast`, 3.6s, at least, 60ms a character, 15s at most) and hold while a pointer or the focus is on them.
- A sheet closes on a drag down on a touch screen: by its title, the grip of `=` above it, or from the top of what it holds. It follows the finger a row at a time.
- Input OTP: a letter is refused out loud. "Digits only." in the status line (`data-error` for other words), `.invalid` on the group, `aria-invalid` on the box, brackets turned into `!`.
- The calendar says a new month ("October 2026.") from a live region that stays put while the month is redrawn.
- Motion tokens on `:root`: `--aui-quick`, `--aui-base`, `--aui-slow`, `--aui-toast` and the stepped easings `--aui-ease-flip`, `-type`, `-wipe`, `-rise`, `-jolt`. Every kit animation reads them.
- Print, Windows High Contrast and more contrast: black characters on white paper with the floating parts left off; slabs and focus in the system colors under `forced-colors`; darker grey and heavier type under `prefers-contrast: more`.
- Scanlines as an option, off unless `<html class="crt">`.
- The README shows `integrity` hashes for the pinned files.

Changed
- Geist Mono comes from `fonts/` next to the CSS, not from Google Fonts. The `@import` is gone, so a page that links the kit makes no request to anyone but the kit's address, and nobody else sees its visitors. An installed Geist Mono is used first. Without the folder, the system monospace, as before.
- Both files open with `/*! ascii/ui kit 1.2.0 | MIT | (c) 2026 Fede Kotek */`, a line minifiers keep. `LICENSE.txt` is next to them on the site, and `fonts/OFL.txt` next to the font.
- Validation waits for the first blur: typing says nothing until you leave the field (or send the form), then every key checks, so a fix clears the message at once. A value wrong on load still shows its message.
- Toasts: the mark (`@@`, `!!`) is `aria-hidden`, so a screen reader hears only the words. Good news is a `role="status"`, an error a `role="alert"`, read at once.
- Slabs have no 2px violet and magenta edges: the primary label, the picked tab, the card title, the magenta badge, the avatar, the picked day, the tooltip and the picked segment are plain slabs. A focused primary button's slab takes the focus color.
- The veil behind a dialog is characters: a period every other column on every row, in faint magenta (yellow behind an alert dialog), not a pattern of dots.
- Hover styles need a mouse, `(hover:hover) and (pointer:fine)`, so a stylus or a touch laptop does not leave them stuck. Menu items and the tooltip were not guarded at all. A keyboard on a touch screen shows the tooltip.
- A focused tab panel gets a wall of `@` down its left edge and a focused table row a `>` in its first character, instead of a shadow that High Contrast drops.
- A wrong field with the focus keeps its wall of `!`, in the focus color.

Fixed
- Dropdown items are two whole rows tall, on the grid. They sat off it.
- A disabled field has a faint rim and gray text, the way a disabled button does.
- A disabled danger button has a gray label, not a yellow one.
- A dialog's `returnValue` starts empty every time it opens.
- A `data-aui-close` in a popover inside a dialog closes the popover, not the dialog.
- Kbd brackets are paint: a screen reader says the key, not "left bracket".
- A tap on a select's frame focuses the select and opens its list, as it does for an input.
- Spinners are not read as "slash", "dash": the frames are `aria-hidden`, or the spinner is `role="img"` named by its `aria-label`.
- Disabled menu items are gray and do not light up under a mouse.

## 1.1.1, 2026-09-26

Fixed
- Pagination keeps the page a script asks for. `data-page="12"` and then `data-pages="20"` used to end on 9 of 20; now it lands on 12, in either order. A page past the end is drawn as the last one, and `data-page` keeps saying the page asked for.
- Events fire only for what a person does, as the README says. Validate no longer fires `aui:invalid` or `aui:valid` on load or for `validate(form)` and `check()`; OTP no longer fires `aui:complete` for a code filled on load or set with `otp(el).value`. The messages and the accepted state still show.
- Calendar: a `data-value` outside `data-min` and `data-max` is not picked; the calendar opens on the allowed month nearest to it. Without `data-value` nothing is picked: today is shown and focused, and the hidden input stays empty until a person picks. A form reset goes back to that. Removing `data-value` clears the pick.
- Radios get their own names in linear time: a thousand groups pasted at once used to take seconds, now well under a tenth of a second.
- Under reduced motion, a spinner or skeleton taken off the page is let go. The animation loop never runs then, so each one used to stay in memory for good.

## 1.1.0, 2026-09-26

Fixed
- Radios in two different forms kept their own names. The kit used to rename the second form's radios when they shared a name with the first's, so that form sent the wrong field. Now only copies in the same form, or in no form, are split.
- A component taken off the page is torn down: its listeners on the page and the window go with it, and a spinner or skeleton put back starts moving again. Before, each copy left its listeners behind and one put back stayed still.
- The Code tab no longer printed a label caught mid-scramble, an `aria-label` added by the scramble, or what you had done to the demo (a moved slider, a typed code, an open details, a picked tab, a run progress bar).
- The Code tab printed the Skeleton behavior and the CSS for what Calendar and Pagination draw (the `.ibtn` buttons).
- The tokens from the Themes view win over the kit's dark tokens in a dark system setting, and say `color-scheme`. The ramp call is a separate script that waits for the kit.
- Frames are 400 characters wide and walls 200 rows tall (they were 180 and 90), so wide screens and long textareas keep their rims.

Added
- `ASCIIUI.destroy(el)`, `ASCIIUI.get(el)`, `ASCIIUI.validate(form)`, and calls per component: `tabs(el).select(i)`, `pagination(el).set(n)`, `calendar(el).set(date)`, `dropdown(el).open()` and `close()`, `otp(el).value`.
- Settings changed on a live element are followed: `data-aui`, `data-page`, `data-pages`, `data-value` and the rest.
- Validation runs when you leave a field and when the form is sent, not only as you type, with `data-error-type`, `data-error-length`, `data-error-range` and `data-error` for the words. `aui:invalid` and `aui:valid` events.
- `data-aui-reset` puts fields back to what the HTML says and redraws bars, outputs, counts and code boxes. It leaves hidden inputs alone and does nothing outside a form or a dialog. A native reset redraws too.
- A toast shown while a modal dialog is open goes inside the dialog, so it is on top and read out.
- OTP: `autocomplete="one-time-code"` on the first box, `data-name` for a hidden input with the whole code.
- Calendar: `data-value`, `data-min`, `data-max`, `data-week-start`, `data-locale`, and `data-name` for a hidden input with the ISO date.
- Pagination: `data-href="?page={n}"` draws links instead of buttons.
- Table: `.tablewrap` and `.tbl`, the table the Table block uses.
- `ASCIIUI.reduce` follows the reduced motion setting while the page is open.

Changed
- Tabs fire `aui:change` only when a person picks a tab, not on load and not for `select()`.
- `.menu kbd` is no longer faded, only light.

## 1.0.0, 2026-09-26

The first version: 30 components, 12 behaviors wired by `data-aui`, buttons that open dialogs, close them, show toasts, reset fields and run progress bars, and `ASCIIUI.tones()` for other characters. Pinned at `/kit/1.0.0/` for pages that need it as it was.
