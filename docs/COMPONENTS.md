# Components

30 sections in `#view-kit`, sorted alphabetically by the docs builder at runtime (source order in `index.html` is historical). Every section gets Preview and Code tabs; the Code tab prints the preview's HTML (cleaned), the CSS rules that match its classes, and its JS if it is registered in `window.AUI_JS`.

| Component | Section id | Caption | JS | Where the code lives |
|---|---|---|---|---|
| Alert | `s-alert` | A card with a hazard rim. | none | css/13 `.alert` |
| Avatar | `s-avatar` | Initials on a slab, or a picture pushed through the LCD. | LCD | css/14 `.avatar`, js/30 LCD |
| Badge | `s-badge` | Inverse slabs for status, brackets for everything else. | none | css/13 `.badge` |
| Breadcrumb | `s-breadcrumb` | Slashes separate, current page is a slab. | none | css/14 `.crumbs` |
| Button | `s-button` | Rim says how loud: @ primary, = default, / danger. | engine (scramble, rim march, burst) | css/05, js/10 "button labels", "button rims" |
| Calendar | `s-calendar` | Month of buttons, today magenta, pick is a slab. | `AUI_JS.calendar` | css/14 `.cal`, js/30 |
| Card and dialog | `s-card` | Title bar of @, walls of #, colon shadow. | engine | css/10, js/10 "card and dialog" |
| Command | `s-command` | The palette as a component. | opens `AUI3.openCmd` | js/20 "command palette" |
| Details | `s-details` | Native details, [+]/[-] marker, answer decodes. | engine (toggle decode) | css/11 `.acc`, js/10 |
| Dropdown | `s-dropdown` | Button opens a menu, arrows move, Escape closes. | `AUI_JS.dropdown` | css/14 `.pop .menu`, js/30 |
| Empty | `s-empty` | Nothing here, plus the next step. | one toast | css/04 tone-faint |
| Input | `s-input` | Frame turns cyan on focus, wall of ! on error. | engine (ripple, validation) | css/06, js/10 "input validation" |
| Input OTP | `s-otp` | Six brackets, auto-advance, paste. | `AUI_JS.otp` | css/14 `.otp`, js/30 |
| Kbd | `s-kbd` | Keys in brackets. | none | css/13 `kbd` |
| Pagination | `s-pagination` | Brackets on every page, slab on current. | `AUI_JS.pagination` | css/14 `.ibtn`, js/30 |
| Picture | `s-picture` | Sectorized LCD, tap a sector. | LCD | css/14 `figure.pic .lcd`, js/30 LCD |
| Progress | `s-progress` | Halftone bar, spinner in the button. | engine | css/08, js/10 "progress" |
| Select | `s-select` | Native select in the input frame. | none | css/13 `.field select` |
| Separator | `s-separator` | Four weights of nothing. | none | css/14 `.sepd .sepl` |
| Sheet | `s-sheet` | Bottom dialog, seven steps. | small | css/14 `dialog.sheet`, js/30 |
| Skeleton | `s-skeleton` | Wave through the ramp. | clock task | css/13 `.skel`, js/20 "sparklines, skeleton" |
| Slider | `s-slider` | Halftone bar with a real range on top. Wired to glitch amount. | engine `bindSlider` | css/08, js/10 "halftone bar" |
| Spinner | `s-spinner` | Five ways to wait. | `AUI_JS.spinners` | css/14 `.spins`, js/30 |
| Tabs | `s-tabs` | Active tab is a slab. | engine | css/09, js/10 "tabs" |
| Textarea | `s-textarea` | Four-row frame with a counter. | counter | css/14 `.field.area`, js/30 |
| Timeline | `s-timeline` | Nodes are @, wire is colons. | none | css/14 `.timeline` |
| Toast | `s-toast` | One line typed in, lime or magenta. | engine `say` | css/12, js/10 "toast", js/30 error variant |
| Toggle group | `s-togglegroup` | Radios dressed as slabs. | status only | css/14 `.tgroup` |
| Toggles | `s-toggles` | Checkbox, radio, switch; glyph is only paint. | engine (develop through ramp) | css/07, js/10 "checkbox and radio" |
| Tooltip | `s-tooltip` | Hover, focus or tap; types itself in. | tap fallback | css/14 `.tip` |

Not in the kit view but built as components: Menu (`#menuDlg`, full screen, js/70), Command palette (`#cmdDlg`, js/20), Poster dialog (`#posterDlg`), Rebuild pill (`#rebuild`), HUD (`#hud`), Tracking band (`#track`), Chips (`.chip`, used by indexes and filters), Icon button (`.ibtn`).

## Anatomy of a section

```html
<section aria-labelledby="s-thing">
  <h2 id="s-thing" class="vh">Thing</h2>                              <!-- real name, screen readers and index -->
  <pre class="poster ptitle" data-text="THING" aria-hidden="true"></pre>  <!-- bitmap title, <= 8 chars fits at 390px -->
  <p class="muted">One line that says what the trick is.</p>          <!-- the caption; the docs builder splits here -->
  <div class="demo">...the preview...</div>                            <!-- everything after the caption becomes the Preview panel -->
  <p class="muted status" id="thingStatus" role="status"></p>          <!-- optional live region -->
</section>
```

The builder (`buildView` in js/30) finds the first `p.muted:not(.status)`, moves everything after it into the Preview panel, and creates the Code panel lazily on first open. `cleanHTML()` strips `data-rv`, inline styles, `.in/.done`, and blanks out generated content (`pre.ptitle`, `pre.chart`, canvases, `.bar`, `#cal`, `#pager`...). Add to that list if your component renders its content from JS.

## Recipe: add a component

1. Write the section in `index.html` inside `#view-kit`, before the Rules section. Keep the title 8 characters or fewer, or add `data-nobars`.
2. CSS goes in a new file at the end of the sequence (or the end of 14 if it is small). Only use the tokens. Frames come from `.frame.tone-*`; slabs are `background:var(--ink);color:var(--bg)` plus the chromatic aberration shadow `box-shadow:-2px 0 0 var(--cy),2px 0 0 var(--hot)` if it is an action.
3. Hit areas: 44px. The pattern is `padding:12px 0;margin:-12px 0` so a 24px row keeps the grid but grows its touch box.
4. Focus: `:focus-visible{background:var(--accent);color:var(--bg)}`. Never remove outlines without replacing them.
5. JS: wrap it as `window.AUI_JS=window.AUI_JS||{};window.AUI_JS.thing=function(){ ... };window.AUI_JS.thing();` in js/30 (or a new file), and add `'s-thing':'thing'` to `JSMAP` in js/40 so the Code tab prints it. Use `ping()` for small sounds, `A.say()` for toasts, `A.kick()` for a hero burst on meaningful changes.
6. Output that draws characters (bars, grids, canvases) must pass through `A.TR()` or `A.colorize(A.barRow(...))`.
7. Add the classes the component uses to the `data-rv` selector list in js/10 (search `'.stat,.ticker,.acc,pre.lab'`) if you want its parts to glitch in on scroll. Otherwise the whole section entrance still runs.
8. Width: from 1024px the Components view is a gallery of columns 46 characters wide, and your section gets one of them. If it cannot live in that (a table, a chart, a picture, a timeline, a wide stat row), put `data-span="full"` on the section and it takes the whole row. `spanSections()` in js/30 already sets it for those cases; the attribute wins over it, in both directions.
9. CSS goes in a new file, numbered after `css/16-grid.css`. Do not pin a layout to a viewport breakpoint: inside a gallery column the window width says nothing about the box you are in. `repeat(auto-fit,minmax(min(24ch,100%),1fr))` sizes against the real box.
10. `python3 qa/qa.py 390 844 dark m x`, `python3 qa/breakpoints.py`, `python3 qa/audit.py`, then `python3 build.py`.

## Conventions that hold across all of them
- Frames: `.frame` puts `--h` on top and bottom, `.mid` puts `--s` on the sides. `.body` puts `--v` (vertical string) as walls. All are strings from `AUI_TONES`.
- Everything is uppercase in slabs (`text-transform:uppercase`), sentence case elsewhere.
- Color meanings: `--hot` action, `--cy` focus/feedback, `--ok` success/checked/on, `--warn` danger/error, `--violet`/`--deep` structure and shadows, `--pink` secondary emphasis.
- Motion is `steps()`, never eased. Entrances glitch in; exits are cut.
