# Blocks

16 sections in `#view-blocks`, filtered by `data-cat`. The view opens with a `.dochead` (the BLOCKS bitmap title and one lede); section posters are hidden and each `h2` shows as a bold uppercase word. Blocks are page-sized, so from 1024px each one takes a whole row of the gallery. The chips at the top (`#blockFilters`) toggle `hidden` on sections. Content belongs to two fictions: Static, a made-up uptime monitor that screams when things break, and a portfolio (Fede's, who made the kit), there as an example of personal content. The lede says so: "Six are a portfolio, as examples."

| Block | id | Category | What is wired |
|---|---|---|---|
| Login | `s-login` | auth | Validates email and 8+ char password, jolts on error, toast on success. SSO button toasts. |
| Stats | `s-stats` | dashboard | Bitmap numbers (`.ptitle` inside `.kpi`), sparklines from `data-spark`. |
| Table | `s-table` | dashboard | Row select with click/Enter/Space, status line, kick when a Down row is picked. |
| Pricing | `s-pricing` | marketing | Three cards, Popular badge, buttons toast the plan. |
| Profile | `s-profile` | personal | LCD portrait (load your own), key/value list, Say hi toast. |
| Career | `s-career` | personal | Timeline, static. |
| Cases | `s-cases` | personal | Four cards with animated LCD thumbnails (`ui1..ui4` scenes), click/Enter sets status and glitches the thumb. |
| Now | `s-now` | personal | Reading progress bar, "loading" spinner on the pull-up. |
| Recipe | `s-recipe` | personal | Servings stepper 1..20 rescales quantities, metric formatting (g/kg, l). |
| Build | `s-build` | personal | Five stats on halftone bars, Reroll randomizes them and flashes lime. |
| Orders | `s-workorders` | app | Checklist with a progress bar that counts, a toast and a lime flash when the last one is checked. |
| Sidebar | `s-sidebar` | app | aria-current follows the click. |
| Settings | `s-settings` | app | Sound and Glitch switches are two-way bound to the page's real Sound and Glitch (the bar's `<)))` and `/\/`). |
| Crit | `s-crit` | app | Textarea with min length, verdict toggle group, error state. |
| Activity | `s-feed` | dashboard | Timeline with times, static. |
| 404 | `s-lost` | marketing | Title that never settles (`titleFrame` on a clock task while in view). |

The personal blocks are real and go stale: the Now list (`index.html`), the Career and Profile lines, and the Recipe ingredients (`ING` in js/30, an asado for six in g, kg and l). The numbers in Build are made up, and Reroll changes them anyway.

## Recipe: add a block
Same anatomy as a component (see COMPONENTS.md) inside `#view-blocks`, plus `data-cat="personal|app|dashboard|auth|marketing"` on the `<section>`. Add a new category by adding a chip (`<button class="chip" data-f="name">`) to `#blockFilters` in index.html, and an entry to `BLOCK_GROUPS` in js/30 so the sidebar groups it. Blocks are also sorted alphabetically by the builder; the caption split and Code tab apply. Blocks that use `.lift > .card.frame` get the offset colon shadow for free.

Widths: `.lift` is capped at 50ch outside the grids; `.grid2` fits as many 37ch cards as its box allows and `.grid3` as many 27ch cards (`css/16`, sized against the box, not the window). When there is no room they stack.
