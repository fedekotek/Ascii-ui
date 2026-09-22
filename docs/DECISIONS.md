# Decisions

Why things are the way they are. Reverse any of these knowingly.

1. **Hybrid, not pure ASCII.** Native HTML under ASCII paint. Pure text UI kills accessibility and makes responsive layout a chore. (v1)
2. **Density is hierarchy.** The ramp `@%#*+=:.` is the weight scale. Frames are strings, not CSS borders. (v2)
3. **Color has one job each.** Magenta acts, cyan focuses, lime confirms, yellow warns. Blue-ish is never decorative. (v4)
4. **Glitch is feedback, not decoration.** At rest the page is readable; chaos comes from touch, scroll and state changes, and the slider turns it down to zero. This is why it reads as designed and not broken. (v3, v4)
5. **Motion is `steps()`.** No easing anywhere. Entrances glitch in, exits are cut. (v1)
6. **Everything on the character grid.** 1ch by one row. It is what makes the fake terminal feel true. (v1)
7. **Sounds are humanized and fatigue.** Repetition is the enemy of a UI sound; the sixth fast repeat is nearly silent. (v9)
8. **Titles never shrink below the browser floor; they lose decoration instead.** Bars, then scale. (v9.3)
9. **Shatter uses the component's own characters.** Random characters read as noise; the real ones read as the thing breaking. (v9.4)
10. **Ramp swaps translate at the output layer.** One map, one `TR()`, one `fillText` patch. Refactoring every drawing routine was the alternative and would have been slower and riskier. Acknowledged smell. (v8)
11. **One file, then a repo.** The single HTML file was right for iteration speed and for publishing as an artifact; it is wrong for a kit. `dist/ascii-ui.html` keeps the first property. (v10)
12. **Blocks contain real content about the owner** because generic lorem makes a kit feel like a template. Personal blocks are marked and the placeholder lines are listed. (v7)
13. **No dependencies.** Geist Mono is the only external request. The kit's value is that you copy it and it is yours. (v1)
14. **Dark is the identity.** Paper (light) exists and works, but the signal palette is the default and the one the visuals are tuned for. (v4)
15. **Menu appears under 720px only.** Above that the tabs fit and a second navigation would be noise. (v9)
