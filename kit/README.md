# ascii/ui kit

Version 1.2.1. What changed from version to version is in [CHANGELOG.md](CHANGELOG.md).

The kit is two files, `ascii-ui.css` and `ascii-ui.js`. No package, no build step, no dependencies. `starter.html`, next to this file, is a page that links the two and nothing else, with every component on it. The whole site as one HTML file is a separate download, from the footer of https://ascii.fedekotek.design.

## Install

Put the two tags in the `<head>` of your page. The script is `defer`, so it runs once the page is parsed, wherever the components are.

Latest, which follows every new version:

```html
<link rel="stylesheet" href="https://ascii.fedekotek.design/kit/ascii-ui.css">
<script defer src="https://ascii.fedekotek.design/kit/ascii-ui.js"></script>
```

Pinned, which never changes under you. The `integrity` attribute is the file's fingerprint: if a single byte of it changes on the way, the browser refuses to run it. It works only on a pinned address (the latest one changes with every version), and it needs `crossorigin`:

```html
<link rel="stylesheet" href="https://ascii.fedekotek.design/kit/1.2.1/ascii-ui.css" integrity="sha384-61faWJddlqmzdFSb2FHUiQkCKJmw9kEf9vvayxyDPDkMyZdwMwT2o4KC5H3IQJ7L" crossorigin="anonymous">
<script defer src="https://ascii.fedekotek.design/kit/1.2.1/ascii-ui.js" integrity="sha384-/gb6Yw38b/1ica/aWitS46ktHYko2WLYtpmCAijY19AFcjrLMDhMZLLlhrfQDCLr" crossorigin="anonymous"></script>
```

Every version stays at its own address: 1.0.0, 1.1.0, 1.1.1, 1.2.0 and 1.2.1 are there, and [CHANGELOG.md](CHANGELOG.md) lists them. Or download the two files from the Get the kit section of the site and link your own copies. Both files say their version and license in their first line, and `ASCIIUI.version` says it in the console.

The font is Geist Mono, from `fonts/geist-mono-latin.woff2` next to the CSS (a Latin-1 subset, 19 kB, SIL OFL 1.1, the license is `fonts/OFL.txt`). Linked from this site, it comes from here too, and nothing asks Google or anyone else. With your own copies, put the `fonts/` folder next to `ascii-ui.css`, or leave it out: an installed Geist Mono is used first, then the system monospace. `LICENSE.txt` sits next to the two files on the site.

## Use it in three steps

Or skip all three: Download page, under Copy on any Code tab, saves that one component as a whole page (`ascii-ui-NAME.html`), already linked to the pinned kit with its integrity. Open page shows the same page in a new tab. The Blocks have it too (see [Blocks](#blocks)). Command, Picture and a Block with a part the kit cannot draw yet say so instead.

1. Link the two files, as above.
2. Open a component on https://ascii.fedekotek.design/#components, pick its Code tab and copy the HTML.
3. Paste it into your page. Done. The CSS and JS printed under the HTML are already in the two files; they are there so you can read them. When a Code tab uses a class the kit does not style (the two components marked site only, and a Block still waiting for a part), it says which, so you know what to write yourself.

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
| `data-aui="contextmenu"` | `.ctx` | a right-click inside it, a long press on a touch screen, or Shift F10 or the Menu key on something focused in it opens its `.menu.pane` (`role="menu"`) there (a long press on a row opens it under the row, as the keyboard does). Arrows, Home, End and a first letter move; the letter in an item's `<kbd>` picks it; Escape and Tab close it and bring the focus back. Shift and right-click, links and text fields still get the browser's own menu |
| `data-aui="confirm"` | an `<input>` in an alert dialog | `data-match="static-prod"`: the dialog's `.btn-danger` buttons stay disabled until the input holds exactly those words. Wrong words say what to type (`data-error` for the words): on Enter, on leaving the field, and on a pause once they cannot become the match. It starts empty every time the dialog opens |
| `data-aui="tooltip"` | `.pop` | hover and focus are CSS; this adds tap to show and Escape to put it away |
| `data-aui="otp"` | `.otp` | advances, goes back on Backspace, takes a paste. The first box gets `autocomplete="one-time-code"`, so a phone offers the code from the message. `data-name="code"` adds a hidden input with the whole code, for the form. A letter is refused: `.invalid` on the group, `aria-invalid` on the box, its brackets turn into `!`, and the status line says "Digits only." (`data-error` for other words). The next digit puts it right. Add `.invalid` yourself for a code the server refused |
| `data-aui="calendar"` | an empty element | draws the month; arrows by day and week, Page Up and Down by month. A new month is said out loud, from a hidden live region inside it. `data-value="2026-09-26"` picks a day (a day outside `data-min` and `data-max` is not picked; without `data-value` nothing is, today is shown and focused and the hidden input stays empty until a person picks), `data-min` and `data-max` bound it, `data-week-start="0"` starts on Sunday (Monday is the default), `data-locale="de"` names the months and days, `data-name="when"` adds a hidden input with the ISO date |
| `data-aui="pagination"` | a `<nav>` | draws the pages; `data-pages="9" data-page="3"`. A page past the end is drawn as the last one and kept, so `data-page="12"` and then `data-pages="20"` lands on 12, in either order. `data-href="?page={n}"` draws links instead of buttons |
| `data-aui="validate"` | an `<input>` in a `.field` | checks `required`, `type`, `pattern`, the lengths and the range when you leave the field and when the form is sent. From then on it checks as you type too, so a fix clears the message at once; nobody is told a word is wrong before they finish it. A value wrong on load shows its message from the start. Writes the message to the nearest `.error` (or the element `aria-describedby` names) |
| `data-aui="counter"` | a `<textarea>` | counts against `maxlength`, into the nearest `.count` |
| `data-aui="segment"` | a `.tgroup` (`role="radiogroup"`) | writes the pick into the nearest `role="status"`, on load and on every pick: the label's words, or `data-say="{label} view."` around them |
| `data-aui="spinner"` | any `<b>` or `<span>` | `data-kind="classic"`, `ramp`, `bounce`, `dots` or `fill`. The frames are hidden from screen readers: with an `aria-label` the spinner is `role="img"` and read as that word; without one it is `aria-hidden`, so put the wait in words next to it |
| `data-aui="skeleton"` | a `<pre class="skel">` | a card silhouette with a wave through the ramp |
| `data-aui="chart"` | a `.chart` around a `<table>` | draws the table in characters, see [Charts](#charts). `data-type="bars"` (the default), `line`, `hbars`, `heatmap`, `donut`; `data-type="spark"` on a `.spark` reads `data-values` instead |
| `data-aui="checklist"` | a `.checklist` of checkboxes | puts the share ticked, as a percent, into the nearest `role="progressbar"` before or after it (or the one `data-progress="id"` names). `data-done="All done."` is a toast when a person ticks the last one |
| `data-aui="pick"` | a group of buttons, links or `role="button"` cards | one of them is the pick: a click, or Enter or Space on a `role="button"`. When one has `aria-current` in the HTML (a `.navlist`), the pick takes it; otherwise each gets `aria-pressed`, `"true"` on the pick. The nearest `role="status"` says the pick's `data-say` |
| `data-aui="stepper"` | a `.stepper`: a button, the number (`<b>` or `<output>`), a button | the first takes one off, the last adds one, from `data-min` (1) to `data-max` (99). At the end of the range that button turns off and the focus moves to the other. Every `[data-each]` in the same `.card` (or the stepper's parent) shows `data-each` times the number, in `data-unit`: `g` becomes `kg` from 1000 and `ml` becomes `l`, `g` and `ml` round to 10, `kg` and `l` to one decimal, no unit rounds up to a whole count |
| `data-aui-open` | a button | opens the nearest `<dialog>`, a card or a `.sheet`. Escape and a tap on the page around it close it. On a touch screen a `.sheet` also closes on a drag down, by its title or from the top of what it holds: it follows the finger a row at a time and closes past a quarter of its height or on a flick. A `<dialog role="alertdialog">` waits for an answer: a tap around it nudges the card and puts the focus back on the safe button (`autofocus`), and Escape counts as that button |
| `data-aui-close` | a button in a dialog or a popover | closes it. `data-aui-close="delete"` also sets the dialog's `returnValue`, so its `close` event knows the answer (it is empty after Escape). In a popover inside a dialog, only the popover closes |
| `data-aui-toast="Saved."` | a button | shows a lime toast. `data-aui-toast-err` shows a yellow one. The mark (`@@`, `!!`) is `aria-hidden`; good news is a `role="status"`, an error a `role="alert"`, read at once. `[x]` puts it away and the focus goes back. It stays `--aui-toast` (3.6s) at least, 60ms a character for longer words, 15s at most, and holds while a pointer or the focus is on it. While a modal dialog is open the toast goes inside it, so it sits on top and is read out |
| `data-aui-reset` | a button in a form or a dialog | puts every field back to what the HTML says (a checkbox checked in the HTML comes back checked), then redraws the bars, outputs, counts and code boxes. Hidden inputs are left alone, and the calendar and the code boxes set their own again (a calendar without `data-value` goes back to nothing picked). Outside a form or a dialog it does nothing and says so in the console |
| `data-aui-fill` | a button | runs the nearest progress bar from 0 to 100, for demos. `data-aui-done` is what it says at the end |
| `data-aui-signal="glitch"` | any element, next to its own `data-aui` or not | the bad signal, opt in: `glitch`, `scramble`, `band`, `rot`, several with spaces. See [Signal](#signal) |
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
| Segment | `aui:change` on the `.tgroup`, when a person picks | `{ value, label, input }` |
| Chart | `aui:pick` on the `.chart`, on a click or a key | `{ index, label, values, texts }`; a heatmap: `{ index, row, col, label, column, value, text }` |
| Checklist | `aui:change` on the list, when a person ticks or unticks one | `{ done, total }` |
| Pick | `aui:change` on the group, when a person picks | `{ item, index }` |
| Stepper | `aui:change` on the `.stepper` | `{ value }` |
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
| `version` | `"1.2.1"` |
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
| `chart(el)` | `pick(i)` (`-1` lets go), `index`, `draw()` (reads the table again and draws it whole), `data` (what it read: `rows`, `names`, `max`) |
| `bar(k, n)`, `colorize(str)` | build halftone bars: `k` of `n` cells full, then colored |
| `tones(map)` | swaps the characters of every frame, bar and spinner |
| `glitch(el)`, `scramble(el)`, `band(el)` | runs that effect of [Signal](#signal) once, now, on any element (`band()` with nothing rolls down the window). `true` when it ran, `false` when it held still (reduced motion, forced colors, print, a field with the focus, the level `off`, off screen, or three glitches already this second) |
| `rot(el)`, `repair(el)` | decays the frames in `el` a step now, and puts them back (`repair()` with nothing puts every one back) |
| `signal(level)` | `"calm"`, `"normal"`, `"loud"` or `"off"` on the root, as `data-aui-signal-level`; `null` takes it off; with nothing it says the level |
| `reduce` | `true` while the system asks for reduced motion. It follows the setting while the page is open |
| `behaviors` | the functions behind each `data-aui` name, to read. Call `init`, not these |

`tabs(el)` and the others take the element or a selector, wire it first if the page has not yet, and return `null` when `el` is some other component.

```js
ASCIIUI.tabs('#settings [role=tablist]').select(2);
ASCIIUI.calendar(document.querySelector('.cal')).set('2026-12-24');
```

## Charts

A chart is a table you already have. Put it in a `.chart` with `data-aui="chart"`: the first column names the points, every other column is a series, the header row names the series and the caption names the chart. The script draws it in characters above the table, from the ramp, one row of `--r` a line, as wide as its box (it redraws when the box changes width, and when the table changes). The drawing is paint (`aria-hidden`); the table stays, clipped out of sight, so a screen reader reads the numbers as a table. Without the script the table is what shows.

```html
<div class="stack">
  <div class="chart" data-aui="chart" data-type="bars" data-pick="3">
    <table>
      <caption>Requests per day</caption>
      <thead><tr><th scope="col">Day</th><th scope="col">Requests</th></tr></thead>
      <tbody>
        <tr><th scope="row">Mon</th><td>1,204</td></tr>
        <tr><th scope="row">Tue</th><td>1,482</td></tr>
      </tbody>
    </table>
  </div>
  <p class="muted status" role="status"></p>
</div>
```

| `data-type` | Draws |
|---|---|
| `bars` (default) | a bar per row, growing through the ramp. Two series or more: a bar each, a glyph each (`@ # % + = :`), and a key under it |
| `line` | a line across the rows, filled under it. Two series or more: a line each, a glyph each, and a key |
| `hbars` | a halftone bar per row, the first series, with the cell's text at the end |
| `heatmap` | every cell a point, two characters wide, denser for more. The newest columns (the last ones) stay when the box is too narrow |
| `donut` | the first series as slices of a ring, a glyph and a color each, with a legend and the share of each |
| `spark` | on a `<span class="spark">`: `data-values="3 5 2 8"`, one ramp character a value. An image named by its numbers (`data-label` names the trend), unless it is `aria-hidden` |

A cell's number is its `data-value`, or else its text without commas, units and `%`, so `1,204` and `92%` read as they should, and the status line says the text as written. `data-max` and `data-min` set the scale (the top of the axis is otherwise the largest value, rounded up), `data-rows` the height in rows (8), `data-pick` the point picked at first.

The chart takes a Tab stop (`role="group"`, named by the caption). The arrows move the pick (up and down move by row in a heatmap), Home and End go to the ends, Escape lets go, and a click picks the point under it. The pick is said in the nearest `role="status"` (or in a hidden one inside the chart), marked in text as well as in violet (`[Thu]`, `[]` in a heatmap), and fires `aui:pick`. Colors are the tokens: magenta and pink for one series, then deep blue, pink, violet; never cyan, which is focus. It grows in once when it first comes on screen; under reduced motion it is drawn whole.

## Signal

The site's effects, the bad signal, for your own pages. All of it is opt in: nothing runs until an element asks with `data-aui-signal`, or a script calls one of the calls below. Several on one element take spaces: `data-aui-signal="glitch rot"`. It needs no `data-aui`, so it rides on any component.

```html
<div data-aui-signal="glitch">
  <div role="tablist" class="tablist" data-aui="tabs">...</div>
</div>
<p data-aui-signal="scramble">Twelve probes, three regions, one pager.</p>
<div class="frame tone-mid" data-aui-signal="band rot" data-rot="30"><div class="body">...</div></div>
```

| `data-aui-signal` | Does |
|---|---|
| `glitch` | when a state inside it changes (`aria-selected`, `aria-pressed`, `aria-expanded`, `aria-checked`, `aria-current`, `open`, a checkbox, radio or select), the part that changed goes a character sideways and back, and a strip or two of light characters, knocked a character off, crosses it. Two frames of 50ms (calm one, loud three), each strip one frame. Not in the first quarter second, so the page setting itself up is not a change. `ASCIIUI.glitch(el)` runs it on anything |
| `scramble` | the words decode into place from the left, once, when it first comes on screen: 10 frames of 40ms (calm 6, loud 14). Only letters and digits are scrambled; spaces and punctuation stay, so every line keeps its width and its breaks. `ASCIIUI.scramble(el)` runs it again |
| `band` | three rows of `- = -` roll down through the box, a row a step, every 9 seconds or so (calm 18, loud 5), 65ms a step. Pink and see-through, the words under it stay readable. On `<html>` or `<body>` it rolls down the window. `ASCIIUI.band(el)` rolls one now |
| `rot` | after `data-rot` seconds (14) with no pointer, key, wheel or scroll, the frames in it lose characters, two ramp steps lighter, a step every 1.1s, three steps (calm two, loud five). Any input repairs them at once |

How loud: `--aui-signal` on `:root`, `calm`, `normal` (the default), `loud` or `off`, or `data-aui-signal-level` on the root or on any element around the effect, which wins. `ASCIIUI.signal("loud")` sets it on the root.

```css
:root { --aui-signal: calm; }
```

The scanlines are Signal too, and still: `<html class="crt">`, and `<html class="crt interlace">` for every other pixel.

What it promises:
- **Off by default.** Nothing moves until you ask, and asking is one attribute.
- **Still when asked to be.** `prefers-reduced-motion`, `forced-colors` (Windows High Contrast) and print switch every effect off, in the CSS and in the script, and a change to them is followed while the page is open. So does a field that takes typing having the focus, and a tab in the background.
- **Nothing moves.** It is paint: strips and bands on one fixed layer, a `translate`, a frame's string. No box on the page changes place or size, before, during or after.
- **Nothing in the way.** The layer takes no clicks (`pointer-events: none`) and is `aria-hidden`. A strip covers text for one frame; the band is see-through.
- **Screen readers get the words.** While a scramble runs, the noise is an `aria-hidden` `<aui-noise>` and the words sit in a visually hidden `<aui-sr>` next to it, so a screen reader reads the words at once, never the noise. Live regions (`role="status"`, `role="alert"`, `aria-live`) are never scrambled. Frames are paint, so rot says nothing.
- **No flashing.** At most three glitches a second on the whole page (WCAG 2.3.1); a fourth waits.
- **Colors keep their jobs.** Noise is magenta and pink. Never cyan, which is focus.
- **It rests.** Its loop asks for a frame only while an effect is drawing. Between them it waits on one timer, and with nothing to do, on nothing. A hidden tab stops it.

## Lifecycle

A component is wired when it lands on the page and torn down when it leaves it: its listeners (on the page, the window and the component), its observers and its animation go with it. Put the same element back and it is wired again. Moving an element in one go does neither. So frameworks that add and remove markup (a router, a list that re-renders) need nothing extra.

Change a setting on a live element and it follows: `data-aui` itself, `data-page`, `data-pages`, `data-href`, `data-value`, `data-min`, `data-max`, `data-week-start`, `data-locale`, `data-name`, `data-kind`, `data-cells`, `data-type`, `data-values`, `data-rows`, `data-pick`, `data-aui-signal`, `data-rot`. `aria-valuenow` redraws a progress bar, and a change to a chart's table redraws the chart.

`ASCIIUI.destroy(el)` tears one down by hand, with everything inside it. `ASCIIUI.init(el)` wires it again.

## Without JavaScript

The HTML is real HTML, so most of it works with ascii-ui.js missing or blocked. What does not:

| Component | Without the script |
|---|---|
| Button, badge, avatar, card, alert, icon, kbd, separator, timeline, breadcrumb, details, table, checkbox, radio, switch, select, input, textarea | work as they are (details opens and closes, the controls are native) |
| Segment | the radios work; the status line stays as the HTML has it |
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
| Chart | the table shows, with its caption: the same numbers, as a table |
| Sparkline | empty, or its own text when it has some (write the numbers in it, the script replaces them) |
| Toast | nothing shows |
| Stat, poster title, pricing, key and value, tags, thumb, profile, nav list | work as they are (the title rows are in the HTML) |
| Checklist | the boxes tick; the bar next to it stays empty |
| Meter | the bar stays empty; the number next to it still reads |
| Pick | the HTML's pick stays; a click changes nothing |
| Stepper | the number and the amounts stay as the HTML has them |

## Blocks

The Blocks on the site (https://ascii.fedekotek.design/#blocks) are page-sized: a login, a pricing table, a checklist, a portfolio. They are made of the components above and of these pieces, which are in the kit too, so a Block's Code tab prints HTML that runs on the two files and offers Download page (a Block with a part the kit cannot draw yet says so there instead). `kit/starter.html` has each piece under Blocks.

| Class | What it is | In |
|---|---|---|
| `.kpis`, `.kpi` | stat tiles: a label, the number, a line for the change. As many in a row as fit, 30 characters each at the least | Stats |
| `.poster.ptitle` | a title in big pixels made of characters: 14 `<span>` rows in 4 of the page's, colored ink to violet from the top. The kit has no bitmap face, so the rows are in the HTML: the site draws and develops them, the Code tab prints them finished. Keep `aria-hidden` on it and the words next to it in a `.vh` | Stats, 404 |
| `.grid2`, `.grid3` | cards side by side, as many 37 (or 27) character columns as the box holds, stacked without the room | Cases, Pricing |
| `.pricing`, `.price`, `.feat`, `.popular`, `.row.full` | plans on a `.grid3`: cards as tall as the row, the feature list takes the slack, the popular plan wears a violet badge on its top rule, the buttons stretch | Pricing |
| `.checklist`, `.meta` | checkboxes with a grey line under each, struck through when ticked. `data-aui="checklist"` fills the progress bar next to it | Orders |
| `.navlist` | the pages of an app: buttons or links with a count, the current one (`aria-current`) an ink slab with a `>`. `data-aui="pick"` moves it on a click | Sidebar |
| `.lift[role="button"]` | a card you pick, in a `data-aui="pick"` group: the pick's title is a slab with a `>` and its rim turns magenta | Cases |
| `.kv`, `.qty` | a `<dl>` of grey labels and values; `.qty` is an amount, bold and magenta | Now, Profile, Recipe, Build |
| `.progress[role="meter"]` | a value on the halftone bar next to words, drawn by `data-aui="progress"` from a percent, `data-cells` wide, with `aria-valuetext` for the number | Now, Build |
| `.stepper`, `.steps` | a number between `[-]` and `[+]`; `data-aui="stepper"` counts and scales the `[data-each]` amounts in its card. `.steps` is a numbered method | Recipe |
| `.tags`, `.b-violet`, `.b-pink` | a row of badges that only label: violet or pink, since lime confirms and yellow warns | Cases, Build |
| `.thumb` | a picture slot: an `<img>`, or a `<pre>` of characters with `role="img"` and an `aria-label` | Cases, Profile |
| `.profile` | a picture beside the words about a person, side by side from 720px | Profile |
| `a.btn` | a link dressed as a button, for a way out that goes to another page | 404, Profile |

What the site's engine draws the kit prints as a still. The bitmap titles come finished, the LCD pictures of Cases and Profile are drawn in characters (put an `<img>` in the `.thumb` instead), the halftone stats of Build and Now are meters. The toys stay on the site: Reroll in Build, Load portrait in Profile, the 404 title that never settles.

`ASCIIUI.get(el)` on a pick returns `select(i)`, `index` and `item`; on a stepper `set(n)` and `value`; on a checklist `done` and `total`.

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

For design tools, the same tokens are in [tokens.json](https://ascii.fedekotek.design/kit/tokens.json), next to this file on the site: the W3C design tokens format (`$value`, `$type`, `$description`), which Tokens Studio and the Figma Variables importers read. It holds the colors in a light and a dark set, the grid, the type, the ramp, the frame tones and the motion below, for the default preset. Download tokens.json in the Themes view makes the same file for the preset and colors you are looking at. It is built from the tokens, not part of a pinned version.

### Motion

Motion is steps, never eased: a step is a whole character or a whole row. Every animation takes its time and its steps from tokens on `:root`, so you can slow the kit down, speed it up, or switch one motion off with `0s`:

| Token | Default | Used by |
|---|---|---|
| `--aui-quick` | `.16s` | the switch, the tooltip, a panel opening (popover, combobox, context menu) |
| `--aui-base` | `.24s` | the toast, the alert dialog's nudge |
| `--aui-slow` | `.28s` | the sheet |
| `--aui-toast` | `3.6s` | the shortest a toast stays (ascii-ui.js reads it) |
| `--aui-ease-flip` | `steps(2)` | the switch thumb, a character a step |
| `--aui-ease-type` | `steps(12)` | the tooltip and the toast, typed in |
| `--aui-ease-wipe` | `steps(4)` | a panel, a row a step |
| `--aui-ease-rise` | `steps(7)` | the sheet |
| `--aui-ease-jolt` | `steps(1,end)` | the nudge |

`prefers-reduced-motion` switches every one of them off, whatever the tokens say.

### Scanlines, print, high contrast

Scanlines are off. `<html class="crt">` brings them back, over the page and over an open dialog. `<html class="crt interlace">` draws them every other pixel, fainter. Both are still: part of [Signal](#signal), and gone in print and in forced colors.

The kit prints as black characters on white paper: the toast, tooltips, panels and dialogs stay off the paper, a link to another site prints its address, and cards and fields do not split across pages. In Windows High Contrast (`forced-colors`) the picked tab, day, page and option come back as slabs in the system colors, and the focus as `Highlight`. With `prefers-contrast: more`, grey text darkens and body type gets heavier.

### Characters

The frames are strings of characters. To draw them with others, after ascii-ui.js has run:

```html
<script>
document.addEventListener('DOMContentLoaded', function () {
  ASCIIUI.tones({ "@": "#", "#": "+" });
});
</script>
```

## Icons

Thirty-nine icons drawn in characters, in CSS only: no icon font, no SVG, no script. Each one comes in two sizes. Inline is one row tall and one to three characters wide, for a line of text or a button's label. Large (`.icon-lg`) is three rows tall and five or six characters wide, for empty states and tiles.

```html
<!-- it means something on its own: an image with a name -->
<span class="icon ok" data-icon="check" role="img" aria-label="Done"></span> Export finished.

<!-- next to words that say the same: decoration -->
<button class="btn frame tone-light" type="button"><span class="mid"><span class="label"><span class="icon" data-icon="download" aria-hidden="true"></span> Export</span></span></button>

<!-- large, for an empty state -->
<span class="icon icon-lg" data-icon="search" aria-hidden="true"></span>
```

The characters are CSS content with empty alt text, so a screen reader says the `aria-label` or nothing. Icons take the color of the text around them; `.hot` (acts), `.ok` (confirms), `.warn` (warns) and `.violet` (structure) give one a role color. There is no cyan one: cyan is focus. They are printable ASCII, so they draw in Geist Mono and in any monospace font that stands in for it, and they stay on screen in print and in Windows High Contrast, because they are text. A name the kit does not know draws nothing. To add one, give it both drawings in your own CSS after the kit's, the way the kit writes them: `.icon[data-icon="rocket"]{--i:"^>";--il:"  ^  \A  /_\\ \A /___\\"}` (`\A ` and its one space start a row, every row is as wide as the others, a backslash is written twice). The site's source has the drawing rules in `docs/ICONS.md`.

| `data-icon` | Inline | Large, ch wide | A label to start from |
|---|---|---|---|
| `search` | `o\` | 5 | Search |
| `close` | `[x]` | 5 | Close |
| `menu` | `[=]` | 5 | Menu |
| `plus` | `[+]` | 5 | Add |
| `minus` | `[-]` | 5 | Remove |
| `check` | `v/` | 5 | Done |
| `warning` | `/!\` | 5 | Warning |
| `error` | `(x)` | 5 | Error |
| `info` | `(i)` | 5 | Information |
| `help` | `(?)` | 5 | Help |
| `arrow-up` | `/\|\` | 5 | Up |
| `arrow-down` | `\\|/` | 5 | Down |
| `arrow-left` | `<-` | 5 | Back |
| `arrow-right` | `->` | 5 | Next |
| `chevron-up` | `^` | 5 | Collapse |
| `chevron-down` | `v` | 5 | Expand |
| `chevron-left` | `<` | 5 | Previous |
| `chevron-right` | `>` | 5 | Next |
| `external` | `->]` | 5 | Opens in a new tab |
| `copy` | `[[]` | 5 | Copy |
| `download` | `_v_` | 5 | Download |
| `upload` | `_^_` | 5 | Upload |
| `edit` | `_/` | 5 | Edit |
| `delete` | `\|_\|` | 5 | Delete |
| `settings` | `{o}` | 5 | Settings |
| `user` | `/o\` | 5 | Account |
| `home` | `[^]` | 5 | Home |
| `bell` | `/.\` | 5 | Notifications |
| `lock` | `[o]` | 5 | Locked |
| `unlock` | `[o/` | 5 | Unlocked |
| `eye` | `<o>` | 5 | Show |
| `eye-off` | `<->` | 5 | Hide |
| `calendar` | `[#]` | 5 | Date |
| `clock` | `(')` | 5 | Time |
| `filter` | `\-/` | 5 | Filter |
| `sort` | `^v` | 5 | Sort |
| `refresh` | `(<` | 5 | Refresh |
| `more` | `...` | 5 | More |
| `star` | `(*)` | 6 | Favorite |

## Using it next to another framework

The kit uses short, generic class names, so it can meet the same names in Bootstrap, Tailwind components or your own CSS. The classes it styles:

`acc alert area avatar b-hot b-ok b-out b-pink b-violet b-warn badge bar bar-title body btn btn-danger btn-primary cal cal-grid cal-head card check checklist combo count crt crumbs ctx danger demo err error f faint feat field field-label frame full glyph good grid2 grid3 group heavy hot ibtn icon icon-lg info invalid kbds kpi kpis kv label lift menu meta mid muted navlist nudge off ok on open opts opts-none otp pane past pct pop popular poster price pricing profile progress prompt ptitle qty row sepd sepl shade sheet sheet-x skel slider slider-track sm spins stack status stepper steps switch-track tab tablewrap tablist tabpanel tags tbl tgroup thumb timeline tip toast toast-x today tone-* up vh violet warn`

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
- The sheet drags down on a touch screen only. With a mouse: the `[x]`, Escape or a click on the veil.
- The calendar picks one day, not a range.
- Popovers, the combobox list and the context menu go to the top layer where the browser has the Popover API. Without it (Safari before 17, Firefox before 125) a panel inside a box that scrolls or clips is cut off at that box's edge, as the dropdown's menu is everywhere.
- The combobox picks one option, not several.
- Motion runs on `requestAnimationFrame`, only while the element is on screen. With `prefers-reduced-motion` nothing animates.
- Signal's scramble swaps the text nodes of its element for two elements while it runs, about half a second. A framework that rewrites that text in the same half second wins, and the scramble lets go. Its noise keeps every line's width in a monospace font; in a proportional one a word can be wider for those frames.

## License

MIT License

Copyright (c) 2026 Fede Kotek

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
