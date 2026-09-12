"""Convert a verified PRIVATE vm-private-mr-stack/1 packet to native .vmmr.

Local files only. No DICOM processing, resampling, metadata copying, approval or upload.
Uses existing NiBabel/NumPy; no installation. Never write patient packets into this repo.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import sys
import nibabel as nib
import numpy as np

def require(value):
    if not value:
        raise ValueError('Unsupported or changed private MRI packet')

def sha(data):
    return hashlib.sha256(data).hexdigest()

def pack(source, target):
    root=Path(__file__).resolve().parents[1]
    source=source.resolve(strict=True)
    target=target.resolve()
    require(not source.is_relative_to(root) and not target.is_relative_to(root))
    require(not any((p/'.git').exists() for p in target.parents))
    require(target.suffix=='.vmmr' and not target.exists() and target.parent.is_dir())
    manifest=json.loads((source/'MRI_STACK_MANIFEST.json').read_text(encoding='utf-8'))
    require(manifest['schema']=='vm-private-mr-stack/1' and manifest['modality']=='MR')
    require(all(manifest[k] is False for k in ['privacyApproved','clinicalApproved','publicationEligible','rescaleApplied','resampleApplied']))
    require(manifest['atlasRegistration'] is None)
    records=[r for r in manifest['files'] if r['name']=='native-mr-stack.nii.gz']
    require(len(records)==1)
    volume=source/'native-mr-stack.nii.gz'
    require(not volume.is_symlink() and volume.stat().st_size==records[0]['bytes'] and sha(volume.read_bytes())==records[0]['sha256'])
    image=nib.load(volume)
    require(len(image.shape)==3 and list(image.shape)==manifest['dataShapeColumnsRowsSlices'])
    require(all(1 <= n <= (512 if i==2 else 2048) for i,n in enumerate(image.shape)) and image.shape[2]>=2)
    require(np.prod(image.shape)*2 < 128*1024*1024-131088)
    require(image.header.get_xyzt_units()[0]=='mm' and int(image.header['sform_code'])==1 and int(image.header['qform_code'])==0)
    data=np.asanyarray(image.dataobj)
    require(str(data.dtype) in ['uint16','int16'] and str(data.dtype)==manifest['scalarType'])
    require([int(data.min()),int(data.max())]==manifest['rawRange'] and data.max()>data.min())
    lps=np.asarray(manifest['affineVoxelToLpsMm'],dtype=float)
    require(lps.shape==(4,4) and np.isfinite(lps).all())
    require(np.allclose(np.diag([-1,-1,1,1]) @ image.affine,lps,rtol=0,atol=1e-5))
    spacing=np.linalg.norm(lps[:3,:2],axis=0)
    require(np.all(spacing>=.001) and np.all(spacing<=100))
    directions=(lps[:3,:2]/spacing).T
    require(abs(np.dot(directions[0],directions[1]))<1e-5)
    positions=np.asarray(manifest['positionsLpsMm'],dtype=float)
    require(positions.shape==(data.shape[2],3) and np.isfinite(positions).all())
    origins=(lps @ np.array([[0,0,k,1] for k in range(data.shape[2])]).T).T[:,:3]
    require(np.max(np.linalg.norm(origins-positions,axis=1))<.01)
    normal=np.cross(directions[0],directions[1])
    deltas=np.diff(positions,axis=0)
    gaps=deltas @ normal
    require(np.all(gaps>.001) and np.all(gaps<=100) and np.max(np.abs(gaps-np.mean(gaps)))<=.01)
    require(np.max(np.linalg.norm(deltas-gaps[:,None]*normal,axis=1))<=.01)
    require(0 < manifest['nominalSliceThicknessMm'] <= 100)
    require(len(manifest['frames'])==data.shape[2])
    for k,frame in enumerate(manifest['frames']):
        require(frame['index']==k)
        pixels=data[:,:,k].T.astype(data.dtype.newbyteorder('<'),copy=False).tobytes()
        require(sha(pixels)==frame['decodedPixelSha256'])
    low,high=manifest['previewWindow']['low'],manifest['previewWindow']['high']
    require(np.isfinite([low,high]).all() and -65536 <= low < high <= 131072)
    body=data.astype(data.dtype.newbyteorder('<'),copy=False).tobytes(order='F')
    header={'schema':'vm-native-mr/1','release':'NOT_FOR_PUBLICATION','modality':'MR',
        'privacyCertified':False,'clinicalApproved':False,'atlasRegistration':None,
        'units':'stored-MR-signal','order':'column-row-slice','scalarType':str(data.dtype),
        'dimensions':list(data.shape),'spacing':spacing.tolist(),'directions':directions.tolist(),
        'positions':positions.tolist(),'thickness':manifest['nominalSliceThicknessMm'],
        'window':[low,high],'sourceSha256':records[0]['sha256'],'bodySha256':sha(body)}
    encoded=json.dumps(header,separators=(',',':'),allow_nan=False).encode('utf-8')
    require(len(encoded)<=131072)
    prefix=b'VMMR0001'+struct.pack('<II',len(encoded),len(body))+encoded
    packet=prefix+b'\0'*((-len(prefix))%8)+body
    require(len(packet)<=128*1024*1024)
    with target.open('xb') as stream:
        stream.write(packet)
    require(sha(target.read_bytes())==sha(packet))
    print(json.dumps({'status':'prepared-local-only','slices':data.shape[2],'bytes':len(packet),'sha256':sha(packet),'publicationEligible':False}))

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--packet',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    try:
        pack(args.packet,args.output)
    except Exception:
        print(json.dumps({'status':'failed','message':'Private MRI packaging failed; no publication approval granted'}))
        sys.exit(1)
