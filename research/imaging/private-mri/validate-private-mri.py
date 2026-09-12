"""Synthetic geometry checks; no patient data, network, GUI or approval records."""
import importlib.util
import argparse
import json
from pathlib import Path
import numpy as np
from pydicom.dataset import Dataset

spec=importlib.util.spec_from_file_location('private_mri',Path(__file__).with_name('prepare-private-mri.py'))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

def frame(k):
    ds=Dataset()
    ds.Rows=3; ds.Columns=4
    ds.ImageOrientationPatient=[0,1,0,-1,0,0]
    ds.ImagePositionPatient=[50,40,30+3.6*k]
    ds.PixelSpacing=[2,3]
    return {'ds':ds,'pixels':np.full((3,4),k,dtype=np.uint16)}

frames=[frame(2),frame(0),frame(1)]
ordered,lps,positions,error,spacing=module.geometry(frames)
assert [f['pixels'][0,0] for f in ordered]==[0,1,2]
np.testing.assert_allclose(lps @ [1,2,1,1],[46,43,33.6,1])
ras=np.diag([-1,-1,1,1]) @ lps
np.testing.assert_allclose(ras @ [1,2,1,1],[-46,-43,33.6,1])
np.testing.assert_allclose(spacing,3.6)
assert error<1e-12
# A genuinely oblique plane, with non-square pixels and a third-axis component.
oblique=[frame(i) for i in [2,0,1]]
a=np.sqrt(.5)
for item in oblique:
    k=int(item['pixels'][0,0])
    item['ds'].ImageOrientationPatient=[a,a,0,0,0,1]
    item['ds'].ImagePositionPatient=[50+3.6*k*a,40-3.6*k*a,30]
ordered,oblique_lps,_,error,spacing=module.geometry(oblique)
assert [f['pixels'][0,0] for f in ordered]==[0,1,2]
np.testing.assert_allclose(oblique_lps @ [1,2,1,1],[50+6.6*a,40-.6*a,34,1])
np.testing.assert_allclose(spacing,3.6)
assert error<1e-12
changes=[
    lambda f:setattr(f[1]['ds'],'ImagePositionPatient',f[0]['ds'].ImagePositionPatient),
    lambda f:setattr(f[1]['ds'],'ImageOrientationPatient',[1,0,0,0,1,0]),
    lambda f:setattr(f[1]['ds'],'PixelSpacing',[3,2]),
    lambda f:setattr(f[1]['ds'],'Rows',7),
    lambda f:setattr(f[1]['ds'],'ImagePositionPatient',[50,40,33.9]),
    lambda f:setattr(f[1]['ds'],'ImagePositionPatient',[55,40,33.6]),
    lambda f:delattr(f[1]['ds'],'ImagePositionPatient'),
]
for change in changes:
    invalid=[frame(i) for i in range(3)]
    change(invalid)
    try:
        module.geometry(invalid)
    except module.ReviewError:
        pass
    else:
        raise AssertionError('Invalid geometry accepted')
print({'syntheticObliqueIndexMapping':'passed','columnRowSpacingOrder':'passed','sliceSorting':'passed','lpsToRas':'passed','invalidGeometryRejected':len(changes),'clinicalApproval':False})

parser=argparse.ArgumentParser()
parser.add_argument('--packet',help='Optional PRIVATE packet directory; never uploads data')
args=parser.parse_args()
if args.packet:
    packet=Path(args.packet).resolve(strict=True)
    manifest=json.loads((packet/'MRI_STACK_MANIFEST.json').read_text(encoding='utf-8'))
    assert manifest['schema']=='vm-private-mr-stack/1' and manifest['modality']=='MR'
    assert all(manifest[k] is False for k in ['privacyApproved','clinicalApproved','publicationEligible'])
    assert manifest['atlasRegistration'] is None
    count=manifest['dataShapeColumnsRowsSlices'][2]
    expected={'native-mr-stack.nii.gz'} | {f'native-plane-{i:03d}.png' for i in {count//4,count//2,3*count//4}}
    assert len(manifest['files'])==len(expected) and {f['name'] for f in manifest['files']}==expected
    for entry in manifest['files']:
        path=packet/entry['name']
        assert path.resolve().parent==packet and not path.is_symlink()
        assert path.stat().st_size==entry['bytes'] and module.file_sha(path)==entry['sha256']
    nifti=module.nib.load(packet/'native-mr-stack.nii.gz')
    data=np.asanyarray(nifti.dataobj)
    assert list(data.shape)==manifest['dataShapeColumnsRowsSlices'] and str(data.dtype)==manifest['scalarType']
    assert [int(data.min()),int(data.max())]==manifest['rawRange']
    assert int(nifti.header['sform_code'])==1 and int(nifti.header['qform_code'])==0
    assert nifti.header.get_xyzt_units()[0]=='mm'
    np.testing.assert_allclose(nifti.affine,manifest['affineVoxelToRasMm'],rtol=0,atol=1e-5)
    lps=np.diag([-1,-1,1,1]) @ nifti.affine
    np.testing.assert_allclose(lps,manifest['affineVoxelToLpsMm'],rtol=0,atol=1e-5)
    origins=(lps @ np.array([[0,0,k,1] for k in range(count)]).T).T[:,:3]
    assert np.max(np.linalg.norm(origins-np.asarray(manifest['positionsLpsMm']),axis=1))<.01
    assert len(manifest['frames'])==count
    for k,frame_record in enumerate(manifest['frames']):
        assert frame_record['index']==k
        pixels=data[:,:,k].T
        encoded=pixels.astype(pixels.dtype.newbyteorder('<'),copy=False).tobytes()
        assert module.sha(encoded)==frame_record['decodedPixelSha256']
    print({'packetHashes':'passed','nativeFramePixelHashes':count,'lpsRasGeometry':'passed','publicationEligible':False})
