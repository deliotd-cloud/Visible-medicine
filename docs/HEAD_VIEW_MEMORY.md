# Per-study browsing recall

Folder sharing is still off by default. When enabled, the current browser tab
retains each exact package/study/revision's contrast and last ordinary browsing
cursor in native IJK, plus axial/coronal/sagittal/multiplanar layout. It adds no
retained image/mask buffers, answers, scores, guided progress, surface-only layout
or zoom/pan; the existing opted-in package still holds its local File references.
No coordinates enter URLs, browser storage, uploads or another tab.

Opening a generic CT/MRI head route resumes that modality's own saved view only
after its image bytes are rechecked. Any anatomy/tour URL takes precedence;
invalid links also refuse saved-view fallback. CT/MRI are distinct unregistered
subjects. No position is copied or registered between them. Out-of-grid, partial,
fractional, nonfinite or malformed cursor/layout values are refused, not clamped.
Reads and writes defensively copy cursor arrays; study/package identities and
the pinned manifest revision must match.

Closing the atlas, replacing the folder, leaving the head viewers, refreshing
or switching sharing off clears remembered views with the existing session.
Source scans, masks, geometry and clinical approvals are unchanged.

Evidence: `F:/VisibleMedicine/staging/20261010-head-view-memory`; corresponding
source-only recovery checkpoint under `F:/VisibleMedicine/recovery/checkpoints`.
Synthetic execution does not replace acquired-scan or clinical acceptance.
