import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {build} from 'esbuild';

const targets = [
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-axis",
    "fmaId": "FMA25058",
    "identity": {
      "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-axis",
      "fmaId": "FMA25058",
      "name": "Intervertebral disk of axis",
      "sourceName": "intervertebral disk of axis",
      "system": "connective",
      "category": "cartilage",
      "laterality": "midline",
      "region": "spine",
      "regions": [
        "spine",
        "head-neck"
      ],
      "bundle": "spine-connective-gaps",
      "nodeName": "FMA25058",
      "bounds": {
        "min": [
          -0.1344040036201477,
          6.414499282836914,
          0.19221298396587372
        ],
        "max": [
          0.11683999747037888,
          6.5093994140625,
          0.37253403663635254
        ]
      },
      "center": [
        -0.008782003074884415,
        6.461949348449707,
        0.28237351030111313
      ],
      "anchor": [
        -0.02172050066292286,
        6.480300426483154,
        0.29006898403167725
      ],
      "sourceTree": "isa",
      "sources": [
        {
          "file": "FJ3202",
          "sha256": "10b24dc45678b68734e84e2d10c749c5b53b4ed3c39c04d2052bdebc02301840"
        }
      ],
      "coverageNote": "Whole-disc source surface. Annulus, nucleus and endplates are not independently segmented. Source vertebral naming is retained; this is not a validated radiological level annotation. Recovered from the v4 source in its unchanged common coordinate frame. Independent anatomical review is pending.",
      "provenance": {
        "method": "licensed-source-mesh",
        "license": "CC-BY-4.0",
        "sourceVersion": "4.0",
        "recovered": true
      },
      "validation": {
        "status": "unvalidated",
        "anatomicalReview": false
      }
    },
    "lessonSha256": "a569f454e6f863994a7ef3cc6d08bfba56de2944a3c78ae0e21e54cb871375d7",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of axis · MRI orientation · draft",
      "body": "On real MRI, follow the cervical disc across sagittal and axial sections and relate its posterior margin to the canal and foramina.",
      "bullets": [
        "Disc signal and contour require sequence-specific assessment; this surface cannot establish degeneration, extrusion or cord involvement.",
        "Use the retained source name and independently confirm the patient level; a nearby landmark is not a registration.",
        "This source-labelled axis disc lies below C2; there is no C1–C2 intervertebral disc.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/",
        "https://www.radiologyinfo.org/en/info/spinemr"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-third-cervical-vertebra",
    "fmaId": "FMA13896",
    "identity": {
      "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-third-cervical-vertebra",
      "fmaId": "FMA13896",
      "name": "Intervertebral disk of third cervical vertebra",
      "sourceName": "intervertebral disk of third cervical vertebra",
      "system": "connective",
      "category": "cartilage",
      "laterality": "midline",
      "region": "spine",
      "regions": [
        "spine",
        "head-neck"
      ],
      "bundle": "spine-connective-gaps",
      "nodeName": "FMA13896",
      "bounds": {
        "min": [
          -0.1197109967470169,
          6.268899917602539,
          0.22661903500556946
        ],
        "max": [
          0.10661400109529495,
          6.330699443817139,
          0.38691002130508423
        ]
      },
      "center": [
        -0.006548497825860977,
        6.299799680709839,
        0.30676452815532684
      ],
      "anchor": [
        0.0048338198103010654,
        6.315899848937988,
        0.3078949749469757
      ],
      "sourceTree": "isa",
      "sources": [
        {
          "file": "FJ3213",
          "sha256": "1792fb233867a50a88c0b087391886dfb63f62eede857920736367c0d0c9e91d"
        }
      ],
      "coverageNote": "Whole-disc source surface. Annulus, nucleus and endplates are not independently segmented. Source vertebral naming is retained; this is not a validated radiological level annotation. Recovered from the v4 source in its unchanged common coordinate frame. Independent anatomical review is pending.",
      "provenance": {
        "method": "licensed-source-mesh",
        "license": "CC-BY-4.0",
        "sourceVersion": "4.0",
        "recovered": true
      },
      "validation": {
        "status": "unvalidated",
        "anatomicalReview": false
      }
    },
    "lessonSha256": "85952b1540f00baed5603a9cc91c75edbee521190c9c19cbd30b309b5b454d2b",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of third cervical vertebra · MRI orientation · draft",
      "body": "On real MRI, follow the cervical disc across sagittal and axial sections and relate its posterior margin to the canal and foramina.",
      "bullets": [
        "Disc signal and contour require sequence-specific assessment; this surface cannot establish degeneration, extrusion or cord involvement.",
        "Use the retained source name and independently confirm the patient level; a nearby landmark is not a registration.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/",
        "https://www.radiologyinfo.org/en/info/spinemr"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-fourth-cervical-vertebra",
    "fmaId": "FMA13897",
    "identity": {
      "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-fourth-cervical-vertebra",
      "fmaId": "FMA13897",
      "name": "Intervertebral disk of fourth cervical vertebra",
      "sourceName": "intervertebral disk of fourth cervical vertebra",
      "system": "connective",
      "category": "cartilage",
      "laterality": "midline",
      "region": "spine",
      "regions": [
        "spine",
        "head-neck"
      ],
      "bundle": "spine-connective-gaps",
      "nodeName": "FMA13897",
      "bounds": {
        "min": [
          -0.13390199840068817,
          6.087099552154541,
          0.24215202033519745
        ],
        "max": [
          0.12067300081253052,
          6.193299770355225,
          0.4128350019454956
        ]
      },
      "center": [
        -0.006614498794078827,
        6.140199661254883,
        0.3274935111403465
      ],
      "anchor": [
        -0.004538619890809059,
        6.158599853515625,
        0.33474501967430115
      ],
      "sourceTree": "isa",
      "sources": [
        {
          "file": "FJ3218",
          "sha256": "a1820438c3e0dd6361807a4a7380861df4134f48df2d869630e678ff71ec226d"
        }
      ],
      "coverageNote": "Whole-disc source surface. Annulus, nucleus and endplates are not independently segmented. Source vertebral naming is retained; this is not a validated radiological level annotation. Recovered from the v4 source in its unchanged common coordinate frame. Independent anatomical review is pending.",
      "provenance": {
        "method": "licensed-source-mesh",
        "license": "CC-BY-4.0",
        "sourceVersion": "4.0",
        "recovered": true
      },
      "validation": {
        "status": "unvalidated",
        "anatomicalReview": false
      }
    },
    "lessonSha256": "c4f6c850cdf31e15fa0f445d05eca4cb34af8d57591b4a28b6931a6981f820c6",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of fourth cervical vertebra · MRI orientation · draft",
      "body": "On real MRI, follow the cervical disc across sagittal and axial sections and relate its posterior margin to the canal and foramina.",
      "bullets": [
        "Disc signal and contour require sequence-specific assessment; this surface cannot establish degeneration, extrusion or cord involvement.",
        "Use the retained source name and independently confirm the patient level; a nearby landmark is not a registration.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/",
        "https://www.radiologyinfo.org/en/info/spinemr"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-fifth-cervical-vertebra",
    "fmaId": "FMA13898",
    "identity": {
      "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-fifth-cervical-vertebra",
      "fmaId": "FMA13898",
      "name": "Intervertebral disk of fifth cervical vertebra",
      "sourceName": "intervertebral disk of fifth cervical vertebra",
      "system": "connective",
      "category": "cartilage",
      "laterality": "midline",
      "region": "spine",
      "regions": [
        "spine",
        "head-neck"
      ],
      "bundle": "spine-connective-gaps",
      "nodeName": "FMA13898",
      "bounds": {
        "min": [
          -0.1480959951877594,
          5.925699234008789,
          0.25521400570869446
        ],
        "max": [
          0.13479000329971313,
          6.033299446105957,
          0.41979798674583435
        ]
      },
      "center": [
        -0.006652995944023132,
        5.979499340057373,
        0.3375059962272644
      ],
      "anchor": [
        -0.0017197600100189447,
        5.95989990234375,
        0.31486502289772034
      ],
      "sourceTree": "isa",
      "sources": [
        {
          "file": "FJ3219",
          "sha256": "9614a560acb98669f69bf67a15321e73495e7decf71fa4e4e3941fc494b443d4"
        }
      ],
      "coverageNote": "Whole-disc source surface. Annulus, nucleus and endplates are not independently segmented. Source vertebral naming is retained; this is not a validated radiological level annotation. Recovered from the v4 source in its unchanged common coordinate frame. Independent anatomical review is pending.",
      "provenance": {
        "method": "licensed-source-mesh",
        "license": "CC-BY-4.0",
        "sourceVersion": "4.0",
        "recovered": true
      },
      "validation": {
        "status": "unvalidated",
        "anatomicalReview": false
      }
    },
    "lessonSha256": "a0cea5b2d3f15069d6ea58667f600c75c98d863cc740501ba25e98255f3924ea",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of fifth cervical vertebra · MRI orientation · draft",
      "body": "On real MRI, follow the cervical disc across sagittal and axial sections and relate its posterior margin to the canal and foramina.",
      "bullets": [
        "Disc signal and contour require sequence-specific assessment; this surface cannot establish degeneration, extrusion or cord involvement.",
        "Use the retained source name and independently confirm the patient level; a nearby landmark is not a registration.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/",
        "https://www.radiologyinfo.org/en/info/spinemr"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-sixth-cervical-vertebra",
    "fmaId": "FMA13899",
    "identity": {
      "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-sixth-cervical-vertebra",
      "fmaId": "FMA13899",
      "name": "Intervertebral disk of sixth cervical vertebra",
      "sourceName": "intervertebral disk of sixth cervical vertebra",
      "system": "connective",
      "category": "cartilage",
      "laterality": "midline",
      "region": "spine",
      "regions": [
        "spine",
        "head-neck"
      ],
      "bundle": "spine-connective-gaps",
      "nodeName": "FMA13899",
      "bounds": {
        "min": [
          -0.1482599973678589,
          5.771800518035889,
          0.235229030251503
        ],
        "max": [
          0.1335499882698059,
          5.867499828338623,
          0.4030120074748993
        ]
      },
      "center": [
        -0.007355004549026489,
        5.819650173187256,
        0.31912051886320114
      ],
      "anchor": [
        -0.030222799628973007,
        5.799399375915527,
        0.3185559809207916
      ],
      "sourceTree": "isa",
      "sources": [
        {
          "file": "FJ3220",
          "sha256": "6aa2490d85cc76e1f9c29a4d187e36c54d3faa1091b42d1ebc54d45ae1d96194"
        }
      ],
      "coverageNote": "Whole-disc source surface. Annulus, nucleus and endplates are not independently segmented. Source vertebral naming is retained; this is not a validated radiological level annotation. Recovered from the v4 source in its unchanged common coordinate frame. Independent anatomical review is pending.",
      "provenance": {
        "method": "licensed-source-mesh",
        "license": "CC-BY-4.0",
        "sourceVersion": "4.0",
        "recovered": true
      },
      "validation": {
        "status": "unvalidated",
        "anatomicalReview": false
      }
    },
    "lessonSha256": "f66fa2442cd813a0d1d01fc101472a68dbe76c994a5e088ecaae9b612e0c2372",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of sixth cervical vertebra · MRI orientation · draft",
      "body": "On real MRI, follow the cervical disc across sagittal and axial sections and relate its posterior margin to the canal and foramina.",
      "bullets": [
        "Disc signal and contour require sequence-specific assessment; this surface cannot establish degeneration, extrusion or cord involvement.",
        "Use the retained source name and independently confirm the patient level; a nearby landmark is not a registration.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/",
        "https://www.radiologyinfo.org/en/info/spinemr"
      ]
    }
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-seventh-cervical-vertebra",
    "fmaId": "FMA13900",
    "identity": {
      "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-seventh-cervical-vertebra",
      "fmaId": "FMA13900",
      "name": "Intervertebral disk of seventh cervical vertebra",
      "sourceName": "intervertebral disk of seventh cervical vertebra",
      "system": "connective",
      "category": "cartilage",
      "laterality": "midline",
      "region": "spine",
      "regions": [
        "spine",
        "head-neck"
      ],
      "bundle": "spine-connective-gaps",
      "nodeName": "FMA13900",
      "bounds": {
        "min": [
          -0.16331200301647186,
          5.599999904632568,
          0.19775299727916718
        ],
        "max": [
          0.14938999712467194,
          5.716700553894043,
          0.37612298130989075
        ]
      },
      "center": [
        -0.006961002945899963,
        5.658350229263306,
        0.28693798929452896
      ],
      "anchor": [
        0.003953089937567711,
        5.680699348449707,
        0.2878810167312622
      ],
      "sourceTree": "isa",
      "sources": [
        {
          "file": "FJ3221",
          "sha256": "d76e5f07cea767b03ee7138fde4781a546f5bbb490de023b1992a5fa206d1322"
        }
      ],
      "coverageNote": "Whole-disc source surface. Annulus, nucleus and endplates are not independently segmented. Source vertebral naming is retained; this is not a validated radiological level annotation. Recovered from the v4 source in its unchanged common coordinate frame. Independent anatomical review is pending.",
      "provenance": {
        "method": "licensed-source-mesh",
        "license": "CC-BY-4.0",
        "sourceVersion": "4.0",
        "recovered": true
      },
      "validation": {
        "status": "unvalidated",
        "anatomicalReview": false
      }
    },
    "lessonSha256": "76fe755a7669dd731f0e916ceddda61d8fa05c179f3ffbc6ecb6b0df6b572a02",
    "oldLesson": {
      "readiness": "draft",
      "title": "Intervertebral disk of seventh cervical vertebra · MRI orientation · draft",
      "body": "On real MRI, follow the cervical disc across sagittal and axial sections and relate its posterior margin to the canal and foramina.",
      "bullets": [
        "Disc signal and contour require sequence-specific assessment; this surface cannot establish degeneration, extrusion or cord involvement.",
        "Use the retained source name and independently confirm the patient level; a nearby landmark is not a registration.",
        "Return separation to zero for source relationships. Explode and cutaway do not generate scan slices, tissue signal or measurements."
      ],
      "note": "Independent anatomy/radiology review pending. No patient images, measured pathology, scan registration or paid-lecture access. Confirm the actual patient, side, level and series orientation before comparison. Imaging choice depends on clinical assessment; this is not trauma clearance or treatment advice.",
      "citations": [
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/",
        "https://www.radiologyinfo.org/en/info/spinemr"
      ]
    }
  }
] as const;
const wire = (value:any):any => JSON.parse(JSON.stringify(value));
const sha = (value:any):string => createHash('sha256').update(JSON.stringify(wire(value))).digest('hex');

test('six imported cervical MRI drafts retain exact teaching, source guards and review return links', {timeout:120000}, async () => {
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
    const structure=material.source.structure; assert.equal(structure.fmaId,target.fmaId);assert.deepEqual(wire(structure),target.identity);
    const lesson=api.bodyLesson(structure,'mri'); assert.equal(sha(lesson),target.lessonSha256); assert.equal(lesson.readiness,'draft');
    const axisNote='This source-labelled axis disc lies below C2; there is no C1–C2 intervertebral disc.';
    assert.equal(lesson.bullets.includes(axisNote),target.fmaId==='FMA25058');
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
