import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {closed56LaterEdits,reconstructClosed56BeforeFamily} from './closed56-family-source-inverse.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFileSync(new URL(path,import.meta.url));
const seam=(before,after)=>({before,after});
function span(original,start,end,after){
 assert.equal(original.split(start).length,2,'Unique start: '+start);
 const at=original.indexOf(start),stop=original.indexOf(end,at+start.length);
 assert(stop>at,'Ordered end: '+end);
 assert.equal(original.indexOf(end,stop+end.length),-1,'Unique end: '+end);
 return seam(original.slice(at,stop),after);
}
function applyOne(source,{before,after},label){
 assert.notEqual(before,after,label+': substantive change');
 assert.equal(source.split(before).length,2,label+': one declared seam');
 return source.replace(before,after);
}
function prove(name,raw,digest,edits){
 const original=read('fixtures/'+raw);
 assert.equal(sha(original),digest,name+': authentic exact pre-role bytes');
 const candidate=read(name);
 const eol=original.includes(Buffer.from('\r\n'))?'\r\n':'\n';
 assert.equal(candidate.includes(Buffer.from('\r\n')),eol==='\r\n',name+': original line endings');
 const oldText=original.toString('utf8').replaceAll('\r\n','\n');
 const newText=candidate.toString('utf8').replaceAll('\r\n','\n');
 const steps=edits(oldText);
 const later=name==='closed56-femoral-epoch.test.mjs'?closed56LaterEdits.slice(3).map(([before,after])=>seam(before,after)):[];
 let expected=oldText;
 for(const [i,step] of steps.entries())expected=applyOne(expected,step,name+' edit '+i);
 for(const [i,step] of later.entries())expected=applyOne(expected,step,name+' later edit '+i);
 const actualPrior=later.length?reconstructClosed56BeforeFamily(newText,expected):newText;
 assert.equal(actualPrior,expected,name+': whole candidate has only declared edits');
 let inverse=actualPrior;
 for(const [i,step] of later.toReversed().entries())inverse=applyOne(inverse,seam(step.after,step.before),name+' later inverse '+i);
 for(const [i,step] of steps.toReversed().entries())inverse=applyOne(inverse,seam(step.after,step.before),name+' inverse '+i);
 assert.equal(inverse,oldText,name+': complete inverse');
 assert.equal(sha(Buffer.from(inverse.replaceAll('\n',eol))),digest,name+': byte-exact original restored');
 const negative=name==='closed56-live-preservation.test.mjs'
  ?"['original clinical refusal','fixtures/current-delivery-test-before-roving.mjs.raw'"
  :name==='closed56-femoral-epoch.test.mjs'
   ?'assert.throws(()=>validateCurrentAtlasDelivery({pin:revision56}));'
   :name==='closed56-live-preservation.mjs'
    ?"assert.equal(sha(bytes),digest,'Frozen preservation evidence changed: '+path);"
    :"assert.notEqual(sha(Buffer.from(invert(forged))),before,'Mutation breaks whole-file inverse');";
 assert(newText.includes(negative),name+': original negative remains');
 const removed=newText.replace(negative,'');
 assert.notEqual(removed,newText,name+': mutation exercised the original negative');
 assert.throws(()=>later.length?reconstructClosed56BeforeFamily(removed,expected):assert.equal(removed,expected),name+': removing an original negative is refused');
 assert.throws(()=>later.length?reconstructClosed56BeforeFamily(newText+'\nconst unknown=true;\n',expected):assert.equal(newText+'\nconst unknown=true;\n',expected),name+': unknown append is refused');
}

test('femoral current role changes only exact source/tree and independently counted current bindings',()=>{
 prove('closed56-femoral-epoch.test.mjs','closed56-femoral-epoch-before-role-20261021.mjs.raw',
  'bb6a8d631f190915f55d5ac4b5cdceb214691079b6502086f0d07c168026f037',()=>[
   seam("assert.equal(pin.source,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');",
        "assert.equal(pin.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');"),
   seam("assert.equal(pin.sourceTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');",
        "assert.equal(pin.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c');"),
   seam(' assert.equal(pin.reviewSourceFiles,review.files.length);',String.raw` assert.equal(pin.reviewSourceFiles,review.files.length);
 assert.equal(review.files.length,1553);
 assert.equal(inputs.inputs.length,1710);
 const inventory=JSON.parse(readFileSync(new URL('../lib/atlas-model-inventory.json',import.meta.url)));
 assert.equal(inventory.models.length,137);
 assert.equal(inventory.models.flatMap(model=>model.paths).length,144);`),
  ]);
});

test('closed56 helper changes only declared archived roles',()=>{
 prove('closed56-live-preservation.mjs','closed56-live-preservation-before-role-20261021.mjs.raw',
  '91db3ee295c49991dcd1943e97ddb0e40c5d943697e64854bc7dd34c0f2df242',old=>[
   seam('// Test-only projection of an exact reviewed evolution, not current delivery admission.',
        '// Test-only projection of exact archived evolutions, not current delivery admission.'),
   seam('// still executed separately by current-atlas-delivery.test.mjs against emitted bytes.',
        '// executed separately by current-atlas-delivery.test.mjs against emitted bytes.'),
   seam('const reviewAfter="assert.equal(pin.reviewIntegration,sha(JSON.stringify(JSON.parse(read(\'atlas-review/integration-inputs.json\')).inputs)));";',
        'const reviewAfter="assert.equal(pin.reviewIntegration,sha(JSON.stringify(JSON.parse(read(\'atlas-review/integration-inputs.json\')).inputs)));";\nconst shoulderReviewAfter="assert.equal(pin.reviewIntegration,sha(JSON.stringify(JSON.parse(readFileSync(\'atlas-review/integration-inputs.json\')).inputs)));";'),
   seam(" if(name==='shoulder-us-renderer-migration.test.mjs')return read(name).toString('utf8');",String.raw` if(name==='shoulder-us-renderer-migration.test.mjs'){
  const shoulder=checked(read,'fixtures/closed56-original-tests/'+name+'.txt','b4700123c95cdf38f85cb5b48236428642e10fb94782c866ef6c28101f209171');
  return replaceOnce(shoulder,reviewBefore,shoulderReviewAfter);
 }`),
   span(old,' let current=beforeRoving;',' return replaceOnce(original,reviewBefore,reviewAfter);',String.raw` assert.equal(beforeRoving.slice(0,beforeRoving.indexOf(marker)).includes("assert.equal(CURRENT_ATLAS_REVISION,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');"),true,
  'The later witness retains its own 87ed introduction source');
`),
  ]);
});

test('closed56 historical mutation guard changes targets but retains every negative',()=>{
 prove('closed56-live-preservation.test.mjs','closed56-live-preservation-test-before-role-20261021.mjs.raw',
  '49bd6c57054d9e2788d41906b66415ddb5325c59c8a63f3321313a394ee935b7',old=>[
   seam('exact live evolution projects only after both whole original transitions are proved',
        'exact archived evolution projects only after both whole original transitions are proved'),
   seam(" assert.equal(readClosed56LiveCopy('shoulder-us-renderer-migration.test.mjs'),read('shoulder-us-renderer-migration.test.mjs').toString());",String.raw` const shoulder=read('fixtures/closed56-original-tests/shoulder-us-renderer-migration.test.mjs.txt').toString();
 assert.equal(readClosed56LiveCopy('shoulder-us-renderer-migration.test.mjs'),shoulder.replace("assert.equal(pin.reviewIntegration,'b4db62ff56037c1ca251e32256afd470f6e155ca3f563d1d1db86b6ec9c6d916');","assert.equal(pin.reviewIntegration,sha(JSON.stringify(JSON.parse(readFileSync('atlas-review/integration-inputs.json')).inputs)));"));`),
   span(old," ['current commit',liveName,",'])test(\'projection refuses changed \'+label',String.raw` ['historical introduction commit','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text.replace("assert.equal(CURRENT_ATLAS_REVISION,'87ed7e343260c7df48a40d53503f25bbfd34cfa5');","assert.equal(CURRENT_ATLAS_REVISION,'0000000000000000000000000000000000000000');")],
 ['historical introduction tree','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text.replace("assert.equal(pin.sourceTree,'bfcfa898ace1d25083f21b681274c5bc816564d7');","assert.equal(pin.sourceTree,'0000000000000000000000000000000000000000');")],
 ['historical observed count','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text.replace('assert.equal(sourceFiles,1548);assert.equal(inputs,1695);','assert.equal(sourceFiles,1548);assert.equal(inputs,1694);')],
 ['original model assertion','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text.replace('d.models.pop();','d.models.slice();')],
 ['original clinical refusal','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text.replace("['invented clinical approval',p=>{p.clinicalApproval=true;}]","['invented clinical approval',p=>{p.clinicalApproval=false;}]")],
 ['original emitted hash proof','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text.replace('assert.equal(sha(bytes),row.sha256,path);','assert.equal(sha(bytes),sha(bytes),path);')],
 ['later whole-original proof','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text.slice(0,text.indexOf("\ntest('complete f509 source and whole original contracts"))],
 ['unknown appended code','fixtures/current-delivery-test-before-roving.mjs.raw',text=>text+'\nconst unknown=true;\n'],
`),
   seam("assert.throws(()=>readClosed56LiveCopy(liveName,{read:name=>name===liveName?read('fixtures/current-atlas-delivery-f5097af8.txt'):read(name)}));",
        "assert.throws(()=>readClosed56LiveCopy(liveName,{read:name=>name==='fixtures/current-delivery-test-before-roving.mjs.raw'?read('fixtures/current-atlas-delivery-f5097af8.txt'):read(name)}));"),
  ]);
});

test('prior inverse guard changes only archived inputs and role marker',()=>{
 prove('closed56-live-context-repair-contract.test.mjs','closed56-live-context-repair-contract-before-role-20261021.mjs.raw',
  'e44381435701b71f17cf3144f2d7d017e03fede6b012a1e6b6f7473a3391bff5',old=>[
   seam('for(const [name,before,proposal,invert,mutation]of [',
        'for(const [name,archived,before,proposal,invert,mutation,currentMarker]of ['),
   seam(" [helper,'573ca775702fdca31cb22a03640a61e8510714b71bd60499244fa249148ea9e7',",
        " [helper,'fixtures/closed56-live-preservation-before-role-20261021.mjs.raw','573ca775702fdca31cb22a03640a61e8510714b71bd60499244fa249148ea9e7',"),
   seam("  \"assert.equal(intermediate,f509,'Every original assertion must survive the four observed 46c-to-f509 seams')\"],",String.raw`  "assert.equal(intermediate,f509,'Every original assertion must survive the four observed 46c-to-f509 seams')",
  'The later witness retains its own 87ed introduction source'],`),
   seam(" [guard,'f64cc09e90dbdfc11fd3b93022282aa259900baf24fc7365ee9685a2209f21af',",
        " [guard,'fixtures/closed56-live-preservation-test-before-role-20261021.mjs.raw','f64cc09e90dbdfc11fd3b93022282aa259900baf24fc7365ee9685a2209f21af',"),
   seam('  "assert.throws(()=>readClosed56LiveCopy(liveName,{read:alter(path,change)}))"],',String.raw`  "assert.throws(()=>readClosed56LiveCopy(liveName,{read:alter(path,change)}))",
  'historical observed count'],`),
   seam("test(name+' restores its complete pre-repair bytes'", "test(name+' retains its complete pre-role and pre-repair witnesses'"),
   seam('const bytes=read(name),text=bytes.toString(\'utf8\');',"const bytes=read(archived),text=bytes.toString('utf8');"),
   seam(' assert(text.includes(mutation));'," assert(text.includes(mutation));\n assert(read(name).toString('utf8').includes(currentMarker),'Current guard still checks the archived source role');"),
  ]);
});
