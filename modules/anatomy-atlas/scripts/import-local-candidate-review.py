"""Convert source-verified candidate feedback to new private Slicer fiducials, never masks."""
import argparse
import importlib.util
import json
from pathlib import Path
import numpy as np
from local_ct_checkpoint import REPO, digest, inside, read_json, unchanged

def module(name, file):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(file))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

comparison_export = module('comparison_export', 'export-local-mask-comparison.py')
baseline_review = module('baseline_review', 'import-local-review-marks.py')

def validate_candidate_review(verified, review):
    keys = {'schema', 'release', 'approval', 'coordinateSystem', 'sourceAnnotationSha256', 'sourceCtSha256',
            'structureId', 'baselineMaskSha256', 'candidateMaskSha256', 'comparisonManifestSha256', 'requestSha256', 'marks'}
    if not isinstance(review, dict) or set(review) != keys or review['schema'] != 'vm-local-candidate-review/1' or review['release'] != 'NOT_FOR_PUBLICATION' or review['approval'] is not False or review['coordinateSystem'] != 'LPS-mm':
        raise ValueError('Unsupported candidate feedback; baseline feedback uses a separate importer')
    expected = {key: verified['request'][key] for key in ['structureId', 'baselineMaskSha256', 'sourceAnnotationSha256', 'sourceCtSha256']}
    expected.update(candidateMaskSha256=verified['candidate']['sha256'], comparisonManifestSha256=verified['manifest_sha'], requestSha256=verified['request_sha'])
    if any(review[key] != value for key, value in expected.items()):
        raise ValueError('Candidate feedback belongs to a different source or comparison')
    marks = review['marks']
    if not isinstance(marks, list) or not 1 <= len(marks) <= 500:
        raise ValueError('Candidate feedback needs 1 to 500 marks')
    checkpoint = verified['checkpoint']
    inverse = np.linalg.inv(np.diag([-1., -1., 1., 1.]) @ checkpoint['image'].affine)
    groups, seen, conflicts = {}, {}, []
    for number, mark in enumerate(marks, 1):
        if not isinstance(mark, dict) or set(mark) != {'action', 'lps'} or not isinstance(mark['action'], str) or mark['action'] not in {'include', 'exclude'}:
            raise ValueError('Unsupported candidate mark')
        point = mark['lps']
        if not isinstance(point, list) or len(point) != 3 or any(type(v) not in (int, float) or not np.isfinite(v) for v in point):
            raise ValueError('Invalid candidate mark coordinate')
        index = (inverse @ [*point, 1.])[:3]
        if np.any(index < -.5) or np.any(index >= np.array(checkpoint['image'].shape) - .5):
            raise ValueError('Candidate mark outside source CT')
        voxel = tuple(np.floor(index + .5).astype(int))
        prior = seen.setdefault(voxel, set())
        if prior and mark['action'] not in prior: conflicts.append(number)
        prior.add(mark['action'])
        group = groups.setdefault(mark['action'], {'code': review['structureId'], 'action': mark['action'], 'status': 'candidate-unapproved', 'maskSha256': review['candidateMaskSha256'], 'points': []})
        group['points'].append({'id': str(number), 'label': f'CANDIDATE {mark["action"]} {number}',
            'description': f'{review["structureId"]}; CANDIDATE REVIEW ONLY; candidate SHA256 {review["candidateMaskSha256"]}; baseline SHA256 {review["baselineMaskSha256"]}; comparison SHA256 {review["comparisonManifestSha256"]}',
            'position': point.copy(), 'orientation': [1,0,0,0,1,0,0,0,1], 'selected': True, 'locked': True, 'visibility': True, 'positionStatus': 'defined'})
    return list(groups.values()), conflicts

def import_candidate_review(state_path, request_path, comparison_dir, review_path, output_dir=None, allow_drafts=(), check_only=False):
    if check_only and output_dir is not None:
        raise ValueError('Check-only must not specify output')
    review_path = Path(review_path).resolve(strict=True)
    review_sha = digest(review_path)
    review = read_json(review_path, 1024 * 1024)
    verified = comparison_export.verify_comparison(state_path, request_path, comparison_dir, allow_drafts)
    checkpoint = verified['checkpoint']
    checkpoint['pins'].append((review_path, review_sha))
    groups, conflicts = validate_candidate_review(verified, review)
    report = {key: review[key] for key in ['sourceAnnotationSha256', 'sourceCtSha256', 'structureId', 'baselineMaskSha256', 'candidateMaskSha256', 'comparisonManifestSha256', 'requestSha256']}
    report.update(schema='vm-slicer-candidate-review-import/1', release='NOT_FOR_PUBLICATION', approval=False,
        reviewSha256=review_sha, reviewTarget='candidate-unapproved', marks=len(review['marks']), groups=len(groups),
        conflictingMarkNumbers=conflicts, sourceMasksChanged=False, candidateChanged=False, sceneOpened=False,
        patientDataUploaded=False, slicerRuntimeValidated=False, files=[])
    unchanged(checkpoint)
    if check_only: return report
    if output_dir is None: raise ValueError('New private output directory required')
    output = Path(output_dir).resolve()
    if output.exists() or inside(output, REPO) or inside(output, checkpoint['base']) or inside(output, Path(state_path).resolve().parent) or inside(output, Path(comparison_dir).resolve()) or any(inside(path, output) for path, _ in checkpoint['pins']):
        raise ValueError('Use a new private directory outside source and review inputs')
    documents = [(f'{group["code"]}.candidate.{group["action"]}.mrk.json', json.dumps(baseline_review.markup_document(group), indent=2, allow_nan=False) + '\n') for group in groups]
    documents.append(('README.txt', 'PRIVATE CANDIDATE FEEDBACK — NOT SEGMENTATIONS OR APPROVALS\n'
        'These marks refer to the candidate hash, not the baseline mask. Verify source CT, baseline, candidate, '
        'request and comparison-manifest hashes against CANDIDATE_REVIEW_MANIFEST.json before loading. '
        'In Slicer, add the original CT, this exact candidate and the locked .mrk.json point lists. Coordinates '
        'are LPS mm: no manual flips or additional transforms. Points are review hints, not contours or edits. '
        'Keep accepted source masks intact; save any further correction as a NEW draft. Resolve conflicting '
        'include/exclude marks with the radiologist. This converter opens no scene and grants no approval. '
        'Without CANDIDATE_REVIEW_MANIFEST.json, outputs are incomplete. Keep all files private.\n'))
    output.mkdir(parents=True, exist_ok=False)
    for name, content in documents:
        path = output / name
        with path.open('x', encoding='utf-8', newline='\n') as stream: stream.write(content)
        report['files'].append({'file': name, 'sha256': digest(path)})
    unchanged(checkpoint)
    with (output / 'CANDIDATE_REVIEW_MANIFEST.json').open('x', encoding='utf-8') as stream:
        json.dump(report, stream, indent=2, allow_nan=False)
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', required=True, type=Path)
    parser.add_argument('--request', required=True, type=Path)
    parser.add_argument('--comparison-dir', required=True, type=Path)
    parser.add_argument('--review', required=True, type=Path)
    parser.add_argument('--output-dir', type=Path)
    parser.add_argument('--allow-draft', action='append', default=[])
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    try:
        report = import_candidate_review(args.state, args.request, args.comparison_dir, args.review, args.output_dir, args.allow_draft, args.check_only)
        print(json.dumps({key: report[key] for key in ['schema', 'marks', 'groups', 'conflictingMarkNumbers', 'approval', 'sourceMasksChanged', 'candidateChanged', 'sceneOpened', 'patientDataUploaded']}))
    except Exception:
        parser.exit(1, 'Candidate review import failed validation; source data was not modified.\n')
