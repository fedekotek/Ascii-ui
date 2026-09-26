# ascii/ui kit

The kit is two files, `ascii-ui.css` and `ascii-ui.js`. No package, no build step, no dependencies. `starter.html`, next to this file, is a page that links the two and nothing else, with every component on it. The whole site as one HTML file is a separate download, from the footer of https://asciiui.vercel.app.

## Use it in three steps

1. Link the two files in the `<head>` of your page:

   ```html
   <link rel="stylesheet" href="https://asciiui.vercel.app/kit/ascii-ui.css">
   <script defer src="https://asciiui.vercel.app/kit/ascii-ui.js"></script>
   ```

   Or download them from the Get the kit section of the site and link your own copies.

2. Open a component on https://asciiui.vercel.app/#components, pick its Code tab and copy the html.

3. Paste it into your page. Done. The css and js printed under the html are already in the two files; they are there so you can read them.

The html has no ids. Each component finds its parts inside the element around it, and ascii-ui.js makes the ids that accessibility needs (a label's `for`, a tab's `aria-controls`), so the same component pasted twice is two working copies. One thing it does not rename: radio buttons share a group by `name`, so give the second copy's radios a name of their own.

The css pulls Geist Mono from Google Fonts with an `@import`. For a faster first paint, remove that line and put the `<link>` from the comment next to it in your `<head>`. Without the font it falls back to the system monospace.

## Data attributes

Anything with `data-aui="NAME"` gets that behavior when the page loads, and so do elements added later.

| Attribute | On | Does |
|---|---|---|
| `data-aui="tabs"` | the `role="tablist"` | click and arrows, Home, End pick a tab. The panels are the `role="tabpanel"` elements next to the list, in order, or the ones `aria-controls` names |
| `data-aui="slider"` | `.slider` | draws the halftone bar from the range input and fills the `<output>` |
| `data-aui="progress"` | `role="progressbar"` | draws the bar from `aria-valuenow`. Change the attribute, or call `ASCIIUI.progress(el, 40)` |
| `data-aui="dropdown"` | `.pop` | the `aria-haspopup` button opens the `role="menu"`; arrows, Home, End move, Escape and Tab close |
| `data-aui="tooltip"` | `.pop` | hover and focus are css; this adds tap to show and Escape to put it away |
| `data-aui="otp"` | `.otp` | advances, goes back on Backspace, takes a paste |
| `data-aui="calendar"` | an empty element | draws the month; arrows by day and week, Page Up and Down by month |
| `data-aui="pagination"` | a `<nav>` | draws the pages; `data-pages="9" data-page="3"` |
| `data-aui="validate"` | an `<input>` in a `.field` | checks `required`, `pattern` and `type`, writes the message to the nearest `.error` (or the element `aria-describedby` names). Words from `data-error-required` and `data-error-pattern` |
| `data-aui="counter"` | a `<textarea>` | counts against `maxlength`, into the nearest `.count` |
| `data-aui="spinner"` | any `<b>` or `<span>` | `data-kind="classic"`, `ramp`, `bounce`, `dots` or `fill` |
| `data-aui="skeleton"` | a `<pre class="skel">` | a card silhouette with a wave through the ramp |
| `data-aui-open` | a button | opens the nearest `<dialog>`, a card or a `.sheet`. Escape and a tap on the page around it close it |
| `data-aui-close` | a button in a dialog | closes it |
| `data-aui-toast="Saved."` | a button | shows a lime toast. `data-aui-toast-err` shows a yellow one |
| `data-aui-reset` | a button in a dialog or form | clears its checkboxes and fields |
| `data-aui-fill` | a button | runs the nearest progress bar from 0 to 100, for demos. `data-aui-done` is what it says at the end |
| `role="status"` | next to the components above | the nearest one says what happened (the picked date, the page, the code) |

"Nearest" means the smallest element around the component that holds one, short of `<body>`. To point at something elsewhere on the page, give it an id and name it: `data-aui-open="id"`, `data-aui-fill="id"`, `data-status="id"`.

Components fire `aui:change`, `aui:select` and `aui:complete` events that bubble, with the details in `event.detail`.

`window.ASCIIUI`: `init(root)` wires a part of the page by hand, `toast(msg, err)`, `progress(el, pct)`, `bar(k, n)` and `colorize(str)` build halftone bars, `tones(map)` swaps the characters, `behaviors` holds the functions above.

Motion runs on `requestAnimationFrame`, only while the element is on screen. With `prefers-reduced-motion` nothing animates.

## Theming

Everything reads tokens on `:root`. Override them after the kit css:

```css
:root {
  --bg: #0b0b0b; --ink: #f2f2f2; --muted: #9a9a9a;
  --hot: #ff5c00;   /* acts */
  --cy: #00e0ff;    /* focus, and nothing else */
  --ok: #b6ff00;    /* confirms */
  --warn: #ffcc00;  /* warns */
}
```

Dark follows the system. `<html data-theme="dark">` or `data-theme="light"` forces one. The Themes view on the site prints the tokens of any preset, ready to paste.

The frames are strings of characters. To draw them with others:

```js
ASCIIUI.tones({ "@": "#", "#": "+" });
```

## License

MIT License

Copyright (c) 2026 Fede Kotek

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
