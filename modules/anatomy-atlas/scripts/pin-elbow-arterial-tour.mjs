import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='a70b6f640c5511330f250882f525b63a4a21117b';
const destination='content/elbow-arterial-tour-pins.json';
assert.deepEqual(process.argv.slice(2),[process.argv[2]]);
assert(['--write','--check'].includes(process.argv[2]),'Choose --write or --check');
const git=p=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:64e6,windowsHide:true});
const path='public/models/bodyparts3d/full-body/catalog.json',raw=readFileSync(path);
assert(raw.equals(git(path)),'Source catalogue differs from baseline');
const built=await build({stdin:{contents:"export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {bodyDisplayCatalog}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const catalog=bodyDisplayCatalog(JSON.parse(raw));
const arm=slug=>'vm:anatomy:body:shoulder-arm:right:vessel:'+slug;
const forearm=slug=>'vm:anatomy:body:forearm:right:vessel:'+slug;
const targets=[
 ['FMA22712',arm('right-inferior-ulnar-collateral-artery')],
 ['FMA22801',forearm('right-anterior-ulnar-recurrent-artery')],
 ['FMA22707',arm('right-superior-ulnar-collateral-artery')],
 ['FMA22804',forearm('right-posterior-ulnar-recurrent-artery')],
 ['FMA23126',arm('radial-collateral-branch-of-right-deep-brachial-artery')],
 ['FMA22764',forearm('right-radial-recurrent-artery')],
 ['FMA23124',arm('middle-collateral-branch-of-right-deep-brachial-artery')],
 ['FMA268667',forearm('right-recurrent-interosseous-artery')],
];
const contexts=[
 ['FMA23130','vm:anatomy:upper-limb:shoulder:right:bone:humerus'],
 ['FMA23464','vm:anatomy:body:forearm:right:bone:right-radius'],
 ['FMA23467','vm:anatomy:body:forearm:right:bone:right-ulna'],
];
const select=([fma,id])=>{
 const found=catalog.structures.filter(s=>s.fmaId===fma||s.id===id);
 assert.equal(found.length,1,fma);assert.equal(found[0].id,id);assert.equal(found[0].fmaId,fma);
 assert.equal(found[0].laterality,'right');assert(found[0].regions.includes('forearm'));
 return found[0];
};
const entries=targets.map(select),contextEntries=contexts.map(select),all=[...entries,...contextEntries];
assert.equal(new Set(all.map(s=>s.id)).size,11);
const bundles=catalog.bundles.filter(b=>all.some(s=>s.bundle===b.id));
assert.deepEqual(bundles.map(b=>b.id).sort(),['elbow-arteries','forearm-skeleton','forearm-vessels-forearm-vascular','shoulder-arm-skeleton']);
for(const b of bundles){
 const file='public'+b.url.split('?')[0],bytes=readFileSync(file);
 assert.equal(bytes.length,b.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),b.sha256);
 assert(bytes.equals(git(file)),`Geometry differs from baseline: ${b.id}`);
}
const pins={schemaVersion:1,baseline,tourRevision:'right-elbow-arterial-pairs-20261012-r1',sourceVersion:catalog.sourceVersion,
 coordinateSystem:catalog.coordinateSystem,license:catalog.license,entries,contextEntries,bundles};
if(process.argv[2]==='--check')assert.deepEqual(JSON.parse(readFileSync(destination)),pins);
else{
 assert(!existsSync(destination));
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',windowsHide:true}).trim(),baseline);
 writeFileSync(destination,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({targets:entries.length,context:contextEntries.length,bundles:bundles.map(b=>b.id),pinsHash:createHash('sha256').update(JSON.stringify(pins)).digest('hex')}));
