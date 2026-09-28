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
| `kit.py [sync]` | The standalone kit in `kit/`: the copy embedded in js/40 matches the files (`sync` rewrites it), the starter page works, and the Code tab HTML of every component and of every Block on the kit, pasted twice into a blank page, has no ids, no duplicate ids and two copies that work on their own. | yes |
| `tokens.py` | Themes > Download tokens.json and `site/kit/tokens.json`: the file parses, is DTCG (`$value` and `$type` on every leaf, values of their type), every color matches the computed variable in both themes, the button (key and click, from index.html, dist and site over http, light and dark system) downloads the same bytes as the static file and says Saved as tokens.json., Amber and a color of your own land in the right mode. | yes |
| `pages.py` | Download page on every Code tab: each page it saves (every kit component, and the Blocks that run on the kit) has the doctype, the title ("Button: ascii/ui kit 1.2.1"), the two pinned kit links with the integrity kit/README.md gives, a styled h1 and an intro that links back to the site and to both files, and opened from file:// with the kit served from `site/kit/<version>/` it runs with no errors and shows the component. Command, Picture and the site-only Blocks end the Code tab note with "so there is no page to download." instead, with an empty status line. Copy HTML is the first, heavy button everywhere. Open page opens a working tab from index.html and site/index.html (its CSP), and downloads from file://. Build first. | yes |
| `usage.py` | Every component's Usage tab (`AUI_DOCS` in js/90): each of the 35 in `COMPONENTS` has use, avoid, anatomy, states, keys, a11y, do and don't and see also; anatomy selectors match the Code tab html; every key the behavior handles is in the table and every key in the table is handled; events, settings and calls agree with the kit; the doc tabs work by keyboard; nothing overflows at 390 and 1440. Prints `usage: ok`. | yes |
| `reference.py [--check]` | Opens every component's Code tab and writes `docs/COMPONENTS-REFERENCE.md`: group, id, kit or site only (from `kit/starter.html`), caption, the HTML as printed, its behaviors and its CSS blocks. `--check` writes nothing and fails when the committed file differs. | with `--check` |
| `release.sh` | The release bar, below. | yes, at the first failure |
| `boot.py` | Screenshots the boot sequence and checks it is gone after 3s. | no, read it |
| `titles.py` | Forces all titles to their final frame at 320/360/390 and reports any that overflow. | no, read it |
| `shatter.py` | Shatters a card and a button, screenshots, rebuilds. | no, pictures |
| `themes-play-code.py` | Presets, ramp presets, Labs, Code tab, Install section screenshots. | no, pictures |
| `shots.py` | Makes `assets/og.png` (1200x630, the share card drawn in characters on the kit's grid, with the counts read from the page) and `assets/icon-180.png` (the favicon). Run it when the counts, the colors or the favicon change, then `python3 build.py`, which gives the card a new `?v=`. | on page errors |
| `reel.py` | The reel on Home, on `site/` over http at 390 touch and 1440, and on `dist/` from file://: nothing fetched before the press, then it plays (past 1 s, readyState 3 or more, no error event, the WebM), under reduced motion it waits for play, the status says "Loading, 3 MB." until it plays, the caption's seconds and MB match the video and the files, and a 404 or a file that will not decode puts the poster back with focus and an error line that links the WebM and the MP4. | yes |
| `facts.py` | The numbers How it was made prints are true. Recounts every `data-fact` on Home from the repo and `site/` (components, blocks, charts, kit versions, release steps, QA scripts, widths, weights, accessibility modes), checks the one bar (the weight against its cap) is as long as its number, that the meta description, share card text, JSON-LD, noscript, llms.txt and README agree on the counts and versions, that each rule in the Rule and Script table is paired with a release step that holds its check, that no text file or commit has an em dash, that cyan is painted only in focus states, and, on `site/` over http, no outside request, no idle frame with reduced motion and a name on every control. Run after `build.py`. | yes |
| `budget.py [--idle]` | The size budget of `site/`: each file's gzip size under its cap, the whole folder under its cap, and no request to anyone else in the page. `--idle` also counts idle work per view (DOM changes, style recalcs, animation frames per second) and fails over its caps; the release bar runs it this way. Lower a cap when a file shrinks. | yes |

## Release bar

One command, the same bar CLAUDE.md names:

```
python3 build.py        # first: release.sh checks and never writes
sh qa/release.sh
```

It runs, in order, and stops at the first failure: `qa.py` at 390x844 and 1440x900 in dark and light, `qa.py 390 844 dark s x --site`, `lazykit.py`, `breakpoints.py`, `clock.py`, `audit.py`, `keyboard.py`, `kit.py`, `tokens.py`, `pages.py`, `usage.py`, `reduced.py`, `reduced.py --site`, `reel.py`, `nav.py quick`, `reference.py --check`, `build.py --check`, `facts.py`, `budget.py --idle`. The last line is `release: ok, 22 of 22 steps passed. Commit, push to main, Vercel ships it.` or `release: FAIL at step N: ...`. If you edited `kit/`, run `python3 qa/kit.py sync` before it; if you changed a component, `python3 qa/reference.py`. The full `nav.py` (without `quick`) is worth a run after navigation changes.

`build.py` writes `dist/ascii-ui.html` and the `site/` folder that Vercel serves. Commit `site/` with the change: the deploy has no build step. `python3 build.py --check` builds into a temporary folder and compares it with `site/` and `dist/` on disk: it prints `ok`, or lists every file that is missing, extra or different and exits 1. Run it last, right before the commit.
