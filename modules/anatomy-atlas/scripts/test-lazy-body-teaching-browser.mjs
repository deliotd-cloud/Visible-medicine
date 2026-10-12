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
const teaching=await (await fetch(new URL('teaching-chunks.json',base))).json();
assert.equal(teaching.schemaVersion,1);assert.equal(teaching.fallback.length,1);
assert.equal(new Set(teaching.regions.map(row=>row.region)).size,teaching.regions.length);
const assetKey=url=>{const value=new URL(url,base);return value.origin+value.pathname;};
const regionalUrls=new Map(teaching.regions.map(row=>[assetKey(row.path),row.region]));
const fallbackUrls=new Set(teaching.fallback.map(assetKey));
assert.equal(regionalUrls.size,teaching.regions.length,'One distinct emitted chunk per source region');
const sourceHashes={};
for(const path of ['app/body-explorer.tsx','app/lazy-body-teaching.tsx','lib/body-teaching-loader.ts','lib/regional-teaching-imports.ts','lib/regional-teaching-snapshot.ts','lib/body-source-additions.ts','lib/content-types.ts','scripts/regional-teaching-snapshots.mjs','integration/module-audit.mjs','app/body-content.ts','lib/body-display-catalog.ts','app/anatomy-control-rail.tsx',...teaching.regions.map(row=>`content/regional-teaching/${row.region}.json`)]){
 sourceHashes[path]=createHash('sha256').update(await readFile(new URL(path,root))).digest('hex');
 assert.equal(inputs.find(entry=>entry.path===path)?.sha256,sourceHashes[path],`Built source matches ${path}`);
}
const compiled=await build({stdin:{contents:"export {bodyContent} from './app/body-content'; export {bodyDisplayCatalog} from './lib/body-display-catalog';",resolveDir:fileURLToPath(root),loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node'});
const mod={exports:{}};runInNewContext(compiled.outputFiles[0].text,{module:mod,exports:mod.exports,require:createRequire(new URL('package.json',root))});
const catalog=mod.exports.bodyDisplayCatalog(JSON.parse(await readFile(new URL('public/models/bodyparts3d/full-body/catalog.json',root))));
const selections=['Right patella','Left tibia'].map(name=>{const structure=catalog.structures.find(s=>s.name===name);assert(structure);assert(teaching.regions.some(row=>row.region===structure.region));return structure;});
const {chromium}=await import(process.env.VM_PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true});
const evidence={base,sourceHashes,teaching,cases:[],errors:[],passed:false,clinicalApproval:false,published:false};
try {
 for(const [width,fail] of [[1280,false],[375,false],[375,true]]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<600,isMobile:width<600});
  const page=await context.newPage();page.setDefaultTimeout(45000);
  const requests=[],regionalRequests=[],fallbackRequests=[],failures=[];
  page.on('pageerror',e=>evidence.errors.push(e.message));
  page.on('request',r=>{
   const key=assetKey(r.url()),region=regionalUrls.get(key);
   if(region){requests.push(r.url());regionalRequests.push({url:r.url(),region});}
   if(fallbackUrls.has(key)){requests.push(r.url());fallbackRequests.push(r.url());}
  });
  page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()?.errorText}));
  let blocked=false;
  if(fail)await page.route(url=>regionalUrls.has(assetKey(url.href)),async route=>{
   if(!blocked){blocked=true;await route.abort('failed');}else await route.continue();
  });
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
  for(const structure of selections){
   const name=structure.name;
   if(name!=='Right patella')await select(name);
   for(const [group,label,tab] of [['Anatomy','Overview','anatomy'],['Anatomy','Function','function'],['Imaging','CT','ct'],['Imaging','MRI','mri'],['Clinical','Clinical notes','clinical']]){
    await page.getByRole('tab',{name:group,exact:true}).click();
    await page.getByRole('tab',{name:label,exact:true}).click();
    const expected=mod.exports.bodyContent(structure,tab);
    await page.locator('.atlas-note-body:visible').getByText(expected.body,{exact:true}).waitFor();
    await page.locator('.atlas-note-body:visible > .eyebrow').filter({hasText:expected.title}).waitFor();
    checks.push({name,tab,title:expected.title});
   }
  }
  const selectedRegions=[...new Set(selections.map(structure=>structure.region))];
  for(const region of selectedRegions){
   const expected=1+(fail&&region===selections[0].region?1:0);
   assert.equal(regionalRequests.filter(request=>request.region===region).length,expected,
    `Selected source region ${region}: one successful import, plus the injected failure when applicable`);
  }
  assert.equal(regionalRequests.length,selectedRegions.length+(fail?1:0),'No unrelated regional imports for selected notes');
  assert.equal(fallbackRequests.length,0,'Known exact sources never request the original full fallback');
  assert.equal(failures.filter(request=>regionalUrls.has(assetKey(request.url))).length,fail?1:0,
    'Exactly one injected regional network failure; cached retry adds no network request');
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
  assert.equal(fallbackRequests.length,0,'Tour smoke must also preserve known-source regional loading');
  evidence.cases.push({width,fail,requests,regionalRequests,fallbackRequests,selectedRegions,failures,checks,screenshot,tourChecked});
  await context.close();
 }
 assert.deepEqual(evidence.errors,[]);evidence.passed=true;
}catch(error){evidence.failure=String(error.stack??error);process.exitCode=1;}
finally{await browser.close();await writeFile(report,JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({passed:evidence.passed,cases:evidence.cases.length,failure:evidence.failure}));}
