import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const [websiteRoot,candidatePath,preimagePath]=process.argv.slice(2);
assert(websiteRoot&&candidatePath,'usage: node compact-css-pure-check.mjs WEBSITE_ROOT CANDIDATE_FILE');
const source=readFileSync(candidatePath,'utf8');
const begin="test('hashed emitted CSS keeps desktop canvas and independent rail; narrow flow stays one column',()=>{";
const end='\n\nasync function importedAdapter()';
assert.equal(source.split(begin).length,2,'one original CSS test header');
assert.equal(source.split(end).length,2,'one following adapter boundary');
const block=source.slice(source.indexOf(begin),source.indexOf(end));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
if(preimagePath){
 const original=readFileSync(preimagePath,'utf8');
 assert.equal(sha(original),'fcb97ceda33ae01919888348e302bca77b310b58a8da6bb18ae382bb4465c226','frozen preimage');
 const originalBlock=original.slice(original.indexOf(begin),original.indexOf(end));
 assert.equal(original.slice(0,original.indexOf(begin)),source.slice(0,source.indexOf(begin)),'whole-file prefix');
 assert.equal(original.slice(original.indexOf(end)),source.slice(source.indexOf(end)),'whole-file suffix');
 const originalAssertions=originalBlock.slice(originalBlock.indexOf(' assert.equal(rule('));
 const candidateAssertions=block.slice(block.indexOf(' assert.equal(rule('));
 assert.equal(candidateAssertions,originalAssertions,'all original layout assertions byte-exact');
 const inverse=source.slice(0,source.indexOf(begin))+originalBlock+source.slice(source.indexOf(end));
 assert.equal(inverse,original,'exact whole-file inverse');
}
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const normalizeSelector=value=>value.replaceAll(/[\s'\"]+/g,'').replaceAll('calc(','').replaceAll(')','');
const postcss=createRequire(resolve(websiteRoot,'package.json'))('postcss');
let callback;
const test=(name,fn)=>{assert.equal(name,'hashed emitted CSS keeps desktop canvas and independent rail; narrow flow stays one column');assert.equal(callback,undefined);callback=fn;};
process.chdir(websiteRoot);
new Function('test','json','sha','readFileSync','postcss','assert','normalizeSelector',block)(test,json,sha,readFileSync,postcss,assert,normalizeSelector);
assert(callback,'CSS callback registered');
callback();
console.log('PASS isolated original CSS assertions against hashed emitted head-neck assets');
