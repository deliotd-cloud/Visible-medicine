"""Synthetic round trips and failure guards; never author real clinical feedback."""
import copy
import argparse
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import sys
import struct
import nibabel as nib
import numpy as np
from local_ct_checkpoint import digest, load_checkpoint, read_json, unchanged

spec=importlib.util.spec_from_file_location('review_import',Path(__file__).with_name('import-local-review-marks.py'))
review_import=importlib.util.module_from_spec(spec)
spec.loader.exec_module(review_import)

class ReviewImportTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='vm-review-test-')
        self.root=Path(self.temp.name).resolve()
        # Cleanup only this exact newly generated synthetic test directory.
        self.assertEqual(self.root.parent,Path(tempfile.gettempdir()).resolve())
        self.assertTrue(self.root.name.startswith('vm-review-test-'))
        self.addCleanup(self.temp.cleanup)
        self.base=self.root/'source'
        self.base.mkdir()
        affine=np.array([[-2.,.4,0,12],[0,-3.,.2,20],[0,0,4.,30],[0,0,0,1]])
        self.affine=np.diag([-1.,-1.,1.,1.])@affine
        self.point=(self.affine@np.array([1.,2.,3.,1.]))[:3].tolist()
        nib.save(nib.Nifti1Image(np.zeros((3,4,5),dtype=np.int16),affine),self.base/'reference_series_003.nii.gz')
        mask=np.zeros((3,4,5),dtype=np.uint8);mask[1,2,3]=1
        nib.save(nib.Nifti1Image(mask,affine),self.base/'mask.nii.gz')
        image=nib.load(self.base/'reference_series_003.nii.gz')
        geometry={'type':'binary_mask','coordinate_system':'RAS','file':'mask.nii.gz',
                  'sha256':digest(self.base/'mask.nii.gz'),'affine_ras_mm':image.affine.tolist()}
        self.ann={'source_geometry':'geometry.json','annotations':{
            'cth.accepted':{'status':'USER_ACCEPTED','approved':True,'geometry':geometry},
            'cth.draft':{'status':'IN_PROGRESS_PARTIAL','approved':False,'geometry':geometry}}}
        self.write(self.base/'geometry.json',{'shape':[3,4,5],'affine_ras':image.affine.tolist(),
            'reference_sha256':digest(self.base/'reference_series_003.nii.gz')})
        self.write(self.base/'annotations.json',self.ann)
        self.state=self.root/'state.json'
        self.write(self.state,{'release':'NOT_FOR_PUBLICATION','annotation_json':str(self.base/'annotations.json'),
            'annotation_sha256':digest(self.base/'annotations.json'),'accepted_masks':1})
        self.review={'schema':'vm-local-review/1','release':'NOT_FOR_PUBLICATION','approval':False,'coordinateSystem':'LPS-mm',
            'sourceAnnotationSha256':digest(self.base/'annotations.json'),
            'sourceCtSha256':digest(self.base/'reference_series_003.nii.gz'),
            'marks':[{'structureId':'cth.accepted','maskSha256':geometry['sha256'],'action':'include','lps':self.point}]}
        self.file=self.root/'review.json';self.write(self.file,self.review)

    def write(self,path,data):
        path.write_text(json.dumps(data,allow_nan=False),encoding='utf-8')

    def validate(self,review=None,allow=()):
        return review_import.validate_review(load_checkpoint(self.state),review or self.review,allow)

    def test_roundtrip_preserves_coordinates_and_sources(self):
        before={p:digest(p) for p in self.base.iterdir()}
        out=self.root/'new-review'
        result=review_import.import_review(self.state,self.file,out)
        self.assertEqual(result['marks'],1);self.assertFalse(result['approval']);self.assertFalse(result['sourceMasksChanged'])
        self.assertTrue((out/'REVIEW_MANIFEST.json').exists())
        data=read_json(out/'cth.accepted.include.mrk.json')
        node=data['markups'][0]
        self.assertEqual(node['coordinateSystem'],'LPS');self.assertTrue(node['locked'])
        self.assertEqual(node['controlPoints'][0]['position'],self.point)
        self.assertEqual(node['controlPoints'][0]['positionStatus'],'defined')
        self.assertEqual(before,{p:digest(p) for p in self.base.iterdir()})

    def test_explicit_drafts_only(self):
        draft=copy.deepcopy(self.review);draft['marks'][0]['structureId']='cth.draft'
        with self.assertRaises(ValueError):self.validate(draft)
        groups,_=self.validate(draft,['cth.draft'])
        self.assertEqual(groups[0]['status'],'draft-unapproved')
        self.assertIn('draft-unapproved',review_import.markup_document(groups[0])['markups'][0]['name'])
        with self.assertRaises(ValueError):self.validate(draft,['cth.draft','cth.missing'])

    def test_rejects_wrong_revision_and_approval(self):
        for key,value in [('sourceCtSha256','f'*64),('sourceAnnotationSha256','f'*64),('approval',True),
                          ('approval',0),('coordinateSystem','RAS-mm'),('release','PUBLIC'),('schema','vm-local-review/2')]:
            with self.subTest(key=key,value=value):
                bad=copy.deepcopy(self.review);bad[key]=value
                with self.assertRaises(ValueError):self.validate(bad)

    def test_bad_marks(self):
        for key,value in [('lps',[True,0,0]),('lps',[float('nan'),0,0]),('lps',[1e100,0,0]),('lps',[1,2]),
                          ('maskSha256','f'*64),('structureId','../../bad'),('structureId','cth.missing'),('action','approve')]:
            with self.subTest(key=key,value=value):
                bad=copy.deepcopy(self.review);bad['marks'][0][key]=value
                with self.assertRaises(ValueError):self.validate(bad)
        for marks in [[],[self.review['marks'][0]]*501]:
            bad=copy.deepcopy(self.review);bad['marks']=marks
            with self.assertRaises(ValueError):self.validate(bad)

    def test_conflicts_preserved_not_resolved(self):
        exclude=copy.deepcopy(self.review['marks'][0]);exclude['action']='exclude'
        self.review['marks'].append(exclude)
        groups,conflicts=self.validate()
        self.assertEqual(len(groups),2);self.assertEqual(conflicts,[2])

    def test_check_only_creates_nothing(self):
        out=self.root/'check-only'
        result=review_import.import_review(self.state,self.file,out,check_only=True)
        self.assertFalse(out.exists());self.assertEqual(result['files'],[])

    def test_no_overwrite_or_source_output(self):
        for out in [self.base/'new-review',self.root,review_import.REPO/'forbidden-review-output']:
            with self.subTest(out=out):
                with self.assertRaises(ValueError):review_import.import_review(self.state,self.file,out)
        self.assertEqual(read_json(self.file),self.review)

    def test_stale_and_escaping_sources(self):
        checkpoint=load_checkpoint(self.state)
        self.state.write_text(self.state.read_text()+' ',encoding='utf-8')
        with self.assertRaises(ValueError):unchanged(checkpoint)
        self.ann['annotations']['cth.accepted']['geometry']['file']='../review.json'
        self.write(self.base/'annotations.json',self.ann)
        state=read_json(self.state);state['annotation_sha256']=digest(self.base/'annotations.json');self.write(self.state,state)
        review=copy.deepcopy(self.review);review['sourceAnnotationSha256']=state['annotation_sha256']
        with self.assertRaises(ValueError):self.validate(review)

    def test_duplicate_keys_and_nonfinite_json(self):
        for text in ['{"approval":false,"approval":true}','{"value":NaN}']:
            self.file.write_text(text,encoding='utf-8')
            with self.assertRaises(ValueError):read_json(self.file)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state',type=Path)
    parser.add_argument('--study',type=Path)
    args=parser.parse_args()
    if bool(args.state)!=bool(args.study):parser.error('Use --state and --study together')
    result=unittest.main(argv=[sys.argv[0]],exit=False)
    if not result.result.wasSuccessful():sys.exit(1)
    if args.state:
        # Read-only synthetic probes at exported focus points. These are NOT user feedback.
        with args.study.open('rb') as stream:
            prefix=stream.read(16)
            assert prefix[:8]==b'VMATLAS1'
            header_size,body_size=struct.unpack('<II',prefix[8:])
            assert 2<=header_size<=1024*1024
            assert (16+header_size+7)//8*8+body_size==args.study.stat().st_size
            header=json.loads(stream.read(header_size))
        checkpoint=load_checkpoint(args.state)
        probes={'schema':'vm-local-review/1','release':'NOT_FOR_PUBLICATION','approval':False,
            'sourceAnnotationSha256':header['sourceAnnotationSha256'],'sourceCtSha256':header['volume']['sourceSha256'],
            'coordinateSystem':'LPS-mm','marks':[{'structureId':s['id'],'maskSha256':s['sourceSha256'],
                'action':'include','lps':s['focusLps']} for s in header['structures']]}
        drafts=header.get('reviewTargetIds',[])
        groups,conflicts=review_import.validate_review(checkpoint,probes,drafts)
        assert len(groups)==len(header['structures']) and not conflicts
        for group,source in zip(groups,header['structures']):
            assert group['status']==source['approval']
            assert review_import.markup_document(group)['markups'][0]['controlPoints'][0]['position']==source['focusLps']
        unchanged(checkpoint)
        print(json.dumps({'readOnlyPrivateProbes':len(groups),'draftsExplicitlyVerified':len(drafts),
            'sourceMasksChanged':False,'reviewFilesWritten':0,'userFeedbackSynthesized':False,
            'testCoordinatesLogged':False,'slicerRuntimeValidated':False}))
