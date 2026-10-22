// Pure source-byte admission proof. No website modules are imported or executed.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const stage=fileURLToPath(new URL('.',import.meta.url));
const source='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/website/tests/';
const sha=x=>createHash('sha256').update(x).digest('hex');
const bytes=p=>readFileSync(p);
const text=p=>bytes(p).toString('utf8');
const replaceOnce=(s,a,b)=>{
 assert.equal(s.split(a).length,2,'Unique complete-byte inverse seam: '+a.slice(0,64));
 return s.replace(a,b);
};
const files=[
 ['cervical-current-history-context-contract.test.mjs','942386357c90782e6d357d936f3d2b7646597e5313d0e126221448f0ee3af6b3'],
 ['cervical-history-preservation.test.mjs','a184ea1af69fb04164ea0da8d85a1829331dd7f77598e622b5649b1280eb3ed3'],
];
for(const [name,hash] of files){
 const original=bytes(stage+'RAW/tests/'+name),frozen=bytes(source+name);
 assert.equal(sha(original),hash);
 assert.deepEqual(original,frozen,'Raw preimage is exact frozen test: '+name);
 assert.equal(original.includes(13),false,'LF-only original');
}
const clinical=text(source+'clinical-review-cervical-disc-tour.test.ts');
const reviewed=text(source+'fixtures/expanded-viewer-test-types/clinical-review-cervical-disc-tour.test.ts.raw');
assert.equal(sha(Buffer.from(clinical)),'36b41c79a10d04fedc0bbb962accf58486ec2542f819e94aca3654d70a42f365');
assert.equal(sha(Buffer.from(reviewed)),'14e140f9979b17a168a70d92baa8e0eca3f8952db886aa3362f44d28577258cc');
let recovered=clinical;
for(const [newer,old] of [['const actual:ReviewPacket=','const actual='],['exact:ReviewPacket=source.bodyLesson','exact=source.bodyLesson']])
 recovered=replaceOnce(recovered,newer,old);
assert.equal(recovered,reviewed,'Two type-only seams recover the complete prior reviewed source');
const current=text(source+'atlas-cervical-projection-xray.test.mjs');
const prior=text(source+'fixtures/atlas-cervical-projection-xray-before-epoch-20261022.test.mjs.raw');
assert.equal(sha(Buffer.from(current)),'428fb397b7d5efff567754844a282223ee8ce8068fc0eb599413cbd7fe0621df');
assert.equal(sha(Buffer.from(prior)),'a5848c319f0df5d21105f2c7710b62a2d94c8858db4a63368ef3a9e826a9b06b');
const epochSeams=[
 ["import { emittedTeaching } from './atlas-emitted-teaching.ts';\n",'\n\nconst revision'],
 ['const sourceRepo = currentAtlasDeliveryRoot();\n','const root = process.cwd();'],
 ["for (const region of ['head-neck','shoulder','lower-limb','female-pelvis'])\n","  const tree = execFileSync"],
 ['  for(const [path,id]of tree)committed.set(`${commit}:${path}`,objects.get(id));\n}\n','const apiEntry = ['],
 ["  const runtimes = ['head-neck', 'shoulder', 'lower-limb', 'female-pelvis'];\n",'  for (const region of runtimes) {'],
 ["    const inputs = json(base + 'source-inputs.json');\n",'    assert.equal(new Set(manifest.files'],
 ['    for (const row of manifest.files) {\n','    for (const flag of'],
];
const bounds=(s,[start,end])=>{
 const at=s.indexOf(start);assert.ok(at>=0&&s.indexOf(start,at+1)<0,'Unique start');
 const from=at+start.length,to=s.indexOf(end,from);assert.ok(to>=0,'End exists');
 return [from,to];
};
let restored=current,forward=prior;
for(const seam of epochSeams){
 const [of,ot]=bounds(prior,seam),[nf,nt]=bounds(current,seam),[rf,rt]=bounds(restored,seam),[ff,ft]=bounds(forward,seam);
 restored=restored.slice(0,rf)+prior.slice(of,ot)+restored.slice(rt);
 forward=forward.slice(0,ff)+current.slice(nf,nt)+forward.slice(ft);
}
assert.equal(restored,prior,'Seven seams recover full prior source');
assert.equal(forward,current,'Seven seams reconstruct full current source');
const old589=bytes(source+'fixtures/atlas-cervical-projection-xray-before-current-admission.txt');
assert.equal(sha(old589),'855dfc3a8ed9da0a86eaf72ca6fa496f19cdaeedec094636e4726b1c664e84d8');
const eraseBetween=(s,left,right)=>{
 assert.equal(s.split(left).length,2,'Unique inverse left anchor');
 const start=s.indexOf(left)+left.length;
 assert.equal(s.slice(start).split(right).length,2,'Unique inverse right anchor');
 const end=s.indexOf(right,start);
 assert.ok(end>start,'Non-empty added segment');
 return s.slice(0,start)+s.slice(end);
};
let context=text(stage+'CODE/tests/cervical-current-history-context-contract.test.mjs');
context=eraseBetween(context,' return text;\n}\n','for(const definition of [main,helper])');
context=replaceOnce(context,
 ' const current=read(definition.name);\n const bytes=definition===main?restoreReviewedMain(current):current,text=bytes.toString(\'utf8\');',
 ' const bytes=read(definition.name),text=bytes.toString(\'utf8\');');
context=eraseBetween(context,"  'Source mutation must break the inverse');\n});\n","test('original cervical theorem fixture remains byte exact'");
assert.deepEqual(Buffer.from(context),bytes(stage+'RAW/tests/cervical-current-history-context-contract.test.mjs'),
 'Complete first-test byte inverse');
let history=text(stage+'CODE/tests/cervical-history-preservation.test.mjs');
history=replaceOnce(history,
 "const priorAdmitted=new URL('./fixtures/atlas-cervical-projection-xray-before-epoch-20261022.test.mjs.raw',import.meta.url);\n",'');
history=eraseBetween(history,
 "const admittedSha='a5848c319f0df5d21105f2c7710b62a2d94c8858db4a63368ef3a9e826a9b06b';\n",
 "test('cervical admission preserves exact old evidence and admits only the reviewed repair'");
history=replaceOnce(history,
 "const admittedSha='a5848c319f0df5d21105f2c7710b62a2d94c8858db4a63368ef3a9e826a9b06b';\ntest(",
 "const admittedSha='a5848c319f0df5d21105f2c7710b62a2d94c8858db4a63368ef3a9e826a9b06b';\n\ntest(");
history=replaceOnce(history,
 '  const originalBytes=readFileSync(original),currentBytes=readFileSync(admitted);\n  const admittedBytes=restorePrior(currentBytes,readFileSync(priorAdmitted));',
 '  const originalBytes=readFileSync(original),admittedBytes=readFileSync(admitted);');
history=replaceOnce(history,
 "  const before=originalBytes.toString('utf8'),after=currentBytes.toString('utf8');",
 "  const before=originalBytes.toString('utf8'),after=admittedBytes.toString('utf8');");
const last="test('cervical epoch adapter refuses missing, duplicate and substituted source',()=>{\n";
assert.equal(history.split(last).length,2,'Unique trailing negative-test addition');
assert.ok(history.endsWith("});\n"),'Complete trailing addition');
history=history.slice(0,history.indexOf(last));
assert.deepEqual(Buffer.from(history),bytes(stage+'RAW/tests/cervical-history-preservation.test.mjs'),
 'Complete second-test byte inverse');
console.log(JSON.stringify({ok:true,clinicalCurrent:sha(Buffer.from(clinical)),clinicalPrior:sha(Buffer.from(reviewed)),cervicalCurrent:sha(Buffer.from(current)),cervicalPrior:sha(Buffer.from(prior)),old589:sha(old589)}));
