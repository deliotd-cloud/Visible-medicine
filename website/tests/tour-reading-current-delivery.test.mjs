import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import {build} from 'esbuild';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {resolve,relative,isAbsolute} from 'node:path';

const require=createRequire(import.meta.url);
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const ts=require('typescript');
const root=new URL('../',import.meta.url);
const atlas='F:/VisibleMedicine/staging/20261023-tour-reading/atlas/';
const atlasReceipt='F:/VisibleMedicine/staging/20261023-tour-reading/SOURCE_BOUND.json';
const parentReceipt='F:/VisibleMedicine/staging/20261023-carpal-website/SOURCE_BOUND.json';
const currentSource='2ab63cbbc1c5e18a4d7b3a65f799e863f5be0491';
const currentTree='c625d8b1a55aabd8e6497169856e9d67b85ea0f3';
const currentReceipt='F:/VisibleMedicine/staging/20261023-midfoot-reasoning/SOURCE_BOUND.json';
const currentReceiptSha='feba2ee6e0127ff34a9b23eaf01b3fe9ed83b8ced45d0803c66feaacd9b3d7fc';
const previousCurrentSource='66ac064579ee23c5739d0907e8378e0e2d57d7bd';
const previousCurrentTree='0730550af7e5f8cc1d763d7326ca0a0c05458ca7';
const previousCurrentReceipt='F:/VisibleMedicine/staging/20261023-review-parser-context/SOURCE_BOUND.json';
const previousCurrentReceiptSha='a32919b11982957ef10eece8526ac6767d5c5a16499ff51cf2e50c2fc912a5f4';
const source='9eac0806a7869cfae435010b013ae611d748c0c9';
const tree='1d96d29f65b9739713f2dd51bfccd3bddf6bba52';
const parent='5f278c3d0c26c5a0899b54f2cfa2a0accb02ecf7';
const sha=value=>createHash('sha256').update(value).digest('hex');
const bytes=path=>readFileSync(new URL(path,root));
const json=path=>JSON.parse(bytes(path));
const sourceRow=(receipt,path)=>{
  const row=receipt.sourceRows.find(item=>item.path===path);
  assert(row,`Receipt omits ${path}`);
  return row;
};
// Keep the original reader-introduction/composition proof at its closed source.
// Current replay delivery is separately bound and exercised below.
const closedReceiptPath='F:/VisibleMedicine/staging/20261023-midfoot-website/SOURCE_BOUND.json';
const closedReceiptBytes=readFileSync(closedReceiptPath);
assert.equal(sha(closedReceiptBytes),'02293636ab03d8631787b98d1a1c0c2d8593cdf0008f75159bc4e87fba60de16');
const closedReceipt=JSON.parse(closedReceiptBytes);
assert.equal(closedReceipt.atlasHead,currentSource);assert.equal(closedReceipt.atlasTree,currentTree);
const closedBytes=path=>{const b=readFileSync(closedReceipt.website+'/'+path);assert.equal(sha(b),sourceRow(closedReceipt,path).sha256,path);return b;};
const closedJson=path=>JSON.parse(closedBytes(path));
const walk=node=>node==null?[]:Array.isArray(node)?node.flatMap(walk):typeof node==='object'?[node,...walk(node.props?.children)]:[];
const words=node=>node==null?'':Array.isArray(node)?node.map(words).join(''):typeof node==='object'?words(node.props?.children):String(node);
const children=node=>node.props?.children==null?[]:Array.isArray(node.props.children)?node.props.children:[node.props.children];

test('closed pinned Atlas and complete parent receipts prove the exact original reader source',()=>{
  const bytes=closedBytes,json=closedJson;
  const incoming=readFileSync(atlasReceipt),previous=readFileSync(parentReceipt);
  assert.equal(sha(incoming),'2d2a76bb1fae54be189ff2e4a02636c8352a37bb6ca59d13a52050c10c8f3cdb');
  assert.equal(sha(previous),'29e083ec39cf546e30e577f30bc345db0464f6451acb6c1380a3ca96d91f16d5');
  const next=JSON.parse(incoming),prior=JSON.parse(previous);
  assert.equal(next.head,source);assert.equal(next.tree,tree);assert.equal(next.parent,parent);
  assert.equal(prior.atlasHead,parent);assert.equal(prior.atlasTree,next.parentTree);
  for(const [name,digest] of [
    ['app/tour-reading-notes.tsx','0765610605eaa51bf93052744817c1856c64e243b26b80722d6285fb3b8c9578'],
    ['app/regional-guided-learning.tsx','e634e0da45c2c9c7763fa38d9c7194b6e7aa0cf6e1b485722a6a7053dd4a3d20'],
    ['app/regional-guided-learning.css','feb800d0045b469b0c43a6805135c9dd36a36098618a472ce41ea576e158842d'],
    ['lib/regional-tours.ts','b1a1bc9d9d80b84d4d98aed1aaa08aa4e9d7313e58bdd40f3b8a10ea0bab215d'],
  ]){
    assert.equal(sourceRow(next,name).sha256,digest,name);
    assert.equal(sha(readFileSync(atlas+name)),digest,name);
    const imported=bytes('atlas-review/'+name);
    const adapted=name.endsWith('.tsx')?readFileSync(atlas+name,'utf8').replace(/(['"])@\//g,'$1@/atlas-review/'):readFileSync(atlas+name);
    assert.deepEqual(imported,Buffer.from(adapted),`Only the declared import adapter may change ${name}`);
    const manifest=json('atlas-review/manifest.json');
    const row=manifest.files.find(item=>item.path===name);
    assert(row,name);assert.equal(row.sourceSha256,digest);assert.equal(row.importedSha256,sha(imported));
  }
  const priorCurrentBytes=readFileSync(previousCurrentReceipt);assert.equal(sha(priorCurrentBytes),previousCurrentReceiptSha);
  const priorCurrent=JSON.parse(priorCurrentBytes);
  assert.equal(priorCurrent.head,previousCurrentSource);assert.equal(priorCurrent.tree,previousCurrentTree);assert.equal(priorCurrent.parent,source);
  const currentBytes=readFileSync(currentReceipt);assert.equal(sha(currentBytes),currentReceiptSha);
  const current=JSON.parse(currentBytes);assert.equal(current.head,currentSource);assert.equal(current.tree,currentTree);
  assert.equal(current.parent,previousCurrentSource);assert.equal(current.parentTree,previousCurrentTree);
  for(const name of ['app/tour-reading-notes.tsx','app/regional-guided-learning.tsx','app/regional-guided-learning.css','lib/regional-tours.ts']){
    assert.equal(sourceRow(priorCurrent,name).sha256,sourceRow(next,name).sha256);
    assert.equal(sourceRow(current,name).sha256,sourceRow(priorCurrent,name).sha256);
  }
  assert.equal(json('atlas-review/manifest.json').revision,currentSource);
  const oldCss=readFileSync(prior.atlas+'/app/regional-guided-learning.css','utf8');
  const newCss=bytes('atlas-review/app/regional-guided-learning.css').toString();
  assert.equal(sha(Buffer.from(oldCss)),sourceRow(prior,'atlas-review/app/regional-guided-learning.css').sha256);
  assert(newCss.startsWith(oldCss),'Old tour CSS must remain byte exact');
  assert.match(newCss.slice(oldCss.length),/\.tour-reading-notes>summary\{min-height:44px/);
  for(const path of ['package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md'])
    assert.equal(sha(bytes(path)),sourceRow(prior,path).sha256,`No new dependency or notice change: ${path}`);
});

test('actual imported library and React SSR preserve all 53 tours, 317 stops, 416 references and limitations',async()=>{
  const resolveDir=closedReceipt.website;
  const bundled=await build({stdin:{contents:"export {TourReadingNotes} from './atlas-review/app/tour-reading-notes'; export {regionalTours,regionalTourLimitations} from './atlas-review/lib/regional-tours';",resolveDir,loader:'tsx'},absWorkingDir:resolveDir,metafile:true,bundle:true,write:false,format:'cjs',platform:'node',packages:'external',alias:{'@':resolveDir},loader:{'.css':'empty'}});
  // Every actual historical compiler input belongs to the sealed composition.
  for(const input of Object.keys(bundled.metafile.inputs)){
    if(input==='<stdin>')continue;
    const absolute=resolve(resolveDir,input),path=relative(resolveDir,absolute).replaceAll('\\','/');
    assert(!isAbsolute(path)&&!path.split('/').includes('..'),input);
    assert.deepEqual(readFileSync(absolute),closedBytes(path),path);
  }
  const module={exports:{}};
  runInNewContext(bundled.outputFiles[0].text,{module,exports:module.exports,require,URL});
  const {TourReadingNotes,regionalTours,regionalTourLimitations}=module.exports;
  assert.equal(regionalTours.length,53);
  let stops=0,references=0;
  for(const tour of regionalTours){
    let reads=0;
    const rendered=TourReadingNotes({tour,onRead(){reads++;}});
    assert.equal(rendered.type,'details');assert.equal(rendered.props.open,undefined);
    assert.equal(rendered.props.className,'tour-reading-notes');
    const summary=walk(rendered).find(item=>item.type==='summary');
    assert.equal(words(summary),`Read tour notes · ${tour.steps.length} ${tour.steps.length===1?'step':'steps'}`);
    const ordered=walk(rendered).find(item=>item.type==='ol');
    assert(ordered);assert.equal(children(ordered).length,tour.steps.length);
    for(const [index,step] of tour.steps.entries()){
      const row=children(ordered)[index];
      assert.equal(row.key,step.id);
      assert.equal(words(walk(row).find(item=>item.type==='h3')),step.title);
      assert.equal(words(walk(row).find(item=>item.type==='p')),step.caption);
      const links=walk(row).filter(item=>item.type==='a');
      assert.deepEqual(links.map(link=>link.props.href),JSON.parse(JSON.stringify(step.references)));
      for(const link of links){assert.equal(link.props.target,'_blank');assert.match(link.props.rel,/\bnoopener\b/);assert.match(link.props.rel,/\bnoreferrer\b/);}
      stops++;references+=links.length;
    }
    assert.equal(words(walk(rendered).find(item=>item.props?.className==='tour-reading-limits')),regionalTourLimitations(tour));
    const html=renderToStaticMarkup(React.createElement(TourReadingNotes,{tour,onRead(){reads++;}}));
    assert.match(html,/class="tour-reading-notes"/);assert.doesNotMatch(html,/<details[^>]*\sopen(?:\s|=|>)/);
    assert.equal(reads,0,'Rendering alone cannot pause or finish playback');
  }
  assert.equal(stops,317);assert.equal(references,416);
  const calls=[];const actual=TourReadingNotes({tour:regionalTours[0],onRead(){calls.push('read');}});
  actual.props.onToggle({currentTarget:{open:false}});assert.deepEqual(calls,[]);
  actual.props.onToggle({currentTarget:{open:true}});actual.props.onFocusCapture({});actual.props.onPointerDownCapture({});
  assert.deepEqual(calls,['read','read','read']);
  const details={open:true,isConnected:true,querySelector(){return {focus(){calls.push('focus');}};}};
  actual.props.onKeyDown({key:'Escape',defaultPrevented:false,nativeEvent:{isComposing:false},currentTarget:details,preventDefault(){calls.push('prevent');},stopPropagation(){calls.push('stop');}});
  assert.equal(details.open,false);assert.deepEqual(calls.slice(-3),['prevent','stop','focus']);
});

test('actual imported parent admits the reader only after source resolution and suspends imaging before playback state',()=>{
  const bytes=closedBytes;
  const code=bytes('atlas-review/app/regional-guided-learning.tsx').toString();
  const ast=ts.createSourceFile('regional-guided-learning.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const nodes=[];const visit=node=>{if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(ast)==='TourReadingNotes')nodes.push(node);ts.forEachChild(node,visit);};visit(ast);
  assert.equal(nodes.length,1);
  const parentNode=nodes[0].parent;
  assert(ts.isBinaryExpression(parentNode));assert.equal(parentNode.left.getText(ast),'!resolved.error');
  const attributes=Object.fromEntries(nodes[0].attributes.properties.map(item=>[item.name.getText(ast),item]));
  assert.equal(attributes.key.initializer.expression.getText(ast),'scope.key');
  assert.equal(attributes.tour.initializer.expression.getText(ast),'tour');
  const callback=attributes.onRead.initializer.expression.getText(ast);
  const compiled=ts.transpileModule(`(${callback})`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  for(const current of [false,true]){
    const calls=[];
    const handler=runInNewContext(compiled,{isCurrentAction(){calls.push('guard');return current;},pausedImaging:{suspend(){calls.push('suspend');}},revokePlayback(){calls.push('revoke');}});
    handler();assert.deepEqual(calls,current?['guard','suspend','revoke']:['guard']);
  }
});

test('closed generated shared runtime contains the reader while dedicated and independent modules retain their pinned sources',()=>{
  const bytes=closedBytes,json=closedJson;
  const shared=json('public/atlas-runtime/head-neck/manifest.json');
  assert.equal(shared.sourceCommit,currentSource);assert.equal(shared.patientDataIncluded,false);
  const emittedFiles=(base,manifest)=>manifest.files.filter(item=>/\.(?:js|css)$/.test(item.path)).map(item=>{
    const output=bytes(base+item.path);
    assert.equal(sha(output),item.sha256,`Manifest hash: ${base}${item.path}`);
    return output.toString();
  }).join('\n');
  const emitted=emittedFiles('public/atlas-runtime/head-neck/',shared);
  assert.match(emitted,/tour-reading-notes/);assert.match(emitted,/Read tour notes/);
  for(const [module,revision] of [['shoulder',currentSource],['lower-limb','190a63238eadcf906abe89dcbb6a67c88afe70b9'],['female-pelvis','190a63238eadcf906abe89dcbb6a67c88afe70b9']]){
    const manifest=json(`public/atlas-runtime/${module}/manifest.json`);
    assert.equal(manifest.sourceCommit,revision,module);assert.equal(manifest.patientDataIncluded,false,module);
    if(module==='shoulder'){
      const inputs=json('public/atlas-runtime/shoulder/source-inputs.json');
      for(const excluded of ['app/tour-reading-notes.tsx','app/regional-guided-learning.tsx'])
        assert(!inputs.some(item=>item.path===excluded),`Dedicated shoulder does not import ${excluded}`);
      const shoulderEmitted=emittedFiles('public/atlas-runtime/shoulder/',manifest);
      assert.doesNotMatch(shoulderEmitted,/tour-reading-notes|Read tour notes/);
    }
  }
  const inputs=json('atlas-review/integration-inputs.json');
  assert.equal(inputs.sourceCommit,currentSource);assert.equal(inputs.sha256,sha(JSON.stringify(inputs.inputs)));
  const review=json('public/atlas-review-viewer/manifest.json');
  assert.equal(review.sourceCommit,currentSource);assert.equal(review.websiteIntegrationSha256,inputs.sha256);
  assert.equal(review.personalRecordsIncluded,false);assert.equal(review.mode,'production');
  const reviewEmitted=emittedFiles('public/atlas-review-viewer/',review);
  assert.match(reviewEmitted,/tour-reading-notes/);assert.match(reviewEmitted,/Read tour notes/);
});

test('closed replay delivery preserves reader content and all four explicitly renewed module identities',()=>{
  const replayBytes=readFileSync('F:/VisibleMedicine/staging/20261023-forearm-website/SOURCE_BOUND.json');
  assert.equal(sha(replayBytes),'cf71965d5f836d30811e17f5bcd1fc7abde902f864b325904a538b93d7a79471');
  const replay=JSON.parse(replayBytes),CURRENT_ATLAS_REVISION=replay.atlasHead;
  assert.equal(replay.atlasTree,'486287b25d968117cffdd27bb20009fa46cda6f3');
  const bytes=path=>{const b=readFileSync(replay.website+'/'+path);assert.equal(sha(b),sourceRow(replay,path).sha256,path);return b;};
  const json=path=>JSON.parse(bytes(path));
  assert.equal(CURRENT_ATLAS_REVISION,'d143c28fb1e5da200712af6629a375c25d17dad7');
  for(const p of ['app/tour-reading-notes.tsx','app/regional-guided-learning.css','lib/regional-tours.ts'])
    assert.deepEqual(bytes('atlas-review/'+p),closedBytes('atlas-review/'+p),'Unchanged reader content: '+p);
  const emitted=(base,manifest)=>manifest.files.filter(r=>/\.(?:js|css)$/.test(r.path)).map(r=>{
    const b=bytes(base+r.path);assert.equal(sha(b),r.sha256,r.path);return b.toString();
  }).join('\n');
  for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
    const base='public/atlas-runtime/'+module+'/',manifest=json(base+'manifest.json');
    assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);assert.equal(manifest.patientDataIncluded,false);
    const text=emitted(base,manifest);
    if(module==='head-neck'){assert.match(text,/tour-reading-notes/);assert.match(text,/Read tour notes/);}
    if(module==='shoulder'){
      for(const excluded of ['app/tour-reading-notes.tsx','app/regional-guided-learning.tsx'])
        assert(!json(base+'source-inputs.json').some(r=>r.path===excluded));
      assert.doesNotMatch(text,/tour-reading-notes|Read tour notes/);
    }
  }
  const binding=json('atlas-review/integration-inputs.json'),viewer=json('public/atlas-review-viewer/manifest.json');
  assert.equal(binding.sourceCommit,CURRENT_ATLAS_REVISION);assert.equal(binding.sha256,sha(JSON.stringify(binding.inputs)));
  assert.equal(viewer.sourceCommit,CURRENT_ATLAS_REVISION);assert.equal(viewer.websiteIntegrationSha256,binding.sha256);
  assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.mode,'production');
  const text=emitted('public/atlas-review-viewer/',viewer);assert.match(text,/tour-reading-notes/);assert.match(text,/Read tour notes/);
});

// Current delivery is a separate, receipt-bound contract. It admits later tour
// additions without changing any historical count, content or replay assertion.
const deliveryReceiptPath=process.env.VM_CURRENT_SOURCE_RECEIPT;
const deliveryReceiptSha=process.env.VM_CURRENT_SOURCE_SHA256;
assert(deliveryReceiptPath&&/^[a-f0-9]{64}$/.test(deliveryReceiptSha??''),'Exact current Website receipt required');
const deliveryReceiptBytes=readFileSync(deliveryReceiptPath);
assert.equal(sha(deliveryReceiptBytes),deliveryReceiptSha,'Current Website receipt changed');
const deliveryReceipt=JSON.parse(deliveryReceiptBytes);
assert.equal(resolve(deliveryReceipt.website),resolve(fileURLToPath(root)),'Receipt belongs to this Website');
const deliveryRows=new Map(deliveryReceipt.sourceRows.map(row=>[row.path,row]));
assert.equal(deliveryRows.size,deliveryReceipt.sourceRows.length,'Unique sealed source rows');
const deliveryBytes=path=>{
  assert(!isAbsolute(path)&&!path.split('/').some(p=>!p||p==='.'||p==='..'),'Safe current source path');
  const row=deliveryRows.get(path);assert(row,'Sealed current source: '+path);
  const b=bytes(path);assert.equal(b.length,row.bytes,path);assert.equal(sha(b),row.sha256,path);return b;
};
const deliveryJson=path=>JSON.parse(deliveryBytes(path));

function currentReaderBinding(){
  deliveryBytes('tests/tour-reading-current-delivery.test.mjs');
  deliveryBytes('tests/current-atlas-delivery.mjs');
  const pin=deliveryJson('tests/fixtures/current-atlas-delivery.json');
  assert.deepEqual(validateCurrentAtlasDelivery(),pin);
  assert.equal(pin.source,CURRENT_ATLAS_REVISION);
  assert.equal(resolve(deliveryReceipt.atlas),resolve(currentAtlasDeliveryRoot()),'Sealed receipt identifies the validated current Atlas source');
  const review=deliveryJson('atlas-review/manifest.json'),binding=deliveryJson('atlas-review/integration-inputs.json');
  assert.equal(review.revision,pin.source);assert.equal(binding.sourceCommit,pin.source);
  assert.equal(binding.sha256,pin.reviewIntegration);assert.equal(binding.sha256,sha(JSON.stringify(binding.inputs)));
  assert.equal(review.websiteIntegrationSha256,binding.sha256);
  return {pin,review,binding};
}

test('current delivery retains exact reader component and style with current source and Review binding',()=>{
  const {pin,review,binding}=currentReaderBinding(),atlas=currentAtlasDeliveryRoot();
  for(const path of ['app/tour-reading-notes.tsx','app/regional-guided-learning.css'])
    assert.deepEqual(deliveryBytes('atlas-review/'+path),closedBytes('atlas-review/'+path),'Unchanged reader: '+path);
  for(const path of ['app/tour-reading-notes.tsx','app/regional-guided-learning.tsx','app/regional-guided-learning.css','lib/regional-tours.ts']){
    const imported=deliveryBytes('atlas-review/'+path),row=review.files.find(r=>r.path===path),native=readFileSync(atlas+'/'+path);
    assert(row,path);assert.equal(row.importedSha256,sha(imported),path);assert.equal(row.sourceSha256,sha(native),path);
    const adapted=path.endsWith('.tsx')?Buffer.from(native.toString().replace(/(['"])@\//g,'$1@/atlas-review/')):native;
    assert.deepEqual(imported,adapted,'Only stock import adaptation: '+path);
    assert.equal(binding.inputs.find(r=>r.path==='atlas-review/'+path)?.sha256,sha(imported),path);
  }
  assert.equal(pin.runtimeSources['head-neck'],pin.source);
});

test('current imported reader renders every current tour without historical catalogue assumptions',async()=>{
  const {review,binding}=currentReaderBinding(),resolveDir=fileURLToPath(root);
  for(const path of ['package.json','package-lock.json'])deliveryBytes(path);
  const bundled=await build({stdin:{contents:"export {TourReadingNotes} from './atlas-review/app/tour-reading-notes'; export {regionalTours,regionalTourLimitations} from './atlas-review/lib/regional-tours';",resolveDir,loader:'tsx'},absWorkingDir:resolveDir,metafile:true,bundle:true,write:false,format:'cjs',platform:'node',packages:'external',alias:{'@':resolveDir},loader:{'.css':'empty'}});
  let inputs=0;
  for(const input of Object.keys(bundled.metafile.inputs)){
    if(input==='<stdin>')continue; // Exactly the declared export-only bridge.
    const absolute=resolve(resolveDir,input),path=relative(resolveDir,absolute).replaceAll('\\','/');
    assert(!isAbsolute(path)&&!path.split('/').includes('..')&&path.startsWith('atlas-review/'),input);
    const b=deliveryBytes(path),row=review.files.find(r=>r.path===path.slice('atlas-review/'.length));
    assert(row,path);assert.equal(row.importedSha256,sha(b),path);
    assert.equal(binding.inputs.find(r=>r.path===path)?.sha256,sha(b),path);inputs++;
  }
  assert(inputs>2,'Actual imported reader and tour dependencies were compiled');
  const module={exports:{}};runInNewContext(bundled.outputFiles[0].text,{module,exports:module.exports,require,URL});
  const {TourReadingNotes,regionalTours,regionalTourLimitations}=module.exports;
  assert(regionalTours.length>0);assert.equal(new Set(regionalTours.map(t=>t.id)).size,regionalTours.length);
  for(const tour of regionalTours){
    let reads=0;const rendered=TourReadingNotes({tour,onRead(){reads++;}});
    assert.equal(rendered.type,'details');assert.equal(rendered.props.open,undefined);
    assert.equal(words(walk(rendered).find(n=>n.type==='summary')),
      'Read tour notes · '+tour.steps.length+' '+(tour.steps.length===1?'step':'steps'));
    const rows=children(walk(rendered).find(n=>n.type==='ol'));assert.equal(rows.length,tour.steps.length);
    for(const [i,step] of tour.steps.entries()){
      assert.equal(rows[i].key,step.id);assert.equal(words(walk(rows[i]).find(n=>n.type==='h3')),step.title);
      assert.equal(words(walk(rows[i]).find(n=>n.type==='p')),step.caption);
      const links=walk(rows[i]).filter(n=>n.type==='a');
      assert.deepEqual(links.map(n=>n.props.href),JSON.parse(JSON.stringify(step.references)));
      for(const link of links){assert.equal(link.props.target,'_blank');assert.match(link.props.rel,/\bnoopener\b/);assert.match(link.props.rel,/\bnoreferrer\b/);}
    }
    assert.equal(words(walk(rendered).find(n=>n.props?.className==='tour-reading-limits')),regionalTourLimitations(tour));
    const html=renderToStaticMarkup(React.createElement(TourReadingNotes,{tour,onRead(){reads++;}}));
    assert.match(html,/class="tour-reading-notes"/);assert.doesNotMatch(html,/<details[^>]*\sopen(?:\s|=|>)/);
    assert.equal(reads,0,'Rendering current notes cannot begin or finish playback');
  }
});

test('current imported parent gates reading on availability and suspends imaging before playback state',()=>{
  currentReaderBinding();
  const code=deliveryBytes('atlas-review/app/regional-guided-learning.tsx').toString();
  const ast=ts.createSourceFile('regional-guided-learning.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const nodes=[];const visit=node=>{if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(ast)==='TourReadingNotes')nodes.push(node);ts.forEachChild(node,visit);};visit(ast);
  assert.equal(nodes.length,1);
  const parentNode=nodes[0].parent;
  assert(ts.isBinaryExpression(parentNode));assert.equal(parentNode.operatorToken.kind,ts.SyntaxKind.AmpersandAmpersandToken);
  assert.equal(parentNode.left.getText(ast),'!availabilityError');
  const availabilityGuard=ts.transpileModule('('+parentNode.left.getText(ast)+')',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  for(const availabilityError of [null,'Unavailable source'])
    assert.equal(runInNewContext(availabilityGuard,{availabilityError}),!availabilityError);
  const attributes=Object.fromEntries(nodes[0].attributes.properties.map(item=>[item.name.getText(ast),item]));
  assert.equal(attributes.key.initializer.expression.getText(ast),'scope.key');
  assert.equal(attributes.tour.initializer.expression.getText(ast),'tour');
  const callback=attributes.onRead.initializer.expression.getText(ast);
  const compiled=ts.transpileModule('('+callback+')',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  for(const current of [false,true]){
    const calls=[];
    const handler=runInNewContext(compiled,{isCurrentAction(){calls.push('guard');return current;},pausedImaging:{suspend(){calls.push('suspend');}},revokePlayback(){calls.push('revoke');}});
    handler();assert.deepEqual(calls,current?['guard','suspend','revoke']:['guard']);
  }
});

test('current generated module identities and reachable learner and Review bundles deliver the reader',()=>{
  const {pin,review,binding}=currentReaderBinding();
  const readerPaths=['app/tour-reading-notes.tsx','app/regional-guided-learning.tsx','app/regional-guided-learning.css','lib/regional-tours.ts'];
  const readReachable=(base,manifest)=>{
    const files=new Map(manifest.files.map(row=>[row.path,row]));assert.equal(files.size,manifest.files.length);
    const seen=new Set(),texts=[];
    function visit(path){
      if(seen.has(path))return;seen.add(path);const row=files.get(path);assert(row,'Reachable declared asset: '+base+path);
      const b=deliveryBytes(base+path);assert.equal(sha(b),row.sha256,path);
      if(base==='public/atlas-review-viewer/')assert.deepEqual(Object.keys(row).sort(),['path','sha256'],'Exact Review manifest schema; deliveryBytes also checks sealed source size');
      else {assert(Number.isSafeInteger(row.bytes)&&row.bytes>=0);assert.equal(b.length,row.bytes,path);}
      const text=b.toString();texts.push(text);
      for(const match of text.matchAll(/(?:assets\/|\.\/)([A-Za-z0-9_-]+\.(?:js|css))/g))visit('assets/'+match[1]);
    }
    visit('index.html');assert(seen.size>1,'Actual entrypoint follows declared bundle graph');return texts.join('\n');
  };
  for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
    const base='public/atlas-runtime/'+name+'/',manifest=deliveryJson(base+'manifest.json');
    assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);assert.equal(manifest.patientDataIncluded,false);
    assert.equal(manifest.clinicalApproved,false);
    const sourceInputs=deliveryJson(base+'source-inputs.json');
    assert.equal(manifest.files.find(r=>r.path==='source-inputs.json')?.sha256,sha(deliveryBytes(base+'source-inputs.json')));
    assert.equal(new Set(sourceInputs.map(r=>r.path)).size,sourceInputs.length);
    if(name==='head-neck'){
      for(const path of readerPaths)assert.equal(sourceInputs.find(r=>r.path===path)?.sha256,review.files.find(r=>r.path===path)?.sourceSha256,path);
      const text=readReachable(base,manifest);assert.match(text,/tour-reading-notes/);assert.match(text,/Read tour notes/);
    }
    if(name==='shoulder'){
      for(const excluded of ['app/tour-reading-notes.tsx','app/regional-guided-learning.tsx'])assert(!sourceInputs.some(r=>r.path===excluded),excluded);
      const text=readReachable(base,manifest);assert.doesNotMatch(text,/tour-reading-notes|Read tour notes/);
    }
  }
  const viewer=deliveryJson('public/atlas-review-viewer/manifest.json');
  assert.equal(viewer.sourceCommit,pin.source);assert.equal(viewer.websiteIntegrationSha256,binding.sha256);
  assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.mode,'production');
  const text=readReachable('public/atlas-review-viewer/',viewer);assert.match(text,/tour-reading-notes/);assert.match(text,/Read tour notes/);
});
