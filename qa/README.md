# QA scripts

Playwright (Python) against `../index.html`. Install once:

```
pip install playwright
playwright install chromium
```

Every check script prints `[]` or `ok` when there is nothing wrong and exits non-zero when it reports a problem, so they can be chained with `&&`. Screenshots go to the directory you run from.

| Script | What it does | Exits non-zero |
|---|---|---|
| `qa.py W H dark\|light TAG [x] [--dist\|--site]` | Loads the page, clicks through all five views, reports page errors, console errors, horizontal overflow, elements wider than the viewport and closed dialogs that still show. Font failures from Google are still ignored, a leftover: the font is inlined now and the page asks no one. Without the trailing `x` it also screenshots every screen of every view as `qa_TAG_VIEW_NN.png`. `--dist` tests `dist/ascii-ui.html`, `--site` tests `site/index.html`. | yes |
| `breakpoints.py` | Column counts, overflow, overlap and nothing sticking out, at eleven widths from 360 to 1920. | yes |
| `clock.py [W H]` | Guards the single rAF clock: no `setInterval` survives, tasks run, `pause()` freezes them, `resume()` restarts them, finite tasks leave the list, a throwing task is dropped. | yes |
| `audit.py` | Per view at 390: interactive elements under 40px and text under 12px. | yes |
| `keyboard.py [url]` | The phone keyboard never opens by accident: sliders tapped, dragged or tapped on their label keep no focus, a scroll that starts on a text field frame does not focus it, a real tap does. | yes |
| `nav.py [quick]` | Navigation with real touch taps: every section picked from the [=] menu lands under the bar (320 and 390), the menu closes when the screen grows past 1024px, `#view/section` addresses load from file:// and http (on a free port), old `#play`/`#apps`/`#onepager` links land on Home and say so, bad addresses (`#constructor/button`, `#bogus/x`, `#components/nope`) do not crash and are cleaned, the tab title follows the address, Back and Forward, rapid view clicks, arrow keys, the sidebar. | yes |
| `reduced.py [--dist\|--site]` | Reduced motion, with scripts on and off, at 390 and 1440: the loader is not covering the page after 1s, no CSS animation is running, no AudioContext is created, zero page errors. | yes |
| `kit.py [sync]` | The standalone kit in `kit/`: the copy embedded in js/40 matches the files (`sync` rewrites it), the starter page works, and the Code tab HTML of every component, pasted twice into a blank page, has no ids, no duplicate ids and two copies that work on their own. | yes |
| `tokens.py` | Themes > Download tokens.json and `site/kit/tokens.json`: the file parses, is DTCG (`$value` and `$type` on every leaf, values of their type), every color matches the computed variable in both themes, the button (key and click, from index.html, dist and site over http, light and dark system) downloads the same bytes as the static file and says Downloading tokens.json., Amber and a color of your own land in the right mode. | yes |
| `usage.py` | Every component's Usage tab (`AUI_DOCS` in js/90): each of the 34 in `COMPONENTS` has use, avoid, anatomy, states, keys, a11y, do and don't and see also; anatomy selectors match the Code tab html; every key the behavior handles is in the table and every key in the table is handled; events, settings and calls agree with the kit; the doc tabs work by keyboard; nothing overflows at 390 and 1440. Prints `usage: ok`. | yes |
| `reference.py [--check]` | Opens every component's Code tab and writes `docs/COMPONENTS-REFERENCE.md`: group, id, kit or site only (from `kit/starter.html`), caption, the HTML as printed, its behaviors and its CSS blocks. `--check` writes nothing and fails when the committed file differs. | with `--check` |
| `release.sh` | The release bar, below. | yes, at the first failure |
| `boot.py` | Screenshots the boot sequence and checks it is gone after 3s. | no, read it |
| `titles.py` | Forces all titles to their final frame at 320/360/390 and reports any that overflow. | no, read it |
| `shatter.py` | Shatters a card and a button, screenshots, rebuilds. | no, pictures |
| `themes-play-code.py` | Presets, ramp presets, Labs, Code tab, Install section screenshots. | no, pictures |
| `shots.py` | Makes `assets/og.png` (1200x630, the share card drawn in characters on the kit's grid, with the counts read from the page) and `assets/icon-180.png` (the favicon). Run it when the counts, the colors or the favicon change, then `python3 build.py`, which gives the card a new `?v=`. | on page errors |
| `budget.py [--idle]` | The size budget of `site/`: each file's gzip size under its cap, the whole folder under its cap, and no request to anyone else in the page. `--idle` also counts idle work per view (DOM changes, style recalcs, animation frames per second) and fails over its caps; the release bar runs it this way. Lower a cap when a file shrinks. | yes |

## Release bar

One command, the same bar CLAUDE.md names:

```
python3 build.py        # first: release.sh checks and never writes
sh qa/release.sh
```

It runs, in order, and stops at the first failure: `qa.py` at 390x844 and 1440x900 in dark and light, `qa.py 390 844 dark s x --site`, `breakpoints.py`, `clock.py`, `audit.py`, `keyboard.py`, `kit.py`, `tokens.py`, `usage.py`, `reduced.py`, `reduced.py --site`, `nav.py quick`, `reference.py --check`, `build.py --check`, `budget.py --idle`. The last line is `release: ok, 19 of 19 steps passed. Commit, push to main, Vercel ships it.` or `release: FAIL at step N: ...`. If you edited `kit/`, run `python3 qa/kit.py sync` before it; if you changed a component, `python3 qa/reference.py`. The full `nav.py` (without `quick`) is worth a run after navigation changes.

`build.py` writes `dist/ascii-ui.html` and the `site/` folder that Vercel serves. Commit `site/` with the change: the deploy has no build step. `python3 build.py --check` builds into a temporary folder and compares it with `site/` and `dist/` on disk: it prints `ok`, or lists every file that is missing, extra or different and exits 1. Run it last, right before the commit.
