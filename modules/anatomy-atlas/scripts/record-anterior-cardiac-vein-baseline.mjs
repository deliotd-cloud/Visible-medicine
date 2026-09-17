import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {cardiacVeinApi,cardiacVeinBase,priorCardiacVeinState} from './anterior-cardiac-vein-tools.mjs';
const path='content/anterior-cardiac-vein-baseline.json',api=await cardiacVeinApi(),raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const result={sourceCommit:cardiacVeinBase,...priorCardiacVeinState(api,raw)};
assert.equal(result.structures,1103);assert.equal(result.lessonCount,9927);
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(await readFile(path)),result);
else{assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),cardiacVeinBase);assert(!api.bodyDisplayCatalog(raw).structures.some(s=>s.fmaId==='FMA76767'));await writeFile(path,JSON.stringify(result,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify(result));
