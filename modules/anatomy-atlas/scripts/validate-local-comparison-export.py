"""Synthetic-only exporter checks and optional cross-language viewer fixtures. No patient data."""
import argparse
import importlib.util
import json
from pathlib import Path
import shutil
import struct
import unittest
import numpy as np
from local_ct_checkpoint import digest, read_json, REPO, inside

def module(name, file):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(file))
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result

fixture = module('comparison_tests', 'validate-local-mask-comparison.py')
exporter = module('comparison_export', 'export-local-mask-comparison.py')
study_exporter = module('study_export', 'export-local-ct-study.py')

class ExportTests(unittest.TestCase):
    save = fixture.ComparisonTests.save
    write = fixture.ComparisonTests.write
    refresh_candidate = fixture.ComparisonTests.refresh_candidate
    run_candidate = fixture.ComparisonTests.run_candidate

    def setUp(self):
        fixture.ComparisonTests.setUp(self)
        for code, entry in self.ann['annotations'].items():
            entry['preferred_label'] = 'Synthetic ' + code
        self.write(self.base / 'annotations.json', self.ann)
        state = read_json(self.state)
        state['annotation_sha256'] = digest(self.base / 'annotations.json')
        self.write(self.state, state)
        self.request['sourceAnnotationSha256'] = state['annotation_sha256']
        self.write(self.request_path, self.request)
        self.review = self.root / 'review'
        self.run_candidate(False, self.review)
        self.output = self.root / 'exports' / 'comparison.vmcompare'

    def export(self, output=None, allow=('cth.target',)):
        return exporter.package_comparison(self.state, self.request_path, self.review, output or self.output, allow)

    def header(self):
        data = self.output.read_bytes()
        self.assertEqual(data[:8], b'VMCMP001')
        size, body = struct.unpack('<II', data[8:16])
        self.assertEqual(((16 + size + 7) // 8) * 8 + body, len(data))
        return json.loads(data[16:16 + size])

    def test_roundtrip_pins_counts_no_ct_and_source_preservation(self):
        paths = [self.state, *self.base.iterdir(), *self.private.iterdir(), *self.review.iterdir()]
        before = {p: digest(p) for p in paths}
        report = self.export()
        h = self.header()
        self.assertEqual(h['counts'], dict(baseline=2, candidate=2, added=1, removed=1, warnings=2))
        self.assertEqual([l['role'] for l in h['layers']], ['candidate', 'added', 'removed', 'warnings'])
        self.assertFalse(report['ctPixelsIncluded'])
        self.assertFalse(h['approval'])
        self.assertFalse(h['viewerValidated'])
        self.assertEqual(h['comparisonManifestSha256'], digest(self.review / 'COMPARISON_MANIFEST.json'))
        self.assertNotIn('volume', h)
        self.assertNotIn('SYNTHETIC SOURCE HEADER', self.output.read_bytes().decode('latin1'))
        self.assertEqual(before, {p: digest(p) for p in paths})

    def test_stale_candidate_rejected(self):
        self.refresh_candidate(self.baseline)
        with self.assertRaises(ValueError): self.export()
        self.assertFalse(self.output.exists())

    def test_stale_report_rejected(self):
        path = self.review / 'COMPARISON_MANIFEST.json'
        h = read_json(path)
        h['approval'] = True
        self.write(path, h)
        with self.assertRaises(ValueError): self.export()

    def test_tampered_map_rejected_even_if_report_hash_updated(self):
        self.save(self.review / 'changes.nii.gz', np.zeros(self.shape, np.uint8))
        path = self.review / 'COMPARISON_MANIFEST.json'
        h = read_json(path)
        h['files'][0]['sha256'] = digest(self.review / 'changes.nii.gz')
        self.write(path, h)
        with self.assertRaises(ValueError): self.export()

    def test_draft_requires_explicit_allow(self):
        with self.assertRaises(ValueError): self.export(allow=())

    def test_existing_output_not_overwritten(self):
        self.export()
        before = digest(self.output)
        with self.assertRaises(ValueError): self.export()
        self.assertEqual(before, digest(self.output))

    def test_source_and_review_destinations_rejected(self):
        for directory in [self.base, self.state.parent, self.review, REPO]:
            with self.assertRaises(ValueError): self.export(directory / 'comparison.vmcompare')

    def test_identity_and_empty_candidate(self):
        for name, mask in [('identity', self.baseline), ('empty', np.zeros(self.shape, np.uint8))]:
            self.refresh_candidate(mask)
            self.review = self.root / name
            self.run_candidate(False, self.review)
            self.output = self.root / 'exports' / (name + '.vmcompare')
            self.export()
            h = self.header()
            self.assertEqual(h['counts']['added'], 0)
            self.assertEqual(h['counts']['removed'], 0 if name == 'identity' else 2)
            self.assertEqual(h['counts']['candidate'], 2 if name == 'identity' else 0)

def write_fixtures(destination):
    target = Path(destination).resolve()
    if target.exists() or inside(target, REPO):
        raise ValueError('Fixtures require a new directory outside the source repository')
    test = ExportTests()
    test.setUp()
    try:
        test.export()
        study = test.root / 'exports' / 'baseline.vmatlas'
        study_exporter.export(test.state, study, ('cth.target',))
        target.mkdir(parents=True, exist_ok=False)
        shutil.copyfile(study, target / study.name)
        shutil.copyfile(test.output, target / test.output.name)
        for name, mask in [('identity', test.baseline), ('empty', np.zeros(test.shape, np.uint8))]:
            test.refresh_candidate(mask)
            test.review = test.root / name
            test.run_candidate(False, test.review)
            test.output = test.root / 'exports' / (name + '.vmcompare')
            test.export()
            shutil.copyfile(test.output, target / test.output.name)
    finally:
        test.doCleanups()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fixture-dir', type=Path)
    args = parser.parse_args()
    result = unittest.TextTestRunner(verbosity=1).run(unittest.defaultTestLoader.loadTestsFromTestCase(ExportTests))
    if not result.wasSuccessful(): raise SystemExit(1)
    if args.fixture_dir: write_fixtures(args.fixture_dir)
    print(json.dumps({'schema': 'vm-comparison-export-validation/1', 'syntheticTests': result.testsRun, 'patientDataUsed': False, 'viewerRuntimeValidated': False}))
