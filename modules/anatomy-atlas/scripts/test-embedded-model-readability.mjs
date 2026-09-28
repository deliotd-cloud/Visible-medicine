// Real-browser layout regression. No private records, screenshots or source
// assets are uploaded. Supply an already installed Playwright module explicitly.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const [baseUrl, outputPath] = process.argv.slice(2);
assert(baseUrl && outputPath, 'Usage: node scripts/test-embedded-model-readability.mjs <loopback module URL> <local report.json>');
const url = new URL(baseUrl);
assert(['127.0.0.1','localhost'].includes(url.hostname), 'Local preview only');
const inputsResponse=await fetch(new URL('source-inputs.json',baseUrl));
assert(inputsResponse.ok,'Served production input manifest must be available');
const servedInputs=await inputsResponse.json();
const servedCssSha256=servedInputs.find(input=>input.path==='app/atlas-panel.css')?.sha256;
assert(servedCssSha256,'Served stylesheet source must be fingerprinted');
const {chromium} = await import(process.env.VM_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({headless:true});
const results=[],errors=[];
let failure=null;
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror', error => errors.push(error.message));
  for (const region of ['thorax','head-neck','foot','spine','whole-body']) {
    for (const [viewport,width,height,scale] of [['phone',375,577,1],['phone-text200',375,577,2],['desktop',1440,820,1]]) {
      await page.setViewportSize({width,height});
      const target=new URL(baseUrl);target.searchParams.set('region',region);
      const response=await page.goto(new URL('/qa',baseUrl).href,{waitUntil:'domcontentloaded'});
      assert.equal(response.status(),200);
      await page.locator('iframe').evaluate((e,target)=>{e.src=target;},target.href);
      await page.waitForFunction(target=>document.querySelector('iframe').contentWindow.location.href===target && document.querySelector('iframe').contentDocument.querySelector('canvas'),target.href);
      const frame=page.frames().find(f=>f.url()===target.href);
      assert(frame,'Embedded module frame loaded');
      await frame.evaluate(scale => {document.documentElement.style.fontSize=`${scale*100}%`;},scale);
      await page.waitForTimeout(250);
      const metrics=await frame.evaluate(() => {
        const app=document.querySelector('.body-app'),canvas=document.querySelector('canvas');
        const rect=canvas.getBoundingClientRect();
        return {canvasHeight:rect.height,canvasTop:rect.top,canvasBottom:rect.bottom,
          panelHeight:app.clientHeight,panelScrollHeight:app.scrollHeight,
          workspaceHeight:document.querySelector('.body-workspace').clientHeight,
          headerHeight:document.querySelector('.body-topbar').clientHeight,
          horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
          controls:[...document.querySelectorAll('.atlas-workspace-modes label')].map(e=>({name:e.textContent.trim(),height:e.getBoundingClientRect().height}))};
      });
      const result={region,viewport,scale,...metrics,verified:false};results.push(result);
      assert(metrics.canvasHeight>=200,`${region}/${viewport}: model drawing area ${metrics.canvasHeight}px`);
      assert(!metrics.horizontalOverflow,`${region}/${viewport}: horizontal overflow`);
      assert(metrics.controls.every(c=>c.height>=40),`${region}/${viewport}: inaccessible mode target`);
      if(scale===1) assert(metrics.canvasBottom<=height+1,`${region}/${viewport}: model requires initial scroll`);
      await frame.locator('canvas').scrollIntoViewIfNeeded();
      const visibleHeight=await frame.evaluate(() => {
        const canvas=document.querySelector('canvas'),rect=canvas.getBoundingClientRect();
        let top=Math.max(0,rect.top),bottom=Math.min(innerHeight,rect.bottom);
        for(let e=canvas.parentElement;e;e=e.parentElement){
          if(/auto|scroll|hidden|clip/.test(getComputedStyle(e).overflowY)){
            const r=e.getBoundingClientRect();top=Math.max(top,r.top);bottom=Math.min(bottom,r.bottom);
          }
        }
        return Math.max(0,bottom-top);
      });
      assert(visibleHeight>=190,`${region}/${viewport}: only ${visibleHeight}px of model reachable through clipping ancestors`);
      const explore=frame.getByRole('radio',{name:'Explore',exact:true});
      await explore.focus();await page.keyboard.press('ArrowRight');
      await frame.waitForFunction(()=>document.querySelector('.body-app').dataset.workspaceMode==='dissect');
      // Compact Dissect intentionally opens the tools sheet and makes the
      // underlying radios inert. Close that sheet before checking/using them.
      if(width<700){
        await frame.getByRole('dialog',{name:'Systems & tools',exact:true}).waitFor();
        await page.keyboard.press('Escape');await frame.getByRole('dialog').waitFor({state:'hidden'});
      }
      assert.equal(await frame.getByRole('radio',{name:'Dissect',exact:true}).getAttribute('aria-checked'),'true');
      await frame.getByRole('radio',{name:'Dissect',exact:true}).focus();
      await page.keyboard.press('ArrowLeft');
      await frame.waitForFunction(()=>document.querySelector('.body-app').dataset.workspaceMode==='explore');
      const search=frame.getByRole('button',{name:'Search atlas',exact:true});
      await search.click();await frame.getByRole('dialog').waitFor();
      await page.keyboard.press('Escape');await frame.getByRole('dialog').waitFor({state:'hidden'});
      await frame.waitForFunction(()=>document.activeElement?.matches('.atlas-search-trigger'),{},{timeout:5000});
      if(width<700){
        const launcher=frame.getByRole('button',{name:'Systems & tools',exact:true});
        await launcher.click();await frame.getByRole('dialog').waitFor();
        const muscles=frame.getByRole('switch',{name:'Show Muscles',exact:true});
        const checked=await muscles.getAttribute('aria-checked');
        await muscles.focus();await page.keyboard.press('Space');
        assert.notEqual(await muscles.getAttribute('aria-checked'),checked);
        await page.keyboard.press('Space');assert.equal(await muscles.getAttribute('aria-checked'),checked);
        await page.keyboard.press('Escape');await frame.getByRole('dialog').waitFor({state:'hidden'});
        await frame.waitForFunction(()=>document.activeElement?.matches('.body-controls-launcher'),{},{timeout:5000});
      }
      Object.assign(result,{visibleHeight,keyboardModes:true,searchReturn:true,verified:true});
      console.log(JSON.stringify(result));
    }
  }
  assert.deepEqual(errors,[]);
} catch(error) {
  failure=error instanceof Error ? error.message : String(error);
  throw error;
} finally {
  await browser.close();
  const css=await readFile(new URL('../app/atlas-panel.css',import.meta.url));
  await writeFile(outputPath,JSON.stringify({baseUrl,servedCssSha256,candidateCssSha256:createHash('sha256').update(css).digest('hex'),
    method:'Production module at available embedded-panel dimensions; root font preference, not native zoom, physical touch, screen-reader, complete dissection or clinical acceptance.',failure,results,errors},null,2)+'\n');
}
