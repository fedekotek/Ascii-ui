# ascii/ui kit

Version 1.2.0. What changed from version to version is in [CHANGELOG.md](CHANGELOG.md).

The kit is two files, `ascii-ui.css` and `ascii-ui.js`. No package, no build step, no dependencies. `starter.html`, next to this file, is a page that links the two and nothing else, with every component on it. The whole site as one HTML file is a separate download, from the footer of https://ascii.fedekotek.design.

## Install

Put the two tags in the `<head>` of your page. The script is `defer`, so it runs once the page is parsed, wherever the components are.

Latest, which follows every new version:

```html
<link rel="stylesheet" href="https://ascii.fedekotek.design/kit/ascii-ui.css">
<script defer src="https://ascii.fedekotek.design/kit/ascii-ui.js"></script>
```

Pinned, which never changes under you:

```html
<link rel="stylesheet" href="https://ascii.fedekotek.design/kit/1.2.0/ascii-ui.css">
<script defer src="https://ascii.fedekotek.design/kit/1.2.0/ascii-ui.js"></script>
```

Every version stays at its own address: 1.0.0, 1.1.0, 1.1.1 and 1.2.0 are there, and [CHANGELOG.md](CHANGELOG.md) lists them. Or download the two files from the Get the kit section of the site and link your own copies. Both files say their version in their first line, and `ASCIIUI.version` says it in the console.

The CSS pulls Geist Mono from Google Fonts with an `@import`. For a faster first paint, remove that line and put the `<link>` from the comment next to it in your `<head>`. Without the font it falls back to the system monospace.

## Use it in three steps

1. Link the two files, as above.
2. Open a component on https://ascii.fedekotek.design/#components, pick its Code tab and copy the HTML.
3. Paste it into your page. Done. The CSS and JS printed under the HTML are already in the two files; they are there so you can read them. When a Code tab uses a class the kit does not style (the Blocks, and the two components marked site only), it says which, so you know what to write yourself.

The HTML has no ids. Each component finds its parts inside the element around it, and ascii-ui.js makes the ids that accessibility needs (a label's `for`, a tab's `aria-controls`), so the same component pasted twice is two working copies.

Radio buttons share a group by `name`. When the same radios are pasted twice outside any form, or twice inside one form, ascii-ui.js gives each copy's radiogroup or fieldset a name of its own (the second becomes `vis-1`, and so on) and keeps each copy's checked radio. Radios in two different forms are already two groups, so they keep the names you gave them, and each form sends what you expect. If your own form spreads one radio group over two fieldsets, put one `role="radiogroup"` around both.

## Data attributes

Anything with `data-aui="NAME"` gets that behavior when the page loads, and so do elements added later.

| Attribute | On | Does |
|---|---|---|
| `data-aui="tabs"` | the `role="tablist"` | click and arrows, Home, End pick a tab. The panels are the `role="tabpanel"` elements next to the list, in order, or the ones `aria-controls` names |
| `data-aui="slider"` | `.slider` | draws the halftone bar from the range input and fills the `<output>`. `data-cells` sets the width (24) |
| `data-aui="progress"` | `role="progressbar"` | draws the bar from `aria-valuenow`. Change the attribute, or call `ASCIIUI.progress(el, 40)` |
| `data-aui="dropdown"` | `.pop` | the `aria-haspopup` button opens the `role="menu"`; arrows, Home, End move, Escape and Tab close |
| `data-aui="popover"` | `.pop` | the `aria-haspopup` button opens the `.pane` next to it, a small panel that is not modal. The focus goes in, to `[autofocus]` or the first control; Escape and a `data-aui-close` inside close it and bring the focus back; a click outside or Tab past the end just close it. A `<form method="dialog">` inside closes it once the form is valid. It opens below its button, above when there is no room, and moves left in whole characters at the edge |
| `data-aui="combobox"` | `.combo` | a field with an `input[role="combobox"]` and a `.pane` holding a `role="listbox"` of `role="option"`. Typing narrows the list (every word typed starts a word of the option, case and accents aside), arrows, Page Up and Down move, Enter or a click picks, Escape puts the pick back. `data-value` on an option is what it sends; `data-name="x"` adds a hidden input with it. `data-empty` is what it says when nothing matches, `data-error-list` what it says when you leave it with words that are not an option. `data-free` takes any text. `aria-disabled="true"` on an option makes it unavailable |
| `data-aui="contextmenu"` | `.ctx` | a right-click inside it, a long press on a touch screen, or Shift F10 or the Menu key on something focused in it opens its `.menu.pane` (`role="menu"`) there. Arrows, Home, End and a first letter move; the letter in an item's `<kbd>` picks it; Escape and Tab close it and bring the focus back. Shift and right-click, links and text fields still get the browser's own menu |
| `data-aui="confirm"` | an `<input>` in an alert dialog | `data-match="static-prod"`: the dialog's `.btn-danger` buttons stay disabled until the input holds exactly those words. Enter with them wrong says what to type (`data-error` for the words). It starts empty every time the dialog opens |
| `data-aui="tooltip"` | `.pop` | hover and focus are CSS; this adds tap to show and Escape to put it away |
| `data-aui="otp"` | `.otp` | advances, goes back on Backspace, takes a paste. The first box gets `autocomplete="one-time-code"`, so a phone offers the code from the message. `data-name="code"` adds a hidden input with the whole code, for the form |
| `data-aui="calendar"` | an empty element | draws the month; arrows by day and week, Page Up and Down by month. `data-value="2026-09-26"` picks a day (a day outside `data-min` and `data-max` is not picked; without `data-value` nothing is, today is shown and focused and the hidden input stays empty until a person picks), `data-min` and `data-max` bound it, `data-week-start="0"` starts on Sunday (Monday is the default), `data-locale="de"` names the months and days, `data-name="when"` adds a hidden input with the ISO date |
| `data-aui="pagination"` | a `<nav>` | draws the pages; `data-pages="9" data-page="3"`. A page past the end is drawn as the last one and kept, so `data-page="12"` and then `data-pages="20"` lands on 12, in either order. `data-href="?page={n}"` draws links instead of buttons |
| `data-aui="validate"` | an `<input>` in a `.field` | checks `required`, `type`, `pattern`, the lengths and the range as you type, when you leave the field and when the form is sent. Writes the message to the nearest `.error` (or the element `aria-describedby` names) |
| `data-aui="counter"` | a `<textarea>` | counts against `maxlength`, into the nearest `.count` |
| `data-aui="spinner"` | any `<b>` or `<span>` | `data-kind="classic"`, `ramp`, `bounce`, `dots` or `fill` |
| `data-aui="skeleton"` | a `<pre class="skel">` | a card silhouette with a wave through the ramp |
| `data-aui-open` | a button | opens the nearest `<dialog>`, a card or a `.sheet`. Escape and a tap on the page around it close it. A `<dialog role="alertdialog">` waits for an answer: a tap around it nudges the card and puts the focus back on the safe button (`autofocus`), and Escape counts as that button |
| `data-aui-close` | a button in a dialog or a popover | closes it. `data-aui-close="delete"` also sets the dialog's `returnValue`, so its `close` event knows the answer (it is empty after Escape). In a popover inside a dialog, only the popover closes |
| `data-aui-toast="Saved."` | a button | shows a lime toast. `data-aui-toast-err` shows a yellow one. While a modal dialog is open the toast goes inside it, so it sits on top and is read out |
| `data-aui-reset` | a button in a form or a dialog | puts every field back to what the HTML says (a checkbox checked in the HTML comes back checked), then redraws the bars, outputs, counts and code boxes. Hidden inputs are left alone, and the calendar and the code boxes set their own again (a calendar without `data-value` goes back to nothing picked). Outside a form or a dialog it does nothing and says so in the console |
| `data-aui-fill` | a button | runs the nearest progress bar from 0 to 100, for demos. `data-aui-done` is what it says at the end |
| `role="status"` | next to the components above | the nearest one says what happened (the picked date, the page, the code) |

"Nearest" means the smallest element around the component that holds one, and only if no other component stands between them: a status line, a count or an error comes after its component, a progress bar before or after its button. A component without a part of its own finds nothing, it does not borrow the next one's.

To point at something elsewhere on the page, give it an id and name it: `data-aui-open="id"`, `data-aui-fill="id"`, `data-status="id"`. A dialog can also be named without an id: `<dialog data-aui-dialog="publish">` and `<button data-aui-open="publish">`. A button and a dialog directly in `<body>` work too, the dialog after the button. When `data-aui-open` finds no dialog, the console says so once, in one line.

### Validation messages

The words come from attributes on the input, and a plain default when there is none:

| Attribute | When |
|---|---|
| `data-error-required` | the field is empty and `required` |
| `data-error-type` | an `email`, `url` or `number` field holds something else |
| `data-error-pattern` | the value does not match `pattern` (the `title` is used next) |
| `data-error-length` | shorter than `minlength` or longer than `maxlength` |
| `data-error-range` | under `min` or over `max` |
| `data-error` | anything else |

When a form is sent with a bad field, the browser's own bubble is replaced by the message in the page, and the first bad field gets the focus. A form with `novalidate` is stopped the same way.

## Events

Every event bubbles, starts with `aui:` and carries its details in `event.detail`. They fire for what a person does, not on load and not for the calls below, so setting a value from your script does not loop back into your listener. A field that is bad on load shows its message and fires nothing; a code filled on load or by `otp(el).value` is accepted and fires nothing.

| Component | Event | `detail` |
|---|---|---|
| Tabs | `aui:change` on the tablist, when the pick changes | `{ tab, index }` |
| Dropdown | `aui:select` on the `.pop` | `{ item, text }` |
| Popover | `aui:toggle` on the `.pop`, when a person opens or closes it | `{ open }` |
| Combobox | `aui:change` on the `.combo`, when a person picks | `{ value, label, option }` |
| Context menu | `aui:select` on the `.ctx` | `{ item, text, target }` (`target` is the row or element it opened on) |
| OTP | `aui:complete` on the `.otp`, when every box holds a digit | `{ value }` |
| Calendar | `aui:change` on the calendar | `{ date, value }` (`value` is `yyyy-mm-dd`) |
| Pagination | `aui:change` on the `<nav>`, buttons only (a link just goes) | `{ page }` |
| Validate | `aui:invalid` and `aui:valid` on the input, when the verdict changes | `{ message, validity }` |
| Reset | `aui:reset` on the form or dialog, after the fields are back | `{}` |
| Slider, counter | the input's own `input` and `change` | |
| Dialog, sheet, alert dialog | the dialog's own `close`; `returnValue` holds the `data-aui-close` answer | |

```js
document.addEventListener('aui:change', e => {
  if (e.target.matches('[data-aui="calendar"]')) console.log(e.detail.value);
});
```

## API

`window.ASCIIUI`:

| Call | Does |
|---|---|
| `version` | `"1.2.0"` |
| `init(root)` | wires everything under `root` (the page when left out). Safe to call again: a component is wired once |
| `destroy(root)` | tears down the components under `root`, and `root` itself: their listeners, observers and animations go |
| `get(el)` | the calls of the component on `el`, whatever it is, or `null` |
| `validate(form)` | checks every field in it, writes the messages and returns `true` or `false`. It does not move the focus and fires no events |
| `toast(msg, err)` | shows a toast; `err` makes it yellow |
| `progress(el, pct)` | sets a progress bar |
| `tabs(el)` | `select(i)`, `index`, `tab` |
| `pagination(el)` | `set(n)`, `page`, `pages` |
| `calendar(el)` | `set(date)` (a `Date` or `"2026-09-26"`, `null` clears it), `date`, `value` |
| `dropdown(el)` | `open()`, `close()`, `toggle()`, `isOpen` |
| `popover(el)` | `open()`, `close()`, `toggle()`, `isOpen` |
| `combobox(el)` | `open()`, `close()`, `set(value)` (`null` clears it; `false` when no option has that value), `value`, `label`, `option`, `isOpen` |
| `contextmenu(el)` | `open(target)` (an element inside it, or `{ x, y }` in the window), `close()`, `isOpen`, `target` |
| `otp(el)` | `value` (read it or set it), `clear()` |
| `bar(k, n)`, `colorize(str)` | build halftone bars: `k` of `n` cells full, then colored |
| `tones(map)` | swaps the characters of every frame, bar and spinner |
| `reduce` | `true` while the system asks for reduced motion. It follows the setting while the page is open |
| `behaviors` | the functions behind each `data-aui` name, to read. Call `init`, not these |

`tabs(el)` and the others take the element or a selector, wire it first if the page has not yet, and return `null` when `el` is some other component.

```js
ASCIIUI.tabs('#settings [role=tablist]').select(2);
ASCIIUI.calendar(document.querySelector('.cal')).set('2026-12-24');
```

## Lifecycle

A component is wired when it lands on the page and torn down when it leaves it: its listeners (on the page, the window and the component), its observers and its animation go with it. Put the same element back and it is wired again. Moving an element in one go does neither. So frameworks that add and remove markup (a router, a list that re-renders) need nothing extra.

Change a setting on a live element and it follows: `data-aui` itself, `data-page`, `data-pages`, `data-href`, `data-value`, `data-min`, `data-max`, `data-week-start`, `data-locale`, `data-name`, `data-kind`, `data-cells`. `aria-valuenow` redraws a progress bar.

`ASCIIUI.destroy(el)` tears one down by hand, with everything inside it. `ASCIIUI.init(el)` wires it again.

## Without JavaScript

The HTML is real HTML, so most of it works with ascii-ui.js missing or blocked. What does not:

| Component | Without the script |
|---|---|
| Button, badge, avatar, card, alert, kbd, separator, timeline, breadcrumb, details, table, segment, checkbox, radio, switch, select, input, textarea | work as they are (details opens and closes, the controls are native) |
| Tooltip | shows on hover and focus (that is CSS); no tap, no Escape |
| Tabs | the panels show or hide as the HTML has them; the tabs do not switch |
| Slider | the range input works, the bar and the number stay as the HTML has them |
| Progress | the bar stays empty |
| Dropdown, popover, context menu | the panel stays closed (a context menu leaves the browser's own) |
| Combobox | a plain text field; the list stays closed |
| Alert dialog | the buttons do nothing; the dialog stays closed |
| Dialog, sheet | the buttons do nothing; the dialog stays closed |
| OTP | six plain boxes, no advance, no hidden input |
| Validate | the browser's own checks and bubble |
| Counter | no count |
| Calendar, pagination | nothing is drawn: put a date input or plain links in them as a fallback, the script replaces them |
| Spinner, skeleton | nothing moves; the skeleton is empty |
| Toast | nothing shows |

## Theming

Everything reads tokens on `:root`. Override them after the kit CSS:

```css
:root {
  --bg: #0b0b0b; --ink: #f2f2f2; --muted: #9a9a9a;
  --hot: #ff5c00;   /* acts */
  --cy: #00e0ff;    /* cyan: focus, and nothing else */
  --ok: #b6ff00;    /* confirms */
  --warn: #ffcc00;  /* warns */
}
```

Dark follows the system. `<html data-theme="dark">` or `data-theme="light"` forces one. The kit sets its dark tokens under `@media (prefers-color-scheme: dark)` on `:root:not([data-theme="light"])`, and on `:root[data-theme="dark"]`, and a plain `:root` loses to both. The Themes view on the site prints the tokens of any preset under selectors that win in every case, ready to paste after the kit CSS.

The frames are strings of characters. To draw them with others, after ascii-ui.js has run:

```html
<script>
document.addEventListener('DOMContentLoaded', function () {
  ASCIIUI.tones({ "@": "#", "#": "+" });
});
</script>
```

## Using it next to another framework

The kit uses short, generic class names, so it can meet the same names in Bootstrap, Tailwind components or your own CSS. The classes it styles:

`acc alert area avatar b-hot b-ok b-out b-warn badge bar bar-title body btn btn-danger btn-primary cal cal-grid cal-head card check combo count crumbs ctx danger demo err error f faint field field-label frame full glyph good group heavy hot ibtn info invalid kbds label lift menu mid muted nudge off ok on open opts opts-none otp pane past pct pop progress prompt row sepd sepl shade sheet sheet-x skel slider slider-track sm spins stack status switch-track tab tablewrap tablist tabpanel tbl tgroup timeline tip toast today tone-* up vh`

The ones most likely to collide: `btn`, `card`, `alert`, `badge`, `row`, `field`, `label`, `body`, `tab`, `menu`, `progress`, `error`, `muted`, `pane`, and the state classes `on`, `off`, `open`, `up`, `good` and `invalid`. It also sets a few things on elements: `box-sizing` on everything, `body` (font, colors), the margins of headings, paragraphs and lists, `a`, `[hidden]`, `dialog`, `kbd`, `fieldset` and `legend`.

To keep them apart, load the kit into a cascade layer. Any CSS of yours that is not in a layer then wins over the kit where both style the same thing:

```css
/* first in your stylesheet */
@import url("ascii-ui.css") layer(ascii);
```

Or copy only the blocks you need from the Code tab and put each under a wrapper of your own (`.ascii .btn { ... }`). Prefixed class names are not in the kit yet.

## Browser support

Current Chromium (Chrome, Edge, Opera, Samsung Internet), Firefox 121 and later, Safari 16.4 and later. The kit needs `:has()`, `<dialog>` with `showModal()`, `color-mix()` (older browsers get a plain color), `AbortController` for listeners, and `Intl` dates for the calendar. It works from `file://`.

## Known limits

- Class names are generic, see above.
- A frame is 400 characters wide (about 3,400px at 14px type) and a wall 200 rows tall (about 4,200px). A box wider or taller than that shows its rim stopping short. `ASCIIUI.tones()` builds the same lengths.
- Shadow DOM is not supported: components inside a shadow root are not found or wired, and the kit CSS does not reach in.
- One toast at a time; a new one replaces the last.
- The calendar picks one day, not a range.
- Popovers, the combobox list and the context menu go to the top layer where the browser has the Popover API. Without it (Safari before 17, Firefox before 125) a panel inside a box that scrolls or clips is cut off at that box's edge, as the dropdown's menu is everywhere.
- The combobox picks one option, not several.
- Motion runs on `requestAnimationFrame`, only while the element is on screen. With `prefers-reduced-motion` nothing animates.

## License

MIT License

Copyright (c) 2026 Fede Kotek

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
