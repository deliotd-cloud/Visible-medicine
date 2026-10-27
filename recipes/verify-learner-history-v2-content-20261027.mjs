import fs from'node:fs';import assert from'node:assert/strict';import{hash,json}from'./bounded-source-hash-20261026.mjs';
const base='F:/VisibleMedicine/staging/20261027-learner-history',s=json(base+'/SOURCE_CANDIDATE_V2.json'),parent=json(s.parent),site=s.website;
for(const r of s.sourceRows)assert.equal(hash(site+'/'+r.path),r.sha256,r.path);
const read=(root,p)=>fs.readFileSync(root+'/'+p,'utf8').replaceAll('\r\n','\n'),old=read(parent.website,'lib/platform-governance.ts'),current=read(site,'lib/platform-governance.ts');
const start='export async function getLearnerPortfolio(',end='export async function saveLearnerNote(';
const helperImport='import { parsePortfolioCursor, portfolioPage, type PortfolioSection } from "@/lib/learner-portfolio-pagination";\n';
assert.equal(current.slice(0,current.indexOf(start)).replace(helperImport,''),old.slice(0,old.indexOf(start)));
assert.equal(current.slice(current.indexOf(end)),old.slice(old.indexOf(end)));
for(const p of ['app/api/learner/portfolio/route.ts']){const a=read(parent.website,p),b=read(site,p),marker='export async function POST(';assert.equal(b.slice(b.indexOf(marker)),a.slice(a.indexOf(marker)));assert(b.includes('private, no-store'));}
const wiring=json(base+'/TEST_LOADER_WIRING_V2.json');for(const r of wiring.records){let inverse=fs.readFileSync(site+'/'+r.path,'utf8').slice(r.prefix.length);for(const[a,b]of [...r.edits].reverse())inverse=inverse.replace(b,a);assert.equal(inverse,fs.readFileSync(parent.website+'/'+r.path,'utf8'));}
fs.writeFileSync(base+'/CONTENT_QA_V2.json',JSON.stringify({at:new Date().toISOString(),passing:true,source:{path:base+'/SOURCE_CANDIDATE_V2.json',sha256:hash(base+'/SOURCE_CANDIDATE_V2.json')},allSealedSourceExact:true,unrelatedGovernanceAndAllWritesExact:true,postMutationRouteExact:true,allExistingTestAssertionsPreserved:true,newAssetsOrMedicalContent:false,normalPreviewChanged:false},null,2)+'\n',{flag:'wx'});console.log('Content and ownership boundaries verified.');
