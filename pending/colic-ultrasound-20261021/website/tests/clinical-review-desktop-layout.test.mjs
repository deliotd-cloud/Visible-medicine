import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import postcss from 'postcss';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const adapter='components/review-ui-variants.css';
const marker='/* Keep the selected model and worksheet responsive to the paper\'s actual width. */';
const oldCssSha='bf42eda18eed6d388e6f3204cab87df01270628f32e8e1e0cc7896e651a73ee7';
const old=JSON.parse(read('tests/fixtures/current-atlas-delivery-before-desktop-layout.json'));
// Independently restored, source-only 6036 recovery; absence or byte drift fails closed.
const historicalRoot='F:/VisibleMedicine/recovery/checkpoints/20261020-checkout-history-website-backup/remote-source-restored';
const readHistorical=p=>readFileSync(historicalRoot+'/'+p);

test('pre-layout delivery stays immutable within the frozen a247 delivery epoch',()=>{
 assert.equal(sha(read('tests/fixtures/current-atlas-delivery-before-desktop-layout.json')),'1dc2a730c32e6ae8181ec5c1de99dd2b82522b5271273c09badfa69e39e679aa');
 const current=JSON.parse(read('tests/fixtures/tongue-palate-a247/current-atlas-delivery.json.raw'));
 assert.equal(sha(read('tests/fixtures/tongue-palate-a247/current-atlas-delivery.json.raw')),'e5815a25fbf2c62e6f428dd25652f185cd3d16e2c56741686de12f3f13863939');
 for(const key of ['schema','source','sourceTree','reviewSourceFiles','viewerFiles','viewerPackages'])assert.equal(current[key],old[key],key);
 const changed=['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json'];
 for(const [path,digest]of Object.entries(old.documents))if(!changed.includes(path))assert.equal(current.documents[path],digest,path);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:old}),'Old Review binding is not admitted as current');
});

test('exact inverse chain preserves the one-input desktop layout transition',()=>{
 const binding=JSON.parse(read('tests/fixtures/tongue-palate-a247/integration-inputs.json.raw'));
 assert.equal(sha(read('tests/fixtures/tongue-palate-a247/integration-inputs.json.raw')),'fbfc46e133abdba14046174bc709770c3a0c938c85b5c00b6dd4126c6cd51df7');
 assert.equal(binding.inputs.length,1682);
 // Rewind only the exact later authored-link host patch before the CSS-era proof.
 const guided=binding.inputs.filter(row=>row.path==='components/HeadAtlasGuidedModel.tsx');
 assert.equal(guided.length,1);assert.equal(guided[0].sha256,sha(read('tests/fixtures/live-learning-original-HeadAtlasGuidedModel.tsx.raw')));
 assert.equal(guided[0].sha256,'cfaf695e1e6bd418fe6f2a1416cc18094aab7d7509ecc61396d4f55a37d37499');
 guided[0].sha256='d461124c39f2b837d37473c7951709a992f22e7482dc64ceef5ba145f12d30f1';
 assert.equal(sha(JSON.stringify(binding.inputs)),'2800d098fc42723470c7a74e3c9aa481c7faf0734450f0b9c0f05eeb8842133f');
 const inverse=structuredClone(binding.inputs),row=inverse.filter(r=>r.path===adapter);
 assert.equal(row.length,1);assert.notEqual(row[0].sha256,oldCssSha);
 assert.equal(row[0].sha256,sha(read(adapter)));
 row[0].sha256=oldCssSha;
 assert.equal(sha(JSON.stringify(inverse)),old.reviewIntegration,'No unrelated input, source, decision or access edit');
});

test('layout appends scoped CSS without changing prior styles or hiding review controls',()=>{
 assert.equal(sha(read('app/workspace/atlas-review/website-review.css')),'acd14e1c9a23f62fe86de0778d07b74ac23c19b62d63941858906a941ac77c0b','Shared schematic presentation input is unchanged');
 for(const path of ['app/globals.css','atlas-review/app/globals.css'])assert(read(path).toString().includes('components/review-ui-variants.css'),'Existing stylesheet entry: '+path);
 const css=read(adapter).toString(),index=css.indexOf(marker);
 assert(index>0);assert.equal(index,css.lastIndexOf(marker));
 assert.equal(sha(css.slice(0,index-1)),oldCssSha,'Original adapter prefix remains byte exact');
 const added=postcss.parse(css.slice(index));
 const allowed=new Set(['container','grid-template-columns','gap','padding','margin']);
 added.walkDecls(d=>{assert(allowed.has(d.prop),d.prop);assert(!/none|hidden|clip|absolute|fixed|!important/.test(d.value));});
 added.walkRules(rule=>assert(rule.selector.startsWith('.website-clinical-review '),rule.selector));
 const query=added.nodes.find(n=>n.type==='atrule'&&n.name==='container');
 assert.equal(query.params,'clinical-review-paper (min-width:40rem)');
 const media=added.nodes.find(n=>n.type==='atrule'&&n.name==='media');
 assert.equal(media.params,'(min-width:1000px) and (max-width:1199px)');
});

test('real source wrappers and preview retain worksheet context, minimum canvas and controls',()=>{
 for(const [file,selected,worksheet]of [
  ['atlas-review/app/review/body/review-dashboard.tsx','body-review-selected','body-review-worksheet'],
  ['atlas-review/app/review/review-dashboard.tsx','review-selected','review-worksheet'],
 ]){
  const text=read(file).toString();assert(text.includes(selected));assert(text.includes(worksheet));assert(text.includes('ReviewModelPreview'));
 }
 const component=read('atlas-review/app/review/review-model-preview.tsx').toString();
 for(const text of ['Worksheet revision','Hide model','Show model','Inspection does not record approval'])assert(component.includes(text),text);
 const css=read('atlas-review/app/review/review-model-preview.css').toString();
 assert(css.includes('clamp(420px, 65dvh, 760px)')||css.includes('clamp(420px,65dvh,760px)'));
 assert(css.includes('focus-visible'));
});

test('6036 teaching upgrade keeps actual layout, worksheet and navigation inputs unchanged',()=>{
 const historicalPinBytes=readHistorical('tests/fixtures/current-atlas-delivery.json');
 assert.equal(sha(historicalPinBytes),'0ee28eaffe4fc13e32f124d7d48eea18e90b34f3cfaf1a55959fdabba90e573a');
 const current=validateHistoricalAtlasDelivery({pin:JSON.parse(historicalPinBytes),root:historicalRoot,read:readHistorical});
 assert.equal(current.source,'6036a7a59dcc1fd75eee4a23af34ca2a568d86b6');
 assert.equal(current.sourceTree,'6da62962106cfab9419b09618547a9da5e3aafc6');
 assert.equal(current.reviewSourceFiles,1548);
 const before=JSON.parse(read('tests/fixtures/tongue-palate-a247/integration-inputs.json.raw'));
 const historicalBindingBytes=readHistorical('atlas-review/integration-inputs.json');
 assert.equal(sha(historicalBindingBytes),'db650d87553c6e5f7830c4a19ad503a2ebdc4d8013d8344221ae03517357d0f7');
 const binding=JSON.parse(historicalBindingBytes);
 assert.equal(binding.inputs.length,1685);
 const oldRows=new Map(before.inputs.map(row=>[row.path,row]));
 const changed=binding.inputs.filter(row=>oldRows.get(row.path)?.sha256!==row.sha256);
 assert.deepEqual(changed.map(row=>row.path).sort(),[
  'atlas-review/app/body-content.ts','atlas-review/content/body-review-display-pins.json',
  'atlas-review/content/regional-teaching/head-neck.json','atlas-review/content/tongue-palate-quiz-pins.json',
  'atlas-review/content/tongue-palate-quiz.ts','atlas-review/lib/tongue-palate-quiz.ts',
  'atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','scripts/import-clinical-review.mjs',
  'docs/anatomy-coverage/index.json','lib/anatomy-coverage-view.ts',
 ].sort());
 assert.equal(changed.filter(row=>!oldRows.has(row.path)).length,3);
 assert.equal(before.inputs.length-changed.filter(row=>oldRows.has(row.path)).length,1675);
 assert(before.inputs.every(row=>binding.inputs.some(now=>now.path===row.path)));
 for(const row of binding.inputs)assert.equal(row.sha256,sha(readHistorical(row.path)),row.path);
 assert.throws(()=>validateCurrentAtlasDelivery({pin:JSON.parse(read('tests/fixtures/tongue-palate-a247/current-atlas-delivery.json.raw'))}));
});

test('current delivery remains separately bound to the clean Atlas source',()=>{
 const previousBytes=read('tests/fixtures/source190-admission/previous-current.json');
 assert.equal(sha(previousBytes),'7f08673542eedf10d211b4668aad93efc65ab7854d6141ec409512edd3785eba');
 const previous=JSON.parse(previousBytes);
 assert.equal(previous.source,'485df97c2530e8e81a8d39a5ee61073ce76d93db');
 assert.equal(previous.sourceTree,'f5af5162af89bae05b9ece240f6f158401c5bd15');
 assert.equal(previous.reviewIntegration,'57663bdf62246dac62ef8a51e762432a711ab2f042d09b69ec1a34c23b8e4703');
 assert.equal(previous.reviewSourceFiles,1550);
 assert.equal(previous.documents['atlas-review/integration-inputs.json'],'44757c9c194681de4098fb3c509c2013ac20d2295a99af676f14a716f199a5a9');
 assert.throws(()=>validateCurrentAtlasDelivery({pin:previous}),'Historical 485 cannot be accepted as the current delivery');
 const current=validateCurrentAtlasDelivery();
 assert.equal(current.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(current.sourceTree,'e9165d7122361f809a267af1414b337b69097fe2');
 assert.equal(current.reviewIntegration,'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59');
 assert.equal(current.reviewSourceFiles,1558);
 const bindingBytes=read('atlas-review/integration-inputs.json');
 assert.equal(sha(bindingBytes),'325359cf86b75fd2d35661c9b3d051924a719c794f9f298b3174d77f8173fb76');
 assert.equal(JSON.parse(bindingBytes).inputs.length,1721);
 currentAtlasDeliveryRoot();
});

test('all four original layout assertions reconstruct exactly across the declared epoch boundary',()=>{
 const raw=read('tests/fixtures/tongue-palate-a247/clinical-review-desktop-layout.test.mjs.raw');
 assert.equal(sha(raw),'2c82f5fe68a43010f4bbe28281e668a9ed213b333f1e39746c3e95d0976377a5');
 const source=read('tests/clinical-review-desktop-layout.test.mjs').toString();
 const marker="\ntest('6036 teaching upgrade keeps actual layout, worksheet and navigation inputs unchanged'";
 assert.equal(source.split(marker).length,2);
 let original=source.slice(0,source.indexOf(marker));
 const inverse=(from,to)=>{assert.equal(original.split(from).length,2);original=original.replace(from,to);};
 inverse("import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';",
  "import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';");
 inverse("import {validateCurrentAtlasDelivery as validateHistoricalAtlasDelivery} from './fixtures/closed56-validator/tests/current-atlas-delivery.mjs';\n",'');
 inverse("// Independently restored, source-only 6036 recovery; absence or byte drift fails closed.\nconst historicalRoot='F:/VisibleMedicine/recovery/checkpoints/20261020-checkout-history-website-backup/remote-source-restored';\nconst readHistorical=p=>readFileSync(historicalRoot+'/'+p);\n",'');
 inverse("test('pre-layout delivery stays immutable within the frozen a247 delivery epoch'",
  "test('pre-layout delivery stays immutable; learner/model delivery is unchanged'");
 inverse(" const current=JSON.parse(read('tests/fixtures/tongue-palate-a247/current-atlas-delivery.json.raw'));\n assert.equal(sha(read('tests/fixtures/tongue-palate-a247/current-atlas-delivery.json.raw')),'e5815a25fbf2c62e6f428dd25652f185cd3d16e2c56741686de12f3f13863939');\n",
  ' const current=validateCurrentAtlasDelivery();\n');
 inverse(" const binding=JSON.parse(read('tests/fixtures/tongue-palate-a247/integration-inputs.json.raw'));\n assert.equal(sha(read('tests/fixtures/tongue-palate-a247/integration-inputs.json.raw')),'fbfc46e133abdba14046174bc709770c3a0c938c85b5c00b6dd4126c6cd51df7');\n",
  " const binding=JSON.parse(read('atlas-review/integration-inputs.json'));\n");
 inverse("assert.equal(guided[0].sha256,sha(read('tests/fixtures/live-learning-original-HeadAtlasGuidedModel.tsx.raw')))",
  "assert.equal(guided[0].sha256,sha(read(guided[0].path)))");
 assert.equal(original,raw.toString(),'Original CSS, context, controls, inverse and refusal assertions retained');
});
