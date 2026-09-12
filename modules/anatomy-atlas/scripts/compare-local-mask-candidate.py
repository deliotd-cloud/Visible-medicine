"""Compare an explicitly supplied private CT mask candidate with its pinned source.

No segmentation, resampling, source edits, network access or approval. Outputs are
review-only label maps and aggregate measurements in a new private directory.
Use the CT project's existing NumPy/NiBabel environment.
"""
import argparse
import gzip
import json
from pathlib import Path
import re
import numpy as np
import nibabel as nib
from local_ct_checkpoint import (REPO, CODE, SHA, digest, inside, confined,
                                 read_json, load_checkpoint, mask_source, unchanged)

MAX_VOXELS = 128 * 1024 * 1024
MAX_FILE_BYTES = 512 * 1024 * 1024
SLAB = 8


def grid_check(image, reference):
    if not isinstance(image, (nib.Nifti1Image, nib.Nifti2Image)):
        raise ValueError('Single-file NIfTI required')
    if len(image.shape) != 3 or any(n < 1 or n > 8192 for n in image.shape) or int(np.prod(image.shape, dtype=np.int64)) > MAX_VOXELS:
        raise ValueError('Unsupported or oversized grid')
    if image.shape != reference.shape or not np.isfinite(image.affine).all() or not np.allclose(image.affine, reference.affine, atol=1e-5, rtol=0):
        raise ValueError('Grid mismatch; automatic resampling is forbidden')
    if not np.allclose(image.affine[3], [0, 0, 0, 1], atol=1e-8, rtol=0) or abs(np.linalg.det(image.affine[:3, :3])) < 1e-8:
        raise ValueError('Invalid source affine')
    qform, qcode = image.get_qform(coded=True)
    sform, scode = image.get_sform(coded=True)
    if not qcode and not scode:
        raise ValueError('An explicit NIfTI spatial transform is required')
    if qcode and scode and not np.allclose(qform, sform, atol=1e-5, rtol=0):
        raise ValueError('Conflicting active NIfTI transforms')
    units = image.header.get_xyzt_units()[0]
    if units not in {'mm', 'unknown'} or reference.header.get_xyzt_units()[0] != 'mm':
        raise ValueError('Verified millimetre reference required')
    if image.get_data_dtype().kind not in 'buif' or image.get_data_dtype().itemsize > 8:
        raise ValueError('Unsupported mask encoding')
    return units


def binary(image, reference):
    if image.get_filename():
        # Retain a compressed-file handle between slabs; avoid repeatedly opening
        # and decompressing a whole prefix of a large private NIfTI.
        image = nib.load(image.get_filename(), keep_file_open=True, mmap='r')
    units = grid_check(image, reference)
    result = np.empty(image.shape, dtype=bool)
    for z in range(0, image.shape[2], SLAB):
        raw = np.asanyarray(image.dataobj[:, :, z:z + SLAB])
        if not np.isfinite(raw).all() or not np.logical_or(raw == 0, raw == 1).all():
            raise ValueError('Masks must contain only finite binary values')
        result[:, :, z:z + SLAB] = raw != 0
    return result, units


def external_mask(path, expected_sha, reference, pins):
    path = Path(path).resolve(strict=True)
    if not path.is_file() or path.stat().st_size > MAX_FILE_BYTES or not path.name.lower().endswith(('.nii', '.nii.gz')):
        raise ValueError('Unsupported candidate file')
    if not isinstance(expected_sha, str) or not SHA.fullmatch(expected_sha) or digest(path) != expected_sha:
        raise ValueError('External mask fingerprint differs')
    pins.append((path, expected_sha))
    return binary(nib.load(path), reference)


def mask_summary(mask, affine):
    counts = [np.count_nonzero(mask, axis=tuple(i for i in range(3) if i != axis)).astype(np.int64) for axis in range(3)]
    count = int(counts[0].sum())
    voxel_mm3 = float(abs(np.linalg.det(affine[:3, :3])))
    result = {'voxels': count, 'volumeMm3': count * voxel_mm3,
              'nativeSliceCounts': [x.tolist() for x in counts],
              'ijkBoundsInclusive': None, 'centroidRasMm': None,
              'occupiedVoxelCentreBoundsRasMm': None}
    if not count:
        return result
    occupied = [np.flatnonzero(x) for x in counts]
    result['ijkBoundsInclusive'] = {'min': [int(x[0]) for x in occupied], 'max': [int(x[-1]) for x in occupied]}
    centroid = np.array([np.dot(np.arange(len(c), dtype=np.float64), c) / count for c in counts])
    result['centroidRasMm'] = (affine[:3, :3] @ centroid + affine[:3, 3]).tolist()
    lower, upper = np.full(3, np.inf), np.full(3, -np.inf)
    # Actual occupied centres, not the corners of an oblique bounding box.
    for z in range(0, mask.shape[2], SLAB):
        indices = np.argwhere(mask[:, :, z:z + SLAB])
        if not len(indices):
            continue
        indices[:, 2] += z
        points = indices @ affine[:3, :3].T + affine[:3, 3]
        lower = np.minimum(lower, points.min(0))
        upper = np.maximum(upper, points.max(0))
    result['occupiedVoxelCentreBoundsRasMm'] = {'min': lower.tolist(), 'max': upper.tolist()}
    return result


def face_neighbours(mask):
    """Six index-face neighbours only, never diagonal/physical-distance contact."""
    near = np.zeros(mask.shape, dtype=bool)
    for axis in range(3):
        low, high = [slice(None)] * 3, [slice(None)] * 3
        low[axis], high[axis] = slice(None, -1), slice(1, None)
        near[tuple(low)] |= mask[tuple(high)]
        near[tuple(high)] |= mask[tuple(low)]
    near &= ~mask
    return near


def compare(checkpoint, code, baseline_sha, candidate_path, candidate_sha,
            allow_drafts=(), protected_regions=()):
    if len(allow_drafts) != len(set(allow_drafts)) or set(allow_drafts) - {code}:
        raise ValueError('Only the explicitly selected draft is supported')
    entry, original_image, status = mask_source(checkpoint, code, allow_drafts)
    if baseline_sha != entry['geometry']['sha256']:
        raise ValueError('Requested baseline differs from checkpoint')
    if status != 'draft-unapproved' and allow_drafts:
        raise ValueError('Do not mark an accepted target as draft')
    reference = checkpoint['image']
    grid_check(reference, reference)
    baseline, baseline_units = binary(original_image, reference)
    candidate, candidate_units = external_mask(candidate_path, candidate_sha, reference, checkpoint['pins'])
    changes = np.zeros(baseline.shape, dtype=np.uint8)
    changes[candidate & ~baseline] = 1
    changes[baseline & ~candidate] = 2
    conflicts = np.zeros(baseline.shape, dtype=np.uint8)
    protected = []
    # Every accepted binary structure is checked, not an arbitrary convenient subset.
    for protected_code, protected_entry in checkpoint['ann']['annotations'].items():
        if protected_code == code or not (protected_entry.get('approved') is True and protected_entry.get('status') == 'USER_ACCEPTED' and (protected_entry.get('geometry') or {}).get('type') == 'binary_mask'):
            continue
        _, image, _ = mask_source(checkpoint, protected_code)
        mask, units = binary(image, reference)
        if not mask.any():
            raise ValueError('An accepted protection mask is empty')
        added = (changes == 1) & mask
        removed = (changes == 2) & mask
        conflicts[added] |= 1
        conflicts[removed] |= 2
        near = face_neighbours(mask)
        protected.append({'structureId': protected_code, 'maskSha256': protected_entry['geometry']['sha256'],
            'headerSpatialUnits': units, 'voxels': int(np.count_nonzero(mask)),
            'baselineOverlapVoxels': int(np.count_nonzero(baseline & mask)),
            'candidateOverlapVoxels': int(np.count_nonzero(candidate & mask)),
            'addedOverlapVoxels': int(np.count_nonzero(added)),
            'removedOverlapVoxels': int(np.count_nonzero(removed)),
            'baselineFaceAdjacentVoxels': int(np.count_nonzero(baseline & near)),
            'candidateFaceAdjacentVoxels': int(np.count_nonzero(candidate & near))})
        del mask, near, added, removed
    regions = []
    if len(protected_regions) > 16 or len({p['id'] for p in protected_regions}) != len(protected_regions):
        raise ValueError('Invalid protected-region list')
    for region in protected_regions:
        mask, units = external_mask(region['path'], region['sha256'], reference, checkpoint['pins'])
        if not mask.any():
            raise ValueError('A protected region must not be empty')
        edits = mask & (changes != 0)
        conflicts[edits] |= 4
        regions.append({'id': region['id'], 'sha256': region['sha256'], 'headerSpatialUnits': units,
            'protectedVoxels': int(np.count_nonzero(mask)), 'changedVoxels': int(np.count_nonzero(edits)),
            'addedVoxels': int(np.count_nonzero(mask & (changes == 1))),
            'removedVoxels': int(np.count_nonzero(mask & (changes == 2)))})
        del mask, edits
    summaries = {name: mask_summary(mask, reference.affine) for name, mask in
                 [('baseline', baseline), ('candidate', candidate), ('added', changes == 1), ('removed', changes == 2)]}
    intersection = int(np.count_nonzero(baseline & candidate))
    denominator = summaries['baseline']['voxels'] + summaries['candidate']['voxels']
    signals = []
    if not changes.any(): signals.append('NO_VOXEL_CHANGES')
    if not baseline.any(): signals.append('EMPTY_BASELINE')
    if not candidate.any(): signals.append('EMPTY_CANDIDATE')
    if any(p['addedOverlapVoxels'] for p in protected): signals.append('NEW_OVERLAP_WITH_ACCEPTED_STRUCTURE')
    if any(p['changedVoxels'] for p in regions): signals.append('EXPLICIT_PROTECTED_REGION_CHANGED')
    if not regions: signals.append('NO_EXPLICIT_PROTECTED_BOUNDARY_REGIONS')
    report = {'schema': 'vm-mask-comparison/1', 'release': 'NOT_FOR_PUBLICATION', 'approval': False,
        'structureId': code, 'baselineStatus': status,
        'sourceAnnotationSha256': checkpoint['annotation_sha'], 'sourceCtSha256': checkpoint['source']['reference_sha256'],
        'baselineMaskSha256': baseline_sha, 'candidateMaskSha256': candidate_sha,
        'grid': {'shape': list(reference.shape), 'affineRasMm': reference.affine.tolist(),
                 'voxelVolumeMm3': float(abs(np.linalg.det(reference.affine[:3, :3]))),
                 'baselineHeaderUnits': baseline_units, 'candidateHeaderUnits': candidate_units,
                 'unitsBasis': 'Millimetre CT grid; unknown mask units inherited only after exact grid/source checks'},
        'summaries': summaries, 'unchangedForegroundVoxels': intersection,
        'diceBetweenVersions': 2 * intersection / denominator if denominator else None,
        'protectedStructures': protected, 'explicitProtectedRegions': regions,
        'signals': signals, 'sourceMasksChanged': False, 'candidateChanged': False,
        'resampled': False, 'patientDataUploaded': False, 'slicerRuntimeValidated': False,
        'limitations': [
            'Version agreement is not anatomical accuracy, diagnostic performance or approval.',
            'Native slice counts use zero-based I/J/K axes, not necessarily patient axial/coronal/sagittal planes.',
            'Physical bounds describe occupied voxel centres, not a fitted anatomical surface or cortical boundary.',
            'Overlap may be expected for nested anatomy. Counts are review signals, not automatic rejection or repair.',
            'Contact counts use six index-face neighbours; they do not prove surface contact, vessel continuity or millimetre clearance.',
            'Unchanged source-file hashes do not prove that a candidate preserves verbally accepted boundaries. Supply explicit protected ROI masks to test those voxels.',
            'Matching grids and declared hashes do not independently authenticate the candidate patient or author.'
        ], 'files': []}
    unchanged(checkpoint)
    return report, changes, conflicts


def request_inputs(checkpoint, request_path):
    request_path = Path(request_path).resolve(strict=True)
    expected_sha = digest(request_path)
    request = read_json(request_path, 128 * 1024)
    keys = {'schema', 'structureId', 'sourceAnnotationSha256', 'sourceCtSha256', 'baselineMaskSha256', 'candidate', 'protectedRegions'}
    if not isinstance(request, dict) or set(request) != keys or request['schema'] != 'vm-mask-candidate/1':
        raise ValueError('Unsupported comparison request')
    if request['sourceAnnotationSha256'] != checkpoint['annotation_sha'] or request['sourceCtSha256'] != checkpoint['source']['reference_sha256']:
        raise ValueError('Candidate request belongs to a different source revision')
    if not isinstance(request['structureId'], str) or not CODE.fullmatch(request['structureId']) or not isinstance(request['baselineMaskSha256'], str) or not SHA.fullmatch(request['baselineMaskSha256']):
        raise ValueError('Invalid baseline identity')
    def file_record(value, region=False):
        keys = {'id', 'file', 'sha256'} if region else {'file', 'sha256'}
        if not isinstance(value, dict) or set(value) != keys or not isinstance(value['sha256'], str) or not SHA.fullmatch(value['sha256']):
            raise ValueError('Invalid external source record')
        if region and (not isinstance(value['id'], str) or not re.fullmatch(r'[a-z][a-z0-9_-]{0,79}', value['id'])):
            raise ValueError('Invalid protected-region identifier')
        path = confined(request_path.parent, value['file'])
        return {'path': path, 'sha256': value['sha256'], **({'id': value['id']} if region else {})}
    candidate = file_record(request['candidate'])
    if not isinstance(request['protectedRegions'], list) or len(request['protectedRegions']) > 16:
        raise ValueError('Invalid protected-region list')
    regions = [file_record(value, True) for value in request['protectedRegions']]
    checkpoint['pins'].append((request_path, expected_sha))
    return request, candidate, regions, expected_sha


def write_labelmap(path, values, reference):
    # New header intentionally omits source descriptions, extensions and demographics.
    image_type = nib.Nifti2Image if isinstance(reference, nib.Nifti2Image) else nib.Nifti1Image
    image = image_type(values, reference.affine)
    image.header.set_xyzt_units('mm')
    image.set_sform(reference.affine, code=1)
    image.set_qform(None, code=0)  # Do not approximate a sheared grid as a quaternion.
    image.header['descrip'] = b'VM PRIVATE REVIEW ONLY - NOT AN APPROVAL'
    with path.open('xb') as stream:
        with gzip.GzipFile(fileobj=stream, mode='wb', filename='', mtime=0) as compressed:
            image.to_file_map({'image': nib.FileHolder(fileobj=compressed)})
    loaded = nib.load(path)
    grid_check(loaded, reference)
    if loaded.header.extensions or not np.array_equal(np.asanyarray(loaded.dataobj), values):
        raise ValueError('Review output did not round-trip')


def run_comparison(state_path, request_path, output_dir=None, allow_drafts=(), check_only=False):
    checkpoint = load_checkpoint(state_path)
    request, candidate, regions, request_sha = request_inputs(checkpoint, request_path)
    output = Path(output_dir).resolve() if output_dir is not None else None
    if check_only and output is not None:
        raise ValueError('Check-only cannot have an output directory')
    if not check_only:
        if output is None or output.exists() or inside(output, REPO) or inside(output, checkpoint['base']) or inside(output, Path(state_path).resolve().parent):
            raise ValueError('Use a new private output directory outside source and repository')
        if any(inside(path, output) for path, _ in checkpoint['pins']) or any(inside(p['path'], output) for p in [candidate, *regions]):
            raise ValueError('Output cannot contain an input file')
    report, changes, conflicts = compare(checkpoint, request['structureId'], request['baselineMaskSha256'],
        candidate['path'], candidate['sha256'], allow_drafts, regions)
    report['requestSha256'] = request_sha
    report['mode'] = 'check-only' if check_only else 'private-review-output'
    if check_only:
        return report
    unchanged(checkpoint)
    output.mkdir(parents=True, exist_ok=False)
    for name, array in [('changes.nii.gz', changes), ('protected-conflicts.nii.gz', conflicts)]:
        path = output / name
        write_labelmap(path, array, checkpoint['image'])
        report['files'].append({'file': name, 'sha256': digest(path)})
    readme = (
        'PRIVATE MASK COMPARISON — NOT A CORRECTION OR APPROVAL\n\n'
        'Open the original source CT in Slicer and load the candidate separately. Add these files as label maps '
        'on the same source grid, with no additional transform. Confirm orientation and source hashes before review.\n'
        'changes.nii.gz: 0 = no change, 1 = added foreground, 2 = removed foreground.\n'
        'protected-conflicts.nii.gz uses bit flags: 1 = addition overlapping an accepted structure; '
        '2 = removal overlapping an accepted structure; 4 = any change within an explicit protected ROI. '
        'Values such as 5 and 6 combine flags. Overlap can be expected for nested anatomy; review it, do not auto-repair it.\n'
        'COMPARISON_MANIFEST.json contains counts per original I/J/K slice and physical RAS-mm centre extents. '
        'These axes are not necessarily patient-plane reformats. Dice measures agreement between versions, not accuracy.\n'
        'No source or candidate mask, workbook, scene or approval was changed. No pixels were uploaded. '
        'Missing explicit protected ROI masks means verbally accepted boundary segments have not been checked.\n'
        'If COMPARISON_MANIFEST.json is missing, this output is incomplete and must not be used. '
        'The report is integrity evidence, not an authenticated clinical signature.\n'
    )
    with (output / 'README.txt').open('x', encoding='utf-8', newline='\n') as stream:
        stream.write(readme)
    report['files'].append({'file': 'README.txt', 'sha256': digest(output / 'README.txt')})
    unchanged(checkpoint)
    # Completion marker is written last; partial output is never advertised as valid.
    with (output / 'COMPARISON_MANIFEST.json').open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(report, stream, indent=2, allow_nan=False)
        stream.write('\n')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', required=True, type=Path)
    parser.add_argument('--request', required=True, type=Path)
    parser.add_argument('--output-dir', type=Path)
    parser.add_argument('--allow-draft', action='append', default=[])
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    try:
        report = run_comparison(args.state, args.request, args.output_dir, args.allow_draft, args.check_only)
        print(json.dumps({'mode': report['mode'], 'structureId': report['structureId'],
            'addedVoxels': report['summaries']['added']['voxels'], 'removedVoxels': report['summaries']['removed']['voxels'],
            'acceptedStructuresChecked': len(report['protectedStructures']), 'protectedRegionsChecked': len(report['explicitProtectedRegions']),
            'signals': report['signals'], 'approval': False, 'sourceMasksChanged': False,
            'filesWritten': len(report['files']) + (0 if args.check_only else 1)}))
    except Exception:
        # No arbitrary input strings, private paths or NIfTI headers in terminal logs.
        parser.exit(1, 'Comparison failed validation; original data was not modified. A missing manifest means incomplete output.\n')
