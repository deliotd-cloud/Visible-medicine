import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('eight pelvic organ quizzes carry exact learner source, review identities and answer evidence',async()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 assert.equal(review.revision,'2413ff790069d5bfa6c2c507d67ebfa2a5b3fe51');
 for(const path of ['content/pelvic-organ-quiz.ts','content/pelvic-organ-quiz-pins.json','lib/pelvic-organ-quiz.ts']) {
  const file=review.files.find((f:any)=>f.path===path);assert(file);
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
  assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);
 }
 const result=await build({stdin:{contents:`
  import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
  import {BodyReviewDetails} from './atlas-review/app/review/body/review-dashboard';
  export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';
  export {default as pins} from './atlas-review/content/pelvic-organ-quiz-pins.json';
  export function render(material){return renderToStaticMarkup(React.createElement(BodyReviewDetails,{material}));}
 `,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'esm',jsx:'automatic',
 banner:{js:"import {createRequire} from 'node:module';const require=createRequire(process.cwd()+'/package.json');"},
 plugins:[{name:'review-link',setup(b){b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:"import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children);}",resolveDir:process.cwd()}));}}]});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')).catch(error=>{error.stack=error.message;throw error;});
 const expected:Record<string,string>={
  FMA15900:'Bladder contracts; sphincters relax',
  FMA9600:'Size alone does not reliably indicate severity',
  FMA15571:'Kidney → ureter → bladder → urethra',FMA15572:'Kidney → ureter → bladder → urethra',
  FMA18256:'Maturation and storage',FMA18257:'Maturation and storage',
  FMA19387:'Fructose',FMA19388:'Fructose',
 };
 assert.equal(api.pins.entries.length,8);
 const seen=new Set<string>();
 for(const pin of api.pins.entries){
  const material=await api.bodyReviewMaterial(pin.identity.id);assert(material);
  assert.deepEqual(material.source.structure,pin.identity);assert.equal(material.approval,false);
  assert.equal(material.status,'worksheet-not-submitted');
  const quiz=material.topics.find((t:any)=>t.tab==='quiz');assert.equal(quiz.readiness,'draft');
  assert.equal(quiz.correctAnswer,expected[pin.identity.fmaId]);assert.equal(quiz.bullets.length,4);
  assert.equal(quiz.bullets.filter((v:string)=>v===quiz.correctAnswer).length,1);
  assert.match(quiz.note,/Radiologist review pending/);
  const html=api.render(material);
  for(const text of [quiz.body,quiz.correctAnswer,quiz.explanation,'Draft answer key:','Draft explanation:',...quiz.citations])assert(html.includes(text),text);
  seen.add(pin.identity.fmaId);
 }
 assert.deepEqual([...seen].sort(),Object.keys(expected).sort());
});
