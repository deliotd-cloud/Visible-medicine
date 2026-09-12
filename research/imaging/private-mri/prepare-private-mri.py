"""Prepare one source-pinned native MR stack for LOCAL review, never publication.

No extraction of DICOM files, source edits, inference, resampling or atlas registration.
Original integer samples are retained. MRI intensities are not Hounsfield units.
Use the existing imaging Python environment; no installation or paid runtime.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import sys
import zipfile

import nibabel as nib
import numpy as np
import pydicom
from PIL import Image


class ReviewError(Exception):
    """Only fixed, non-identifying messages may be exposed to logs."""


def require(condition, message):
    if not condition:
        raise ReviewError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def file_sha(path):
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def vector(ds, name, size):
    result = np.asarray(getattr(ds, name, []), dtype=float)
    require(result.shape == (size,) and np.isfinite(result).all(), 'Missing/non-finite geometry')
    return result


def geometry(frames):
    require(2 <= len(frames) <= 512, 'Unsupported frame count')
    first = frames[0]['ds']
    orient = vector(first, 'ImageOrientationPatient', 6)
    spacing = vector(first, 'PixelSpacing', 2)
    require((spacing > 0).all(), 'Non-positive pixel spacing')
    row, col = orient[:3], orient[3:]
    require(abs(np.dot(row,col)) < 1e-5 and abs(np.linalg.norm(row)-1) < 1e-5 and abs(np.linalg.norm(col)-1) < 1e-5, 'Non-orthonormal orientation')
    normal = np.cross(row,col)
    normal /= np.linalg.norm(normal)
    positions=[]
    for frame in frames:
        ds=frame['ds']
        require(np.allclose(vector(ds,'ImageOrientationPatient',6),orient,atol=1e-6,rtol=0), 'Mixed orientations')
        require(np.allclose(vector(ds,'PixelSpacing',2),spacing,atol=1e-6,rtol=0), 'Mixed pixel spacing')
        require((int(ds.Rows),int(ds.Columns)) == (int(first.Rows),int(first.Columns)), 'Mixed dimensions')
        positions.append(vector(ds,'ImagePositionPatient',3))
    order=np.argsort(np.asarray(positions) @ normal)
    frames=[frames[int(i)] for i in order]
    positions=np.asarray(positions)[order]
    gaps=np.diff(positions @ normal)
    require(np.all(gaps > .001), 'Repeated/reversed positions')
    step=(positions[-1]-positions[0])/(len(frames)-1)
    residual=positions-(positions[0]+np.arange(len(frames))[:,None]*step)
    max_residual=float(np.linalg.norm(residual,axis=1).max())
    require(max_residual < .01, 'Nonuniform positions require a different import path')
    require(np.linalg.norm(step-np.dot(step,normal)*normal) < .01, 'Gantry shear requires explicit review')
    affine=np.eye(4)
    # DICOM i=column, j=row. PixelSpacing is [row spacing, column spacing].
    affine[:3,0]=row*spacing[1]
    affine[:3,1]=col*spacing[0]
    affine[:3,2]=step
    affine[:3,3]=positions[0]
    require(abs(np.linalg.det(affine[:3,:3])) > 1e-8, 'Singular affine')
    return frames, affine, positions, max_residual, float(np.median(gaps))


def prepare(args):
    intake=Path(args.intake).resolve(strict=True)
    source_manifest=json.loads((intake/'LOCAL-ONLY-source-manifest.json').read_text())
    inventory=json.loads((intake/'inventory.json').read_text())
    match=[c for c in source_manifest if c['case']==args.case]
    require(len(match)==1,'Case alias not unique')
    case=match[0]
    series_hashes=[key for key,value in case['seriesUidSha256ToAlias'].items() if value==args.series]
    require(len(series_hashes)==1,'Series alias not unique')
    source=Path(case['archivePath']).resolve(strict=True)
    require(source.parent==Path('D:/Cases').resolve(strict=True) and source.suffix.lower()=='.zip', 'Source outside approved case folder')
    before=source.stat()
    require(file_sha(source)==case['archiveSha256'],'Source archive changed since intake')
    expected=next(c for c in inventory['cases'] if c['case']==args.case)
    expected=next(s for s in expected['series'] if s['series']==args.series)
    require(expected['modalities']==['MR'] and not expected['localizer'], 'Not an MR stack candidate')
    frames=[]
    with zipfile.ZipFile(source) as archive:
        for member in archive.infolist():
            if member.is_dir() or not member.filename.lower().endswith('.dcm'):
                continue
            require(not member.flag_bits & 1 and member.file_size <= 64*1024*1024,'Unsupported ZIP member')
            raw=archive.read(member)  # ZipFile verifies CRC; nothing is extracted.
            header=pydicom.dcmread(io.BytesIO(raw),stop_before_pixels=True,specific_tags=['SeriesInstanceUID'])
            if sha(str(getattr(header,'SeriesInstanceUID','')).encode()) != series_hashes[0]:
                continue
            ds=pydicom.dcmread(io.BytesIO(raw))
            require(ds.Modality=='MR' and str(ds.SOPClassUID)=='1.2.840.10008.5.1.4.1.1.4','Only classic MR Image Storage is supported')
            require(int(getattr(ds,'NumberOfFrames',1))==1 and int(ds.SamplesPerPixel)==1 and ds.PhotometricInterpretation=='MONOCHROME2','Unsupported pixel layout')
            require(str(getattr(ds,'LossyImageCompression','00'))=='00','Lossy source held')
            require(str(getattr(ds,'AnatomicalOrientationType','BIPED'))=='BIPED','Non-biped coordinates held')
            require(not any(x in str(getattr(ds,'ImageType','')).upper() for x in ['LOCALIZER','SCOUT']),'Localizer held')
            require(not any(hasattr(ds,key) for key in ['ModalityLUTSequence','RealWorldValueMappingSequence','FloatPixelData','DoubleFloatPixelData']),'Additional intensity mapping needs dedicated handling')
            require(str(ds.file_meta.TransferSyntaxUID)=='1.2.840.10008.1.2.4.90','Pilot pins JPEG2000 lossless only')
            require(int(ds.BitsAllocated)==16 and 1<=int(ds.BitsStored)<=16 and int(ds.HighBit)==int(ds.BitsStored)-1,'Unsupported stored-bit layout')
            ds.pixel_array_options(decoding_plugin='gdcm', raw=True)
            pixels=ds.pixel_array
            require(pixels.shape==(int(ds.Rows),int(ds.Columns)) and pixels.dtype.kind in 'iu' and pixels.dtype.itemsize==2,'Unexpected decoded samples')
            frames.append({'ds':ds,'pixels':pixels,'sourceSha256':sha(raw),'pixelSha256':sha(pixels.astype(pixels.dtype.newbyteorder('<'),copy=False).tobytes())})
    require(len(frames)==expected['instances'],'Series instance count changed')
    require(len({str(f['ds'].SOPInstanceUID) for f in frames})==len(frames),'Repeated SOP instances')
    for key in ['StudyInstanceUID','SeriesInstanceUID','FrameOfReferenceUID']:
        values={str(getattr(f['ds'],key,'')) for f in frames}
        require(len(values)==1 and '' not in values,'Missing/mixed study reference')
    require(len({str(f['pixels'].dtype) for f in frames})==1,'Mixed scalar types')
    frames,lps,positions,residual,step=geometry(frames)
    slopes=[float(getattr(f['ds'],'RescaleSlope',1)) for f in frames]
    intercepts=[float(getattr(f['ds'],'RescaleIntercept',0)) for f in frames]
    require(np.isfinite(slopes+intercepts).all() and all(v!=0 for v in slopes),'Invalid rescale mapping')
    # Preserve original stored samples; nonidentity scaling requires a different exporter.
    require(all(v==1 for v in slopes) and all(v==0 for v in intercepts),'Nonidentity rescale held, never ignored')
    data=np.stack([f['pixels'].T for f in frames],axis=2)
    ras=np.diag([-1.,-1.,1.,1.]) @ lps
    thickness=sorted({float(getattr(f['ds'],'SliceThickness',0)) for f in frames})
    require(len(thickness)==1 and np.isfinite(thickness[0]) and thickness[0]>0,'Unknown/mixed nominal thickness')
    require(source.stat().st_size==before.st_size and source.stat().st_mtime_ns==before.st_mtime_ns and file_sha(source)==case['archiveSha256'],'Source changed during read')
    result={'schema':'vm-private-mr-stack/1','caseAlias':args.case,'seriesAlias':args.series,
        'sourceArchiveSha256':case['archiveSha256'],'seriesUidSha256':series_hashes[0],
        'modality':'MR','sequenceLabel':'unclassified; radiologist review required',
        'privacyApproved':False,'clinicalApproved':False,'publicationEligible':False,'atlasRegistration':None,
        'dataShapeColumnsRowsSlices':list(data.shape),'scalarType':str(data.dtype),'intensityUnits':'stored MR signal; not HU or calibrated quantitative units',
        'rawRange':[int(data.min()),int(data.max())],'rescaleApplied':False,'resampleApplied':False,
        'affineVoxelToLpsMm':lps.tolist(),'affineVoxelToRasMm':ras.tolist(),
        'positionsLpsMm':positions.tolist(),'maxAffinePositionResidualMm':residual,
        'centreSpacingMm':step,'nominalSliceThicknessMm':thickness[0],
        'nominalIntersliceGapMm':max(0.,step-thickness[0]),
        'gapPolicy':'Native planes only. No interpolation across acquisition gaps; not isotropic or complete tissue sampling.',
        'decoder':{'pydicom':pydicom.__version__,'plugin':'gdcm'},
        'frames':[{'index':i,'sourceSha256':f['sourceSha256'],'decodedPixelSha256':f['pixelSha256']} for i,f in enumerate(frames)],
        'limitations':['No source anonymisation certification; metadata stripping does not clear burned-in pixels.', 'No patient name, path, raw UID, private tag or free-text DICOM description copied to output metadata.', 'No segmentation, diagnostic interpretation, normality claim, matched CT/MRI identity or atlas transform.']}
    if args.check_only:
        print(json.dumps({k:result[k] for k in ['caseAlias','seriesAlias','dataShapeColumnsRowsSlices','rawRange','centreSpacingMm','nominalIntersliceGapMm','maxAffinePositionResidualMm','privacyApproved']}))
        return
    destination=Path(args.output).resolve()
    allowed=Path('D:/VisibleMedicine-Atlas-Recovery').resolve(strict=True)
    require(destination.parent==allowed,'Output must be a new direct private D recovery subdirectory')
    require(not destination.exists(),'Refusing to overwrite an existing review packet')
    destination.mkdir(parents=False)
    image=nib.Nifti1Image(data,ras)
    image.header.set_xyzt_units('mm')
    image.set_sform(ras,code=1)
    image.set_qform(None,code=0)  # Full sform retained; no silent shear removal.
    image.header['descrip']=b'Private MR review; stored signal; no atlas registration'
    volume=destination/'native-mr-stack.nii.gz'
    nib.save(image,volume)
    restored=nib.load(volume)
    require(np.array_equal(np.asanyarray(restored.dataobj),data),'NIfTI samples changed')
    corners=np.array([[x,y,k,1] for x in [0,data.shape[0]-1] for y in [0,data.shape[1]-1] for k in range(data.shape[2])])
    error=np.linalg.norm((restored.affine @ corners.T - ras @ corners.T)[:3],axis=0).max()
    require(error < .001,'NIfTI geometry precision insufficient')
    result['niftiCornerRoundTripMaxErrorMm']=float(error)
    result['niftiScalarRoundTripExact']=True
    # Review-only display mapping, never used to change the NIfTI samples.
    lo,hi=[float(v) for v in np.percentile(data,[1,99.5])]
    require(hi>lo,'Flat image requires different review window')
    result['previewWindow']={'low':lo,'high':hi,'method':'global percentiles 1/99.5; display only'}
    for i in sorted({len(frames)//4,len(frames)//2,3*len(frames)//4}):
        pixels=np.clip((frames[i]['pixels'].astype(float)-lo)/(hi-lo)*255,0,255).astype('uint8')
        Image.fromarray(pixels).save(destination/f'native-plane-{i:03d}.png')
    result['files']=[{'name':p.name,'bytes':p.stat().st_size,'sha256':file_sha(p)} for p in sorted(destination.iterdir())]
    # Completion marker last. A partial directory without it is never admitted.
    (destination/'MRI_STACK_MANIFEST.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'case':args.case,'series':args.series,'slices':len(frames),'volumeBytes':volume.stat().st_size,'samplesExact':True,'geometryRoundTripErrorMm':float(error),'publicationEligible':False}))


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--intake',required=True)
    parser.add_argument('--case',required=True)
    parser.add_argument('--series',required=True)
    parser.add_argument('--output')
    parser.add_argument('--check-only',action='store_true')
    args=parser.parse_args()
    if not args.check_only and not args.output:
        parser.error('--output is required unless --check-only')
    try:
        prepare(args)
    except Exception as error:
        # Do not print raw filenames, DICOM values, UIDs or exception payloads.
        print(json.dumps({'status':'failed','errorType':type(error).__name__,'detail':str(error) if isinstance(error,ReviewError) else 'Local import failed; no publication approval granted'}))
        sys.exit(1)
