"""Synthetic candidate feedback round trips and source/mismatch guards. No patient data."""
import copy
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import unittest
from unittest.mock import patch
import numpy as np
from local_ct_checkpoint import REPO, digest, read_json, load_checkpoint

def module(name, file):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(file))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

fixtures = module('export_tests', 'validate-local-comparison-export.py')
review_import = module('candidate_import', 'import-local-candidate-review.py')

class CandidateReviewTests(unittest.TestCase):
    save = fixtures.ExportTests.save
    write = fixtures.ExportTests.write
    run_candidate = fixtures.ExportTests.run_candidate
    refresh_candidate = fixtures.ExportTests.refresh_candidate
    export = fixtures.ExportTests.export

    def setUp(self):
        fixtures.ExportTests.setUp(self)
        self.verified = review_import.comparison_export.verify_comparison(self.state, self.request_path, self.review, ('cth.target',))
        self.point = (np.diag([-1., -1., 1., 1.]) @ self.affine @ [1., 2., 3., 1.])[:3].tolist()
        self.feedback = {key: self.request[key] for key in ['structureId', 'sourceAnnotationSha256', 'sourceCtSha256', 'baselineMaskSha256']}
        self.feedback.update(schema='vm-local-candidate-review/1', release='NOT_FOR_PUBLICATION', approval=False,
            coordinateSystem='LPS-mm', candidateMaskSha256=self.request['candidate']['sha256'],
            comparisonManifestSha256=digest(self.review / 'COMPARISON_MANIFEST.json'), requestSha256=digest(self.request_path),
            marks=[{'action': 'include', 'lps': self.point}, {'action': 'exclude', 'lps': self.point}])
        self.feedback_path = self.private / 'candidate-feedback.json'
        self.write(self.feedback_path, self.feedback)

    def run_import(self, output=None, check=True, allow=('cth.target',)):
        return review_import.import_candidate_review(self.state, self.request_path, self.review, self.feedback_path, output, allow, check)

    def test_coordinates_source_protection_and_completion_manifest(self):
        inputs = [self.state, *self.base.iterdir(), *self.private.iterdir(), *self.review.iterdir()]
        before = {p: digest(p) for p in inputs}
        output = self.root / 'candidate-feedback-output'
        report = self.run_import(output, False)
        self.assertEqual(report['marks'], 2)
        self.assertEqual(report['conflictingMarkNumbers'], [2])
        self.assertFalse(report['approval'])
        self.assertFalse(report['candidateChanged'])
        self.assertEqual(report['reviewTarget'], 'candidate-unapproved')
        for action in ['include', 'exclude']:
            node = read_json(output / f'cth.target.candidate.{action}.mrk.json')['markups'][0]
            self.assertTrue(node['locked'])
            self.assertEqual(node['coordinateSystem'], 'LPS')
            self.assertIn('candidate-unapproved', node['name'])
            point = node['controlPoints'][0]
            self.assertEqual(point['position'], self.point)
            self.assertIn(self.feedback['candidateMaskSha256'], point['description'])
            self.assertIn(self.feedback['baselineMaskSha256'], point['description'])
        self.assertEqual(read_json(output / 'CANDIDATE_REVIEW_MANIFEST.json'), report)
        for record in report['files']: self.assertEqual(digest(output / record['file']), record['sha256'])
        self.assertEqual(before, {p: digest(p) for p in inputs})

    def test_check_only_writes_nothing(self):
        before = sorted(p.relative_to(self.root).as_posix() for p in self.root.rglob('*'))
        self.assertEqual(self.run_import()['files'], [])
        self.assertEqual(before, sorted(p.relative_to(self.root).as_posix() for p in self.root.rglob('*')))
        with self.assertRaises(ValueError): self.run_import(self.root / 'unexpected-output', True)

    def test_wrong_version_pins_and_approval_rejected(self):
        for key in ['structureId', 'baselineMaskSha256', 'candidateMaskSha256', 'sourceAnnotationSha256', 'sourceCtSha256', 'comparisonManifestSha256', 'requestSha256']:
            with self.subTest(key=key):
                bad = copy.deepcopy(self.feedback)
                bad[key] = '0' * 64
                with self.assertRaises(ValueError): review_import.validate_candidate_review(self.verified, bad)
        for key, value in [('approval', True), ('approval', 0), ('release', 'PUBLIC'), ('coordinateSystem', 'RAS-mm'), ('schema', 'vm-local-review/1')]:
            bad = copy.deepcopy(self.feedback)
            bad[key] = value
            with self.assertRaises(ValueError): review_import.validate_candidate_review(self.verified, bad)

    def test_baseline_and_candidate_contracts_are_not_interchangeable(self):
        with self.assertRaises(ValueError): review_import.baseline_review.validate_review(load_checkpoint(self.state), self.feedback, ('cth.target',))
        baseline = {key: self.feedback[key] for key in ['release', 'approval', 'coordinateSystem', 'sourceAnnotationSha256', 'sourceCtSha256']}
        baseline.update(schema='vm-local-review/1', marks=[{'structureId': 'cth.target', 'maskSha256': self.feedback['baselineMaskSha256'], 'action': 'include', 'lps': self.point}])
        self.assertEqual(review_import.baseline_review.validate_review(load_checkpoint(self.state), baseline, ('cth.target',))[0][0]['status'], 'draft-unapproved')
        with self.assertRaises(ValueError): review_import.validate_candidate_review(self.verified, baseline)

    def test_invalid_marks_and_limits(self):
        for marks in [[], [{}], [{'action': 'approve', 'lps': self.point}], [{'action': 'include', 'lps': [True, 0, 0]}],
                      [{'action': 'include', 'lps': [1e9, 0, 0]}], [{'action': 'include', 'lps': [float('nan'), 0, 0]}],
                      [{'action': 'include', 'lps': self.point, 'maskSha256': '0' * 64}], self.feedback['marks'] * 251]:
            bad = {**self.feedback, 'marks': marks}
            with self.assertRaises(ValueError): review_import.validate_candidate_review(self.verified, bad)

    def test_stale_candidate_and_report_fail_before_output(self):
        self.refresh_candidate(self.baseline)
        with self.assertRaises(ValueError): self.run_import(self.root / 'bad-output', False)
        self.assertFalse((self.root / 'bad-output').exists())

    def test_tampered_comparison_report(self):
        path = self.review / 'COMPARISON_MANIFEST.json'
        report = read_json(path)
        report['approval'] = True
        self.write(path, report)
        with self.assertRaises(ValueError): self.run_import()

    def test_duplicate_keys_and_oversized_feedback(self):
        self.feedback_path.write_text('{"schema":"x","schema":"y"}', encoding='utf-8')
        with self.assertRaises(ValueError): self.run_import()
        self.feedback_path.write_text(' ' * (1024 * 1024 + 1), encoding='utf-8')
        with self.assertRaises(ValueError): self.run_import()

    def test_no_overwrite_and_no_source_destination(self):
        output = self.root / 'kept-review'
        self.run_import(output, False)
        before = digest(output / 'CANDIDATE_REVIEW_MANIFEST.json')
        for target in [output, self.base / 'new', self.state.parent / 'new', self.review / 'new', REPO / 'forbidden']:
            with self.assertRaises(ValueError): self.run_import(target, False)
        self.assertEqual(before, digest(output / 'CANDIDATE_REVIEW_MANIFEST.json'))

    def test_partial_output_has_no_completion_marker(self):
        output = self.root / 'interrupted'
        original = review_import.unchanged
        def changed_after_write(checkpoint):
            if output.exists(): raise ValueError('Synthetic source-change failure')
            return original(checkpoint)
        with patch.object(review_import, 'unchanged', changed_after_write):
            with self.assertRaises(ValueError): self.run_import(output, False)
        self.assertTrue(output.exists())
        self.assertFalse((output / 'CANDIDATE_REVIEW_MANIFEST.json').exists())

    def test_draft_requires_explicit_scope(self):
        with self.assertRaises(ValueError): self.run_import(allow=())

    def test_real_typescript_export_to_slicer_json_roundtrip(self):
        self.export()
        fixtures.study_exporter.export(self.state, self.output.parent / 'baseline.vmatlas', ('cth.target',))
        feedback = self.output.parent / 'typescript-candidate-feedback.json'
        node = shutil.which('node')
        self.assertIsNotNone(node, 'Existing Node runtime required')
        result = subprocess.run([node, str(REPO / 'scripts/validate-local-comparison-viewer.mjs'), str(self.output.parent), '--write-feedback', str(feedback)],
            cwd=REPO, capture_output=True, text=True, timeout=45, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue(json.loads(result.stdout)['syntheticCandidateFeedbackExported'])
        self.feedback_path = feedback
        report = self.run_import(self.root / 'typescript-return', False)
        self.assertEqual(report['marks'], 2)
        self.assertEqual(report['conflictingMarkNumbers'], [2])
        node = read_json(self.root / 'typescript-return/cth.target.candidate.include.mrk.json')['markups'][0]
        self.assertEqual(node['controlPoints'][0]['position'], read_json(feedback)['marks'][0]['lps'])

if __name__ == '__main__':
    result = unittest.TextTestRunner(verbosity=1).run(unittest.defaultTestLoader.loadTestsFromTestCase(CandidateReviewTests))
    if not result.wasSuccessful(): raise SystemExit(1)
    print(json.dumps({'schema': 'vm-candidate-feedback-validation/1', 'syntheticTests': result.testsRun,
        'typescriptToSlicerJsonRoundtrip': True, 'sourceMasksChanged': False, 'patientDataUsed': False, 'slicerRuntimeValidated': False}))
