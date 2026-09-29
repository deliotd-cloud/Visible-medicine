# Compact touch controls

Observed on the contained phone viewer: root label/reset actions measured 30×32px,
and zoom 36×38px. Increase those tap areas to 44×44px for narrow screens or coarse
pointers. Independent specimen camera buttons receive the same minimum target.
Icon artwork, anatomical-system switches, actions and teaching are unchanged.

Root camera selectors share available width so normal 375px phone controls stay
in one 44px row instead of pushing zoom into a second row. Larger text may wrap;
never shrink text or clip a control to retain one row. Mouse desktop density stays.
No new controls or navigation. Specimen state is deliberately retained across
workspace modes: closing/resetting it merely on tab change would discard work.

## Evidence

- 21 existing production-handler control-state tests pass.
- Six real generated-viewer cases: 320×480, 375×577, 375×577 at 200% text,
  700×812,1024×768 touch and1440×820 mouse. Browser checks measure actual boxes,
  toggle labels, open the independent hip/thigh specimen and return to the atlas.
  Touch action boxes meet 44px, neither host overflows horizontally, and specimen
  canvas height stays at least 160px. Normal-width 375px+ camera row stays 44px.
- Phone screenshot checked; initial extra-row observation led to selector reflow
  correction and a full affected browser rerun. Final head/neck row also measured
  44px with both selectors and zoom sharing the same top coordinate.
- Nested review, requirements audit, TypeScript and regional/shoulder builds pass.
  Final CSS rerun uses exact renderer revision and generated-input hashes.

Evidence `docs/evidence/mobile-targets-browser-20260929.json`; reproducible test
`scripts/test-mobile-anatomy-targets.mjs` uses a local generated-module QA URL and
the bundled Playwright via VM_PLAYWRIGHT_MODULE, not a new dependency.
Physical-device/full accessibility acceptance remains separate.

Read-only Terra Medium audit identified small targets. Main independently
measured and implemented the correction; no worker edits or nested delegation.
Per-run token/time totals unavailable. No clinical, privacy or publication claims.
