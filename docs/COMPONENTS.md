# Components

30 sections in `#view-kit`, sorted by the docs builder at runtime (source order in `index.html` is historical): first by group, then alphabetically inside each group. The groups are `KIT_GROUPS` in js/30: Form, Overlay, Display, Feedback, Navigation. A section missing from that list lands in an Other group at the end. The builder puts a `.grouph` label on the page where each group starts, and the sidebar and menu list the parts under the same groups.

The view opens with a `.dochead` (the COMPONENTS bitmap title, `data-nobars`, and one lede) and the chip index. Get the kit (`s-install`, built in js/40) and Rules (`s-rules`) close the page; the sidebar lists them first, as Getting started. Inside the view the section posters are hidden by css and each section's `h2` shows as a bold uppercase word instead.

Every section gets Preview and Code tabs; the Code tab prints the preview's HTML (cleaned), the CSS rules that match its classes, and its JS if it is registered in `window.AUI_JS`.

| Component | Group | Section id | Summary | JS | Where the code lives |
|---|---|---|---|---|---|
| Alert | Feedback | `s-alert` | A card with a hazard rim. | none | css/13 `.alert` |
| Avatar | Display | `s-avatar` | Initials on a slab, or a picture pushed through the LCD. | LCD | css/14 `.avatar`, js/30 LCD |
| Badge | Display | `s-badge` | Inverse slabs for status, brackets for everything else. | none | css/13 `.badge` |
| Breadcrumb | Navigation | `s-breadcrumb` | Slashes separate, current page is a slab. | none | css/14 `.crumbs` |
| Button | Form | `s-button` | Rim says how loud: @ primary, = default, / danger. | engine (scramble, rim march, burst) | css/05, js/10 "button labels", "button rims" |
| Calendar | Form | `s-calendar` | Month of buttons, today in the action color, pick is a slab. | `AUI_JS.calendar` | css/14 `.cal`, js/30 |
| Card and dialog | Display | `s-card` | Title bar of @, walls of #, colon shadow. | engine | css/10, js/10 "card and dialog" |
| Command | Overlay | `s-command` | The command menu; on this site it is Search. | opens `AUI3.openCmd` | js/80, commands in js/20 "command palette" |
| Details | Display | `s-details` | Native details, [+]/[-] marker, answer decodes. | engine (toggle decode) | css/11 `.acc`, js/10 |
| Dropdown | Overlay | `s-dropdown` | Button opens a menu, arrows move, Escape closes. | `AUI_JS.dropdown` | css/14 `.pop .menu`, js/30 |
| Empty | Feedback | `s-empty` | Nothing here, plus the next step. | one toast | css/04 tone-faint |
| Input | Form | `s-input` | Frame turns to the focus color, wall of ! on error. | engine (ripple, validation) | css/06, js/10 "input validation" |
| Input OTP | Form | `s-otp` | Six brackets, auto-advance, paste. Under 1024px the brackets sit inside each 5ch target, `[ _ ]`. | `AUI_JS.otp` | css/14 `.otp`, js/30 |
| Kbd | Display | `s-kbd` | Keys in brackets. | none | css/13 `kbd` |
| Pagination | Navigation | `s-pagination` | Brackets on every page, slab on current. | `AUI_JS.pagination` | css/14 `.ibtn`, js/30 |
| Picture | Display | `s-picture` | Sectorized LCD, tap a sector. | LCD | css/14 `figure.pic .lcd`, js/30 LCD |
| Progress | Feedback | `s-progress` | How far along a task is, halftone bar, spinner in the button. | engine | css/08, js/10 "progress" |
| Select | Form | `s-select` | Native select in the input frame. | none | css/13 `.field select` |
| Separator | Display | `s-separator` | Four weights of nothing. | none | css/14 `.sepd .sepl` |
| Sheet | Overlay | `s-sheet` | Bottom dialog, seven steps. | small | css/14 `dialog.sheet`, js/30 |
| Skeleton | Feedback | `s-skeleton` | A card silhouette (faint frame, a slab line, two text lines) with a wave through the ramp, sized to its column. | clock task | css/13 `.skel`, js/20 "sparklines, skeleton" |
| Slider | Form | `s-slider` | Pick a value on a range: halftone bar with a real range on top. Wired to the glitch amount. | engine `bindSlider` | css/08, js/10 "halftone bar" |
| Spinner | Feedback | `s-spinner` | Five ways to wait. | `AUI_JS.spinners` | css/14 `.spins`, js/30 |
| Tabs | Navigation | `s-tabs` | Active tab is a slab. | engine | css/09, js/10 "tabs" |
| Textarea | Form | `s-textarea` | Four-row frame with a counter. | counter | css/14 `.field.area`, js/30 |
| Timeline | Display | `s-timeline` | Events in order. Nodes are @, wire is colons. | none | css/14 `.timeline` |
| Toast | Feedback | `s-toast` | One line typed in, lime or yellow. | engine `say(msg, err)` | css/12, js/10 "toast" |
| Toggle group | Form | `s-togglegroup` | Pick one of a few options, radios dressed as slabs. | status only | css/14 `.tgroup` |
| Toggles | Form | `s-toggles` | Checkbox, radio, switch; glyph is only paint. | engine (develop through ramp) | css/07, js/10 "checkbox and radio" |
| Tooltip | Overlay | `s-tooltip` | Hover, focus or tap; types itself in. | tap fallback | css/14 `.tip` |

Not in the kit view but built as components: Menu (`#menuDlg`, full screen, js/70), Search (`#cmdDlg`, js/80, css/18), Home tiles (`.tile`, css/16), Link button (`.linkbtn`), Poster dialog (`#posterDlg`), Rebuild pill (`#rebuild`), HUD (`#hud`), Tracking band (`#track`), Chips (`.chip`, used by indexes and filters), Icon button (`.ibtn`).

## Anatomy of a section

```html
<section aria-labelledby="s-thing">
  <h2 id="s-thing" class="vh">Thing</h2>                              <!-- real name: shown as a bold uppercase word in the docs views, and the index -->
  <pre class="poster ptitle" data-text="THING" aria-hidden="true"></pre>  <!-- bitmap title: hidden by css in the docs views, Search still reads it -->
  <p class="muted">One line that says what the trick is.</p>          <!-- the caption; the docs builder splits here -->
  <div class="demo">...the preview...</div>                            <!-- everything after the caption becomes the Preview panel -->
  <p class="muted status" id="thingStatus" role="status"></p>          <!-- optional live region -->
</section>
```

The builder (`buildView` in js/30) finds the first `p.muted:not(.status)`, moves everything after it into the Preview panel, and creates the Code panel lazily on first open. `cleanHTML()` strips `data-rv`, inline styles, `.in/.done`, and blanks out generated content (`pre.ptitle`, `pre.chart`, canvases, `.bar`, `#cal`, `#pager`...). Add to that list if your component renders its content from JS.

## Recipe: add a component

1. Write the section in `index.html` inside `#view-kit`, before the Rules section. Keep the poster title 8 characters or fewer; it is hidden in the view but is still the markup every section carries.
2. Add the section id to its group in `KIT_GROUPS` (js/30), or it ends up in Other.
3. CSS goes in a new file at the end of the sequence, numbered after `css/18-search.css` (or the end of 14 if it is small). Only use the tokens. Frames come from `.frame.tone-*`; slabs are `background:var(--ink);color:var(--bg)` plus the chromatic aberration shadow `box-shadow:-2px 0 0 var(--violet),2px 0 0 var(--hot)` (`var(--deep)` on the right for a magenta slab) if it is an action. Never `--cy`: blue is focus.
4. Hit areas: 44px. The pattern is `padding:12px 0;margin:-12px 0` so a 21px row keeps the grid but grows its touch box.
5. Focus: `:focus-visible{background:var(--accent);color:var(--bg)}`. Never remove outlines without replacing them.
6. JS: wrap it as `window.AUI_JS=window.AUI_JS||{};window.AUI_JS.thing=function(){ ... };window.AUI_JS.thing();` in js/30 (or a new file), and add `'s-thing':'thing'` to `JSMAP` in js/40 so the Code tab prints it. Use `ping()` for small sounds, `A.say()` for toasts, `A.kick()` for a hero burst on meaningful changes.
7. Output that draws characters (bars, grids, canvases) must pass through `A.TR()` or `A.colorize(A.barRow(...))`.
8. Add the classes the component uses to the `data-rv` selector list in js/10 (search `'.stat,.ticker,.acc,pre.lab'`) if you want its parts to glitch in on scroll. Otherwise the whole section entrance still runs.
9. Width: from 1024px the Components view is a gallery of columns at least 40 characters wide (`--galmin`), and your section gets one of them. If it cannot live in that (a table, a chart, a picture, a timeline, a wide stat row), put `data-span="full"` on the section and it takes the whole row. `spanSections()` in js/30 already sets it for those cases; the attribute wins over it, in both directions.
10. Do not pin a layout to a viewport breakpoint: inside a gallery column the window width says nothing about the box you are in. `repeat(auto-fit,minmax(min(24ch,100%),1fr))` sizes against the real box.
11. `python3 qa/qa.py 390 844 dark m x`, `python3 qa/breakpoints.py`, `python3 qa/audit.py`, then `python3 build.py`.

## Conventions that hold across all of them
- Frames: `.frame` puts `--h` on top and bottom, `.mid` puts `--s` on the sides. `.body` puts `--v` (vertical string) as walls. All are strings from `AUI_TONES`.
- Everything is uppercase in slabs (`text-transform:uppercase`), sentence case elsewhere.
- Color meanings: `--hot` action, `--cy` focus and nothing else, `--ok` success/checked/on, `--warn` danger/error, `--violet`/`--deep` structure and shadows, `--pink` secondary emphasis.
- Motion is `steps()`, never eased. Entrances glitch in; exits are cut.
