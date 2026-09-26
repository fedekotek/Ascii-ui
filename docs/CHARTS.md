# Charts

All in js/20 under "a character grid with colour runs". A `Grid(w,h)` holds a character and a color key per cell and renders to HTML with colored runs (`Grid.html()`). Cells set via `g.set(x,y,ch,key)` are ramp-translated; `g.text()` is raw (labels).

| Chart | id | Data | Interaction | Entrance |
|---|---|---|---|---|
| Bars | `ch-bars` | `REQ[7]` | tap a bar (or arrows, Enter), violet highlight, status line | grows from 0 (`grow(drawBars)`) |
| Line | `ch-line` | rolling `d[]`, new point every 700ms while in view | tap = spike (yellow `!`, tear, kick) | grows |
| Regions | `ch-regions` | `REG[5]` | none | grows |
| Heatmap | `ch-heat` | `heat[7*26]` seeded random | tap a day, bracket highlight, status | grows |
| Donut | `ch-donut` | `SEG[4]` | tap a slice or legend row to isolate | grows |

`CC` (columns) and `CCW` (px per column at 12px) come from `A.onLayout`. Charts are `font-size:12px;line-height:14px` so they get more cells than body text.

## Recipe: add a chart
1. Section in `#view-charts` with `<pre class="chart demo" id="ch-thing" role="img" aria-label="...">` and a status `<p>`.
2. A `drawThing(p)` that builds a `Grid(CC, H)` and sets `el.innerHTML=g.html()`. `p` in 0..1 is the entrance progress; assign `el._anim=grow(drawThing)`.
3. Add `drawThing()` to `drawCharts()` so it redraws on resize and ramp change.
4. Pointer handling via `cellAt(el, e)` which returns `{x,y}` in cells.
5. Colors are palette keys (`'hot'`, `'violet'`...), not CSS colors. Never `'cy'` for a highlight: cyan is focus.

Roadmap charts (see ROADMAP.md): area, stacked bars, radar, radial gauge, sparkline table, live scatter.
