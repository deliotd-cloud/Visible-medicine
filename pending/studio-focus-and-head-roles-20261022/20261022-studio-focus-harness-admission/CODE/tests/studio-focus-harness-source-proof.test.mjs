import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const stage=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const records={
  'studio-course-details-content.test.mjs':['d84c858a85405a80282cac15b02d4ee790cab21bee38fe456920bdbe8405ab32','f8bd174d91ed3ac05de9b33efc0537fa2b9519e2db1473f38219c713a6a6e3ff',5],
  'studio-course-details-form.test.mjs':['27d86526e6d43f034b23beca5d9806f50d1043c73a0310de5eeb8a5ed7e384e7','83cb4dc6818b6e50beeb2c04fae2028f3f163c2a6f1dd79dd45aff739755bb12',3],
  'studio-course-draft-discard.test.mjs':['82cc2e71926ecdc3c22b776b37fe9fc82d62703dc09950d5f336dad4867ff170','234963c717fc82f8a4a84e7060d115f21a535ef840ba517c2cbaf0696d4b9815',1],
  'studio-course-editor-keyboard.test.mjs':['3f3bf4f9dad4681a0ceb00d2c1b87b6d47179ac603044395a386d91c0e26ad4e','35441cf8f6fc631b9e2edd62218c322d465c9e7209839a14aeea68c53fd98a58',1],
  'studio-course-history.test.mjs':['e6001c39a22e4f1dea6942bb7eaad82aa6a035273a8feb98dd8827ea7dcb0682','286f6ae77145ae66cc50820b05c83840ad20ab33a041c3cbd8ed721828e6b0a4',1],
  'studio-course-options.test.mjs':['2772d496d27046d19d7b68a0cdd5b857f5968f4f70394aa582a374b00f152e76','5eaf815544a9584548c4ed0c2011231efeabc2c80afbe05cbfda7c22afd5d7f1',1],
  'studio-course-outline-link-names.test.mjs':['572336fec79e46f0ab42bf908198b36547e2770b77ab4eeb555de7f50a5fe680','5aba95f8e5bf61338dabe1971b30a958104e867da42896a81c4975df8c4dd222',1],
  'studio-course-popstate-focus.test.mjs':['d1782cd45d0211b8a47627847f01b1a8a71df62cb85144de443577e4e3ff174f','6811eb51e9d29987236669486532d8accc4467cb74fe2b1cc58ed24a7788e820',1],
  'studio-course-recovery-notice.test.mjs':['c00afac189203c9b5f4c5a4ad263e978d277d52bb692d779f78debd757673f9c','686c9a83981138954def428a0291cb6c29b6696585e83811113e1b4f1954a150',1],
  'studio-course-switch-details.test.mjs':['85226ca5d1cf56768a88952669013b019bcfba4482c727e27f25667c00b24311','2617ff2c5b95e3100d1b166af9a496ed4058a15a842a614fba9b839940e7cbdb',4],
};
const hash=value=>createHash('sha256').update(value).digest('hex');

function verify(name,modified){
  const [oldSha,newSha,count]=records[name];
  const original=readFileSync(resolve(stage,'RAW/preimages',name),'utf8');
  const candidate=modified??readFileSync(resolve(stage,'CODE/tests',name),'utf8');
  assert.equal(hash(original),oldSha,`${name} preimage identity`);
  assert.equal(hash(candidate),newSha,`${name} candidate identity`);
  const a=original.split('\n'),b=candidate.split('\n'),rows=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)rows[i][j]=a[i]===b[j]?rows[i+1][j+1]+1:Math.max(rows[i+1][j],rows[i][j+1]);
  let i=0,j=0,hunks=[],rebuilt=[];
  while(i<a.length||j<b.length){
    if(i<a.length&&j<b.length&&a[i]===b[j]){rebuilt.push(b[j]);i++;j++;continue;}
    const before=[],after=[];
    while(i<a.length||j<b.length){
      if(i<a.length&&j<b.length&&a[i]===b[j])break;
      if(j<b.length&&(i===a.length||rows[i][j+1]>rows[i+1][j]))after.push(b[j++]);
      else before.push(a[i++]);
    }
    assert(before.every(line=>!/^\s*(?:assert\.|test\()/.test(line)),`${name} removed assertion`);
    assert(after.every(line=>/useRef|optionsTarget|optionsEvent|focus\.querySelector|course-title|\? \{ focus|oldToggle\(|old\(|current\(|onClick\(/.test(line)),`${name} unrelated hunk ${JSON.stringify(after)}`);
    hunks.push({before,after});rebuilt.push(...before);
  }
  assert.equal(hunks.length,count,`${name} exact adapter hunk count`);
  assert.equal(rebuilt.join('\n'),original,`${name} reverse reconstruction`);
  assert.equal(hash(rebuilt.join('\n')),oldSha,`${name} original SHA restored`);
  return hunks.length;
}

test('each enumerated mock/event hunk reverses to exact frozen original source',()=>{
  let hunks=0;for(const name of Object.keys(records))hunks+=verify(name);
  assert.equal(hunks,19);
});
test('unexpected candidate mutation is refused',()=>{
  const name='studio-course-details-content.test.mjs';const candidate=readFileSync(resolve(stage,'CODE/tests',name),'utf8');
  assert.throws(()=>verify(name,candidate.replace('course-title','changed-title')),/candidate identity/);
});
test('deleted original assertion is refused',()=>{
  const name='studio-course-details-content.test.mjs';const candidate=readFileSync(resolve(stage,'CODE/tests',name),'utf8');
  assert.throws(()=>verify(name,candidate.replace(/\s*assert\.equal\(app\.selected\(\), 'content'\);/,'\n')),/candidate identity/);
});
