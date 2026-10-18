# Private local CT/MRI study sets

The native head viewer offers a collapsed **My study set** in the structure index.
Choose a scored-mask structure, then **Add to study set** in its information panel.
Add up to 50 structures across searches/systems in the same scan. Open the set to
revisit or remove a structure, clear it, or practise the set using find-on-scan,
multiple-choice labelling, or typed-name recall. Starting creates a new attempt.

This is an in-memory selection list, not a published exam, annotation change,
clinical approval, bookmark store or cross-modality registration. Exact current
LoadedStudy and HeadEntry object identity and HEAD_MANIFEST_SHA256 are required.
Eligibility is intersected with the whole-study practice pool: locators, shared
geometry aliases, renamed duplicate placements and foreign entries cannot enter
the set. Repeatedly selecting an existing item removes it; adding at capacity
never evicts another item. Read operations return a defensive array.

The parent clears the set when the package, loaded study or modality changes;
closing, refresh and leaving the route also discard it. Folder sharing does not
retain it across CT/MRI. Practice hides the index and set, including answers;
callbacks reject active practice, package opening and stale study context. The
existing practice engine still owns mask loading, question validation and scoring.
The list survives finishing practice in the same scan so it can be reused.

Actions also require the current import generation, review context and exact
shortlist state. A retired callback cannot restart practice after changing the
package or clearing the set, even if an importer reuses study/entry objects.

No file reads beyond existing import, uploads, persistent browser storage,
database writes, source scan/mask edits or permissions changes are introduced.
Tests use synthetic entries/components. Real acquired-scan acceptance remains
separate and requires the approved local package through supported folder selection.
