"""Export accepted CT-head masks for local review; no inference or source edits.

Run with the CT-head project's existing Python environment. Output is explicitly
NOT_FOR_PUBLICATION and must be outside this repository and the source directory.
Dependencies: numpy, nibabel, scikit-image (existing local, permissive tooling).
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import struct
import sys
from importlib.metadata import version

sys.addaudithook(lambda event, args: (_ for _ in ()).throw(RuntimeError('Network disabled'))
                if event in {'socket.connect', 'socket.connect_ex', 'socket.getaddrinfo', 'socket.sendto'} else None)
import nibabel as nib
import numpy as np
from skimage.measure import marching_cubes


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def inside(path, parent):
    return path == parent or parent in path.parents


def export(state_path, output):
    repo = Path(__file__).resolve().parents[1]
    state_path = state_path.resolve(strict=True)
    state = json.loads(state_path.read_text(encoding='utf-8-sig'))
    annotations_path = Path(state['annotation_json']).resolve(strict=True)
    base = annotations_path.parent
    output = output.resolve()
    if inside(output, repo) or inside(output, base) or output.exists() or output.with_suffix('.export.json').exists() or output.suffix != '.vmatlas':
        raise ValueError('Use a new .vmatlas output outside the repository and original data')
    annotation_sha = digest(annotations_path)
    if annotation_sha != state['annotation_sha256']:
        raise ValueError('Annotation revision differs from saved checkpoint')
    ann = json.loads(annotations_path.read_text(encoding='utf-8-sig'))
    source_path = (base / ann['source_geometry']).resolve(strict=True)
    if not inside(source_path, base):
        raise ValueError('Source geometry must remain inside the source directory')
    source = json.loads(source_path.read_text(encoding='utf-8-sig'))
    reference = base / 'reference_series_003.nii.gz'
    if digest(reference) != source['reference_sha256']:
        raise ValueError('Original CT fingerprint differs')
    image = nib.load(reference)
    if len(image.shape) != 3 or list(image.shape) != source['shape'] or not np.allclose(image.affine, source['affine_ras'], atol=1e-5, rtol=0):
        raise ValueError('CT geometry differs from source record')
    data = np.asanyarray(image.dataobj)
    if not np.isfinite(data).all():
        raise ValueError('Missing/padding voxels require an explicitly reviewed export policy')
    # Exact narrowing only: never quantise, window, resize, or replace image values.
    if data.min() < -32768 or data.max() > 32767 or not np.equal(data, np.round(data)).all():
        raise ValueError('This local pilot requires exactly representable signed 16-bit HU')
    values = data.astype('<i2')
    if not np.array_equal(values, data):
        raise ValueError('Scalar conversion changed HU')
    del data
    affine = np.diag([-1., -1., 1., 1.]) @ image.affine
    body = bytearray()

    def block(array):
        body.extend(b'\0' * (-len(body) % 8))
        encoded = array.tobytes(order='F' if array.ndim == 3 else 'C')
        record = {'offset': len(body), 'bytes': len(encoded)}
        body.extend(encoded)
        return record

    volume = {'dimensions': list(image.shape), 'originLps': affine[:3, 3].tolist(),
              'stepsLps': affine[:3, :3].T.tolist(), 'units': 'HU', 'type': 'int16',
              'data': block(values), 'sourceSha256': source['reference_sha256']}
    del values
    structures = []
    source_files = [(reference, source['reference_sha256']), (annotations_path, annotation_sha)]
    for code, entry in ann['annotations'].items():
        geom = entry.get('geometry') or {}
        if entry.get('approved') is not True or entry.get('status') != 'USER_ACCEPTED' or geom.get('type') != 'binary_mask':
            continue
        if not re.fullmatch(r'cth\.[a-z0-9_.]+', code):
            raise ValueError('Unexpected anatomy code')
        path = (base / geom['file']).resolve(strict=True)
        if not inside(path, base) or digest(path) != geom['sha256']:
            raise ValueError('Accepted mask source differs')
        mask_image = nib.load(path)
        if mask_image.shape != image.shape or not np.allclose(mask_image.affine, image.affine, atol=1e-5, rtol=0):
            raise ValueError('Mask is not on the exact source CT grid')
        if not np.allclose(mask_image.affine, geom['affine_ras_mm'], atol=1e-5, rtol=0):
            raise ValueError('Mask differs from reviewed geometry')
        raw = np.asanyarray(mask_image.dataobj)
        if not np.isin(raw, [0, 1]).all():
            raise ValueError('Only nonempty binary masks are supported')
        coords = np.argwhere(raw != 0)
        if not len(coords):
            raise ValueError('Accepted mask is empty')
        lower, upper = coords.min(0), coords.max(0) + 1
        crop = raw[tuple(slice(int(a), int(b)) for a, b in zip(lower, upper))].astype(np.uint8)
        packed = np.packbits(crop.ravel(order='F'), bitorder='little')
        if not np.array_equal(np.unpackbits(packed, bitorder='little')[:crop.size], crop.ravel(order='F')):
            raise ValueError('Mask encoding is not lossless')
        padded = np.pad(crop, 1)
        vertices, faces, _, _ = marching_cubes(padded, level=.5, step_size=1, allow_degenerate=False)
        voxel_vertices = vertices + lower - 1
        positions = (voxel_vertices @ affine[:3, :3].T + affine[:3, 3]).astype('<f4')
        if np.linalg.det(affine[:3, :3]) < 0:
            faces = faces[:, ::-1]
        faces = faces.astype('<u4')
        # Pick a real foreground voxel nearest the physical centroid, never an empty cavity centre.
        centre = coords.mean(0)
        distances = np.sum(((coords - centre) @ affine[:3, :3].T) ** 2, axis=1)
        focus_index = coords[int(np.argmin(distances))]
        focus = affine[:3, :3] @ focus_index + affine[:3, 3]
        colour = entry.get('display_colour') or entry.get('suggested_colour')
        if not isinstance(colour, str) or not re.fullmatch(r'#[0-9a-fA-F]{6}', colour):
            colour = ['#16c6b2', '#d2dc16', '#65a9e8', '#ed9b60'][len(structures) % 4]
        label = entry['preferred_label']
        if not isinstance(label, str) or len(label) > 120 or not re.fullmatch(r'[A-Za-z0-9 (),./–—\-]+', label):
            raise ValueError('Unexpected anatomy label')
        parent_code = entry.get('parent_code')
        if parent_code and not re.fullmatch(r'cth\.[a-z0-9_.]+', parent_code):
            raise ValueError('Unexpected parent code')
        structures.append({'id':code, 'label':label, 'colour':colour, 'parentId':parent_code or None,
            'approval':'source-mask-accepted', 'sourceSha256':geom['sha256'],
            'voxelCount':int(len(coords)), 'cropStart':lower.tolist(), 'cropSize':(upper-lower).tolist(),
            'mask':block(packed), 'positions':block(positions), 'indices':block(faces),
            'focusLps':focus.tolist(), 'surfaceMethod':'binary-0.5-isosurface-no-smoothing'})
        source_files.append((path, geom['sha256']))
        del raw, coords, crop, padded, packed, positions, faces
    if len(structures) != state['accepted_masks']:
        raise ValueError('Accepted-mask count differs from checkpoint')
    manifest = {'schema':'vm-local-study/1', 'release':'NOT_FOR_PUBLICATION',
        'modality':'CT', 'sourceAnnotationSha256':annotation_sha,
        'coordinateSystem':'LPS-mm', 'spatialRelationship':'same-source-grid',
        'viewerValidated':False, 'privacyCertified':False,
        'window':{'center':35, 'width':80, 'function':'LINEAR', 'inverted':False},
        'volume':volume, 'structures':structures, 'bodySha256':hashlib.sha256(body).hexdigest()}
    header = json.dumps(manifest, separators=(',', ':'), ensure_ascii=True).encode('utf-8')
    if len(header) > 1024*1024:
        raise ValueError('Manifest exceeds limit')
    prefix = b'VMATLAS1' + struct.pack('<II', len(header), len(body)) + header
    prefix += b'\0' * (-len(prefix) % 8)
    if len(prefix)+len(body) > 256*1024*1024:
        raise ValueError('Package exceeds local viewer memory guard')
    for path, sha in source_files:
        if digest(path) != sha:
            raise ValueError('Source changed during export')
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open('xb') as target:
        target.write(prefix)
        target.write(body)
    report = {'schema':'vm-local-study-export/1', 'file':output.name,
        'sha256':digest(output), 'bytes':output.stat().st_size, 'structures':len(structures),
        'triangles':sum(s['indices']['bytes']//12 for s in structures),
        'sourceAnnotationSha256':annotation_sha, 'sourceCtSha256':source['reference_sha256'],
        'sourceMasksVerified':len(structures), 'originalsUnchanged':True,
        'losslessMaskEncoding':True, 'losslessScalarConversion':True,
        'release':'NOT_FOR_PUBLICATION', 'clinicalApprovalAdded':False,
        'privacyCertified':False, 'patientDataUploaded':False,
        'tools':{name:version(name) for name in ['numpy','nibabel','scikit-image']}}
    with output.with_suffix('.export.json').open('x',encoding='utf-8') as target:
        json.dump(report,target,indent=2)
        target.write('\n')
    print(json.dumps(report))


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state',required=True,type=Path)
    parser.add_argument('--output',required=True,type=Path)
    args=parser.parse_args()
    export(args.state,args.output)
