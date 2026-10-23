// Whole-file inverses define the implementation boundary; assets/content remain exact.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-regional-tour-entry',root=stage+'/atlas',prepared=json(stage+'/PREPARED.json'),read=p=>fs.readFileSync(p,'utf8'),old=p=>read(prepared.parent+'/'+p);
const ts=createRequire(root+'/package.json')('typescript');
const replace=(text,current,before)=>{assert.equal(text.split(current).length,2,'Inverse must be unique: '+current.slice(0,90));return text.replace(current,before);};
const proofs=[];
function inverse(path,fn){assert.equal(hash(prepared.parent+'/'+path),prepared.files.find(r=>r.path===path).sha256);assert.equal(fn(read(root+'/'+path)),old(path),path+' whole-file inverse');proofs.push(path);}
inverse('app/body-explorer.tsx',text=>{
  for(const insertion of [
    "import type { RegionalTour } from '@/lib/regional-tours';\nimport {noRegionalTourEntry,resolveRegionalTourEntry,type RegionalTourEntry} from '@/lib/regional-tour-entry';\n",
    "  tourEntry = noRegionalTourEntry,\n  sourceRevision = '',\n",
    "  tourEntry?: RegionalTourEntry;\n  sourceRevision?: string;\n",
    "  const appliedTourEntry = useRef(tourEntry.status === 'none');\n  const initialTourEntry = useRef({entry:tourEntry,sourceRevision});\n  const [entryTour,setEntryTour] = useState<RegionalTour|null>(null);\n",
    '      setEntryTour(null);\n',
    `          if (!appliedTourEntry.current) {
            // Fresh-load intent is consumed once, before any scene mounts.
            // Existing study/practice activity always wins; never auto-start.
            const result=resolveRegionalTourEntry(value,initialRegion,initialTourEntry.current.sourceRevision,initialTourEntry.current.entry,
              studyLink.status!=='none'||practice.status==='active'||guidedLearning);
            if(result.status==='ready'){
              setEntryTour(result.tour);
              setGuidedLearning(true);
            }else if(result.status==='rejected'){
              setLinkIssue(result.reason==='busy'
                ? 'This tour was not opened because another study or learning activity takes precedence. No tour was substituted.'
                : 'This tour link is unavailable for the current source, revision or region. No tour was selected. Find the tour again in Guided learning.');
            }
            appliedTourEntry.current=true;
          }
`,
  ])text=replace(text,insertion,'');
  const line=old('app/body-explorer.tsx').split('\n').find(line=>line.startsWith('      {guidedLearning && (whole || regionalToursFor'));
  assert(line);
  const changed=line.replace(' region={initialRegion} catalog=', ' region={initialRegion} initialTour={entryTour??undefined} catalog=')
    .replace(' : guidedLearning && regionalTour ?', ' : guidedLearning && (entryTour??regionalTour) ?')
    .replace(' tour={regionalTour}', ' tour={(entryTour??regionalTour)!}');
  assert.notEqual(changed,line);return replace(text,changed,line);
});
inverse('integration/head-neck/main.tsx',text=>replace(replace(text,"import {parseRegionalTourEntry} from '../../lib/regional-tour-entry';\n",''),' tourEntry={parseRegionalTourEntry(params)} sourceRevision={__VM_HEAD_SOURCE_REVISION__}',''));
inverse('package.json',text=>replace(text,'    "regional-tour-entry:test": "node --test scripts/test-regional-tour-entry.mjs && node scripts/test-initial-regional-tour-picker.mjs && node scripts/test-whole-body-guided-learning.mjs",\n',''));
// The worker supplied the frozen theorem's exact production-component inverse.
// Execute only that declaration, then prove the ENTIRE parent component.
const testPath='scripts/test-whole-body-guided-learning.mjs',testText=read(root+'/'+testPath);
function declaration(text,name){const ast=ts.createSourceFile('test.mjs',text,ts.ScriptTarget.Latest,true);const found=ast.statements.filter(s=>ts.isVariableStatement(s)&&s.declarationList.declarations.some(d=>d.name.getText(ast)===name));assert.equal(found.length,1);return found[0].getText(ast);}
const currentDecl=declaration(testText,'historicalComponentInput'),oldDecl=declaration(old(testPath),'historicalComponentInput');
inverse(testPath,text=>replace(replace(text,
  '// guard permits only the two new nested pause-signal props and the exact\n// initial-selection additions. All other bytes must',
  '// guard permits only the two new nested pause-signal props, proved separately\n// by the real current-source nested player regression. All other bytes must'),currentDecl,oldDecl));
// Evaluate the two source inverses against current and parent. Each reconstructs
// exactly the same immutable historical component, not just selected assertions.
const {runInNewContext}=await import('node:vm');
const input=path=>fs.readFileSync(root+'/'+path),oldInput=path=>fs.readFileSync(prepared.parent+'/'+path);
const currentFn=runInNewContext(currentDecl+';historicalComponentInput',{readFileSync:input,assert,Buffer});
const oldFn=runInNewContext(oldDecl+';historicalComponentInput',{readFileSync:oldInput,assert,Buffer});
assert.deepEqual(currentFn('app/whole-body-guided-learning.tsx'),oldFn('app/whole-body-guided-learning.tsx'));
proofs.push('app/whole-body-guided-learning.tsx');
const noticePath='LICENSES/THIRD_PARTY_NOTICES.md',notice=read(root+'/'+noticePath),oldNotice=old(noticePath);assert(notice.startsWith(oldNotice));
assert.equal(notice.slice(oldNotice.length),'\n## Exact regional tour entry — 23 October 2026\n\nOriginal MIT application code selects an existing draft regional tour by its\nexact tour and learner-source revisions, without starting playback. No new\nmodel, image, scan, dataset, font, texture, dependency, service or fee is added.\nExisting source credits, licence conditions and review holds remain unchanged.\nThis does not grant access, clinical approval or patient-space registration.\nSee `docs/REGIONAL_TOUR_ENTRY.md`.\n');proofs.push(noticePath);
const permitted=new Set([...proofs,'content/body-renderer-revision.json']);
let unchanged=0,modelFiles=0,modelBytes=0;
for(const row of prepared.files){assert.equal(hash(prepared.parent+'/'+row.path),row.sha256);if(!permitted.has(row.path)){assert.equal(hash(root+'/'+row.path),row.sha256,row.path);unchanged++;}if(row.path.startsWith('public/models/')){modelFiles++;modelBytes+=fs.statSync(root+'/'+row.path).size;}}
const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',windowsHide:true,maxBuffer:16e6}).trim();
const changed=git('diff','--name-only').split('\n').filter(Boolean);assert(changed.every(path=>permitted.has(path)));
const added=git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean);
assert.deepEqual(new Set(added),new Set(['docs/REGIONAL_TOUR_ENTRY.md','lib/regional-tour-entry.ts','scripts/check-regional-tour-entry-types.mjs','scripts/test-initial-regional-tour-picker.mjs','scripts/test-regional-tour-entry.mjs']));
const result={at:new Date().toISOString(),parent:prepared.head,atlas:root,wholeFileInversePaths:proofs,rendererMetadataOnlyStockGenerator:true,unchangedTrackedInputs:unchanged,modelFiles,modelBytes,changed,added,
  teachingTourGeometrySourceHoldsAndDependenciesUnchanged:true,oldTestAssertionsWholeFileInverse:true,privateDecisionsReadOrMigrated:false,previewChanged:false,clinicalApproval:false,websiteIntegrationPending:true};
fs.writeFileSync(stage+'/PRESERVATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
