import fs from'node:fs';import assert from'node:assert/strict';import{hash}from'./bounded-source-hash-20261026.mjs';
const base='F:/VisibleMedicine/staging/20261027-learner-history',site=base+'/website',parent='F:/VisibleMedicine/staging/20261027-learning-return-links/website';
fs.mkdirSync(base+'/original-tests');
const helper=`import {readFileSync} from 'node:fs';import{createRequire}from'node:module';import{resolve}from'node:path';
const site=process.env.VISIBLE_MEDICINE_WEBSITE??process.cwd(),require=createRequire(resolve(site,'package.json')),ts=require('typescript'),module={exports:{}};
const compiled=ts.transpileModule(readFileSync(resolve(site,'lib/learner-portfolio-pagination.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('module','exports',compiled)(module,module.exports);export const portfolioPagination=module.exports;
`;
fs.writeFileSync(site+'/tests/learner-portfolio-pagination-loader.mjs',helper,{flag:'wx'});
const records=[];
for(const [p,edits]of [
 ['tests/learner-portfolio-draft-safety.test.mjs',[["    if (name === '../lib/learning-draft-navigation.ts')", "    if (name === '../lib/learner-portfolio-pagination') return portfolioPagination;\n    if (name === '../lib/learning-draft-navigation.ts')"]]],
 ['tests/learner-portfolio-return-links.test.mjs',[["  id => id === '../lib/learning-draft-navigation.ts' ?", "  id => id === '../lib/learner-portfolio-pagination' ? portfolioPagination : id === '../lib/learning-draft-navigation.ts' ?"]]],
 ['tests/runtime-mutation-envelope.test.mjs',[["'lib/request-security.ts'];","'lib/request-security.ts','lib/learner-portfolio-pagination.ts'];"],["'PlatformGovernanceError','getLearnerPortfolio',...Object.values(portfolioActions)","'PlatformGovernanceError','getLearnerPortfolio','getLearnerPortfolioPage',...Object.values(portfolioActions)"]]],
]){
 const before=fs.readFileSync(parent+'/'+p,'utf8');assert.equal(fs.readFileSync(site+'/'+p,'utf8'),before);fs.copyFileSync(parent+'/'+p,base+'/original-tests/'+p.split('/').at(-1),fs.constants.COPYFILE_EXCL);
 let after=before;for(const[a,b]of edits){assert.equal(after.split(a).length,2,a);after=after.replace(a,b);}
 const prefix=p.includes('runtime-mutation')?'':"import {portfolioPagination} from './learner-portfolio-pagination-loader.mjs';\n";after=prefix+after;
 let inverse=after.slice(prefix.length);for(const[a,b]of [...edits].reverse()){assert.equal(inverse.split(b).length,2,b);inverse=inverse.replace(b,a);}assert.equal(inverse,before);
 fs.writeFileSync(site+'/'+p,after);records.push({path:p,beforeSha256:hash(parent+'/'+p),afterSha256:hash(site+'/'+p),inverseExact:true,edits,prefix});
}
fs.writeFileSync(base+'/TEST_LOADER_WIRING.json',JSON.stringify({at:new Date().toISOString(),allOriginalAssertionsPreserved:true,actualNewDependencyLoaded:true,records},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({wired:records.length}));
