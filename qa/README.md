# QA scripts

Playwright (Python) against `../index.html`. Install once:

```
pip install playwright pillow
playwright install chromium
```

| Script | What it does |
|---|---|
| `qa.py W H dark|light TAG [x]` | Loads the page, clicks through all seven views, reports page errors, console errors, horizontal overflow and elements wider than the viewport. Without the trailing `x` it also screenshots every screen of every view as `qa_TAG_VIEW_NN.png`. |
| `audit.py` | Per view: interactive elements shorter than 40px and text under 12px. |
| `titles.py` | Forces all titles to their final frame at 320/360/390 and reports any that overflow. |
| `shatter.py` | Shatters a card and a button, screenshots, rebuilds. |
| `themes-play-code.py` | Presets, ramp presets, Play words and map, Code tab, Install section screenshots. |
| `apps-menu.py` | Scrolls the Apps view on a touch viewport and opens the menu sheet. |
| `boot.py` | Screenshots the boot sequence and checks it is gone after 3s. |

All scripts print `[]` when there is nothing wrong. Screenshots go next to the script.

Release bar: `qa.py` clean at 390 dark, 390 light, 1440 dark, 1440 light; `audit.py` clean; one manual pass on a phone.
