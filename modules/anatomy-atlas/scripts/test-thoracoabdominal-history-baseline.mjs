// Reproduce the old mixed live/history snapshot failure on the unchanged parent.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {relative,dirname,extname} from 'node:path';
import {build} from './workspace-test-build.mjs';
import {wholeBodyTeachingSnapshot} from './exact-clinical-reference-history.mjs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import pins from '../content/thoracoabdominal-organ-imaging-pins.json' with {type:'json'};
const commit='6cbeafbf85430e02e569a3bdd3a5d7e16b0a1467';
const root=process.cwd(),git=path=>execFileSync('git',['show',commit+':'+path],{cwd:root,encoding:'utf8',maxBuffer:16e6});
const exports=git('scripts/content-contract-tools.mjs').match(/contents: `([\s\S]*?)`/)[1];
const require=createRequire(import.meta.url);
const compiled=await build({stdin:{contents:exports+"\nexport {authoringBeforeThoracoabdominalOrganImaging} from './scripts/thoracoabdominal-organ-imaging-history.mjs';export {authoringBeforeCentralVesselImaging} from './scripts/central-vessel-imaging-history.mjs';export {beforeCorpusSpongiosumSource} from './scripts/corpus-spongiosum-source-history.mjs';",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'unchanged-parent-replay',setup(b){b.onResolve({filter:/^node:/},args=>({path:args.path,external:true}));b.onResolve({filter:/^(esbuild|ajv\/)/},args=>({path:pathToFileURL(require.resolve(args.path)).href,external:true}));b.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{const path=relative(root,args.path).replaceAll('\\','/');if(path.startsWith('node_modules/'))return;assert(!path.startsWith('../'));return {contents:git(path),loader:({'.ts':'ts','.tsx':'tsx','.json':'json','.mjs':'js'})[extname(path)]||'js',resolveDir:dirname(args.path)};});}}]});
const source=compiled.outputFiles[0].text.replaceAll('import.meta.url',JSON.stringify(pathToFileURL(root+'/scripts/parent-replay.mjs').href));
let api;
try {api=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));}
catch(error){throw new Error(error.message);}
const catalog=JSON.parse(git('public/models/bodyparts3d/full-body/catalog.json'));
const context={api,catalog};
const scoped=api.beforeCorpusSpongiosumSource(api.authoringBeforeCentralVesselImaging(context),catalog);
const display=scoped.bodyDisplayCatalog(catalog),before=api.authoringBeforeThoracoabdominalOrganImaging(context);
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const actual=hash({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,before.bodyLesson(s,t)]))})),shoulder:scoped.structures,recipes:scoped.dissectionProfiles});
assert.equal(actual,'426379c3ebac664ebca6d95ae3286f44ccece9fbc1d168c100ba565fd0b6de28');
assert.notEqual(actual,pins.previousAllLessonsAndRecipesHash);
assert.equal(wholeBodyTeachingSnapshot(before,catalog).body.length>0,true);
console.log(JSON.stringify({unchangedParent:commit,preExistingMixedSnapshotMismatch:true,actual,expected:pins.previousAllLessonsAndRecipesHash}));
