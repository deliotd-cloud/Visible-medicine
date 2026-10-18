# Responsive native mask loading

The local CT/MRI importer validates each checksum-bound mask and locates its
display-focus voxel in one pass, yielding to browser input between blocks of
262,144 voxels. Small masks stay in one block. The previous separate binary check
and full synchronous focus loop could delay Close atlas and package replacement
events on large masks.

The yield uses a timer task, not a resolved-Promise loop: input/abort events get
an opportunity to run. An aborted scan rejects before returning a loaded entry
or reading its optional surface. No partially validated mask is displayed. The
existing checksum, geometry, crop and size gates remain in force. Yield frequency
is a bounded-work policy, not a guaranteed frame rate on every device.

The focus calculation retains the previous index-space distance, first-voxel
tie handling, crop offset and native affine mapping exactly. Empty masks keep
the existing declared-point fallback. Every byte must still be binary, including
bytes after the closest voxel. This does not resample, modify or add masks,
accepted boundaries, clinical landmarks, registration or diagnostic information.
No files, pixels or identifiers are uploaded or persisted by this helper.

Tests use synthetic buffers to check parity, late malformed data, actual timer
interleaving, cancellation and importer behaviour. They do not confer acquired
scan acceptance or clinical approval. A local browser sample with a synthetic
4,194,304-voxel all-one mask kept the identical focus index: the prior synchronous
algorithm serviced zero timer ticks; the compiled new helper serviced 21 and
responded to cancellation. It took about 164 ms versus 43 ms for the synchronous
sample: this trades some total throughput for responsiveness, not a claim of
faster import or a portable timing guarantee.

Real approved-folder browser testing was
attempted on 10 October, but the browser tool denied the F-drive folder because
it is outside its configured workspace roots. No copying, alternate path or
permission bypass was used. The approved manifest checksum still matches.
