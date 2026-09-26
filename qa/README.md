# QA scripts

Playwright (Python) against `../index.html`. Install once:

```
pip install playwright
playwright install chromium
```

Every check script prints `[]` or `ok` when there is nothing wrong and exits non-zero when it reports a problem, so they can be chained with `&&`. Screenshots go to the directory you run from.

| Script | What it does | Exits non-zero |
|---|---|---|
| `qa.py W H dark\|light TAG [x] [--dist\|--site]` | Loads the page, clicks through all five views, reports page errors, console errors, horizontal overflow, elements wider than the viewport and closed dialogs that still show. Font failures (fonts.googleapis.com, fonts.gstatic.com) are ignored, so it is clean offline. Without the trailing `x` it also screenshots every screen of every view as `qa_TAG_VIEW_NN.png`. `--dist` tests `dist/ascii-ui.html`, `--site` tests `site/index.html`. | yes |
| `breakpoints.py` | Column counts, overflow, overlap and nothing sticking out, at eleven widths from 360 to 1920. | yes |
| `clock.py [W H]` | Guards the single rAF clock: no `setInterval` survives, tasks run, `pause()` freezes them, `resume()` restarts them, finite tasks leave the list, a throwing task is dropped. | yes |
| `audit.py` | Per view at 390: interactive elements under 40px and text under 12px. | yes |
| `keyboard.py [url]` | The phone keyboard never opens by accident: sliders tapped, dragged or tapped on their label keep no focus, a scroll that starts on a text field frame does not focus it, a real tap does. | yes |
| `nav.py [quick]` | Navigation with real touch taps: every section picked from the [=] menu lands under the bar (320 and 390), the menu closes when the screen grows past 1024px, `#view/section` addresses load from file:// and http (on a free port), old `#play`/`#apps`/`#onepager` links land on Home and say so, bad addresses (`#constructor/button`, `#bogus/x`, `#components/nope`) do not crash and are cleaned, the tab title follows the address, Back and Forward, rapid view clicks, arrow keys, the sidebar. | yes |
| `reduced.py [--dist\|--site]` | Reduced motion, with scripts on and off, at 390 and 1440: the loader is not covering the page after 1s, no CSS animation is running, no AudioContext is created, zero page errors. | yes |
| `kit.py [sync]` | The standalone kit in `kit/`: the copy embedded in js/40 matches the files (`sync` rewrites it), the starter page works, and the Code tab HTML of every component, pasted twice into a blank page, has no ids, no duplicate ids and two copies that work on their own. | yes |
| `reference.py [--check]` | Opens every component's Code tab and writes `docs/COMPONENTS-REFERENCE.md`: group, id, kit or site only (from `kit/starter.html`), caption, the HTML as printed, its behaviors and its CSS blocks. `--check` writes nothing and fails when the committed file differs. | with `--check` |
| `release.sh` | The release bar, below. | yes, at the first failure |
| `boot.py` | Screenshots the boot sequence and checks it is gone after 3s. | no, read it |
| `titles.py` | Forces all titles to their final frame at 320/360/390 and reports any that overflow. | no, read it |
| `shatter.py` | Shatters a card and a button, screenshots, rebuilds. | no, pictures |
| `themes-play-code.py` | Presets, ramp presets, Labs, Code tab, Install section screenshots. | no, pictures |
| `shots.py` | Makes `assets/og.png` (1200x630, Home hero, dark, reduced motion) and `assets/icon-180.png` (the favicon). Run it when the hero or favicon changes, then `python3 build.py`. | on page errors |

## Release bar

One command, the same bar CLAUDE.md names:

```
python3 build.py        # first: release.sh checks and never writes
sh qa/release.sh
```

It runs, in order, and stops at the first failure: `qa.py` at 390x844 and 1440x900 in dark and light, `qa.py 390 844 dark s x --site`, `breakpoints.py`, `clock.py`, `audit.py`, `keyboard.py`, `kit.py`, `reduced.py`, `reduced.py --site`, `nav.py quick`, `reference.py --check`, `build.py --check`. The last line is `release: ok, 15 of 15 steps passed.` or `release: FAIL at step N: ...`. If you edited `kit/`, run `python3 qa/kit.py sync` before it; if you changed a component, `python3 qa/reference.py`. The full `nav.py` (without `quick`) is worth a run after navigation changes.

`build.py` writes `dist/ascii-ui.html` and the `site/` folder that Vercel serves. Commit `site/` with the change: the deploy has no build step. `python3 build.py --check` builds into a temporary folder and compares it with `site/` and `dist/` on disk: it prints `ok`, or lists every file that is missing, extra or different and exits 1. Run it last, right before the commit.
