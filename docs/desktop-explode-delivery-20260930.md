# Desktop dissection layout and explode readability — 30 September 2026

Atlas source `eb6031b48e00faec4894c180f4c0d5a680847224`, website baseline
`1727b2e3c729b73d50d4b8edfdd0441442e4136c`. Local-only integration.

Short desktop embeds with all three columns retain a bounded model workspace.
The side rail and information column scroll independently instead of stretching
the central canvas to their content height. Compact drawer/focus layouts keep
their existing flow. Camera, dissection, teaching and geometry are unchanged.
The shared explode selector wraps its full chosen name, and shoulder help
tooltips fit the viewport at enlarged text sizes. No new dependencies or assets.

Compiled-source checks: head/neck and thorax stage-two dissections, selected
artery/bronchus, independent panel scrolling, focus/return and Reset. The original
canvas heights of 1815/1913px become 456px at 1280×900, with usable visible anatomy.
Thirty-six actual explode-choice text-fit checks cover both modules, all three
choices, 1280/375/320 widths and normal/enlarged text. Original tooltip overflow
failure evidence is preserved in the main workspace; it was corrected, not hidden.

Source suites: explode behavior, selection visibility and renderer recovery pass;
shoulder workspace 1463 checks pass. Model-first fixture now supplies real resolved
teaching for settled SSR markup, because SSR cannot run async loader effects;
all existing assertions remain. Its 3853 checks pass. Module builds pass.

Earlier current-baseline orbit evidence: 96 selected-label states and 32 stage-two
states containing 126 labels (3–5 per state) pass screen-side, bounds and overlap
checks across head/neck/thorax Spread/Extract views. This bounded sample is not
whole-atlas, surgical, physical-device or clinical acceptance. Final integrated
verification and backup evidence are recorded separately in the main checkpoint.

All 137 model bytes and existing notices must remain identical. Review bindings
advance to the actual source revision; no approvals are migrated or submitted.
No scans, masks, patient files, desktop Didanix or fracture implementation changed.
D-drive recovery remains pending while full; no D access, deletion or write.

Final integrated website: both desktop dissection journeys, panel scrolling,
focus/return and Reset pass, along with all 36 explode text-fit cases and zero
page errors. See `desktop-explode-browser-20260930.json`. Website tests: full
run 304/305 pass; the sole historical tour-reflow delta fixture was pinned to
its original delivered commit, then its affected test passes (305 covered
across two runs, not a single all-green run). TypeScript and final build pass.
The old failure logs are retained. Generated learner and review imports match
the same source; all 137 models and previous notices remain unchanged.
