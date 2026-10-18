import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {build} from 'esbuild';

const targets = [
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-first-thoracic-vertebra",
    "fmaId": "FMA10458",
    "lessonSha256": "bfe09e56097035f0c0bd96a76f2e5dd84e554d30a736a39b50125b7b6f1b5f10",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of first thoracic vertebra · MRI orientation · draft",
      "body": "Trace a thoracic disc relative to the vertebral endplates and spinal canal. Evaluate its signal and any relation to neural structures on actual MR images.",
      "bullets": [
        "A bright or dark atlas material does not reproduce T1, T2 or fluid-sensitive disc appearance.",
        "There are no separate annular tears, nucleus surfaces or validated thoracic nerve roots in this source selection.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://www.radiologyinfo.org/en/info/spinemr",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-second-thoracic-vertebra",
    "fmaId": "FMA13495",
    "lessonSha256": "77dcef1f1b2c192e9e11f4ed0926dd769c8fb7f8ad884c78acbcbc7e6b0628e4",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of second thoracic vertebra · MRI orientation · draft",
      "body": "Trace a thoracic disc relative to the vertebral endplates and spinal canal. Evaluate its signal and any relation to neural structures on actual MR images.",
      "bullets": [
        "A bright or dark atlas material does not reproduce T1, T2 or fluid-sensitive disc appearance.",
        "There are no separate annular tears, nucleus surfaces or validated thoracic nerve roots in this source selection.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://www.radiologyinfo.org/en/info/spinemr",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-third-thoracic-vertebra",
    "fmaId": "FMA13500",
    "lessonSha256": "03f5ef071500556f09f3a26fdfb06db30569b3e8bad3c67dd8c7f34ffbedebfe",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of third thoracic vertebra · MRI orientation · draft",
      "body": "Trace a thoracic disc relative to the vertebral endplates and spinal canal. Evaluate its signal and any relation to neural structures on actual MR images.",
      "bullets": [
        "A bright or dark atlas material does not reproduce T1, T2 or fluid-sensitive disc appearance.",
        "There are no separate annular tears, nucleus surfaces or validated thoracic nerve roots in this source selection.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://www.radiologyinfo.org/en/info/spinemr",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-fourth-thoracic-vertebra",
    "fmaId": "FMA13501",
    "lessonSha256": "a7969883a2db078910d4dbe4dc06df490be0fbf54c04509c61eac0b480fe9e15",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of fourth thoracic vertebra · MRI orientation · draft",
      "body": "Trace a thoracic disc relative to the vertebral endplates and spinal canal. Evaluate its signal and any relation to neural structures on actual MR images.",
      "bullets": [
        "A bright or dark atlas material does not reproduce T1, T2 or fluid-sensitive disc appearance.",
        "There are no separate annular tears, nucleus surfaces or validated thoracic nerve roots in this source selection.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://www.radiologyinfo.org/en/info/spinemr",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-fifth-thoracic-vertebra",
    "fmaId": "FMA13502",
    "lessonSha256": "dd4d7882286308d164e3ee9ec5c08a4602336abbfa4e889082af4079f2636f5c",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of fifth thoracic vertebra · MRI orientation · draft",
      "body": "Trace a thoracic disc relative to the vertebral endplates and spinal canal. Evaluate its signal and any relation to neural structures on actual MR images.",
      "bullets": [
        "A bright or dark atlas material does not reproduce T1, T2 or fluid-sensitive disc appearance.",
        "There are no separate annular tears, nucleus surfaces or validated thoracic nerve roots in this source selection.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://www.radiologyinfo.org/en/info/spinemr",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-sixth-thoracic-vertebra",
    "fmaId": "FMA13503",
    "lessonSha256": "797dc253776f3169d5d17ff5bb65e5b8c4559282f2903d000e4618a2c2aaaf20",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of sixth thoracic vertebra · MRI orientation · draft",
      "body": "Trace a thoracic disc relative to the vertebral endplates and spinal canal. Evaluate its signal and any relation to neural structures on actual MR images.",
      "bullets": [
        "A bright or dark atlas material does not reproduce T1, T2 or fluid-sensitive disc appearance.",
        "There are no separate annular tears, nucleus surfaces or validated thoracic nerve roots in this source selection.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://www.radiologyinfo.org/en/info/spinemr",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-seventh-thoracic-vertebra",
    "fmaId": "FMA13504",
    "lessonSha256": "5c6e997a7374c2a0b147398d143f886c5240a3b1886c387c6b3ab6d230c565da",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of seventh thoracic vertebra · MRI orientation · draft",
      "body": "Trace a thoracic disc relative to the vertebral endplates and spinal canal. Evaluate its signal and any relation to neural structures on actual MR images.",
      "bullets": [
        "A bright or dark atlas material does not reproduce T1, T2 or fluid-sensitive disc appearance.",
        "There are no separate annular tears, nucleus surfaces or validated thoracic nerve roots in this source selection.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://www.radiologyinfo.org/en/info/spinemr",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-eighth-thoracic-vertebra",
    "fmaId": "FMA13505",
    "lessonSha256": "36a5e94484f0d5ed6fcee63a6d4c090ede241aad937d2cc7834becd5a25caeb5",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of eighth thoracic vertebra · MRI orientation · draft",
      "body": "Trace a thoracic disc relative to the vertebral endplates and spinal canal. Evaluate its signal and any relation to neural structures on actual MR images.",
      "bullets": [
        "A bright or dark atlas material does not reproduce T1, T2 or fluid-sensitive disc appearance.",
        "There are no separate annular tears, nucleus surfaces or validated thoracic nerve roots in this source selection.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://www.radiologyinfo.org/en/info/spinemr",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-ninth-thoracic-vertebra",
    "fmaId": "FMA13506",
    "lessonSha256": "640065c179afde1d7489ca46851fb67fdaeaa84d588f11e587af4a3925baa723",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of ninth thoracic vertebra · MRI orientation · draft",
      "body": "Trace a thoracic disc relative to the vertebral endplates and spinal canal. Evaluate its signal and any relation to neural structures on actual MR images.",
      "bullets": [
        "A bright or dark atlas material does not reproduce T1, T2 or fluid-sensitive disc appearance.",
        "There are no separate annular tears, nucleus surfaces or validated thoracic nerve roots in this source selection.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://www.radiologyinfo.org/en/info/spinemr",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-tenth-thoracic-vertebra",
    "fmaId": "FMA13507",
    "lessonSha256": "37912d7b06d5cce33c2735aa361b86ebb637681d31a22bd9c817baa24911460a",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of tenth thoracic vertebra · MRI orientation · draft",
      "body": "Trace a thoracic disc relative to the vertebral endplates and spinal canal. Evaluate its signal and any relation to neural structures on actual MR images.",
      "bullets": [
        "A bright or dark atlas material does not reproduce T1, T2 or fluid-sensitive disc appearance.",
        "There are no separate annular tears, nucleus surfaces or validated thoracic nerve roots in this source selection.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://www.radiologyinfo.org/en/info/spinemr",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-eleventh-thoracic-vertebra",
    "fmaId": "FMA13508",
    "lessonSha256": "a96da3e7cc998a6d67c69d1d0b1957e956c2230af855ac7ca8c520fb49116366",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of eleventh thoracic vertebra · MRI orientation · draft",
      "body": "Trace a thoracic disc relative to the vertebral endplates and spinal canal. Evaluate its signal and any relation to neural structures on actual MR images.",
      "bullets": [
        "A bright or dark atlas material does not reproduce T1, T2 or fluid-sensitive disc appearance.",
        "There are no separate annular tears, nucleus surfaces or validated thoracic nerve roots in this source selection.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://www.radiologyinfo.org/en/info/spinemr",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/"
      ]
    }
  }
] as const;
const wire = (value:any):any => JSON.parse(JSON.stringify(value));
const sha = (value:any):string => createHash('sha256').update(JSON.stringify(wire(value))).digest('hex');

test('eleven imported thoracic MRI drafts retain exact teaching, source guards and review return links', {timeout:120000}, async () => {
  const compiled = await build({stdin:{contents:[
    "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {spineImagingLesson} from './atlas-review/lib/spine-imaging';",
    "export {reviewModelHref} from './lib/clinical-review-links';",
    "export {clinicalReviewReturn} from './lib/clinical-review-return';",
    "export {clinicalReviewEntries} from './atlas-review/lib/clinical-review-index';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
  const api = await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  for (const target of targets) {
    const material = await api.bodyReviewMaterial(target.id);
    assert(material); assert.equal(material.approval,false); assert.equal(material.status,'worksheet-not-submitted');
    const structure=material.source.structure; assert.equal(structure.fmaId,target.fmaId);
    const lesson=api.bodyLesson(structure,'mri'); assert.equal(sha(lesson),target.lessonSha256); assert.equal(lesson.readiness,'draft');
    assert(lesson.citations.includes('https://accreditationsupport.acr.org/support/solutions/articles/11000061020-mri-exam-specific-parameters-spine-module-revised-5-10-2022-'));
    assert.deepEqual(api.spineImagingLesson(structure,'mri'),lesson);
    const {readiness:_readiness,...shown}=lesson; assert.deepEqual(api.bodyContent(structure,'mri'),shown);
    assert.deepEqual(material.topics.find((x:any)=>x.tab==='mri'),{tab:'mri',...lesson});
    assert.deepEqual(await api.parseBodyReviewResponse(wire(material),target.id),wire(material));
    for(const kind of ['old-lesson','prose','source']) {
      const altered=wire(material);
      if(kind==='old-lesson')altered.topics=altered.topics.map((x:any)=>x.tab==='mri'?{tab:'mri',...target.oldLesson}:x);
      else if(kind==='prose')altered.topics.find((x:any)=>x.tab==='mri').body+=' foreign';
      else altered.source.structure.name+=' foreign';
      assert.equal(await api.parseBodyReviewResponse(altered,target.id),null,kind);
    }
    assert.equal(api.spineImagingLesson({...structure,name:structure.name+' foreign'},'mri'),undefined);
    const source=new URL(material.atlasLink,'https://review.test'),model=new URL(api.reviewModelHref(material.atlasLink),'https://review.test');
    assert.equal(model.pathname,'/workspace/atlas-review/model');
    for(const [key,value] of source.searchParams)assert.equal(model.searchParams.get(key),value);
    const entry=api.clinicalReviewEntries.find((x:any)=>x.scope==='body'&&x.id===target.id); assert(entry);
    const params=Object.fromEntries(model.searchParams);
    assert.deepEqual(await api.clinicalReviewReturn(params),{href:entry.href,name:entry.name});
    assert.deepEqual(await api.clinicalReviewReturn({...params,source:'0'.repeat(64)}),{href:'/workspace/atlas-review',name:null});
  }
});
