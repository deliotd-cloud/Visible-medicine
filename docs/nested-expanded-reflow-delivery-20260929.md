# Expanded dissection reflow: local integration

Atlas `1223e506beaf1ba8ddba1d082c8449e42cb64f72` corrects the expanded-panel
overflow and canvas resizing identified in `nested-readability-delivery-20260929.md`.
Learner and protected Clinical Review receive the same source changes.

Selected values and practice controls wrap; structure columns adapt to enlarged
text; the short/mobile canvas returns to its original size after text enlargement.
No labels, controls or notices are hidden to achieve reflow. Existing compact
default disclosures and normal desktop layout remain.

The actual generated-source module passed 36 cases across ventricular, eye and
femoral dissections, four viewport sizes and repeated 100%→200%→100% text, with all
disclosures open. Original 18-case CSS fixture, renderer/selection/model-first/
navigation checks, types and both module builds also pass. Final host checks and
website recovery are recorded in the main coordination checkpoint.

The actual website learner (375x577 iframe) and review (375x668 iframe) both
passed all-open 100%→200%→100% text checks: 206px→412px→206px canvas height,
no root/study/control-panel horizontal overflow, and reachable final controls.
The exact revision-bound worksheet return is retained. These checks used refreshed
generated exports, with no temporary stylesheet override. All 270 website tests
pass; types/build and verified backup receipts are in the coordination checkpoint.

All models, source identity, teaching and independent access are preserved. The
renderer fingerprint changes without transferring clinical approvals. Fracture
work remains separate. No patient files, assets or dependencies added, and no
publication or clinical approval. Development checks are not physical-device,
native-browser-zoom or screen-reader certification.
