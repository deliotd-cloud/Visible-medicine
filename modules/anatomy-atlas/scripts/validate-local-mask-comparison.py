"""Synthetic mask comparison tests plus optional read-only real-source identity probe."""
import argparse
import copy
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import nibabel as nib
import numpy as np
from local_ct_checkpoint import digest, load_checkpoint, mask_source, read_json, unchanged

spec = importlib.util.spec_from_file_location('comparison', Path(__file__).with_name('compare-local-mask-candidate.py'))
comparison = importlib.util.module_from_spec(spec)
spec.loader.exec_module(comparison)


class ComparisonTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='vm-mask-comparison-test-')
        self.root = Path(self.temp.name).resolve()
        self.assertEqual(self.root.parent, Path(tempfile.gettempdir()).resolve())
        self.assertTrue(self.root.name.startswith('vm-mask-comparison-test-'))
        self.addCleanup(self.temp.cleanup)  # Exact fresh synthetic directory only.
        self.base = self.root / 'source'
        self.base.mkdir()
        self.private = self.root / 'candidate'
        self.private.mkdir()
        self.shape = (4, 5, 6)
        affine = np.array([[-2., .4, 0, 12], [0, -3., .2, 20], [0, 0, 4., 30], [0, 0, 0, 1]])
        self.save(self.base / 'reference_series_003.nii.gz', np.zeros(self.shape, np.int16), affine)
        self.reference = nib.load(self.base / 'reference_series_003.nii.gz')
        self.affine = self.reference.affine
        self.baseline = np.zeros(self.shape, np.uint8)
        self.baseline[1, 2, 2:4] = 1
        self.candidate = self.baseline.copy()
        self.candidate[1, 2, 2] = 0
        self.candidate[1, 2, 4] = 1
        protected = np.zeros(self.shape, np.uint8)
        protected[1, 2, 2] = 1
        protected[1, 2, 4] = 1
        # Includes baseline-positive and baseline-negative voxels: protect both states.
        self.roi = protected.copy()
        self.save(self.base / 'baseline.nii.gz', self.baseline)
        self.save(self.base / 'protected.nii.gz', protected)
        self.save(self.private / 'candidate.nii.gz', self.candidate)
        self.save(self.private / 'roi.nii.gz', self.roi)
        def entry(file, accepted):
            return {'approved': accepted, 'status': 'USER_ACCEPTED' if accepted else 'IN_PROGRESS_PARTIAL',
                    'geometry': {'type': 'binary_mask', 'coordinate_system': 'RAS', 'file': file,
                    'sha256': digest(self.base / file), 'affine_ras_mm': self.affine.tolist()}}
        self.ann = {'source_geometry': 'geometry.json', 'annotations': {
            'cth.target': entry('baseline.nii.gz', False),
            'cth.accepted': entry('protected.nii.gz', True)}}
        self.write(self.base / 'geometry.json', {'shape': list(self.shape), 'affine_ras': self.affine.tolist(),
            'reference_sha256': digest(self.base / 'reference_series_003.nii.gz')})
        self.write(self.base / 'annotations.json', self.ann)
        self.state = self.root / 'state-holder' / 'state.json'
        self.state.parent.mkdir()
        self.write(self.state, {'release': 'NOT_FOR_PUBLICATION', 'annotation_json': str(self.base / 'annotations.json'),
            'annotation_sha256': digest(self.base / 'annotations.json'), 'accepted_masks': 1})
        self.request = {'schema': 'vm-mask-candidate/1', 'structureId': 'cth.target',
            'sourceAnnotationSha256': digest(self.base / 'annotations.json'),
            'sourceCtSha256': digest(self.base / 'reference_series_003.nii.gz'),
            'baselineMaskSha256': digest(self.base / 'baseline.nii.gz'),
            'candidate': {'file': 'candidate.nii.gz', 'sha256': digest(self.private / 'candidate.nii.gz')},
            'protectedRegions': [{'id': 'accepted-boundary', 'file': 'roi.nii.gz', 'sha256': digest(self.private / 'roi.nii.gz')}]}
        self.request_path = self.private / 'candidate.json'
        self.write(self.request_path, self.request)

    def save(self, path, values, affine=None, units='mm'):
        image = nib.Nifti1Image(values, self.affine if affine is None else affine)
        image.header.set_xyzt_units(units)
        image.set_sform(image.affine, 1)
        image.set_qform(None, 0)
        image.header['descrip'] = b'SYNTHETIC SOURCE HEADER DO NOT COPY'
        nib.save(image, path)

    def write(self, path, value):
        path.write_text(json.dumps(value, allow_nan=False), encoding='utf-8')

    def refresh_candidate(self, data=None, affine=None, units='mm'):
        self.save(self.private / 'candidate.nii.gz', self.candidate if data is None else data, affine, units)
        self.request['candidate']['sha256'] = digest(self.private / 'candidate.nii.gz')
        self.write(self.request_path, self.request)

    def run_candidate(self, check=True, output=None, allow=('cth.target',)):
        return comparison.run_comparison(self.state, self.request_path, output, allow, check)

    def test_counts_differences_protection_and_source_preservation(self):
        inputs = [self.state, *self.base.iterdir(), *self.private.iterdir()]
        before = {p: digest(p) for p in inputs}
        output = self.root / 'review-output'
        report = self.run_candidate(False, output)
        self.assertFalse(report['approval'])
        self.assertFalse(report['sourceMasksChanged'])
        self.assertEqual(report['baselineStatus'], 'draft-unapproved')
        self.assertEqual(report['summaries']['baseline']['voxels'], 2)
        self.assertEqual(report['summaries']['candidate']['voxels'], 2)
        self.assertEqual(report['summaries']['added']['voxels'], 1)
        self.assertEqual(report['summaries']['removed']['voxels'], 1)
        self.assertEqual(report['unchangedForegroundVoxels'], 1)
        self.assertEqual(report['diceBetweenVersions'], .5)
        self.assertAlmostEqual(report['summaries']['added']['volumeMm3'], 24.)
        protection = report['protectedStructures'][0]
        self.assertEqual(protection['addedOverlapVoxels'], 1)
        self.assertEqual(protection['removedOverlapVoxels'], 1)
        self.assertEqual(protection['baselineFaceAdjacentVoxels'], 1)
        self.assertEqual(report['explicitProtectedRegions'][0]['changedVoxels'], 2)
        labels = np.asanyarray(nib.load(output / 'changes.nii.gz').dataobj)
        expected = np.zeros(self.shape, np.uint8)
        expected[1, 2, 4], expected[1, 2, 2] = 1, 2
        np.testing.assert_array_equal(labels, expected)
        flags = np.asanyarray(nib.load(output / 'protected-conflicts.nii.gz').dataobj)
        self.assertEqual(flags[1, 2, 4], 5)
        self.assertEqual(flags[1, 2, 2], 6)
        self.assertEqual(np.count_nonzero(flags), 2)
        self.assertEqual(report, read_json(output / 'COMPARISON_MANIFEST.json'))
        image = nib.load(output / 'changes.nii.gz')
        self.assertNotIn(b'SYNTHETIC SOURCE', bytes(image.header['descrip']))
        self.assertFalse(image.header.extensions)
        self.assertEqual(int(image.header['qform_code']), 0)
        for file in report['files']:
            self.assertEqual(file['sha256'], digest(output / file['file']))
        self.assertEqual(before, {p: digest(p) for p in inputs})
        # Same deterministic inputs produce byte-identical compressed maps.
        second = self.run_candidate(False, self.root / 'second-output')
        self.assertEqual(report['files'], second['files'])

    def test_oblique_extents_native_slices_and_centroid(self):
        report = self.run_candidate()
        for name, ijk in [('added', [1, 2, 4]), ('removed', [1, 2, 2])]:
            summary = report['summaries'][name]
            point = (self.affine @ [*ijk, 1])[:3]
            np.testing.assert_allclose(summary['centroidRasMm'], point)
            np.testing.assert_allclose(summary['occupiedVoxelCentreBoundsRasMm']['min'], point)
            np.testing.assert_allclose(summary['occupiedVoxelCentreBoundsRasMm']['max'], point)
            self.assertEqual(summary['ijkBoundsInclusive'], {'min': ijk, 'max': ijk})
            for axis, counts in enumerate(summary['nativeSliceCounts']):
                self.assertEqual(sum(counts), 1)
                self.assertEqual(counts[ijk[axis]], 1)

    def test_identity_empty_and_no_boundary_roi_are_not_approvals(self):
        self.refresh_candidate(self.baseline)
        report = self.run_candidate()
        self.assertIn('NO_VOXEL_CHANGES', report['signals'])
        self.assertEqual(report['diceBetweenVersions'], 1.)
        self.assertFalse(report['approval'])
        self.assertEqual(report['explicitProtectedRegions'][0]['changedVoxels'], 0)
        self.request['protectedRegions'] = []
        self.refresh_candidate(np.zeros(self.shape, np.uint8))
        report = self.run_candidate()
        self.assertIn('EMPTY_CANDIDATE', report['signals'])
        self.assertIn('NO_EXPLICIT_PROTECTED_BOUNDARY_REGIONS', report['signals'])
        self.assertIsNone(report['summaries']['candidate']['centroidRasMm'])
        self.assertEqual(report['diceBetweenVersions'], 0.)
        self.assertEqual(report['files'], [])

    def test_all_empty_agreement_is_not_perfect_score(self):
        zeros = np.zeros(self.shape, np.uint8)
        self.save(self.base / 'baseline.nii.gz', zeros)
        self.ann['annotations']['cth.target']['geometry']['sha256'] = digest(self.base / 'baseline.nii.gz')
        self.write(self.base / 'annotations.json', self.ann)
        state = read_json(self.state)
        state['annotation_sha256'] = digest(self.base / 'annotations.json')
        self.write(self.state, state)
        self.request['sourceAnnotationSha256'] = state['annotation_sha256']
        self.request['baselineMaskSha256'] = digest(self.base / 'baseline.nii.gz')
        self.refresh_candidate(zeros)
        report = self.run_candidate()
        self.assertIsNone(report['diceBetweenVersions'])
        self.assertIn('EMPTY_BASELINE', report['signals'])
        self.assertIn('EMPTY_CANDIDATE', report['signals'])

    def test_pins_schema_and_explicit_draft_guards(self):
        for key in ['sourceAnnotationSha256', 'sourceCtSha256', 'baselineMaskSha256']:
            with self.subTest(key=key):
                bad = copy.deepcopy(self.request); bad[key] = 'f' * 64
                self.write(self.request_path, bad)
                with self.assertRaises(ValueError): self.run_candidate()
        for bad in [dict(self.request, approval=True), dict(self.request, schema='vm-mask-candidate/2'), dict(self.request, structureId='cth.missing')]:
            self.write(self.request_path, bad)
            with self.assertRaises(ValueError): self.run_candidate()
        self.write(self.request_path, self.request)
        for allow in [(), ('cth.target', 'cth.target'), ('cth.other',)]:
            with self.assertRaises(ValueError): self.run_candidate(allow=allow)
        bad = copy.deepcopy(self.request); bad['candidate']['sha256'] = 'f' * 64
        self.write(self.request_path, bad)
        with self.assertRaises(ValueError): self.run_candidate()

    def test_accepted_baseline_never_approves_candidate(self):
        self.request['structureId'] = 'cth.accepted'
        self.request['baselineMaskSha256'] = digest(self.base / 'protected.nii.gz')
        self.write(self.request_path, self.request)
        report = self.run_candidate(allow=())
        self.assertEqual(report['baselineStatus'], 'source-mask-accepted')
        self.assertFalse(report['approval'])
        self.assertEqual(report['protectedStructures'], [])  # Target is not its own protection mask.
        with self.assertRaises(ValueError): self.run_candidate(allow=('cth.accepted',))

    def test_every_accepted_mask_is_source_checked(self):
        # An unchanged target is not permission to ignore corrupt protection data.
        self.refresh_candidate(self.baseline)
        self.save(self.base / 'protected.nii.gz', np.zeros(self.shape, np.uint8))
        with self.assertRaises(ValueError): self.run_candidate()
        self.ann['annotations']['cth.accepted']['geometry']['sha256'] = digest(self.base / 'protected.nii.gz')
        self.write(self.base / 'annotations.json', self.ann)
        state = read_json(self.state); state['annotation_sha256'] = digest(self.base / 'annotations.json')
        self.write(self.state, state)
        self.request['sourceAnnotationSha256'] = state['annotation_sha256']
        self.write(self.request_path, self.request)
        with self.assertRaises(ValueError): self.run_candidate()

    def test_no_overwrite_or_source_output(self):
        for output in [self.root, self.base / 'new', self.state.parent / 'new', comparison.REPO / 'comparison-test-forbidden']:
            with self.subTest(output=output):
                with self.assertRaises(ValueError): self.run_candidate(False, output)
                if output != self.root: self.assertFalse(output.exists())
        with self.assertRaises(ValueError): self.run_candidate(True, self.root / 'new')
        with self.assertRaises(ValueError): self.run_candidate(False)
        output = self.root / 'once'
        self.run_candidate(False, output)
        before = {p: digest(p) for p in output.iterdir()}
        with self.assertRaises(ValueError): self.run_candidate(False, output)
        self.assertEqual(before, {p: digest(p) for p in output.iterdir()})

    def test_invalid_voxels_and_geometry(self):
        for value in [2, -1, .5, np.nan, np.inf]:
            data = self.candidate.astype(np.float32); data[0, 0, 0] = value
            self.refresh_candidate(data)
            with self.assertRaises(ValueError): self.run_candidate()
        for data in [np.zeros((4, 5, 7), np.uint8), np.zeros((*self.shape, 1), np.uint8)]:
            self.refresh_candidate(data)
            with self.assertRaises(ValueError): self.run_candidate()
        affine = self.affine.copy(); affine[0, 3] += .01
        self.refresh_candidate(affine=affine)
        with self.assertRaises(ValueError): self.run_candidate()
        self.refresh_candidate(units='meter')
        with self.assertRaises(ValueError): self.run_candidate()
        self.refresh_candidate(units='unknown')
        self.assertEqual(self.run_candidate()['grid']['candidateHeaderUnits'], 'unknown')
        image = nib.load(self.private / 'candidate.nii.gz')
        image.set_qform(np.eye(4), 1)
        nib.save(image, self.private / 'candidate.nii.gz')
        self.request['candidate']['sha256'] = digest(self.private / 'candidate.nii.gz')
        self.write(self.request_path, self.request)
        with self.assertRaises(ValueError): self.run_candidate()

    def test_face_neighbours_do_not_wrap_or_include_diagonals(self):
        mask = np.zeros((3, 3, 3), bool); mask[0, 0, 0] = True
        near = comparison.face_neighbours(mask)
        self.assertEqual(int(near.sum()), 3)
        self.assertFalse(near[2, 0, 0])
        self.assertFalse(near[1, 1, 0])
        self.assertFalse(near[0, 0, 0])

    def test_nifti2_precision_is_not_narrowed_in_output(self):
        affine = self.affine.copy(); affine[0, 3] = 1234.123456789
        reference = nib.Nifti2Image(np.zeros(self.shape, np.int16), affine)
        reference.header.set_xyzt_units('mm')
        reference.set_sform(affine, 1); reference.set_qform(None, 0)
        output = self.root / 'nifti2-difference.nii.gz'
        comparison.write_labelmap(output, self.candidate, reference)
        decoded = nib.load(output)
        self.assertIsInstance(decoded, nib.Nifti2Image)
        np.testing.assert_array_equal(decoded.affine, affine)

    def test_declared_volume_limit_is_enforced(self):
        with patch.object(comparison, 'MAX_VOXELS', 100):
            with self.assertRaises(ValueError): self.run_candidate()
        with patch.object(comparison, 'MAX_FILE_BYTES', 1):
            with self.assertRaises(ValueError): self.run_candidate()

    def test_roi_identity_path_and_empty_guards(self):
        for file in ['../source/baseline.nii.gz', str(self.base / 'baseline.nii.gz')]:
            bad = copy.deepcopy(self.request); bad['candidate']['file'] = file
            self.write(self.request_path, bad)
            with self.assertRaises(ValueError): self.run_candidate()
        bad = copy.deepcopy(self.request); bad['protectedRegions'] *= 2
        self.write(self.request_path, bad)
        with self.assertRaises(ValueError): self.run_candidate()
        bad = copy.deepcopy(self.request); bad['protectedRegions'][0]['id'] = '../bad'
        self.write(self.request_path, bad)
        with self.assertRaises(ValueError): self.run_candidate()
        self.save(self.private / 'roi.nii.gz', np.zeros(self.shape, np.uint8))
        self.request['protectedRegions'][0]['sha256'] = digest(self.private / 'roi.nii.gz')
        self.write(self.request_path, self.request)
        with self.assertRaises(ValueError): self.run_candidate()

    def test_changed_sources_and_incomplete_output_are_not_valid(self):
        original = comparison.unchanged
        def reject_changed(checkpoint):
            original(checkpoint)
            raise ValueError('Simulated source changed during processing')
        with patch.object(comparison, 'unchanged', reject_changed):
            with self.assertRaises(ValueError): self.run_candidate(False, self.root / 'no-output')
        self.assertFalse((self.root / 'no-output').exists())
        with patch.object(comparison, 'write_labelmap', side_effect=OSError('Simulated full disk')):
            with self.assertRaises(OSError): self.run_candidate(False, self.root / 'partial')
        self.assertFalse((self.root / 'partial' / 'COMPARISON_MANIFEST.json').exists())

    def test_candidate_changed_during_output_has_no_completion_manifest(self):
        original = comparison.write_labelmap
        def mutate_after_map(path, values, reference):
            original(path, values, reference)
            if path.name == 'changes.nii.gz':
                self.save(self.private / 'candidate.nii.gz', np.zeros(self.shape, np.uint8))
        output = self.root / 'changed-during-write'
        with patch.object(comparison, 'write_labelmap', mutate_after_map):
            with self.assertRaises(ValueError): self.run_candidate(False, output)
        self.assertTrue((output / 'changes.nii.gz').exists())
        self.assertFalse((output / 'COMPARISON_MANIFEST.json').exists())

    def test_duplicate_json_and_network_block(self):
        for raw in ['{"schema":1,"schema":2}', '{"value":NaN}']:
            self.request_path.write_text(raw, encoding='utf-8')
            with self.assertRaises(ValueError): self.run_candidate()
        import socket
        with self.assertRaises(RuntimeError): socket.getaddrinfo('example.invalid', 443)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', type=Path)
    parser.add_argument('--identity-structure', default='cth.bst.midbrain')
    args = parser.parse_args()
    result = unittest.main(argv=[sys.argv[0]], exit=False)
    if not result.result.wasSuccessful(): sys.exit(1)
    if args.state:
        # Use the baseline as its own candidate IN MEMORY. This is a read-only
        # integrity probe, not a new proposal, correction, review or approval.
        checkpoint = load_checkpoint(args.state)
        code = args.identity_structure
        entry, image, status = mask_source(checkpoint, code, (code,))
        allowed = (code,) if status == 'draft-unapproved' else ()
        sha = entry['geometry']['sha256']
        report, changes, conflicts = comparison.compare(checkpoint, code, sha, image.get_filename(), sha, allowed)
        assert not changes.any() and not conflicts.any()
        assert report['summaries']['baseline'] == report['summaries']['candidate']
        assert all(p['addedOverlapVoxels'] == p['removedOverlapVoxels'] == 0 for p in report['protectedStructures'])
        unchanged(checkpoint)
        print(json.dumps({'readOnlyPrivateIdentityProbe': True, 'structureId': code,
            'acceptedStructuresChecked': len(report['protectedStructures']), 'differenceVoxels': 0,
            'privateFilesWritten': 0, 'sourceMasksChanged': False, 'clinicalFeedbackGenerated': False,
            'approval': False, 'slicerRuntimeValidated': False}))
