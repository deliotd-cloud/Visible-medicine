# Practice mask identity

CT/MRI practice deduplication compares saved mask bytes **and** native crop
placement: checksum, scalar type, crop shape, crop offset, native volume shape
and voxel-to-RAS transform. A matching checksum alone is insufficient: equal
cropped binary arrays can occupy different locations in a scan.

The same rule governs the eligible question pool and label distractors. Explicit
geometry aliases remain excluded, and renamed copies of one placed mask still
collapse to the first whole-study representative before system filtering.
Review and revisit use exact current-study entry objects from that same pool.

This does not validate geometry or admit a different study. Existing release
checks, asset hashes, binary-mask requirements, bounds/affine checks and exact
native-voxel scoring remain unchanged. No scan, mask, clinical statement,
annotation approval or CT/MRI–3D semantic mapping is changed.

Synthetic regressions reproduce the previous loss of a second same-byte mask at
a different location, then exercise both locate and label questions through
loading, scoring and completed review. Additional cases cover duplicate files,
explicit aliases, system filtering and placement metadata. They do not imply
that the accepted head package contained this edge case, or replace signed-in
loaded-scan/clinical acceptance.

Local evidence: `E:/VisibleMedicine-LocalStaging/20261009-practice-mask-placement/`.
