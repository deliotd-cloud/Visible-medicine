"""Read-only source checks shared by private CT review tools. No network or approval."""
import hashlib
import json
from pathlib import Path
import re
import sys

def _offline(event, args):
    if event in {'socket.connect', 'socket.connect_ex', 'socket.getaddrinfo', 'socket.sendto'}:
        raise RuntimeError('Network disabled')

sys.addaudithook(_offline)
import nibabel as nib
import numpy as np

CODE = re.compile(r'cth\.[a-z0-9_.]{1,120}')
SHA = re.compile(r'[a-f0-9]{64}')
REPO = Path(__file__).resolve().parents[1]

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def inside(path, parent):
    return path == parent or parent in path.parents

def read_json(path, limit=20*1024*1024):
    if path.stat().st_size > limit:
        raise ValueError('JSON input exceeds limit')
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError('Duplicate JSON key')
            result[key] = value
        return result
    def invalid(value):
        raise ValueError('Non-finite JSON number')
    return json.loads(path.read_text(encoding='utf-8-sig'), object_pairs_hook=pairs, parse_constant=invalid)

def confined(base, relative):
    if not isinstance(relative, str) or Path(relative).is_absolute():
        raise ValueError('Expected relative source path')
    path = (base / relative).resolve(strict=True)
    if not inside(path, base) or not path.is_file():
        raise ValueError('Source escaped its original directory')
    return path

def load_checkpoint(state_path):
    state_path = Path(state_path).resolve(strict=True)
    state_sha = digest(state_path)
    state = read_json(state_path)
    if state.get('release') != 'NOT_FOR_PUBLICATION':
        raise ValueError('Unsupported checkpoint release state')
    annotation = Path(state['annotation_json']).resolve(strict=True)
    ann_sha = digest(annotation)
    if ann_sha != state['annotation_sha256']:
        raise ValueError('Annotation differs from saved checkpoint')
    ann = read_json(annotation)
    base = annotation.parent
    geometry = confined(base, ann['source_geometry'])
    source = read_json(geometry)
    reference = confined(base, 'reference_series_003.nii.gz')
    if not isinstance(source.get('reference_sha256'), str) or not SHA.fullmatch(source['reference_sha256']) or digest(reference) != source['reference_sha256']:
        raise ValueError('Original CT fingerprint differs')
    image = nib.load(reference)
    if len(image.shape) != 3 or list(image.shape) != source['shape'] or not np.allclose(image.affine, source['affine_ras'], atol=1e-5, rtol=0):
        raise ValueError('Original CT geometry differs')
    if not np.isfinite(image.affine).all() or abs(np.linalg.det(image.affine[:3,:3])) < 1e-8:
        raise ValueError('Invalid source affine')
    return {'state':state, 'ann':ann, 'base':base, 'image':image, 'source':source,
            'annotation_sha':ann_sha, 'pins':[(state_path,state_sha),(annotation,ann_sha),
                (geometry,digest(geometry)),(reference,source['reference_sha256'])]}

def mask_source(checkpoint, code, allow_drafts=()):
    if not isinstance(code,str) or not CODE.fullmatch(code):
        raise ValueError('Invalid anatomy code')
    entry = checkpoint['ann']['annotations'].get(code)
    if not isinstance(entry,dict):
        raise ValueError('Unknown anatomy code')
    accepted = entry.get('approved') is True and entry.get('status') == 'USER_ACCEPTED'
    draft = entry.get('approved') is False and entry.get('status') == 'IN_PROGRESS_PARTIAL'
    if not accepted and not (draft and code in allow_drafts):
        raise ValueError('Unaccepted mask requires an explicit draft target')
    geom = entry.get('geometry') or {}
    if geom.get('type') != 'binary_mask' or geom.get('coordinate_system') != 'RAS' or not isinstance(geom.get('sha256'),str) or not SHA.fullmatch(geom['sha256']):
        raise ValueError('Unsupported mask geometry')
    path = confined(checkpoint['base'],geom['file'])
    if digest(path) != geom['sha256']:
        raise ValueError('Source mask fingerprint differs')
    image = nib.load(path)
    if image.shape != checkpoint['image'].shape or not np.allclose(image.affine,checkpoint['image'].affine,atol=1e-5,rtol=0) or not np.allclose(image.affine,geom['affine_ras_mm'],atol=1e-5,rtol=0):
        raise ValueError('Mask does not match the source CT grid')
    checkpoint['pins'].append((path,geom['sha256']))
    return entry,image,'source-mask-accepted' if accepted else 'draft-unapproved'

def unchanged(checkpoint):
    for path, expected in dict(checkpoint['pins']).items():
        if digest(path) != expected:
            raise ValueError('Original source changed during processing')
