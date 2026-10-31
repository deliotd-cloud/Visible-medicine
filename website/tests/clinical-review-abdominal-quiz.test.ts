import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from './review-component-test-build.ts';
import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';

test('six abdominal quizzes carry exact learner source, review identities and answer evidence',async()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 assert.equal(review.revision,CURRENT_ATLAS_REVISION);
 for(const path of ['content/abdominal-organ-quiz.ts','content/abdominal-organ-quiz-pins.json','lib/abdominal-organ-quiz.ts']) {
  const file=review.files.find((f:any)=>f.path===path);assert(file);
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
  assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);
 }
 const result=await build({stdin:{contents:`
  import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
  import {BodyReviewDetails} from './atlas-review/app/review/body/review-dashboard';
  export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';
  export {abdominalOrganQuizLesson} from './atlas-review/lib/abdominal-organ-quiz';
  export {kidneyOrientationLesson} from './atlas-review/lib/kidney-orientation';
  export {default as pins} from './atlas-review/content/abdominal-organ-quiz-pins.json';
  export function render(material){return renderToStaticMarkup(React.createElement(BodyReviewDetails,{material}));}
 `,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'esm',jsx:'automatic',
 banner:{js:"import {createRequire} from 'node:module';const require=createRequire(process.cwd()+'/package.json');"},
 plugins:[{name:'review-link',setup(b){b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:"import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children);}",resolveDir:process.cwd()}));}}]});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')).catch(error=>{error.stack=error.message;throw error;});
 const expected:Record<string,string>={
  FMA7198:'Digestive enzymes into ducts; hormones into blood',
  FMA7204:'Glomerular filtration followed by tubular processing',FMA7205:'Glomerular filtration followed by tubular processing',
  FMA7196:'Blood',FMA15629:'Cortex: steroid hormones; medulla: epinephrine and norepinephrine',
  FMA15630:'Cortex: steroid hormones; medulla: epinephrine and norepinephrine',
 };
 assert.equal(api.pins.entries.length,6);
 const seen=new Set<string>();
 for(const pin of api.pins.entries){
  const material=await api.bodyReviewMaterial(pin.identity.id);assert(material);
  assert.deepEqual(material.source.structure,pin.identity);assert.equal(material.approval,false);
  assert.equal(material.status,'worksheet-not-submitted');
  const quiz=material.topics.find((t:any)=>t.tab==='quiz');assert.equal(quiz.readiness,'draft');
  // Retain every original functional question even where a newer kidney lesson takes precedence.
  const originalQuiz=api.abdominalOrganQuizLesson(pin.identity,'quiz');assert(originalQuiz);
  assert.equal(originalQuiz.correctAnswer,expected[pin.identity.fmaId]);
  assert.equal(originalQuiz.readiness,'draft');assert.equal(originalQuiz.bullets.length,4);
  assert.equal(originalQuiz.bullets.filter((v:string)=>v===originalQuiz.correctAnswer).length,1);
  assert.match(originalQuiz.note,/Radiologist review pending/);
  const kidney=api.kidneyOrientationLesson(pin.identity,'quiz');
  const kidneyAnswers:Record<string,string>={FMA7204:'Papilla → minor calyx → major calyx → renal pelvis → right ureter',FMA7205:'Retroperitoneal, usually higher than the right, with the spleen near its upper pole'};
  assert.equal(Boolean(kidney),pin.identity.fmaId in kidneyAnswers);
  if(kidney)assert.equal(kidney.correctAnswer,kidneyAnswers[pin.identity.fmaId]);
  assert.deepEqual(quiz,{tab:'quiz',...(kidney??originalQuiz)});
  assert.equal(quiz.bullets.length,4);assert.equal(quiz.bullets.filter((v:string)=>v===quiz.correctAnswer).length,1);
  for(const fn of [api.abdominalOrganQuizLesson,api.kidneyOrientationLesson]){
    assert.equal(fn({...pin.identity,name:'forged name'},'quiz'),undefined);
    assert.equal(fn({...pin.identity,sources:[]},'quiz'),undefined);
  }
  const html=api.render(material);
  for(const text of [quiz.body,quiz.correctAnswer,quiz.explanation,'Draft answer key:','Draft explanation:',...quiz.citations])assert(html.includes(text),text);
  seen.add(pin.identity.fmaId);
 }
 assert.deepEqual([...seen].sort(),Object.keys(expected).sort());
});
