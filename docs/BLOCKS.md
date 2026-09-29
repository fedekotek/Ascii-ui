# Blocks

16 sections in `#view-blocks`, filtered by `data-cat`. The view opens with a `.dochead` (the BLOCKS bitmap title and one lede); section posters are hidden and each `h2` shows as a bold uppercase word. Blocks are page-sized, so from 1024px each one takes a whole row of the gallery. The chips at the top (`#blockFilters`) toggle `hidden` on sections. Content belongs to two fictions: Static, a made-up uptime monitor that screams when things break, and a portfolio (Fede's, who made the kit), there as an example of personal content. The lede says so: "Six are a portfolio, as examples."

| Block | id | Category | What is wired on the site | On the kit |
|---|---|---|---|---|
| Login | `s-login` | auth | Validates email and 8+ char password, jolts on error, toast on success. SSO button toasts. | page, html and css |
| Stats | `s-stats` | dashboard | Bitmap numbers (`.ptitle` inside `.kpi`), sparklines from `data-spark`. | no page yet: the sparklines (`.spark`) wait for the kit's chart. The rest is `.kpis`, `.kpi` and finished `.ptitle` rows |
| Table | `s-table` | dashboard | Row select with click/Enter/Space, status line, kick when a Down row is picked. | page, the kit Table |
| Pricing | `s-pricing` | marketing | Three cards, Popular badge, buttons toast the plan. | page: `.grid3 .pricing`, the buttons are `data-aui-toast` |
| Profile | `s-profile` | personal | LCD portrait (load your own), key/value list, Say hi opens the portfolio. | page: `.profile`, the portrait a `.thumb` in characters, Say hi an `a.btn`, Load portrait left out |
| Career | `s-career` | personal | Timeline, static. | page, the kit Timeline |
| Cases | `s-cases` | personal | Four cards with animated LCD thumbnails (`ui1..ui4` scenes), click/Enter sets status and glitches the thumb. | page: `.grid2` with `data-aui="pick"`, the thumbnails `.thumb` in characters, the one line from each card's `data-say` |
| Now | `s-now` | personal | Reading progress bar, "loading" spinner on the pull-up. | page: `.kv`, the reading bar a `role="meter"` progress, the pull-up a dots spinner |
| Recipe | `s-recipe` | personal | Servings stepper 1..20 rescales quantities, metric formatting (g/kg, l). | page: `data-aui="stepper"` scales the `[data-each]` amounts in a `.kv` |
| Build | `s-build` | personal | Five stats on halftone bars, Reroll randomizes them and flashes lime. | page: the stats are meters in a `.kv`, the resistances `.tags`, Reroll left out |
| Tasks | `s-tasks` | app | Checklist with a progress bar that counts, a toast and a lime flash when the last one is checked. | page: `.checklist` with `data-aui="checklist"`, `data-done` toasts |
| Sidebar | `s-sidebar` | app | aria-current follows the click. | page: `.navlist` with `data-aui="pick"` |
| Settings | `s-settings` | app | Sound and Glitch switches are two-way bound to the page's real Sound and Glitch (the bar's `<)))` and `/\/`). | page, html and css |
| Crit | `s-crit` | app | Textarea with min length, verdict toggle group, error state. | page, html and css |
| Activity | `s-feed` | dashboard | Timeline with times, static. | page, the kit Timeline |
| 404 | `s-lost` | marketing | Title that never settles (`titleFrame` on a clock task while in view). | page: the title printed settled, the way back an `a.btn` |

The personal blocks are real and go stale: the Now list (`index.html`), the Career and Profile lines, and the Recipe ingredients (`ING` in js/30, an asado for six in g, kg and l). The numbers in Build are made up, and Reroll changes them anyway.

## On the kit

Every Block's Code tab prints HTML that runs on `kit/ascii-ui.css` and `kit/ascii-ui.js` alone, and so offers Download page, unless it holds a class the kit does not style (today only Stats, for `.spark`). The pieces are generic kit blocks (`/* ==== name: ... ==== */` at the end of `kit/ascii-ui.css`, listed under Blocks in `kit/README.md`): `stat`, `poster`, `grid`, `pricing`, `checklist`, `navlist`, `pick`, `kv`, `meter`, `stepper`, `tags`, `thumb`, `profile`, `linkbtn`. Three behaviors are for them: `checklist`, `pick` and `stepper`. `kit/starter.html` shows each piece under Blocks, and `qa/kit.py` pastes every Block on the kit twice into a blank page (the ALIVE and TWICE checks run for these behaviors too).

The site keeps its own markup and css; `KITIFY` in js/40 turns each Block's clone into the kit's on the way to the Code tab:

- Bitmap titles (`.ptitle`) are printed finished, one `<span>` a row, with the ramp's own characters (`posterOf`). The kit colors the rows by position.
- The LCD pictures become `<pre role="img">` drawings in a `.thumb` (`THUMBS` and `PORTRAIT` in js/40). The site's LCD engine never reaches the kit.
- Halftone stats (Build's `.statbars`, Now's reading bar) become `.progress` elements with `role="meter"`, a percent in `aria-valuenow` and the number in `aria-valuetext`. Build's stats come from `A.build` (js/30, before any reroll), the reading from `data-value` and `data-max` on `#nowRead`.
- Recipe's list comes from `A.recipe` (js/30) as a `.kv` of `[data-each][data-unit]` amounts at six.
- Buttons that go somewhere (404's way back, Say hi) become `a.btn` links; site toys (Reroll, Load portrait) are left out, and the Code tab note says so (`SITEONLY`).
- Class names the site uses for itself map to the kit's: `.wo` to `.checklist`, `.side` to `.navlist`, `.lost` to `.stack`, `.b-ok` and `.b-warn` in Build's tags to `.b-violet` and `.b-pink`.

A block's Code tab lists any class the kit does not style and says there is no page to download (`qa/pages.py` checks both ways).

## Recipe: add a block
Same anatomy as a component (see COMPONENTS.md) inside `#view-blocks`, plus `data-cat="personal|app|dashboard|auth|marketing"` on the `<section>`. Add a new category by adding a chip (`<button class="chip" data-f="name">`) to `#blockFilters` in index.html, and an entry to `BLOCK_GROUPS` in js/30 so the sidebar groups it. Blocks are also sorted alphabetically by the builder; the caption split and Code tab apply. Blocks that use `.lift > .card.frame` get the offset colon shadow for free.

To keep it on the kit: build it from kit classes (the components and the Block pieces above), or add a small generic piece to the end of `kit/ascii-ui.css`, named for what it is, not for the demo. Anything the site draws with its engine needs a still in `KITIFY`. Then `python3 qa/kit.py sync`, `python3 qa/pages.py` and `python3 qa/kit.py`.

Widths: `.lift` is capped at 50ch outside the grids; `.grid2` fits as many 37ch cards as its box allows and `.grid3` as many 27ch cards (`css/16` on the site, the `grid` block in the kit, sized against the box, not the window). When there is no room they stack.
