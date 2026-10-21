import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const read=path=>readFileSync(new URL(path,import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const one=(text,before,after)=>{
 assert.equal(text.split(before).length,2,'one declared seam: '+before.slice(0,90));
 return text.replace(before,after);
};
const exact=(current,frozen,digest,seams)=>{
 const prior=read('fixtures/body-learning-layout-history/'+frozen),actual=read(current);
 assert.equal(sha(prior),digest,'canonical test original: '+frozen);
 let expected=prior.toString();
 for(const [from,to]of seams)expected=one(expected,from,to);
 assert.equal(actual.toString(),expected,'all pre-existing assertions survive outside declared seams: '+current);
 let inverse=actual.toString();
 for(const [from,to]of seams.toReversed())inverse=one(inverse,to,from);
 assert.equal(inverse,prior.toString(),'exact whole-source inverse: '+current);
};

test('desktop layout keeps complete a247 and 6036 history outside current admission seams',()=>{
 exact('clinical-review-desktop-layout.test.mjs','clinical-review-desktop-layout-original.test.mjs.raw',
  'afc346bc245238ecc9469b64a39b9db472f9d7e1d4aa12389d25031e1ae29de3',[
  ["import postcss from 'postcss';\nimport {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\n\nconst read",
   "import postcss from 'postcss';\nimport {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\nimport {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';\n\nconst read"],
  ["assert.equal(guided.length,1);assert.equal(guided[0].sha256,sha(read(guided[0].path)))",
   "assert.equal(guided.length,1);assert.equal(guided[0].sha256,sha(read('tests/fixtures/live-learning-original-HeadAtlasGuidedModel.tsx.raw')))"],
  ["const current=validateCurrentAtlasDelivery({pin:JSON.parse(historicalPinBytes),root:historicalRoot,read:readHistorical})",
   "const current=validateHistoricalAtlasDelivery({pin:JSON.parse(historicalPinBytes),root:historicalRoot,read:readHistorical})"],
  ["assert.equal(current.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9')","assert.equal(current.source,'0dfce15890cafc0a2b8e309193531daa29a672ed')"],
  ["assert.equal(current.sourceTree,'c314f1cbfa394caed4c6874864fda7dea0a3286c')","assert.equal(current.sourceTree,'18f4fa612d0209123488a9104c2e26089b06cfe3')"],
  ["assert.equal(current.reviewIntegration,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f')","assert.equal(current.reviewIntegration,'d5dbb01222de26c1ffcb8adcc754f53b4e87a787d19e9ab5ba3498cfcc8963c9')"],
  ["assert.equal(current.reviewSourceFiles,1553)","assert.equal(current.reviewSourceFiles,1556)"],
  ["assert.equal(sha(bindingBytes),'69092b905e27e50b748a73344214a050e35cd4eb345bcebe19887b6867b8b82d')","assert.equal(sha(bindingBytes),'1ff0122debc54ff429998ac9bfc669a0d2ced1563a9c3101024c655db6e9b930')"],
  ["assert.equal(JSON.parse(bindingBytes).inputs.length,1710)","assert.equal(JSON.parse(bindingBytes).inputs.length,1719)"],
  ["  \"import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\");",
   "  \"import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';\");\n inverse(\"import {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';\\n\",'');"],
  ["  \" const binding=JSON.parse(read('atlas-review/integration-inputs.json'));\\n\");",
   "  \" const binding=JSON.parse(read('atlas-review/integration-inputs.json'));\\n\");\n inverse(\"assert.equal(guided[0].sha256,sha(read('tests/fixtures/live-learning-original-HeadAtlasGuidedModel.tsx.raw')))\",\n  \"assert.equal(guided[0].sha256,sha(read(guided[0].path)))\");"],
 ]);
});

test('closed53/54 source, model, register and negative proofs remain exact',()=>{
 exact('head-manual-recovery-53-to-54-closed.test.mjs','head-manual-recovery-53-to-54-closed-original.test.mjs.raw',
  '44447da331496d3685c360eda3199cc18fa7a194cb556384167f33ccbf979dae',[
  ["import {revision53,readRevision53,validateRevision53Delivery} from './historical-head-manual-recovery-delivery-53.mjs';",
   "import {revision53,readRevision53} from './historical-head-manual-recovery-delivery-53.mjs';\nimport {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';\nimport {validateCurrentAtlasDelivery as validateLiveAtlasDelivery} from './current-atlas-delivery.mjs';"],
  ["  assert.equal(validateRevision53Delivery().reviewIntegration,revision53.review);",
   "  const closed53=validateHistoricalAtlasDelivery({pin:JSON.parse(readRevision53('tests/fixtures/current-atlas-delivery.json')),read:readRevision53});\n  assert.equal(closed53.reviewIntegration,revision53.review);"],
  ["  assert.throws(()=>validateCurrentAtlasDelivery({pin:validateRevision53Delivery()}));",
   "  assert.throws(()=>validateCurrentAtlasDelivery({pin:closed53}));\n  assert.throws(()=>validateLiveAtlasDelivery({pin:closed53}));"],
 ]);
});

test('closed54/55 provider retains five full reader proofs with only three headmanual forward seams',()=>{
 const branch=` if(name===rows[2][0]){
  source=once(source,"import {revision53,readRevision53,validateRevision53Delivery} from './historical-head-manual-recovery-delivery-53.mjs';",
   "import {revision53,readRevision53} from './historical-head-manual-recovery-delivery-53.mjs';\\nimport {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';\\nimport {validateCurrentAtlasDelivery as validateLiveAtlasDelivery} from './current-atlas-delivery.mjs';");
  source=once(source,"  assert.equal(validateRevision53Delivery().reviewIntegration,revision53.review);",
   "  const closed53=validateHistoricalAtlasDelivery({pin:JSON.parse(readRevision53('tests/fixtures/current-atlas-delivery.json')),read:readRevision53});\\n  assert.equal(closed53.reviewIntegration,revision53.review);");
  return once(source,"  assert.throws(()=>validateCurrentAtlasDelivery({pin:validateRevision53Delivery()}));",
   "  assert.throws(()=>validateCurrentAtlasDelivery({pin:closed53}));\\n  assert.throws(()=>validateLiveAtlasDelivery({pin:closed53}));");
 }`;
 exact('closed54-55-provider-preservation.test.mjs','closed54-55-provider-preservation-original.test.mjs.raw',
  '3ad806905ee65d0a1e7fefa50cd58bf51c73419d899e62df6e89bc2dc531f5ae',[
  [' if(name===rows[2][0])return source;',branch],
 ]);
});

test('shoulder harness retains all original assertions with the real learning consumer',()=>{
 exact('atlas-shoulder-navigation-current.test.mjs','atlas-shoulder-navigation-current-original.test.mjs.raw',
  '1b0d2c84440379db35adcbbc73ee01cac7ea347322d6be4bbf4f59f8f03041cb',[
  ["import {structures} from '../atlas-review/app/anatomy-data.ts';",
   "import {structures} from '../atlas-review/app/anatomy-data.ts';\nimport {liveLearningConsumerModule} from './live-learning-consumer-loader-transition.mjs';"],
  ["  './atlas-runtime-frame.css':{},","  './atlas-runtime-frame.css':{},\n  './AtlasBodyLearning':liveLearningConsumerModule,"],
 ]);
 const before=read('fixtures/live-learning-original-AtlasRuntimeFrame.tsx.raw');
 assert.equal(sha(before),'673f6b25ab720fc250b7d55b04fd8571e5b2bc077a5bc1f69e984aabb624b234');
 const current=read('../components/AtlasRuntimeFrame.tsx').toString();
 let expected=before.toString();
 expected=one(expected,"import './atlas-runtime-frame.css';","import './atlas-runtime-frame.css';\nimport {AtlasBodyLearning} from './AtlasBodyLearning';");
 expected=one(expected,'      allowFullScreen={allowFullScreen} onLoad={onLoad} onError={onError}/>',
  '      allowFullScreen={allowFullScreen} onLoad={onLoad} onError={onError}/>\n    <AtlasBodyLearning frame={frame} src={src}/>');
 assert.equal(current,expected,'runtime frame preserves its complete pre-existing behavior outside two additive seams');
});
