import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash} from './seal-simple-website-successor.mjs';
const output='check-hra-original-reader-worktrees-20261025.mjs';assert(!fs.existsSync(output));let source=fs.readFileSync('check-original-reader-worktrees-20261025.mjs','utf8');
function replace(a,b){assert.equal(source.split(a).length-1,1,a);source=source.replace(a,b);}
replace("stage='F:/VisibleMedicine/staging/20261025-original-reader-worktrees'","stage='F:/VisibleMedicine/staging/20261025-hra-original-reader-worktrees'");
replace("GIT_NO_REPLACE_OBJECTS:'1'","ATLAS_SOURCE_REPO:'F:/VisibleMedicine/atlas',GIT_NO_REPLACE_OBJECTS:'1'");
replace("assert.equal(fs.realpathSync('outputs'),input.legacyNativeAliasRealPath);","assert.equal(fs.realpathSync(row.site+'/node_modules'),fs.realpathSync(input.dependencies));for(const r of input.dependencyRows)assert.equal(hash(input.dependencies+'/'+r.path),r.sha256);for(const object of row.atlasReads)assert(git('F:/VisibleMedicine/atlas',['cat-file','-s',object]).trim().match(/^\\d+$/));");
replace("whole original historical Node-only roots; no type graph/build/browser or source substitution","bounded whole original historical HRA roots with exact locked esbuild0.28.2;256MiB Node/64MiB Go, single thread; no broad type graph/build/browser or source substitution");
replace("Genuine complete original1case deep-brain and2case Foot roots in their real detached historical Website worktrees. No current-delivery proof or full-suite/clinical/registration acceptance inferred.","Genuine complete original2case renal and2case pelvic roots in their real detached historical Website worktrees with exact locked compiler dependencies. Original ATLAS_SOURCE_REPO override points to real canonical native source with historical objects, no source overlays. No current362delivery proof or full-suite/clinical/registration acceptance inferred.");
fs.writeFileSync(output,source,{flag:'wx'});console.log(JSON.stringify({path:output,sha256:hash(output),testsOrAssertionsEdited:false}));
