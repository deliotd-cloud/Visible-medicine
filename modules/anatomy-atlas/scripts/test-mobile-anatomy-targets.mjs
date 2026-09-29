// Generated viewer: actual target boxes, phone/tablet/desktop and text enlargement.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.VM_PLAYWRIGHT_MODULE||'playwright');
const [base,report]=process.argv.slice(2);
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const inputs=await (await fetch(new URL('source-inputs.json',base))).json();
for(const path of ['app/body-explorer.css','app/um-knee-study.css'])
 assert.equal(inputs.find(i=>i.path===path)?.sha256,createHash('sha256').update(await readFile(path)).digest('hex'));
const cases=[],browser=await chromium.launch({headless:true});let failure=null;
try{
 for(const [width,height,touch,textScale] of [[320,480,true,1],[375,577,true,1],[375,577,true,2],[700,812,true,1],[1024,768,true,1],[1440,820,false,1]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
  const page=await context.newPage();page.setDefaultTimeout(20000);
  await page.goto(new URL('/qa',base).href);
  const url=new URL(base);url.search='?region=thigh';
  await page.locator('iframe').evaluate((e,url)=>{e.src=url;},url.href);
  await page.waitForFunction(url=>document.querySelector('iframe').contentWindow.location.href===url&&document.querySelector('iframe').contentDocument.querySelector('.body-toolbar'),url.href);
  const frame=page.frames().find(f=>f.url()===url.href);assert(frame);
  if(textScale!==1)await frame.locator('html').evaluate((e,scale)=>{e.style.fontSize=100*scale+'%';},textScale);
  const metrics=async(selector)=>frame.locator(selector).evaluateAll(es=>es.map(e=>{
   const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label')||e.textContent.trim(),width:r.width,height:r.height};
  }));
  const root=await metrics('.body-toolbar > button, .body-view-row > .body-zoom button');
  assert(root.length>=4);
  for(const box of root)assert(box.width >= (touch?44:30)&&box.height >= (touch?44:31),JSON.stringify(box));
  const cameraRowHeight=await frame.locator('.body-view-row').evaluate(e=>e.getBoundingClientRect().height);
  if(touch&&width>=375&&textScale===1)assert(cameraRowHeight<=48,'Normal-size camera controls should share one row');
  assert.equal(await frame.locator('html').evaluate(e=>e.scrollWidth>innerWidth+1),false);
  const labels=frame.getByRole('button',{name:'Toggle stage and selected labels',exact:true});
  const before=await labels.getAttribute('aria-pressed');await labels.click();assert.notEqual(await labels.getAttribute('aria-pressed'),before);
  await frame.getByText('Dissect',{exact:true}).click();
  await frame.getByRole('button',{name:'Hip & thigh dissection · separate specimen',exact:true}).click();
  const study=frame.locator('.atlas-inline-study:not([hidden])');
  await study.locator('.vm-scene-recovery[data-health="ready"]').waitFor();
  const specimen=await metrics('.atlas-inline-study:not([hidden]) .um-knee-camera-tools button');
  assert(specimen.length>=6);
  if(touch)for(const box of specimen)assert(box.width>=44&&box.height>=44,JSON.stringify(box));
  assert.equal(await frame.locator('html').evaluate(e=>e.scrollWidth>innerWidth+1),false);
  const canvas=await study.locator('canvas').boundingBox();assert(canvas.height>=160);
  await study.getByRole('button',{name:'Back to atlas',exact:true}).click();
  await frame.locator('.body-toolbar').waitFor({state:'visible'});
  cases.push({width,height,touch,textScale,root,specimen,cameraRowHeight,canvasHeight:canvas.height,noHorizontalOverflow:true,labelsToggleAndReturn:true});
  await context.close();
 }
}catch(error){failure=error.message;throw error;}finally{
 await browser.close();await writeFile(report,JSON.stringify({cases,failure,clinicalApproval:false},null,2)+'\n');
}
console.log(JSON.stringify({passed:true,cases:cases.length}));
