// Finite package closure; no app/build/normal-preview source write.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261024-head-active-identity-portable-main';
const proposal='F:/VisibleMedicine/staging/20261024-head-active-identity-portable-proposal';
const parent='F:/VisibleMedicine/staging/20261024-portable-head-review-website/PREPARATION.json',parentHash='4254380b3a9ff660e07244b39838b47fa71b480f759ae98e5c582d7dece793f6';
const memory=JSON.parse(execFileSync('powershell',['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory | Select-Object AvailableMBytes,PercentCommittedBytesInUse | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
if(memory.AvailableMBytes<1024||memory.PercentCommittedBytesInUse>90){console.log(JSON.stringify({admitted:false,memory}));process.exit(75);}
assert(!fs.existsSync(root));assert.equal(sha(read(parent)),parentHash);const prep=json(parent),rows=new Map(prep.sourceRows.map(r=>[r.path,r]));
const handoff=json(proposal+'/HANDOFF.json'),manifestPath='tests/fixtures/head-active-identity-before-separate/manifest.json',manifest=json(proposal+'/candidate/'+manifestPath);
assert.equal(sha(read(proposal+'/candidate/'+manifestPath)),'a24dcd2271fc2c191c69a68ccafdb81e8ac97454f08ed6be0de9fe0851a25ee1');
const proof=json('F:/VisibleMedicine/staging/20261024-head-active-identity-historical-proof/TERMINAL.json');assert.equal(proof.passing,true);const io=json('F:/VisibleMedicine/staging/20261024-head-active-identity-historical-proof/io-112328.json');assert.equal(io.observed.length,28);
const actual=new Map(io.observed.map(r=>[r.sourcePath,r]));for(const row of manifest.sourceRows){const seen=actual.get(row.path);assert(seen);assert.equal(row.sha256,seen.sha256);assert.equal(row.bytes,seen.bytes);}
fs.mkdirSync(root+'/candidate/tests',{recursive:true});const out=root+'/candidate',files=[],owned=[];
function put(relative,bytes,owner){const p=out+'/'+relative;assert(!fs.existsSync(p));fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes,{flag:'wx'});files.push({path:relative,bytes:bytes.length,sha256:sha(bytes),owner});if(owner==='proposal'||owner==='main')owned.push(relative);}
for(const row of handoff.candidateFiles){const b=read(proposal+'/candidate/'+row.path);assert.equal(b.length,row.bytes);assert.equal(sha(b),row.sha256);put(row.path,b,'proposal');}
const helper='tests/head-active-identity-historical-source.mjs',helperBefore=read(out+'/'+helper);assert.equal(sha(helperBefore),'611c179bcb93da8f294c5a55bd3a9efe1c518ecfe68fa5edc7af7d1467e87806');
const seams=[
 ['export function validateHistoricalManifest(value){',"function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}\nexport function validateHistoricalManifest(value){"],
 ['  return value;\n}\nfunction validatedBytes','  return freeze(structuredClone(value));\n}\nexport function validatedBytes'],
 ["    verify(){for(const row of manifest.sourceRows)validatedBytes(row,fs.readFileSync(new URL(row.fixture,base)));},","    verify(){assert.deepEqual(fixtureFiles(new URL('source/',base)),manifest.sourceRows.map(row=>row.path+'.raw').sort(),'Exact raw source inventory at verification');for(const row of manifest.sourceRows)validatedBytes(row,fs.readFileSync(new URL(row.fixture,base)));},"],
 ['    const original=fs.readFileSync;','    let viewerReads=0;\n    const original=fs.readFileSync;'],
 ["        assert.equal(options,'utf8','Original viewer text read shape');","        assert.equal(options,'utf8','Original viewer text read shape');\n        viewerReads++;"],
 ["    assert.deepEqual([...loaded].sort(),[...manifest.modulePaths].sort(),'Complete proven module namespace');","    assert.equal(viewerReads,1,'Exactly one original whole-viewer source read');\n    assert.deepEqual([...loaded].sort(),[...manifest.modulePaths].sort(),'Complete proven module namespace');"],
];
let text=helperBefore.toString();for(const [from,to]of seams){assert.equal(text.split(from).length,2);text=text.replace(from,to);}let inverse=text;for(const [from,to]of [...seams].reverse()){assert.equal(inverse.split(to).length,2);inverse=inverse.replace(to,from);}assert.deepEqual(Buffer.from(inverse),helperBefore);
fs.writeFileSync(root+'/HELPER_BEFORE.mjs',helperBefore,{flag:'wx'});fs.writeFileSync(out+'/'+helper,text);Object.assign(files.find(r=>r.path===helper),{bytes:Buffer.byteLength(text),sha256:sha(Buffer.from(text)),owner:'main'});
const support=[...manifest.modulePaths.filter(p=>p!==manifest.entryPath),'lib/head-separate-comparison.ts','lib/head-link-availability.ts','components/HeadAtlasViewer.tsx','components/HeadSeparateComparisonLink.tsx','tests/head-separate-comparison-test-source.ts','package.json','package-lock.json'];
assert.equal(new Set(support).size,support.length);for(const relative of support){const row=rows.get(relative);assert(row);const b=read(prep.website+'/'+relative);assert.equal(b.length,row.bytes);assert.equal(sha(b),row.sha256);put(relative,b,'unchanged-current-support');}
const current='F:/VisibleMedicine/staging/20261024-head-active-identity-current-v2/candidate/tests/head-comparison-active-identity-current.test.ts';assert.equal(sha(read(current)),'236e9f186d51a19f9ec404bd2a24a29dad8a6a3febf967be97ecb4fbdae9971a');put('tests/head-comparison-active-identity-current.test.ts',read(current),'main');
const collector=Buffer.from("import fs from 'node:fs';\nimport assert from 'node:assert/strict';\nimport {runHistoricalActiveIdentity} from './head-active-identity-historical-source.mjs';\nconst read=fs.readFileSync;\nawait runHistoricalActiveIdentity();\nassert.equal(fs.readFileSync,read,'Historical viewer read hook restored');\n");
// Preserve the stock entrypoint by collecting the unmodified frozen original.
put('tests/head-comparison-active-identity.test.ts',collector,'main');
put('tests/head-active-identity-historical-source.test.mjs',read('head-active-fixture-controls-20261024.mjs'),'main');
fs.symlinkSync(prep.website+'/node_modules',out+'/node_modules','junction');
const receipt={at:new Date().toISOString(),root:out,parent,parentHash,proposalHandoffSha256:sha(read(proposal+'/HANDOFF.json')),memory,files,sourcePaths:files.length,sourceBytes:files.reduce((n,r)=>n+r.bytes,0),ownedPaths:owned,helperWholeInverse:true,helperSeams:seams,reportedCasesExpected:21,historicalDistinctCases:5,historicalCollectorEntries:2,currentCases:5,controls:6,fullWebsite:false,installed:false,previewChanged:false};
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({root,files:files.length,owned:owned.length,bytes:receipt.sourceBytes,preparationSha256:sha(read(root+'/PREPARATION.json'))}));
