// Real generated regional module in a same-origin local iframe. No patient data.
// Run against the isolated QA server; source hashes prevent testing stale bundles.
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url), require=createRequire(new URL('package.json',root));
const {build}=require('esbuild');
const {chromium}=await import(process.env.VM_PLAYWRIGHT_MODULE||'playwright');
const [base,report]=process.argv.slice(2);
assert(base&&report,'Provide local module URL and evidence output path');
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const inputs=await (await fetch(new URL('source-inputs.json',base))).json();
for(const path of ['app/study-surface.css','app/eye-layers.css'])
  assert.equal(inputs.find(i=>i.path===path)?.sha256,createHash('sha256').update(await readFile(new URL(path,root))).digest('hex'));
const built=await build({stdin:{contents:"export * from './lib/nested-review-material';",resolveDir:fileURLToPath(root),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const rows=['ventricles','eye','femoral'].map(name=>api.nestedReviewRows.find(r=>r.study===name||r.study.includes(name)));
assert(rows.every(Boolean));
const browser=await chromium.launch({headless:true}),cases=[];let failure=null;
try {
 const page=await browser.newPage();page.setDefaultTimeout(20000);
 for(const row of rows){
  const packet=await api.nestedReviewMaterial(row.key,row.surfaces[0].id);assert(packet?.atlasLink);
  const target=new URL(base),link=new URL(packet.atlasLink,'https://local.invalid');
  target.search=link.search;target.searchParams.set('region',packet.source.parent.region);
  for(const [width,height] of [[320,480],[375,577],[700,812],[1440,820]]){
   await page.setViewportSize({width,height});
   await page.goto(new URL('/qa',base).href,{waitUntil:'domcontentloaded'});
   await page.locator('iframe').evaluate((e,url)=>{e.src=url;},target.href);
   await page.waitForFunction(url=>document.querySelector('iframe').contentWindow.location.href===url&&document.querySelector('iframe').contentDocument.querySelector('.atlas-inline-study .eye-layer-workbench'),target.href);
   const frame=page.frames().find(f=>f.url()===target.href);assert(frame);
   const study=frame.locator('.atlas-inline-study:not([hidden])');
   await study.locator('.vm-scene-recovery[data-health="ready"]').waitFor();
   await study.locator('details').evaluateAll(es=>es.forEach(e=>{e.open=true;}));
   let initialHeight;
   for(const [step,scale] of [1,2,1].entries()){
    await frame.evaluate(scale=>{document.documentElement.style.fontSize=`${100*scale}%`;},scale);
    await page.waitForTimeout(450); // Finish CSS transitions and ResizeObserver.
    const metrics=await study.evaluate(e=>{
     const d=e.ownerDocument,w=d.defaultView,c=e.querySelector('canvas'),controls=e.querySelector('.eye-layer-controls');
     const overflow=[d.documentElement,e,controls].filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>({name:el.className||el.tagName,client:el.clientWidth,scroll:el.scrollWidth}));
     const switches=[...e.querySelectorAll('[data-slot="switch"]')].filter(el=>el.getBoundingClientRect().height);
     return {canvasHeight:c.getBoundingClientRect().height,overflow,warning:!!e.querySelector('[data-slot="dialog-description"]')?.textContent,
      switchThumbsContained:switches.every(el=>{const r=el.getBoundingClientRect(),t=el.querySelector('[data-slot="switch-thumb"]').getBoundingClientRect();return t.left>=r.left-1&&t.right<=r.right+1&&t.top>=r.top-1&&t.bottom<=r.bottom+1;})};
    });
    const item={study:row.study,width,height,step,scale,...metrics,verified:false};cases.push(item);
    assert(metrics.canvasHeight>=200,JSON.stringify(item));assert.deepEqual(metrics.overflow,[],JSON.stringify(item));
    assert(metrics.warning);assert(metrics.switchThumbsContained,JSON.stringify(item));
    if(step===0)initialHeight=metrics.canvasHeight;
    if(step===2)assert(Math.abs(metrics.canvasHeight-initialHeight)<2,`Canvas failed to shrink: ${JSON.stringify(item)}`);
    for(const locator of [study.locator('canvas'),study.locator('.eye-layer-controls button:visible').last()]){
     await locator.scrollIntoViewIfNeeded();
     const visible=await locator.evaluate(el=>{const w=el.ownerDocument.defaultView,r=el.getBoundingClientRect();let top=Math.max(0,r.top),bottom=Math.min(w.innerHeight,r.bottom);for(let p=el.parentElement;p;p=p.parentElement)if(/auto|scroll|hidden|clip/.test(w.getComputedStyle(p).overflowY)){const pr=p.getBoundingClientRect();top=Math.max(top,pr.top);bottom=Math.min(bottom,pr.bottom);}return Math.max(0,bottom-top);});
     assert(visible>=(await locator.evaluate(el=>el.tagName==='CANVAS')?190:24),`Unreachable ${JSON.stringify(item)}`);
    }
    item.verified=true;console.log(JSON.stringify(item));
   }
  }
 }
}catch(error){failure=error.message;throw error;}
finally{await browser.close();await writeFile(report,JSON.stringify({base,failure,cases,physicalDevice:false,clinicalApproval:false},null,2)+'\n');}
