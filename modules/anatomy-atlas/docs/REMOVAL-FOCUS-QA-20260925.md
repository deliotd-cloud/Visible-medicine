# Regional dissection removal focus — 25 September 2026

## Change

Keyboard activation of the selected-structure Remove/Hide control previously
unmounted that focused button and left focus at the page root. The shared
callback now focuses its persistent selection-feedback wrapper before dispatch
and selection clearing. Tab then reaches contextual Undo. Focus is moved only
when the connected trigger owns focus, belongs to the information panel, and is
not inside a closed responsive popup. Automatic message reveal still never
takes focus. No extra controls, anatomy, teaching, or permissions were added.

## Actual local browser checks

Tested in the in-app browser at localhost:3191, not the published website.

- Abdomen, desktop 1280 × 720: assembled 106; stage 2 (available wall removed)
  104; remove Stomach 103. Before the fix, focus fell to the page root. After the
  fix, Enter on Remove focuses feedback, Tab focuses Undo, Enter restores 104
  while retaining stage 2. Focus stays on the persistent wrapper.
- Abdomen, 390 × 844: select Stomach, open Details, Enter on Remove; feedback
  receives focus inside the open sheet. Tab reaches Undo; Enter restores the
  stomach and retains sheet focus. Escape returns to the Structure info launcher;
  the model again exposes its Stomach label. Viewport override reset afterward.
- Pelvis, desktop: assembled 82; remove gluteus maximus 80; expose deep gluteal
  group 78. Select Right obturator internus (FMA22324), keyboard Remove -> 77,
  feedback focus -> Tab Undo -> Enter -> 78. Stage 3 and the restored label remain.
- Pelvic screenshot: paired deep gluteal labels appear on their corresponding
  screen sides; selected deep tissue is labelled "Behind tissue". Selecting this
  structure also switches from pelvic close-up to the broader source extent;
  assess whether that framing should be retained in a later scoped viewer pass.

These samples are not exhaustive mobile-device, screen-reader, or clinical
acceptance. No clinical certification or new anatomical validation is claimed.

## Automated evidence

- Contextual Undo: 11 tests, including eight focus-guard scenarios and execution
  of the actual shared Remove/Hide callback to assert focus precedes dispatch and
  selection unmount.
- Model-first: original baseline retained; exactly one pinned removal callback
  migrated against saved source 7b5fae0. Existing controls/handler contracts pass.
- Dissection history, renderer, selection visibility and body-review checks pass.
- TypeScript passes. Focus helper and changed test/validator files pass targeted
  lint. Lint of body-explorer still reports four errors at lines 412, 416, 460,
  752 (effect updates/dependencies); their source contexts are byte-identical to
  7b5fae0. Do not describe the full file/repository lint as passing.
- Shared production module builds; existing large-chunk warning remains.
- Renderer review binding regenerated so prior review cannot transfer silently.

Local detailed logs (ignored, not uploaded):

- .local/test-logs/2026-09-25T13-54-58.656Z-46956-eb9cdecc.log
- .local/test-logs/2026-09-25T13-56-28.109Z-37272-348e8700.log

## Next substantive work

Integrate the verified generated module into the website. Investigate selected
pelvis framing without changing anatomy. Read-only content triage found draft
imaging gaps for right lateral sacral vein FMA18906 (CT/MRI/US), obturator veins
FMA18915/18916 (MRI/US), and iliolumbar veins FMA18903/18904 (MRI/US and Function).
Verify these against primary references before authoring; do not infer absent
contralateral geometry, vein continuity, flow or procedural suitability.
Held pelvic-floor candidates still require the owner's adjudication. Preserve
the complete roadmap, independent entitlements and revision-bound sign-off.
