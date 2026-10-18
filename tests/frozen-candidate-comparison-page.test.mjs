import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {webcrypto} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import {build} from 'esbuild';
import {resolveCandidate} from '../lib/clinical-review-candidate.ts';
import {validateFrozenComparisonPair} from '../lib/frozen-candidate-comparison.ts';

const require=createRequire(import.meta.url),React=require('react');
const registry=JSON.parse(readFileSync('lib/clinical-review-candidate-registry.json','utf8'));
const current=registry.find(item=>item.decisionMode==='personal-review'&&item.supersedes);
assert(current,'Registered direct-supersession example is required.');
const built=await build({entryPoints:['app/workspace/review-candidates/[candidateId]/page.tsx'],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',plugins:[{name:'read-only-page-boundaries',setup(api){
  api.onResolve({filter:/^@\/lib\/clinical-review-candidate-registry\.json$/},()=>({path:'registry',namespace:'fixture'}));
  api.onResolve({filter:/^@\/components\/FrozenCandidateComparison$/},()=>({path:'comparison',namespace:'fixture'}));
  api.onResolve({filter:/^@\/lib\/clinical-review-candidate$/},()=>({path:'resolver',namespace:'fixture'}));
  api.onResolve({filter:/^@\/lib\/frozen-candidate-comparison$/},()=>({path:'pair',namespace:'fixture'}));
  api.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:({registry:'export default globalThis.__registry;',comparison:'export function FrozenCandidateComparison(){return null;}',resolver:'export const resolveCandidate=globalThis.__resolveCandidate;',pair:'export const validateFrozenComparisonPair=globalThis.__validatePair;'})[args.path],loader:'js'}));
}}]});
const walk=(node,predicate,out=[])=>{if(React.isValidElement(node)){if(predicate(node))out.push(node);React.Children.forEach(node.props.children,c=>walk(c,predicate,out));}return out;};
const words=node=>node==null?'':typeof node==='string'||typeof node==='number'?String(node):Array.isArray(node)?node.map(words).join(''):words(node.props?.children);
function harness(entries){
  const scope={exports:{}};
  runInNewContext(built.outputFiles[0].text,{module:scope,exports:scope.exports,crypto:webcrypto,TextEncoder,structuredClone,URL,URLSearchParams,__registry:entries,__resolveCandidate:resolveCandidate,__validatePair:validateFrozenComparisonPair,
    require:name=>name==='next/link'?{default:function Link(){return null;}}:name==='next/navigation'?{notFound(){throw Error('not-found');}}:require(name)});
  return id=>scope.exports.default({params:Promise.resolve({candidateId:id})});
}
test('saved page displays comparison only for a validated direct predecessor and keeps the original review iframe',async()=>{
  const page=await harness(registry)(current.id);
  const comparison=walk(page,node=>typeof node.type==='function'&&node.type.name==='FrozenCandidateComparison');
  assert.equal(comparison.length,1);
  assert.equal(comparison[0].props.current.id,current.id);
  assert.equal(comparison[0].props.previous.id,current.supersedes);
  assert.equal(walk(page,node=>node.type==='iframe')[0].props.src,`/api/atlas-review/candidates/${current.id}/assets/index.html`);
  const previous=await harness(registry)(current.supersedes);
  assert.equal(walk(previous,node=>typeof node.type==='function'&&node.type.name==='FrozenCandidateComparison').length,0);
});
test('missing, duplicate or malformed predecessor never substitutes live material and does not remove the saved worksheet',async()=>{
  const prior=registry.find(item=>item.id===current.supersedes);
  for(const entries of [registry.filter(item=>item.id!==current.supersedes),[...registry,prior],registry.map(item=>item.id===current.supersedes?{...item,label:'tampered'}:item)]){
    const page=await harness(entries)(current.id);
    assert.equal(walk(page,node=>typeof node.type==='function'&&node.type.name==='FrozenCandidateComparison').length,0);
    assert.match(words(page),/could not be matched for comparison/);
    assert.equal(walk(page,node=>node.type==='iframe').length,1);
  }
});
test('unknown candidate fails closed; the existing protected layout and asset authorization remain in place',async()=>{
  await assert.rejects(harness(registry)('f'.repeat(64)),/not-found/);
  const layout=readFileSync('app/workspace/review-candidates/layout.tsx','utf8');
  assert.match(layout,/export \{default,dynamic\} from '\.\.\/atlas-review\/layout'/);
  const route=readFileSync('app/api/atlas-review/candidates/[candidateId]/assets/[...asset]/route.ts','utf8');
  assert.match(route,/runClinicalReview\(request/);
  assert.match(route,/authorizeAtlasDelivery\(env.DB/);
  assert.match(route,/audience:'administrator-review'/);
  const decoder=readFileSync('lib/frozen-candidate-worksheet.ts','utf8');
  assert.doesNotMatch(decoder,/parseBodyReviewResponse|bodyReviewDisplayMatches|body-review-display-pins|body-tours|body-catalog/);
});
