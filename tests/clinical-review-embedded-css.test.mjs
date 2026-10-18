import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {dirname,resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import postcss from 'postcss';

const root=fileURLToPath(new URL('../',import.meta.url));
const embedded='app/workspace/atlas-review/model/review-model-embedded.css';
const routes=[['app/workspace/atlas-review/model/page.tsx','./review-model-embedded.css'],
 ['app/workspace/atlas-review/model/embedded/page.tsx','../review-model-embedded.css']];
const read=p=>readFileSync(resolve(root,p),'utf8');

function embeddedDependency(source,route,relativeImport){
 const imports=[...source.matchAll(/^import ['"]([^'"]+\.css)['"];$/gm)].map(m=>m[1]);
 assert.equal(imports.filter(p=>p===relativeImport).length,1,'one route-owned embedded stylesheet');
 const resolved=resolve(root,dirname(route),relativeImport);
 assert.equal(resolved,resolve(root,embedded),'route styles resolve to the shared owned inspector CSS');
 assert(!relative(root,resolved).startsWith('..'));assert(existsSync(resolved));
 return postcss.parse(readFileSync(resolved,'utf8'));
}

test('both route boundaries import the existing inspector styles directly',()=>{
 const layout=read('app/workspace/atlas-review/layout.tsx');
 assert(layout.includes("import './website-review.css'"));
 const css=embeddedDependency(read(routes[0][0]),...routes[0]);
 embeddedDependency(read(routes[1][0]),...routes[1]);
 const rule=selector=>css.nodes.find(n=>n.type==='rule'&&n.selector===selector);
 const properties=selector=>Object.fromEntries(rule(selector).nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
 assert.deepEqual(properties('.review-model-embedded'),{height:'100dvh','min-height':'0',display:'flex','flex-direction':'column',background:'var(--vm-midnight)',color:'var(--vm-ivory)'});
 const frame=properties('.review-model-embedded > .review-model-frame');
 assert.equal(frame.flex,'1');assert.equal(frame.height,'0');assert.equal(frame['min-height'],'0');
 assert.equal(properties('.website-clinical-review:has(> .review-model-embedded) > .review-account-scope').display,'none');
});

test('missing, duplicate and foreign route style dependencies cannot pass the contract',()=>{
 for(const [route,local] of routes){
  const source=read(route),line=`import '${local}';`;
  assert.throws(()=>embeddedDependency(source.replace(line,''),route,local));
  assert.throws(()=>embeddedDependency(source+'\n'+line,route,local));
  assert.throws(()=>embeddedDependency(source.replace(line,"import 'https://untrusted.invalid/inspector.css';"),route,local));
 }
});

test('model CSS delivery preserves private authorization, inspection scope and exact frame validation',()=>{
 const parent=read('app/workspace/atlas-review/layout.tsx');
 assert(parent.includes('await authorizeClinicalReview()'));assert(parent.includes('error.status === 401'));
 const model=read('app/workspace/atlas-review/model/model-view.tsx');
 assert(model.includes('Private anatomy inspection · education only · no decision is recorded here'));
 assert(model.includes("typeof value !== 'string' || value.length > 256"));
 assert(model.includes('await clinicalReviewReturn(Object.fromEntries(query))'));
 assert(model.includes("'/atlas-review-viewer/index.html?' + query.toString()"));
 assert(!model.includes('dangerouslySetInnerHTML'));
});
