import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {restorePreNeckPin2381,restorePreNeckDelivery2381,restorePreNeckHeadTeaching2381,restorePrePresentationViewer2381} from './tests/zero-registration-current-roles-inverse.mjs';

const website='F:/VisibleMedicine/staging/20261022-corpus-cranio-assurance/website';
const stage='F:/VisibleMedicine/staging/20261022-zero-registration-current-admission';
const base=join(website,'tests');
const read=path=>readFileSync(join(website,path));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const imp=async name=>import(pathToFileURL(join(base,name)).href);
const {beforeSurfaceBinder}=await imp('surface-binder-history-inverse.mjs');
const {restorePracticeExitViewer}=await imp('head-practice-exit-inverse.mjs');
const {restoreHeadToolsBefore20261022}=await imp('head-tools-epoch-20261022.mjs');
const {restorePreExpansionFrame}=await imp('expansion-frame-adoption-inverse.mjs');

const pin=JSON.parse(restorePreNeckPin2381(read('tests/fixtures/current-atlas-delivery.json'),
 read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.json')));
restorePreNeckDelivery2381(read('tests/current-atlas-delivery.test.mjs'),
 read('tests/fixtures/current-atlas-delivery-before-neck-xray-20261022.mjs.raw'));
const old=JSON.parse(read('tests/fixtures/colic-fa1-preimage/current-atlas-delivery.json.raw'));
assert.equal(old.source,'fa1bf9a233c6989fef42b533bbbac9d6ab034311');
assert.equal(pin.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');

const fa='tests/fixtures/colic-fa1-preimage/';
const faInputs=new Set(['atlas-review/app/body-content.ts','atlas-review/content/body-review-display-pins.json',
 'atlas-review/content/regional-teaching/abdomen.json','docs/anatomy-coverage/index.json',
 'lib/anatomy-coverage-view.ts','scripts/import-clinical-review.mjs']);
const faLater=new Set(['atlas-review/app/body-explorer.tsx','atlas-review/app/eye-layers.tsx',
 'atlas-review/app/review/review-dashboard.tsx','atlas-review/app/ventricles.tsx',
 'atlas-review/lib/head-selection-channel.ts','atlas-review/lib/regional-tours.ts',
 'atlas-review/lib/renal-tour.ts','components/HeadAtlasComparisonNavigation.tsx',
 'components/HeadAtlasGuidedModel.tsx','components/HeadAtlasInlineComparison.tsx',
 'components/HeadAtlasLinkedModel.tsx']);
const frame=Buffer.from(restorePreExpansionFrame(read('components/AtlasRuntimeFrame.tsx').toString()));
assert.deepEqual(frame,read('tests/fixtures/atlas-runtime-expansion-before-20261022/AtlasRuntimeFrame.tsx.raw'));
const preSurface=beforeSurfaceBinder(read('scripts/bind-clinical-review.mjs').toString(),
 read('tests/fixtures/head-surface-before-20261022/scripts__bind-clinical-review.mjs.raw').toString());
const addition="  'components/atlas-runtime-expansion.ts','components/atlas-runtime-frame.css',\n";
assert.equal(preSurface.split(addition).length,2);
const binder=Buffer.from(preSurface.replace(addition,''));
assert.deepEqual(binder,read('tests/fixtures/atlas-runtime-expansion-before-20261022/bind-clinical-review.mjs.raw'));
const viewer=Buffer.from(restoreHeadToolsBefore20261022(
 restorePrePresentationViewer2381(read('components/HeadAtlasViewer.tsx'),restorePracticeExitViewer),
 read('tests/fixtures/head-toolbar-before-compaction-20261022.tsx.raw')));
const headTeaching=restorePreNeckHeadTeaching2381(read('atlas-review/content/regional-teaching/head-neck.json'));
const importer=read('tests/fixtures/head-surface-before-20261022/lib__head-atlas-import.ts.raw');
assert.equal(sha(importer),'9fcb349f19c69fee2a6221870a0db3de090c7cd2265b98f6a04d87c9d6098b57');
const historical=path=>Object.hasOwn(old.documents,path)?read(fa+'documents/'+path+'.raw'):
 faInputs.has(path)?read(fa+'binding-inputs/'+path+'.raw'):
 faLater.has(path)?readFileSync(join(stage,'tests/fixtures/zero-registration-fa1-binding',path)):
 path==='components/AtlasRuntimeFrame.tsx'?frame:
 path==='scripts/bind-clinical-review.mjs'?binder:
 path==='components/HeadAtlasViewer.tsx'?viewer:
 path==='atlas-review/content/regional-teaching/head-neck.json'?headTeaching:
 path==='lib/head-atlas-import.ts'?importer:read(path);

const bindings=JSON.parse(historical('atlas-review/integration-inputs.json'));
assert.equal(bindings.inputs.length,1719);
assert.equal(sha(JSON.stringify(bindings.inputs)),old.reviewIntegration);
const mismatches=bindings.inputs.filter(row=>sha(historical(row.path))!==row.sha256).map(row=>row.path);
assert.deepEqual(mismatches,[],'Unrecovered historical binding roles');
for(const path of Object.keys(old.documents))assert.equal(sha(historical(path)),old.documents[path],path);
const files=['drawable-epoch-current-admission.test.mjs','expanded-review-delivery-admission.test.mjs'];
const originals=['269e7af836b93760fcf460bf39ce1be296a96c1549452b04076a38a52d24c9ce',
 'e4ee6d1670ec14b6f5f7b722ae4b9958225ee1886aff82513e4e1a74301b8872'];
for(let i=0;i<files.length;i++)assert.equal(sha(read('tests/'+files[i])),originals[i],files[i]+' exact preimage');
for(const [name,title,reader] of [
 [files[0],'complete original drawable admission source survives named current roles',
  'readFileSync(fileURLToPath(import.meta.url),\'utf8\')'],
 [files[1],'complete original expanded Review admission source survives named current roles',
  "readFileSync(new URL('./expanded-review-delivery-admission.test.mjs',import.meta.url),'utf8')"],
]){
 const filePath=join(stage,'tests',name),source=readFileSync(filePath,'utf8');
 const opening=`test('${title}',()=>{`;
 const at=source.lastIndexOf(opening),end=source.lastIndexOf('\n});');
 assert(at>=0&&end>at&&source.indexOf(opening)===at,`One source inverse witness: ${name}`);
 const body=source.slice(at+opening.length,end).replace(reader,'readFileSync(filePath,\'utf8\')');
 assert(!body.includes('import.meta.url'),`Source-only witness reader: ${name}`);
 new Function('assert','readFileSync','sha','filePath',body)(assert,readFileSync,sha,filePath);
}
console.log(JSON.stringify({sourceOnly:true,exact2381PinInverse:true,exactCurrentDeliveryTestInverse:true,
 fa1InputRows:bindings.inputs.length,fa1Documents:Object.keys(old.documents).length,
 headViewerRoles:['practice-exit','presentation','toolbar'],originalTestPreimages:files}));
