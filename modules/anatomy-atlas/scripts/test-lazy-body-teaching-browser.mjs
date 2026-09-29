import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from './workspace-component-test-build.mjs';
const [base,report]=process.argv.slice(2);
assert(base&&report&&new URL(base).hostname==='127.0.0.1');
const root=new URL('../',import.meta.url);
const inputs=await (await fetch(new URL('source-inputs.json',base))).json();
const sourceHashes={};
for(const path of ['app/body-explorer.tsx','app/lazy-body-teaching.tsx','lib/body-teaching-loader.ts','app/anatomy-control-rail.tsx']){
 sourceHashes[path]=createHash('sha256').update(await readFile(new URL(path,root))).digest('hex');
 assert.equal(inputs.find(entry=>entry.path===path)?.sha256,sourceHashes[path],`Built source matches ${path}`);
}
const compiled=await build({stdin:{contents:"export {bodyContent} from './app/body-content';",resolveDir:fileURLToPath(root),loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node'});
const mod={exports:{}};runInNewContext(compiled.outputFiles[0].text,{module:mod,exports:mod.exports,require:createRequire(new URL('package.json',root))});
const catalog=JSON.parse(await readFile(new URL('public/models/bodyparts3d/full-body/catalog.json',root)));
const {chromium}=await import(process.env.VM_PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true});
const evidence={base,sourceHashes,cases:[],errors:[],passed:false,clinicalApproval:false,published:false};
try {
 for(const [width,fail] of [[1280,false],[375,false],[375,true]]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<600,isMobile:width<600});
  const page=await context.newPage();page.setDefaultTimeout(45000);
  const requests=[],failures=[];
  page.on('pageerror',e=>evidence.errors.push(e.message));
  page.on('request',r=>{if(/\/body-content-[^/]+\.js/.test(r.url()))requests.push(r.url());});
  page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()?.errorText}));
  let blocked=false;
  if(fail)await page.route('**/body-content-*.js',async route=>{if(!blocked){blocked=true;await route.abort('failed');}else await route.continue();});
  const address=new URL(base);address.search='?region=leg';
  await page.goto(address.href);await page.locator('.body-toolbar').waitFor();
  await page.locator('canvas').waitFor();
  assert.equal(requests.length,0,'No teaching module fetched before a teaching selection');
  async function select(name){
   const close=page.getByRole('button',{name:'Close structure info',exact:true});if(await close.isVisible())await close.click();
   await page.getByRole('button',{name:'Search atlas',exact:true}).click();
   await page.getByPlaceholder('e.g. Achilles, peroneus, CN IV, FMA…').fill(name);
   await page.locator('button[data-atlas-search-key]').filter({has:page.locator('strong',{hasText:new RegExp('^'+name+'$')})}).click();
  }
  await select('Right patella');
  if(fail){
   const retry=page.getByRole('button',{name:'Retry teaching notes',exact:true});await retry.waitFor();
   assert(await page.locator('canvas').isVisible(),'Viewer survives teaching fetch failure');
   await retry.focus();await retry.press('Enter');
   // Chromium can cache a failed dynamic module load. A manual, clearly warned
   // reload is the safe fallback; never auto-reset the learner's model view.
   const reload=page.getByRole('button',{name:'Reload atlas',exact:true});
   await reload.waitFor();
   assert((await page.getByRole('alert').innerText()).includes('resets your current unsaved view'));
   await reload.click();await page.locator('.body-toolbar').waitFor();
   await select('Right patella');
  }
  const checks=[];
  for(const name of ['Right patella','Left tibia']){
   if(name!=='Right patella')await select(name);
   const structure=catalog.structures.find(s=>s.name===name);assert(structure);
   for(const [group,label,tab] of [['Anatomy','Overview','anatomy'],['Anatomy','Function','function'],['Imaging','CT','ct'],['Imaging','MRI','mri'],['Clinical','Clinical notes','clinical']]){
    await page.getByRole('tab',{name:group,exact:true}).click();
    await page.getByRole('tab',{name:label,exact:true}).click();
    const expected=mod.exports.bodyContent(structure,tab);
    await page.locator('.atlas-note-body:visible').getByText(expected.body,{exact:true}).waitFor();
    await page.locator('.atlas-note-body:visible > .eyebrow').filter({hasText:expected.title}).waitFor();
    checks.push({name,tab,title:expected.title});
   }
  }
  assert.equal(requests.length,fail?2:1,'Teaching module shared; failed network import retries once');
  const screenshot=report.replace(/\.json$/,`-${width}-${fail?'recovery':'notes'}.png`);
  await page.screenshot({path:screenshot,fullPage:false,animations:'disabled'});
  let tourChecked=false;
  if(width===375&&!fail){
   await page.getByRole('button',{name:'Close structure info',exact:true}).click();
   await page.getByText('Guided learning',{exact:true}).click();
   await page.getByRole('button',{name:'Start guided tour',exact:true}).click();
   await page.locator('.regional-tour-explanation > summary').click();
   await page.getByText('CT / MRI & imaging notes',{exact:true}).click();
   await page.locator('.tour-imaging-options').getByRole('button',{name:'MRI',exact:true}).click();
   assert((await page.locator('.tour-imaging-reader').innerText()).includes('No scan loaded or spatial alignment'));
   await page.getByRole('button',{name:'Next',exact:true}).click();
   await page.getByText('CT / MRI & imaging notes',{exact:true}).click();
   await page.locator('.tour-imaging-content h3').waitFor();
   await page.getByRole('button',{name:'Play',exact:true}).click();
   await page.getByRole('button',{name:'Pause',exact:true}).click();
   await page.getByRole('button',{name:'Exit tour',exact:true}).click();
   tourChecked=true;
  }
  evidence.cases.push({width,fail,requests,failures,checks,screenshot,tourChecked});
  await context.close();
 }
 assert.deepEqual(evidence.errors,[]);evidence.passed=true;
}catch(error){evidence.failure=String(error.stack??error);process.exitCode=1;}
finally{await browser.close();await writeFile(report,JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({passed:evidence.passed,cases:evidence.cases.length,failure:evidence.failure}));}
