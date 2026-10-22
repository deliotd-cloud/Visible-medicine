import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const WINDOWS_COMMAND_BUDGET=24000;
export const digest=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
export const seal=value=>digest(Object.fromEntries(Object.entries(value).filter(([key])=>key!=='seal')));
export function assertSeal(value,label){assert(value&&typeof value==='object'&&!Array.isArray(value),`${label} object required`);assert.equal(value.seal,seal(value),`${label} seal changed`);}
export const windowsCommandLength=(executable,args)=>[executable,...args].map(arg=>`"${String(arg).replaceAll('"','\\"')} "`.length).reduce((a,b)=>a+b,0);
export function partitionRoots(roots,{chunkSize,makeArgs,executable,budget=WINDOWS_COMMAND_BUDGET}){
  assert(Number.isSafeInteger(chunkSize)&&chunkSize>0,'Positive integer chunk size required');
  assert(Array.isArray(roots)&&roots.length>0,'Nonempty ordered root inventory required');
  assert.equal(new Set(roots).size,roots.length,'Duplicate root');
  const chunks=[];let current=[];
  for(const root of roots){
    assert(/^tests\/[A-Za-z0-9._-]+\.test\.(?:ts|mjs)$/.test(root),'Unsafe direct test root');
    if(current.length&&(current.length>=chunkSize||windowsCommandLength(executable,makeArgs([...current,root],chunks.length))>budget)){
      chunks.push(current);current=[];
    }
    const next=[...current,root];
    assert(windowsCommandLength(executable,makeArgs(next,chunks.length))<=budget,`Individual root exceeds Windows command budget: ${root}`);
    current=next;
  }
  if(current.length)chunks.push(current);
  assert.deepEqual(chunks.flat(),roots,'Partition altered ordered root union');
  return chunks;
}
function lines(text){return String(text).replace(/\u001b\[[0-9;]*m/g,'').split(/\r?\n/);}
function extract(text,prefix){
  const values={};
  for(const line of lines(text)){
    const match=line.match(new RegExp(`^${prefix} (tests|pass|fail|cancelled|skipped|todo) (\\d+)$`));
    if(match){assert(!Object.hasOwn(values,match[1]),`Duplicate ${prefix} ${match[1]} summary`);values[match[1]]=Number(match[2]);}
  }
  for(const key of ['tests','pass','fail','cancelled','skipped','todo'])assert(Number.isSafeInteger(values[key]),`Missing ${prefix} ${key} summary`);
  assert.equal(values.tests,values.pass+values.fail+values.cancelled+values.skipped+values.todo,`Inconsistent ${prefix} counts`);
  return values;
}
export function nativeCounts(tap,spec,{requireResults=false}={}){
  assert.match(tap,/^TAP version 13\r?$/m,'Native TAP header absent');
  const counts=extract(tap,'#');
  const plans=[...String(tap).matchAll(/^1\.\.(\d+)\r?$/gm)];
  assert.equal(plans.length,1,'Exactly one terminal TAP plan required');
  const results=[...String(tap).matchAll(/^(?:ok|not ok) (\d+)(?: - [^\r\n]*)?\r?$/gm)];
  // Pure helper fixtures retain the old summary-only contract. Both production
  // receipt paths explicitly require actual results and suite-summary parity.
  if(requireResults)assert(results.length>0,'Native top-level result evidence absent');
  assert.equal(Number(plans[0][1]),results.length||counts.tests,'TAP plan differs from top-level results');
  for(let i=0;i<results.length;i++){
    assert.equal(Number(results[i][1]),i+1,'Top-level TAP result sequence changed');
    assert(results[i].index<plans[0].index,'Top-level TAP result follows terminal plan');
  }
  const tapSuites=[...String(tap).matchAll(/^# suites (\d+)\r?$/gm)],specSuites=lines(spec).filter(line=>/^ℹ suites \d+$/.test(line));
  if(requireResults||tapSuites.length||specSuites.length){
    assert.equal(tapSuites.length,1,'Exactly one native TAP suite summary required');
    assert.equal(specSuites.length,1,'Exactly one native spec suite summary required');
    assert.equal(Number(tapSuites[0][1]),Number(specSuites[0].split(' ').at(-1)),'Native suite summaries differ');
  }
  const suites=Number(tapSuites[0]?.[1]??0);assert(Number.isSafeInteger(suites),'Invalid native suite total');
  assert(counts.tests+suites>=results.length,'Native case/suite summary is smaller than top-level results');
  assert.deepEqual(extract(spec,'ℹ'),counts,'Spec and TAP native summaries differ');
  return counts;
}
export function reusableCounts(counts,exitCode,signal){
  return exitCode===0&&signal===null&&counts.tests>0&&counts.pass===counts.tests&&
    ['fail','cancelled','skipped','todo'].every(key=>counts[key]===0);
}
export function assertRootCoverage(entries,execution){
  assert.deepEqual([...entries].sort(),entries,'Direct roots must be sorted');
  const covered=execution.coveredByImport||[];
  assert(covered.length<=1,'Only one known mirror can be covered by import');
  if(covered.length){
    assert.equal(covered[0].path,'tests/atlas-glottic-muscle-imaging.test.mjs');
    assert.equal(covered[0].via,'tests/atlas-glottic-muscle-imaging.test.ts');
    assert.equal(covered[0].wrapperSha256,'a3d30dd530ad31ccc4e55b60c16cd68bddf421ad77a661340d1bbc414e880e0b');
    assert.equal(execution.mirror.active,true);assert.equal(execution.mirror.capability.supported,true);
  }
  const expected=entries.filter(root=>!covered.some(item=>item.path===root));
  assert.deepEqual(execution.executedRoots,expected,'Stock execution plan dropped or reordered roots');
  assert.equal(new Set([...expected,...covered.map(item=>item.path)]).size,entries.length,'Effective and import-covered roots overlap');
  assert.deepEqual([...expected,...covered.map(item=>item.path)].sort(),entries,'Planned full root union changed');
  return expected;
}
