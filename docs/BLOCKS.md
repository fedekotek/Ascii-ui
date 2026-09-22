# Blocks

16 sections in `#view-blocks`, filtered by `data-cat`. The chips at the top (`#blockFilters`) toggle `hidden` on sections. Content belongs to two fictions: Static, a made-up uptime monitor that screams when things break, and the person the kit was built for.

| Block | id | Category | What is wired |
|---|---|---|---|
| Login | `s-login` | auth | Validates email and 8+ char password, jolts on error, toast on success. SSO button toasts. |
| Stats | `s-stats` | dashboard | Bitmap numbers (`.ptitle` inside `.kpi`), sparklines from `data-spark`. |
| Table | `s-table` | dashboard | Row select with click/Enter/Space, status line, kick when a Down row is picked. |
| Pricing | `s-pricing` | marketing | Three cards, Popular badge, buttons toast the plan. |
| Profile | `s-profile` | personal | LCD portrait (load your own), key/value list, Say hi toast. |
| Career | `s-career` | personal | Timeline, static. |
| Case studies | `s-cases` | personal | Four cards with animated LCD thumbnails (`ui1..ui4` scenes), click/Enter sets status and glitches the thumb. |
| Now | `s-now` | personal | Reading progress bar, "loading" spinner on the pull-up. |
| Recipe | `s-recipe` | personal | Servings stepper 1..20 rescales quantities, metric formatting (g/kg, l). |
| Build | `s-build` | personal | Five stats on halftone bars, Reroll randomizes and jolts. |
| Work orders | `s-workorders` | app | Checklist with a progress bar that counts, toast + jolt at 5/5. |
| Sidebar | `s-sidebar` | app | aria-current follows the click. |
| Settings | `s-settings` | app | Sound and Glitch switches are two-way bound to the real header switches. |
| Design crit | `s-crit` | app | Textarea with min length, verdict toggle group, error state. |
| Activity | `s-feed` | dashboard | Timeline with times, static. |
| 404 | `s-lost` | marketing | Title that never settles (`titleFrame` on a clock task while in view). |

Placeholder copy to replace before this goes anywhere public: Pomelo and MercadoLibre one-liners in Career; the asado quantities and the Malbec ratio in Recipe; every number in Build; the Now list will go stale.

## Recipe: add a block
Same anatomy as a component (see COMPONENTS.md) inside `#view-blocks`, plus `data-cat="personal|app|dashboard|auth|marketing"` on the `<section>`. Add a new category by adding a chip in `FILTERS` (index.html `#blockFilters`). Blocks are also sorted alphabetically by the builder; the caption split and Code tab apply. Blocks that use `.lift > .card.frame` get the offset colon shadow for free.

Widths: `.lift` is capped at 50ch; `.grid2` is two 37ch cards at 860px+; `.grid3` is three 24ch cards. Under those breakpoints they stack.
