import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const hashes = Object.freeze({
  receipt: 'cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e',
  b79Receipt: 'd2c288a5be7b54dda220a0f539e72c15988f63543124323c5b08c60533950df2',
  b79Pin: 'c6ae4cccc92593ab75982b1d0ad1c10f3ee2b4f408c85e86bf0a94460365bad0',
  tourHelper: '56534358796baebd68291bda23afa5e19f01c47462f6c4ff14a132499d93db8f',
  deliveryHelper: '02dd815603c922dedbdc5a5fce270fbda736b81220e335d750dcbec1124c833e',
  milestoneRegistry: '33e4deca7d8c2fed6cab7753ab9a6671fbaeb73e5c26a49bda42274b782b68e1',
  currentRegistry: '485d3153101e3481eab586108053a824111d732f4dd48ef3f81c07b40e2a39c5',
  fdaCatalogue: '56cf325c006a00e4349a6b45844797800a11c005448d32a08f40e64664288b44',
});
export const pre = Object.freeze({
  'adjacent-current-tour-source-roles.test.mjs': '7ec572e4493961965d5c7b0204d323f26d0d253e14d412673ad7b2e7647406a9',
  'adjacent-shoulder-source-roles.test.mjs': 'edbd7db6962055a068a87450cdbde4ddc24a0457c78241cbb1a4b599f89d9fdb',
  'arterial-history-preservation.test.mjs': 'c4697cc3a83d1515a434d07e680790a9d494174cd45b801d3db7b67f5471d05e',
  'atlas-back-topic-completion.test.ts': 'd4767a7a19c9fdfb8967c1fa345c374cfc4031bb8b3f26c0af3eff70dfe86ca6',
});
export const post = Object.freeze({
  'adjacent-current-tour-source-roles.test.mjs': 'a5651afdbcc8ea2ee26766f756628298a2b68b793745bf41ee8c4bbedbf87113',
  'adjacent-shoulder-source-roles.test.mjs': 'b90d6c6f0b5f58150528ba874aac043a7e2150b173ae252940251c40e0d16c32',
  'arterial-history-preservation.test.mjs': '1bcfc68aadeed2a1dfd2ae14ab117f62718debf245b0f53307c7c89795661008',
  'atlas-back-topic-completion.test.ts': 'abf8805953e77b91596ee1f775b29f15961976c8ea60a4ed19da2f092844944e',
});

const tour = 'adjacent-current-tour-source-roles.test.mjs';
const shoulder = 'adjacent-shoulder-source-roles.test.mjs';
const arterial = 'arterial-history-preservation.test.mjs';
const back = 'atlas-back-topic-completion.test.ts';
const one = (a, b) => ({a, b});
const replacements = Object.freeze({
  [tour]: [
    one("import {assertCurrentTourSource,assertCurrentTourDelivery,assertCompleteGuidedReview} from './adjacent-current-tour-source-role.mjs';", "import {assertCurrentTourSource,assertCurrentTourDelivery,assertCompleteGuidedReview} from 'file:///F:/VisibleMedicine/staging/20261024-adjacent-regression-current/website/tests/adjacent-current-tour-source-role.mjs';"),
    one('const transition=JSON.parse(transitionBytes);', `const transition=JSON.parse(transitionBytes);\nassert.equal(sha(readFileSync('F:/VisibleMedicine/staging/20261024-adjacent-regression-current/website/tests/adjacent-current-tour-source-role.mjs')),\n '56534358796baebd68291bda23afa5e19f01c47462f6c4ff14a132499d93db8f');\nconst historicalAtlas='F:/VisibleMedicine/staging/20261024-cervical-vascular-website/atlas';`),
    one(' const atlasRoot=process.env.VM_ATLAS_SOURCE_REPO;assert(atlasRoot);', ' const atlasRoot=historicalAtlas;assert(atlasRoot);'),
  ],
  [shoulder]: [
    one("import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';", "import {validateCurrentAtlasDelivery as validateDelivery} from './current-atlas-delivery.mjs';"),
    one(" env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});", ` env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});\n\nconst b79Stage='F:/VisibleMedicine/staging/20261024-cervical-vascular-website';\nconst b79Site=b79Stage+'/website',b79Root=b79Stage+'/atlas';\nfunction validateCurrentAtlasDelivery(){\n const receiptBytes=readFileSync(b79Stage+'/SOURCE_BOUND.json');\n assert.equal(sha(receiptBytes),'d2c288a5be7b54dda220a0f539e72c15988f63543124323c5b08c60533950df2');\n const receipt=JSON.parse(receiptBytes);\n assert.equal(receipt.atlasHead,'b79e110d2d28f18993263926ba35aa7a3f478b20');\n assert.equal(receipt.atlasTree,'0dd97cc55ef9aff3493b91752309d1d661c0b0c8');\n const pinPath='tests/fixtures/current-atlas-delivery.json';\n const pinBytes=readFileSync(b79Site+'/'+pinPath);\n assert.equal(sha(pinBytes),receipt.sourceRows.find(row=>row.path===pinPath)?.sha256);\n return validateDelivery({pin:JSON.parse(pinBytes),root:b79Site,\n  read:path=>readFileSync(b79Site+'/'+path)});\n}\nfunction checkedB79HistoryRepo(revision){\n checkedAtlasHistoryRepo(revision);\n assert.equal(git(b79Root,['rev-parse','HEAD']).toString().trim(),'b79e110d2d28f18993263926ba35aa7a3f478b20');\n assert.equal(git(b79Root,['rev-parse','HEAD^{tree}']).toString().trim(),'0dd97cc55ef9aff3493b91752309d1d661c0b0c8');\n assert.equal(git(b79Root,['status','--porcelain']).toString().trim(),'');\n return b79Root;\n}`),
    one("test('authenticated 190a shoulder role remains separate from exact b79 delivery',()=>{\n const current=validateCurrentAtlasDelivery();\n assert.equal(assertHistoricalShoulderSourceRole(current),historical);\n const root=checkedAtlasHistoryRepo(historical);", "test('authenticated 190a shoulder role remains separate from exact b79 delivery',()=>{\n const current=validateCurrentAtlasDelivery();\n assert.equal(assertHistoricalShoulderSourceRole(current),historical);\n const root=checkedB79HistoryRepo(historical);"),
    one("test('every historical shoulder input matches the independent 190a Git source',()=>{\n const root=checkedAtlasHistoryRepo(historical);", "test('every historical shoulder input matches the independent 190a Git source',()=>{\n const root=checkedB79HistoryRepo(historical);"),
  ],
  [arterial]: [
    one("import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';", "import {CURRENT_ATLAS_REVISION} from 'file:///F:/VisibleMedicine/staging/20261024-adjacent-regression-current/website/tests/current-atlas-delivery.mjs';"),
  ],
  [back]: [
    one("const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');", `const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');\n// Compare both teaching states against the complete milestone registry.\nconst milestoneRegistryBytes = milestoneWebsiteBytes('atlas-review/lib/specimen-review-material.ts');\nassert.equal(sha256(milestoneRegistryBytes),\n  '33e4deca7d8c2fed6cab7753ab9a6671fbaeb73e5c26a49bda42274b782b68e1');`),
    one("    plugins: revision === 'latest' ? [] : [{name: 'historical-back-topic-teaching', setup(plugin) {", `    plugins: revision === 'latest' ? [] : [{name: 'historical-back-topic-teaching', setup(plugin) {\n      plugin.onLoad({filter: /[\\\\/]lib[\\\\/]specimen-review-material\\.ts$/, args => ({\n        contents: milestoneRegistryBytes.toString('utf8'), loader: 'ts', resolveDir: dirname(args.path),\n      }));`),
    one("test('356 source contexts stay fixed; 48 back teaching changes reject 144 stale or foreign submissions before storage', {timeout: 120000}, async () => {", `test('356 source contexts stay fixed; 48 back teaching changes reject 144 stale or foreign submissions before storage', {timeout: 120000}, async () => {\n  const currentRegistryBytes = readFileSync('atlas-review/lib/specimen-review-material.ts');\n  assert.equal(sha256(currentRegistryBytes),\n    '485d3153101e3481eab586108053a824111d732f4dd48ef3f81c07b40e2a39c5');\n  assert(!milestoneRegistryBytes.toString('utf8').includes('fdaSpecimenReviewRows'));\n  assert(currentRegistryBytes.toString('utf8').includes('...fdaSpecimenReviewRows'));\n  const fdaCatalogueBytes = readFileSync('atlas-review/public/models/fda-shoulder-draft/catalog.json');\n  assert.equal(sha256(fdaCatalogueBytes),\n    '56cf325c006a00e4349a6b45844797800a11c005448d32a08f40e64664288b44');\n  assert.deepEqual(JSON.parse(fdaCatalogueBytes.toString('utf8')).structures.map((s: any) => s.id), [\n    'vm:reference:fda-shoulder-fc9f3e56:ac-ligament',\n    'vm:reference:fda-shoulder-fc9f3e56:humeral-cartilage',\n    'vm:reference:fda-shoulder-fc9f3e56:labrum',\n    'vm:reference:fda-shoulder-fc9f3e56:clavicle',\n    'vm:reference:fda-shoulder-fc9f3e56:humerus-source',\n    'vm:reference:fda-shoulder-fc9f3e56:scapula',\n  ]);`),
  ],
});

function replaceExact(text, a, b) {
  assert(a.length && a !== b);
  const count = text.split(a).length - 1;
  assert.equal(count, 1, `Unique seam expected: ${a.slice(0, 70)}; found ${count}`);
  return text.replace(a, b);
}
function proof(e) {
  for (const [key, expected] of Object.entries(hashes)) {
    assert(Buffer.isBuffer(e?.[key]), `Missing authenticated ${key}`);
    assert.equal(sha(e[key]), expected, `Authenticated ${key} changed`);
  }
  const b79=JSON.parse(e.b79Receipt), live=JSON.parse(e.receipt);
  assert.equal(b79.atlasHead,'b79e110d2d28f18993263926ba35aa7a3f478b20');
  assert.equal(b79.atlasTree,'0dd97cc55ef9aff3493b91752309d1d661c0b0c8');
  assert.equal(live.atlasHead,'6e810b188dde401f6c19a970928f316a479696df');
  assert.equal(b79.sourceRows.find(r=>r.path==='tests/fixtures/current-atlas-delivery.json')?.sha256,hashes.b79Pin);
  assert.equal(e.history?.head,b79.atlasHead);
  assert.equal(e.history?.tree,b79.atlasTree);
  assert.equal(e.history?.status,'');
  assert.equal(e.history?.blob,'907286de2d2d7fbd5d6f74ff93e87977a54ef19e');
  const ids=JSON.parse(e.fdaCatalogue).structures.map(s=>s.id);
  assert.deepEqual(ids,['ac-ligament','humeral-cartilage','labrum','clavicle','humerus-source','scapula'].map(id=>`vm:reference:fda-shoulder-fc9f3e56:${id}`));
  assert(!e.milestoneRegistry.toString().includes('fdaSpecimenReviewRows'));
  assert(e.currentRegistry.toString().includes('...fdaSpecimenReviewRows'));
}
export function apply(name, bytes, evidence) {
  assert(pre[name], `Undeclared target: ${name}`);
  proof(evidence);
  assert.equal(sha(bytes),pre[name],`Wrong before SHA: ${name}`);
  const raw=bytes.toString('utf8');
  assert.deepEqual(Buffer.from(raw),bytes,`Non-UTF8 source: ${name}`);
  let text=raw;
  for (const {a,b} of replacements[name]) text=replaceExact(text,a,b);
  const result=Buffer.from(text);
  assert.equal(sha(result),post[name],`Wrong deterministic after SHA: ${name}`);
  return result;
}
export function restore(name, bytes, evidence) {
  assert(pre[name], `Undeclared target: ${name}`);
  proof(evidence);
  assert(post[name], `Missing sealed after SHA: ${name}`);
  assert.equal(sha(bytes),post[name],`Wrong after SHA: ${name}`);
  let text=bytes.toString('utf8');
  const changes=[...replacements[name]];
  for(const {a,b} of changes.reverse()) text=replaceExact(text,b,a);
  const result=Buffer.from(text);
  assert.equal(sha(result),pre[name],`Whole-file inverse failed: ${name}`);
  return result;
}
export const replacementSeams = replacements;
