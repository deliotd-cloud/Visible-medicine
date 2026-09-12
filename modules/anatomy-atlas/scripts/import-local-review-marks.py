"""Validate private atlas review JSON and write new Slicer fiducials, never masks.

No scene is opened and no acceptance or annotation revision is modified.
Use the original CT-head Python environment (NumPy and NiBabel already installed).
"""
import argparse
import json
from pathlib import Path
import numpy as np
from local_ct_checkpoint import REPO, CODE, digest, inside, read_json, load_checkpoint, mask_source, unchanged

SCHEMA = 'https://raw.githubusercontent.com/Slicer/Slicer/main/Modules/Loadable/Markups/Resources/Schema/markups-schema-v1.0.3.json#'

def validate_review(checkpoint, review, allow_drafts=()):
    expected = {'schema','release','approval','sourceAnnotationSha256','sourceCtSha256','coordinateSystem','marks'}
    if not isinstance(review,dict) or set(review) != expected or review['schema'] != 'vm-local-review/1' or review['release'] != 'NOT_FOR_PUBLICATION' or review['approval'] is not False or review['coordinateSystem'] != 'LPS-mm':
        raise ValueError('Unsupported review file; review marks are not approvals')
    if review['sourceAnnotationSha256'] != checkpoint['annotation_sha'] or review['sourceCtSha256'] != checkpoint['source']['reference_sha256']:
        raise ValueError('Review belongs to a different or stale source revision')
    marks = review['marks']
    if not isinstance(marks,list) or not 1 <= len(marks) <= 500:
        raise ValueError('Review needs 1 to 500 marks')
    if len(allow_drafts) != len(set(allow_drafts)) or any(not CODE.fullmatch(code) for code in allow_drafts):
        raise ValueError('Invalid explicit draft list')
    affine = np.diag([-1.,-1.,1.,1.]) @ checkpoint['image'].affine
    inverse = np.linalg.inv(affine)
    verified, groups, conflicts = {}, {}, []
    seen = {}
    for number, mark in enumerate(marks,1):
        if not isinstance(mark,dict) or set(mark) != {'structureId','maskSha256','action','lps'} or not isinstance(mark['action'],str) or mark['action'] not in {'include','exclude'}:
            raise ValueError('Unsupported correction mark')
        code = mark['structureId']
        if not isinstance(code,str) or not CODE.fullmatch(code):
            raise ValueError('Invalid structure ID')
        if code not in verified:
            verified[code] = mask_source(checkpoint,code,allow_drafts)
        entry, _, status = verified[code]
        if mark['maskSha256'] != entry['geometry']['sha256']:
            raise ValueError('Review mask fingerprint differs')
        point = mark['lps']
        if not isinstance(point,list) or len(point) != 3 or any(type(v) not in (int,float) or not np.isfinite(v) for v in point):
            raise ValueError('Invalid physical coordinate')
        index = (inverse @ [*point,1.])[:3]
        if np.any(index < -.5) or np.any(index >= np.array(checkpoint['image'].shape)-.5):
            raise ValueError('Review mark lies outside original CT')
        key = (code,mark['action'])
        group = groups.setdefault(key,{'code':code,'action':mark['action'],'status':status,
                                     'maskSha256':mark['maskSha256'],'points':[]})
        voxel = tuple(np.floor(index+.5).astype(int))
        prior = seen.setdefault((code,voxel),set())
        if prior and mark['action'] not in prior:
            conflicts.append(number)
        prior.add(mark['action'])
        group['points'].append({'id':str(number),'label':f'{mark["action"]} {number}',
            'description':f'{code}; {status}; REVIEW ONLY; mask SHA256 {mark["maskSha256"]}',
            'position':point.copy(),'orientation':[1,0,0,0,1,0,0,0,1],
            'selected':True,'locked':True,'visibility':True,'positionStatus':'defined'})
    if set(allow_drafts) - {group['code'] for group in groups.values() if group['status']=='draft-unapproved'}:
        raise ValueError('Explicit draft ID not present in this review')
    unchanged(checkpoint)
    return list(groups.values()),conflicts

def markup_document(group):
    colour = [.2,.9,.45] if group['action']=='include' else [1.,.3,.3]
    return {'@schema':SCHEMA,'markups':[{'type':'Fiducial',
        'name':f'VM REVIEW {group["code"]} {group["action"]} {group["status"]}',
        'coordinateSystem':'LPS','coordinateUnits':'mm','locked':True,
        'fixedNumberOfControlPoints':True,'labelFormat':'%N-%d','controlPoints':group['points'],
        'display':{'visibility':True,'color':colour,'selectedColor':colour,'activeColor':colour,
            'pointLabelsVisibility':True,'propertiesLabelVisibility':False,'glyphScale':1.5,
            'textScale':1.5,'opacity':1.,'sliceProjection':False}}]}

def import_review(state_path, review_path, output_dir=None, allow_drafts=(), check_only=False):
    checkpoint = load_checkpoint(state_path)
    review_path = Path(review_path).resolve(strict=True)
    review_sha = digest(review_path)
    review = read_json(review_path,1024*1024)
    groups,conflicts = validate_review(checkpoint,review,allow_drafts)
    checkpoint['pins'].append((review_path,review_sha))
    report = {'schema':'vm-slicer-review-import/1','release':'NOT_FOR_PUBLICATION','approval':False,
        'sourceAnnotationSha256':checkpoint['annotation_sha'],'sourceCtSha256':checkpoint['source']['reference_sha256'],
        'reviewSha256':review_sha,'marks':len(review['marks']),'groups':len(groups),
        'draftStructures':sorted({g['code'] for g in groups if g['status']=='draft-unapproved'}),
        'conflictingMarkNumbers':conflicts,'sourceMasksChanged':False,'sceneOpened':False,'patientDataUploaded':False,
        'slicerRuntimeValidated':False,'files':[]}
    if check_only:
        unchanged(checkpoint)
        return report
    if output_dir is None:
        raise ValueError('A new private output directory is required')
    output = Path(output_dir).resolve()
    if output.exists() or inside(output,REPO) or inside(output,checkpoint['base']) or inside(review_path,output):
        raise ValueError('Use a new private directory outside source data and repository')
    documents = []
    for group in groups:
        name = f'{group["code"]}.{group["action"]}.mrk.json'
        content = json.dumps(markup_document(group),indent=2,allow_nan=False)+'\n'
        documents.append((name,content))
    unchanged(checkpoint)
    # A fresh directory and exclusive creation preserve all previous reviews and masks.
    output.mkdir(parents=True,exist_ok=False)
    for name,content in documents:
        target=output/name
        with target.open('x',encoding='utf-8',newline='\n') as stream:
            stream.write(content)
        report['files'].append({'file':name,'sha256':digest(target)})
    unchanged(checkpoint)
    with (output/'REVIEW_MANIFEST.json').open('x',encoding='utf-8') as stream:
        json.dump(report,stream,indent=2,allow_nan=False)
    with (output/'README.txt').open('x',encoding='utf-8') as stream:
        stream.write('PRIVATE REVIEW MARKS — NOT SEGMENTATIONS OR APPROVALS\n'
            'Open the original CT-head Slicer scene, verify its source revision against REVIEW_MANIFEST.json, '
            'then add these .mrk.json files using Add Data. Coordinates are LPS mm; do not flip them manually. '
            'Keep the point lists locked and edit a separate draft segmentation, never accepted source masks. '
            'Save the resulting review scene to a NEW private file. No scene or mask was changed by this converter. '
            'Conflicting include/exclude marks are preserved and listed in the manifest for human resolution. '
            'If REVIEW_MANIFEST.json is missing, treat this output as incomplete.\n')
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state',required=True,type=Path)
    parser.add_argument('--review',required=True,type=Path)
    parser.add_argument('--output-dir',type=Path)
    parser.add_argument('--allow-draft',action='append',default=[])
    parser.add_argument('--check-only',action='store_true')
    args=parser.parse_args()
    try:
        print(json.dumps(import_review(args.state,args.review,args.output_dir,args.allow_draft,args.check_only)))
    except (ValueError,KeyError,TypeError,OSError) as error:
        # Do not leak arbitrary source metadata or path values in diagnostic output.
        parser.exit(1,'Review import failed validation; original data was not modified.\n')
