# Branded anatomy module — verification record

Date: 6 September 2026. Tester: coding agent using the in-app browser on Windows. These are observed interaction/visual checks, not clinical approval or a full accessibility certification. Local development app tested at `http://localhost:3000/`; production compilation passed. Browser screenshots were inspected during the task; no screenshot files are claimed as packaged evidence.

## Observed checks

| Surface | Checks and result |
| --- | --- |
| Shoulder, 1440 × 1000 | Source model renders; exact Visible Medicine logo and palette; maximum separation fits the model; anterior/posterior/lateral/deep illustration presets work. Subscapularis label selects the matching information panel. |
| Shoulder, 1024 × 900 | Exam mode exits the fixed plate, hides labels and allows geometry selection. Selecting teres minor on a supraspinatus question gives the expected incorrect-answer feedback and 0/1 score. Study mode restores controls. Dragging the orbit then changing separation retains a non-preset orbit. |
| Shoulder, 768 × 1024 | Corrected previously hidden tablet control rail: search, systems and plates remain available below the viewer. All eight teaching tabs visible. DOM client/scroll widths both 753px, with no horizontal page overflow. |
| Shoulder, 390 × 844 | Vertical layout; logo, controls and content remain available. Reserved canvas space fixes the observed model/toolbar overlap. DOM client/scroll widths both 375px. |
| Hand, 1024 and 390 widths | Stage selection, maximum explode, right-side filter, trapezoid selection, removal, undo, isolate/frame, original-position reference and reassembly checked. Removed count returns correctly on undo; reassembly resets separation to zero. Mobile layout has no horizontal page overflow; model and toolbar separation corrected. |
| Spine | Intervertebral disc stage shows 47 structures (25 bones, 22 discs). Maximum explode and fixed-skeleton option operate; scene remains framed. Expanded scopes can become small on screen, so zoom/focus remain important. |
| Whole body | 823 catalogue structures; 203-bone initial view renders. Maximum skeletal separation remains in frame; reset returns to zero. |

Fresh whole-body reload and subsequent shoulder navigation produced no captured error-level console messages. Earlier development hot-reload errors while adding the image component did not recur after full navigation. Production deployment requires a separate post-publish smoke check.

## Reproducible non-browser checks

- TypeScript compilation and focused lint of changed source files: pass.
- Production build: pass, with the existing large-chunk advisory. This is not a measured load-time/performance pass.
- `validate-explode.mjs`: 391,870 centroid-pair checks, 7,280 fitting cases, 88 crop cases; pass.
- `validate-dissection.mjs`: 2,502 rules, 6,192 stage/view fits, 86 stages and 60 focused views across 11 regions plus whole body; pass.
- Shoulder, full-body, gap-preservation and recovered-asset validators: pass; source geometry and IDs unchanged.
- Dependency audit: 750 installed packages, zero unclassified; pass with notice obligations. No dependency or lockfile changes in this milestone.
- Both approved brand PNG hashes match their documented originals.

The numerical report fields that say `browserInteractionTesting: false` describe those scripts, not this separately recorded manual browser session.

## Outstanding release gates

1. Physical iOS/Android touch, pinch, orientation changes, browser/GPU variation and memory pressure; viewport emulation does not prove these.
2. Complete keyboard-only and screen-reader workflow, 200% text zoom, focus order and contrast review. The canvas has a structure-list alternative, but accessibility is not certified.
3. Full region × system × side × dissection-stage × viewport visual matrix. Sampled interaction tests and numerical coverage are not exhaustive browser tests.
4. Label collision/occlusion refinement, dense neurovascular views and very long structures. Increasing centroid separation does not guarantee surface clearance. User-directed zoom can intentionally crop a close-up.
5. Performance profiling on the actual host and representative low-powered devices; chunk splitting/loading budgets as indicated by measurements.
6. Specialist anatomical/content review, actual imaging rights and registration, editorial persistence and final main-website integration. None is implied by a successful build.
