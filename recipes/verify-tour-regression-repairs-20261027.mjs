import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {hash,json} from './bounded-source-hash-20261026.mjs';
const stage='F:/VisibleMedicine/staging/20261027-tour-regression-repairs',sf=stage+'/SOURCE_CANDIDATE_V2.json',s=json(sf),p=json(s.parent);
assert.equal(hash(s.parent),s.parentSha256);
assert(s.testOnly && s.allProductAndGeneratedInputsExact);
assert.deepEqual(s.changedPaths,['tests/regional-tour-entry-delivery.test.mjs','tests/regional-tour-title-navigation-current.test.mjs','tests/regional-tour-title-tour-current.test.mjs']);
assert.deepEqual(s.addedPaths,['tests/regional-duration-source-inverse.mjs','tests/regional-duration-source-inverse.test.mjs']);
for(const r of s.sourceRows)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);
for(const r of p.sourceRows){assert.equal(hash(p.website+'/'+r.path),r.sha256,r.path);if(!s.changedPaths.includes(r.path))assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);}
for(const d of s.dependencies){assert.equal(hash(d.file),d.sha256);assert.equal(hash(d.entry),d.entrySha256);}
const git=(root,...a)=>execFileSync('git',['--no-replace-objects','-C',root,...a],{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}}).trim();
for(const [root,head]of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1'],[s.atlas,s.atlasHead]])assert.equal(git(root,'rev-parse','HEAD'),head);
const binding=json(s.website+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,s.reviewBindingSha256);assert.equal(binding.inputs.length,1835);
for(const r of binding.inputs)assert.equal(hash(s.website+'/'+r.path),r.sha256,r.path);
const parentVerificationFile='F:/VisibleMedicine/staging/20261027-related-joint-studies/VERIFICATION_SUMMARY.json';
assert.equal(hash(parentVerificationFile),'09b6870e5bf5f8a2bd29961984b6a811ef20de7d54798e1deca02f581b551cf1');
const v=json(parentVerificationFile);assert(v.passingForStatedScope);assert.equal(v.source.sha256,s.parentSha256);
const typePin=v.fullConfiguredTypes;assert.equal(hash(typePin.path),typePin.sha256);const types=json(typePin.path);
assert(types.fullProjectTypes&&types.diagnosticCount===0);
const norm=p=>p.replaceAll('\\','/');
const remap=f=>norm(f).startsWith(norm(p.website)+'/')?s.website+norm(f).slice(norm(p.website).length):f;
for(const r of types.sourceFiles)assert.equal(hash(remap(r.path)),r.sha256,r.path);
const ts=createRequire(s.website+'/package.json')('typescript'),loaded=ts.readConfigFile(s.website+'/tsconfig.json',ts.sys.readFile);
assert(!loaded.error);const parsed=ts.parseJsonConfigFileContent(loaded.config,ts.sys,s.website);assert.equal(parsed.errors.length,0);
assert.equal(hash(s.website+'/tsconfig.json'),types.configSha256);assert.equal(ts.version,types.typescriptVersion);
assert.deepEqual(parsed.fileNames.map(norm).sort(),types.roots.map(remap).map(norm).sort());
const read=(root,n)=>fs.readFileSync(root+'/'+n,'utf8');
let entry=read(s.website,s.changedPaths[0]);
const seams=[
 ["  const {restoreRegionalDurationCatalogue}=await import('./regional-duration-source-inverse.mjs');\n",''],
 ["    const actual=p==='lib/regional-learning-catalogue.ts'?Buffer.from(restoreRegionalDurationCatalogue(fs.readFileSync(p,'utf8'))):fs.readFileSync(p);\n    assert.equal(digest(actual),row.sha256,p+' integrated (duration-only inverse for catalogue)');","    assert.equal(digest(fs.readFileSync(p)),row.sha256,p+' integrated');"],
];
entry=entry.replaceAll('\r\n','\n');for(const[a,b]of seams){assert.equal(entry.split(a).length,2);entry=entry.replace(a,b);}
assert.equal(entry,read(p.website,s.changedPaths[0]).replaceAll('\r\n','\n'),'Other entry assertions unchanged');
const out={at:new Date().toISOString(),passing:true,source:{path:sf,sha256:hash(sf)},testOnly:true,allProductAndGeneratedInputsExact:true,all1835ProtectedReviewInputsExact:true,fullTypesInherited:{verification:{path:parentVerificationFile,sha256:hash(parentVerificationFile)},result:typePin,roots:types.roots.length,files:types.sourceFiles.length,allConfiguredRootsAndTypedInputsExact:true,rerun:false},productBuildAndBrowserInherited:true,clinicalApproval:false,normalPreviewChanged:false};
fs.writeFileSync(stage+'/CONTENT_QA_V2.json',JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passing:true,testOnly:true,typesInherited:{roots:types.roots.length,files:types.sourceFiles.length}}));
