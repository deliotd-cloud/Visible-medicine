import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=fileURLToPath(new URL('./',import.meta.url));
const original=readFileSync(resolve(here,'fixtures/studio-course-details-content-prefocus.test.mjs.raw'),'utf8');
const current=readFileSync(resolve(here,'studio-course-details-content.test.mjs'),'utf8');
const historical=readFileSync(resolve(here,'fixtures/studio-course-editor-prefocus.tsx.raw'),'utf8');
const currentComponentPath=resolve(here,'../components/StudioCourseEditor.tsx');
const currentComponent=readFileSync(currentComponentPath,'utf8');
const sha=text=>createHash('sha256').update(text).digest('hex');
const shas={original:'d84c858a85405a80282cac15b02d4ee790cab21bee38fe456920bdbe8405ab32',current:'ccb38f67558b07127ef0689b465a7cbbac08c469a1cb08dbf6511eea587d7480',historical:'e6d0c653f7c18ea6e99afc98a2c8674de056757e7afea0a94a3edbb3fc3140e8',component:'62a6c880bdc7d4ec35393d8dbc580022176b17f5e7a1dc913da39b325c6dc6a0'};

function authenticate(testSource=current,oldSource=original,preFocus=historical,now=currentComponent){
  assert.equal(sha(testSource),shas.current,'current role test identity');
  assert.equal(sha(oldSource),shas.original,'original test identity');
  assert.equal(sha(preFocus),shas.historical,'historical component identity');
  assert.equal(sha(now),shas.component,'current component identity');
  assert.match(testSource,/if \(role === 'historical'\) assert\.equal\(app\.focus\.activeElement, focusBefore\);/);
  assert.match(testSource,/else assert\.equal\(app\.focus\.activeElement\?\.marker, 'course-title'\);/);
  assert.deepEqual([...testSource.matchAll(/^test\('([^']+)'/gm)].map(x=>x[1]),[...oldSource.matchAll(/^test\('([^']+)'/gm)].map(x=>x[1]));
  assert.equal([...testSource.matchAll(/^test\('/gm)].length,5);
  const a=oldSource.split('\n'),b=testSource.split('\n'),rows=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)rows[i][j]=a[i]===b[j]?rows[i+1][j+1]+1:Math.max(rows[i+1][j],rows[i][j+1]);
  let i=0,j=0,count=0;const rebuilt=[];
  while(i<a.length||j<b.length){
    if(i<a.length&&j<b.length&&a[i]===b[j]){rebuilt.push(b[j]);i++;j++;continue;}
    const before=[],after=[];
    while(i<a.length||j<b.length){
      if(i<a.length&&j<b.length&&a[i]===b[j])break;
      if(j<b.length&&(i===a.length||rows[i][j+1]>rows[i+1][j]))after.push(b[j++]);
      else before.push(a[i++]);
    }
    assert(before.every(line=>!/^\s*assert\./.test(line)||line.trim()==='assert.equal(app.focus.activeElement, focusBefore);'),'Only the focus assertion may be role gated');
    const adapterLines=new Set([
      '    useMemo(factory, deps) {',
      '      const index = cursor++, prior = slots[index];',
      '      if (!prior || deps.some((value, i) => !Object.is(value, prior.deps[i])))',
      '        slots[index] = { deps, value: factory() };',
      '      return slots[index].value;',
      '    },',
      '    // Registered first by this editor, then committed before its passive effects.',
      '    useLayoutEffect(callback, deps) { react.useEffect(callback, deps); },',
    ]);
    assert(after.every(line=>/createHash|resolve|new URL|readFileSync|role|website|sourcePath|source =|sha256|e6d0c|62a6c|optionsTarget|optionsEvent|focus\.querySelector|course-title|\? \{ focus|useRef|clickOptions\(|old\(|current\(/.test(line)||adapterLines.has(line)),`Unenumerated hunk ${JSON.stringify(after)}`);
    rebuilt.push(...before);count++;
  }
  assert.equal(count,10,'Only ten mock/source-role and commit-hook hunks');
  assert.equal(rebuilt.join('\n'),oldSource,'Whole original source recovered');
  assert.equal(sha(rebuilt.join('\n')),shas.original);
}

test('five tests retain exact original source outside nine mock and role seams',()=>authenticate());
test('changing the historical assertion is refused',()=>assert.throws(()=>authenticate(current.replace('focusBefore);','null);')),/current role test identity/));
test('fabricated historical and current component identities are refused',()=>{
  assert.throws(()=>authenticate(current,original,historical+'\n'),/historical component identity/);
  assert.throws(()=>authenticate(current,original,historical,currentComponent+'\n'),/current component identity/);
});
