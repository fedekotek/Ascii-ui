# Changelog

The kit's versions, newest first. Every version lives at its own address that never changes, `https://ascii.fedekotek.design/kit/VERSION/ascii-ui.css` and `.../ascii-ui.js`. The plain `/kit/` address is always the latest.

## 1.2.0, 2026-09-27

Changed
- Geist Mono comes from `fonts/` next to the CSS, not from Google Fonts. The `@import` is gone, so a page that links the kit makes no request to anyone but the kit's address, and nobody else sees its visitors. An installed Geist Mono is used first. Without the folder, the system monospace, as before.
- Both files open with `/*! ascii/ui kit 1.2.0 | MIT | (c) 2026 Fede Kotek */`, a line minifiers keep. `LICENSE.txt` is next to them on the site, and `fonts/OFL.txt` next to the font.

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
