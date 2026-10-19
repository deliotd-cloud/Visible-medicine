import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {build} from 'esbuild';

const targets = [
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-first-lumbar-vertebra",
    "fmaId": "FMA16033",
    "lessonSha256": "d2c757f748baa820afee27f60a7a88f6d042b48dfabe25cce73f372f0f23818b"
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-second-lumbar-vertebra",
    "fmaId": "FMA16034",
    "lessonSha256": "c9a55cb4958e917026c00c503647ab27c0a1a48497d13b59191248e9744dd282"
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-third-lumbar-vertebra",
    "fmaId": "FMA16035",
    "lessonSha256": "7d98464de1e66d6afae423a2facfff79847163ab5960608c22cfe0d0c6bc57e8"
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-fourth-lumbar-vertebra",
    "fmaId": "FMA16036",
    "lessonSha256": "4ca6c5c0c649d6d78705e18631a7f2f87235a92c9109642f71945c4f50d6b89a"
  },
  {
    "id": "vm:anatomy:body:spine:midline:cartilage:intervertebral-disk-of-fifth-lumbar-vertebra",
    "fmaId": "FMA16037",
    "lessonSha256": "f9a745bbf6a22bd7cb891a4d65e000a7fcce4d157938adc0d20573b35e2426ae"
  }
] as const;
const reading = "https://radiology.queensu.ca/source/Lumbar_Disc_Nomenclature.pdf";
const wire = (value: any): any => JSON.parse(JSON.stringify(value));
const jsonSha = (value: any): string => createHash('sha256').update(JSON.stringify(wire(value))).digest('hex');

test('five imported lumbar MRI drafts remain source-bound across learner, Review and return navigation', {timeout:120000}, async () => {
  const result = await build({stdin:{contents:[
    "export {bodyReviewMaterial,bodyReviewSnapshot,bodyReviewSummaries} from './atlas-review/lib/body-review-material';",
    "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
    "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
    "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
    "export {spineImagingLesson} from './atlas-review/lib/spine-imaging';",
    "export {reviewModelHref} from './lib/clinical-review-links';",
    "export {clinicalReviewReturn} from './lib/clinical-review-return';",
    "export {clinicalReviewEntries} from './atlas-review/lib/clinical-review-index';"
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
  const api = await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  assert.equal(api.bodyReviewSummaries.length,1104);
  for (const target of targets) {
    const material = await api.bodyReviewMaterial(target.id);
    const snapshot = api.bodyReviewSnapshot(target.id);
    assert(material && snapshot);
    const structure = material.source.structure;
    assert.equal(structure.id,target.id);
    assert.equal(structure.fmaId,target.fmaId);
    const lesson = api.bodyLesson(structure,'mri');
    assert.equal(jsonSha(lesson),target.lessonSha256,'Exact recorded MRI revision');
    const {readiness:_readiness,...shown} = lesson;
    assert.deepEqual(api.bodyContent(structure,'mri'),shown);
    assert.deepEqual(api.spineImagingLesson(structure,'mri'),lesson);
    assert.equal(lesson.readiness,'draft');
    assert(lesson.citations.includes(reading));
    assert(lesson.note.includes('No patient images'));
    assert.deepEqual(snapshot.topics.find((row:any)=>row.tab==='mri'),{tab:'mri',...lesson});
    assert.deepEqual(material.topics.find((row:any)=>row.tab==='mri'),{tab:'mri',...lesson});
    assert.equal(material.status,'worksheet-not-submitted');
    assert.equal(material.approval,false);
    assert.equal((await api.bodyReviewContext(target.id)).revisions.imaging,null);
    assert.deepEqual(await api.parseBodyReviewResponse(wire(material),target.id),wire(material));
    for (const kind of ['prose','reference','source']) {
      const altered=wire(material), topic=altered.topics.find((row:any)=>row.tab==='mri');
      if(kind==='prose')topic.body+=' foreign';
      else if(kind==='reference')topic.citations[0]+='?foreign=1';
      else altered.source.structure.name+=' foreign';
      assert.equal(await api.parseBodyReviewResponse(altered,target.id),null,kind);
    }
    assert.equal(api.spineImagingLesson({...structure,name:structure.name+' foreign'},'mri'),undefined,
      'A matching FMA ID is not a substitute for exact source identity');
    const source = new URL(material.atlasLink,'https://review.test');
    const model = new URL(api.reviewModelHref(material.atlasLink),'https://review.test');
    assert.equal(model.pathname,'/workspace/atlas-review/model');
    for(const [key,value] of source.searchParams)assert.equal(model.searchParams.get(key),value);
    assert.equal(source.searchParams.get('structure'),target.id);
    assert.match(source.searchParams.get('source')??'',/^[a-f0-9]{64}$/);
    const entry=api.clinicalReviewEntries.find((row:any)=>row.scope==='body'&&row.id===target.id);
    assert(entry);
    const params=Object.fromEntries(model.searchParams);
    assert.deepEqual(await api.clinicalReviewReturn(params),{href:entry.href,name:entry.name});
    assert.deepEqual(await api.clinicalReviewReturn({...params,source:'0'.repeat(64)}),
      {href:'/workspace/atlas-review',name:null});
  }
});
