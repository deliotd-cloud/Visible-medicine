// Test-only, exact native-confirm fixture seam. Live viewer/tests still execute.
import assert from 'node:assert/strict';
import {restoreBeforeHeadHistoryProjectionRoot} from './head-epoch-projections.mjs';
import {createHash} from 'node:crypto';
import {restoreLaterDisclosureHarness} from './head-disclosure-later-harness-inverse.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const addedImport="import {restorePracticeConfirmConsumer} from './head-practice-confirm-harness-inverse.mjs';\n";
const roles={
 'head-image-history.test.ts':['eae943c637cb3049297618d15b0a7728cc932745591df2e1f72df6d62d41f20f','5282143cc7d182d6a5a71bda18afe269ea2d18a2b88a57b58693936c2c6dbabc'],
 'head-disclosure-harness-preservation.test.mjs':['6b909e39b97b23aa7b7ac6dec2a552e0958acea68601d3f2ec37f381cb0b8633','fbde7b1c240f2f0552e86dc6b365709a068eccdd612c26381427fb60232d5a7c'],
 'head-image-history-anchor-harness.test.mjs':['fec315d0caa2a1bb80fb990b05250fd088776d7aeacd7baba62184795c5f3c99','66645a662c9a0075e2728cd6d5b6c8aa1f714ed415ad8f6179fd92c1c4ef9527'],
 'head-history-role-preservation.test.mjs':['7573d5c5d2c654bbdccfb4c249108448571fd2c4e7ce6b6bf306d2c34da0aa7f','c721d7b4f6432e9ce9ea8a6cf76131ed24b74b6e78fd2a230676da0a55fd8b73'],
};
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,'Exact confirm fixture reader seam');return s.replace(a,b);};
const laterHarnesses=new Set(['head-image-history.test.ts','head-mask-picking-ui.test.ts',
 'head-slice-keyboard.test.ts','head-slice-zoom.test.ts','head-view-history-client.test.mjs']);
export function restorePracticeConfirmConsumer(name,bytes){
 if(name==='head-history-role-preservation.test.mjs')bytes=restoreBeforeHeadHistoryProjectionRoot(Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes));
 if(laterHarnesses.has(name)){
  assert(Buffer.isBuffer(bytes)||typeof bytes==='string','Exact later harness input type');
  bytes=restoreLaterDisclosureHarness(name,typeof bytes==='string'?Buffer.from(bytes,'utf8'):bytes);
 }
 if(!Object.hasOwn(roles,name))return Buffer.from(bytes);
 const [current,prior]=roles[name];assert.equal(sha(bytes),current,name+' full current native-confirm fixture role');let text=bytes.toString();
 if(name==='head-image-history.test.ts')text=once(text,'const window={location,history,confirm:()=>true,addEventListener','const window={location,history,addEventListener');
 else{
  text=once(text,addedImport,'');
  if(name==='head-disclosure-harness-preservation.test.mjs')text=once(text,"let current=restorePracticeConfirmConsumer(file,read('./'+file)).toString();","let current=read('./'+file).toString();");
  if(name==='head-image-history-anchor-harness.test.mjs')text=once(text,"restorePracticeConfirmConsumer('head-image-history.test.ts',fs.readFileSync(new URL('./head-image-history.test.ts',import.meta.url),'utf8')).toString()","fs.readFileSync(new URL('./head-image-history.test.ts',import.meta.url),'utf8')");
  if(name==='head-history-role-preservation.test.mjs'){
   text=once(text,"live=restorePracticeConfirmConsumer(name+'.test.mjs',read(`./${name}.test.mjs`))","live=read(`./${name}.test.mjs`)");
   text=once(text,"const current=restorePracticeConfirmConsumer(name+'.test.mjs',read(`./${name}.test.mjs`)).toString();","const current=read(`./${name}.test.mjs`).toString();");
  }
 }
 assert.equal(sha(text),prior,name+' complete pre-confirm fixture role');return Buffer.from(text);
}
