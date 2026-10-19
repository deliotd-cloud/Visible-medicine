import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const original=readFileSync(new URL('./fixtures/clinical-review-navigation-before-dialog.test.ts.raw',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(original),'8517d7351b49410bc31327b4038192210847ec04c92014991691f33ea32d0a5a');
const actual=readFileSync(new URL('./clinical-review-navigation.test.ts',import.meta.url),'utf8');
function legacyPart(text){
 const start=text.indexOf("test('current Review navigation preserves queue and fetch boundaries");
 assert(start>=0);const before=text.slice(0,start);
 assert(before.endsWith('\n\n'));return before.slice(0,-1);
}
function expected(){
 let text=original.toString();
 text=text.replace("import {createHash} from 'node:crypto';", "import {createHash} from 'node:crypto';\nconst immutableGitOptions={windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};");
 assert.equal(text.split("{encoding:'utf8'}").length,5);
 text=text.replaceAll("{encoding:'utf8'}","{...immutableGitOptions,encoding:'utf8'}");
 const old="execFileSync('git',['show','0c608b3:atlas-review/'+path])";
 assert.equal(text.split(old).length,2);text=text.replace(old,"execFileSync('git',['show','0c608b3:atlas-review/'+path],immutableGitOptions)");
 const dashboard="const dashboard=readFileSync('atlas-review/app/review/body/review-dashboard.tsx','utf8');";
 assert.equal(text.split(dashboard).length,2);text=text.replace(dashboard,"const dashboard=execFileSync('git',['show','0c608b3:atlas-review/app/review/body/review-dashboard.tsx'],{...immutableGitOptions,encoding:'utf8'});");
 return text;
}
test('every old navigation assertion survives as immutable historical proof, with current-source integrity still checked',()=>{
 assert.equal(legacyPart(actual),expected());
 assert(actual.includes("index < 0 || !canLeave()"),'The historical assertion is retained, not restamped');
});
test('history substitution, native-guard removal and disabled immutable Git cannot enter the migration',()=>{
 const before=legacyPart(actual);
 for(const candidate of [before.replace('0c608b3:atlas-review/app/review/body/review-dashboard.tsx','ff3502a:atlas-review/app/review/body/review-dashboard.tsx'),before.replace("assert.ok(dashboard.includes('index < 0 || !canLeave()'));",'assert.ok(true);'),before.replace("GIT_NO_REPLACE_OBJECTS:'1'","GIT_NO_REPLACE_OBJECTS:'0'")])assert.notEqual(candidate,expected());
});
