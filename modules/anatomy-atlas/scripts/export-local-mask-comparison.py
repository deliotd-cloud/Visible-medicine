"""Package a source-verified comparison for the private CT/3D browser viewer.

No CT pixels, source edits, resampling, approval or upload. Run after the local
comparison tool; the completed report and both maps must still match its inputs.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import nibabel as nib
import numpy as np
from skimage.measure import marching_cubes
from local_ct_checkpoint import REPO, digest, inside, read_json, load_checkpoint, unchanged

spec = importlib.util.spec_from_file_location('comparison', Path(__file__).with_name('compare-local-mask-candidate.py'))
comparison = importlib.util.module_from_spec(spec)
spec.loader.exec_module(comparison)
MAX_BYTES = 64 * 1024 * 1024
COLOURS = {'candidate': '#65a9e8', 'added': '#39c992', 'removed': '#ff6d85', 'warnings': '#f5ca60'}


def package_comparison(state_path, request_path, comparison_dir, output, allow_drafts=()):
    checkpoint = load_checkpoint(state_path)
    request, candidate, regions, request_sha = comparison.request_inputs(checkpoint, request_path)
    directory = Path(comparison_dir).resolve(strict=True)
    output = Path(output).resolve()
    if output.exists() or output.suffix != '.vmcompare' or inside(output, REPO) or inside(output, checkpoint['base']) or inside(output, Path(state_path).resolve().parent) or inside(output, directory):
        raise ValueError('Use a new private comparison package outside source/review directories')
    manifest_path = directory / 'COMPARISON_MANIFEST.json'
    manifest_sha = digest(manifest_path)
    saved = read_json(manifest_path)
    report, changes, warnings = comparison.compare(checkpoint, request['structureId'], request['baselineMaskSha256'], candidate['path'], candidate['sha256'], allow_drafts, regions)
    expected_files = ['changes.nii.gz', 'protected-conflicts.nii.gz', 'README.txt']
    if [f.get('file') for f in saved.get('files', [])] != expected_files:
        raise ValueError('Incomplete comparison output')
    expected = {**report, 'requestSha256': request_sha, 'mode': 'private-review-output', 'files': saved['files']}
    if saved != expected:
        raise ValueError('Comparison report is stale or modified')
    checkpoint['pins'].append((manifest_path, manifest_sha))
    for record in saved['files']:
        path = (directory / record['file']).resolve(strict=True)
        if not inside(path, directory) or digest(path) != record['sha256']:
            raise ValueError('Comparison output fingerprint differs')
        checkpoint['pins'].append((path, record['sha256']))
        if record['file'].endswith('.nii.gz'):
            image = nib.load(path)
            comparison.grid_check(image, checkpoint['image'])
            expected_labels = changes if record['file'] == 'changes.nii.gz' else warnings
            if not np.array_equal(np.asanyarray(image.dataobj), expected_labels):
                raise ValueError('Comparison map differs from its source inputs')
    candidate_mask, _ = comparison.external_mask(candidate['path'], candidate['sha256'], checkpoint['image'], checkpoint['pins'])
    if any(n > 4096 for n in checkpoint['image'].shape):
        raise ValueError('Grid exceeds browser study limit')
    summary = {name: report['summaries'][name]['voxels'] for name in ['baseline', 'candidate', 'added', 'removed']}
    summary['warnings'] = int(np.count_nonzero(warnings))
    if sum(summary.values()) > 16_000_000:
        raise ValueError('Comparison foreground exceeds browser validation guard')
    affine = np.diag([-1., -1., 1., 1.]) @ checkpoint['image'].affine
    body = bytearray()
    def block(array):
        body.extend(b'\0' * (-len(body) % 8))
        data = array.tobytes(order='F' if array.ndim == 3 else 'C')
        result = {'offset': len(body), 'bytes': len(data)}
        body.extend(data)
        if len(body) > MAX_BYTES:
            raise ValueError('Comparison exceeds browser memory guard')
        return result
    layers, vertices = [], 0
    for role, mask in [('candidate', candidate_mask), ('added', changes == 1), ('removed', changes == 2), ('warnings', warnings != 0)]:
        indices = np.argwhere(mask)
        if not len(indices):
            continue
        low, high = indices.min(0), indices.max(0) + 1
        crop = mask[tuple(slice(int(a), int(b)) for a, b in zip(low, high))]
        packed = np.packbits(crop.ravel(order='F'), bitorder='little')
        if not np.array_equal(np.unpackbits(packed, bitorder='little')[:crop.size], crop.ravel(order='F')):
            raise ValueError('Mask packing changed voxels')
        positions, faces, _, _ = marching_cubes(np.pad(crop.astype(np.uint8), 1), level=.5, step_size=1, allow_degenerate=False)
        positions = (positions + low - 1) @ affine[:3, :3].T + affine[:3, 3]
        if np.linalg.det(affine[:3, :3]) < 0:
            faces = faces[:, ::-1]
        positions, faces = positions.astype('<f4'), faces.astype('<u4')
        vertices += len(positions)
        if vertices > 2_000_000 or positions.nbytes > 24_000_000 or faces.nbytes > 24_000_000:
            raise ValueError('Surface exceeds browser complexity guard')
        # One real foreground voxel per changed native K slice, not an invented
        # patient-plane index or an average point outside the labelled tissue.
        focuses = []
        for k in np.flatnonzero(np.any(crop, axis=(0, 1))):
            ij = np.argwhere(crop[:, :, k])
            middle = ij[np.argmin(np.sum((ij - ij.mean(0)) ** 2, axis=1))]
            index = np.array([middle[0], middle[1], k]) + low
            focuses.append({'sourceK': int(index[2]), 'lps': (affine[:3, :3] @ index + affine[:3, 3]).tolist()})
        layer = {'role': role, 'colour': COLOURS[role], 'voxelCount': int(len(indices)),
            'cropStart': low.tolist(), 'cropSize': (high - low).tolist(),
            'mask': block(packed), 'positions': block(positions), 'indices': block(faces),
            'focuses': focuses, 'surfaceMethod': 'binary-0.5-isosurface-no-smoothing'}
        if role == 'warnings':
            layer['flags'] = block(warnings[tuple(slice(int(a), int(b)) for a, b in zip(low, high))])
        layers.append(layer)
    header = {'schema': 'vm-local-comparison/1', 'release': 'NOT_FOR_PUBLICATION', 'approval': False,
        'viewerValidated': False, 'coordinateSystem': 'LPS-mm', 'spatialRelationship': 'same-source-grid',
        'structureId': request['structureId'], 'sourceAnnotationSha256': report['sourceAnnotationSha256'],
        'sourceCtSha256': report['sourceCtSha256'], 'baselineMaskSha256': request['baselineMaskSha256'],
        'candidateMaskSha256': candidate['sha256'], 'requestSha256': request_sha, 'comparisonManifestSha256': manifest_sha,
        'dimensions': list(checkpoint['image'].shape), 'originLps': affine[:3, 3].tolist(), 'stepsLps': affine[:3, :3].T.tolist(),
        'counts': summary, 'protectedSources': [{'structureId': p['structureId'], 'sha256': p['maskSha256']} for p in report['protectedStructures']],
        'protectedRegions': [{'id': p['id'], 'sha256': p['sha256']} for p in report['explicitProtectedRegions']],
        'layers': layers, 'bodySha256': hashlib.sha256(body).hexdigest()}
    encoded = json.dumps(header, separators=(',', ':'), allow_nan=False).encode('utf-8')
    if len(encoded) > 1024 * 1024:
        raise ValueError('Comparison header exceeds limit')
    prefix = b'VMCMP001' + struct.pack('<II', len(encoded), len(body)) + encoded
    prefix += b'\0' * (-len(prefix) % 8)
    if len(prefix) + len(body) > MAX_BYTES:
        raise ValueError('Comparison exceeds local file limit')
    unchanged(checkpoint)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open('xb') as stream:
        stream.write(prefix)
        stream.write(body)
    unchanged(checkpoint)
    return {'schema': 'vm-local-comparison-export/1', 'bytes': output.stat().st_size, 'sha256': digest(output),
        'layers': len(layers), 'counts': summary, 'triangles': sum(layer['indices']['bytes'] // 12 for layer in layers),
        'sourceFilesChanged': False, 'ctPixelsIncluded': False, 'approval': False, 'viewerValidated': False}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', required=True, type=Path)
    parser.add_argument('--request', required=True, type=Path)
    parser.add_argument('--comparison-dir', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--allow-draft', action='append', default=[])
    args = parser.parse_args()
    try:
        print(json.dumps(package_comparison(args.state, args.request, args.comparison_dir, args.output, args.allow_draft)))
    except Exception:
        parser.exit(1, 'Comparison export failed validation; source data was not modified.\n')
