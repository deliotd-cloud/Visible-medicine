// Browser regression for the real shoulder module's initial, named landmarks.
import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [url,report]=process.argv.slice(2);
assert(url&&report,'Supply a loopback shoulder module URL and local report path');
assert(['127.0.0.1','localhost'].includes(new URL(url).hostname),'Loopback only');
const inputs=await (await fetch(new URL('source-inputs.json',url))).json();
for(const path of ['app/scene-label-layer.tsx','lib/screen-label-layout.ts','app/atlas-panel.css']){
  const candidate=createHash('sha256').update(await readFile(new URL('../'+path,import.meta.url))).digest('hex');
  assert.equal(inputs.find(i=>i.path===path)?.sha256,candidate,'Production source mismatch: '+path);
}
const {chromium}=await import(process.env.VM_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});const cases=[],errors=[];let failure=null;
try{
  const page=await browser.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push(e.message));
  for(const width of [320,375,1024])for(const scale of [1,2]){
    await page.setViewportSize({width,height:width<700?577:820});
    await page.goto(url);await page.locator('canvas').waitFor();
    await page.waitForFunction(()=>[...document.querySelectorAll('.scene-label')].some(e=>getComputedStyle(e).visibility==='visible'));
    await page.evaluate(scale=>{document.documentElement.style.fontSize=`${scale*100}%`;},scale);
    await page.waitForTimeout(350);
    const labels=await page.evaluate(()=>{
      const overlay=document.querySelector('.scene-label-overlay').getBoundingClientRect();
      const buttons=[...document.querySelectorAll('button.scene-label')],dots=[...document.querySelectorAll('.scene-label-leaders circle')];
      return buttons.filter(e=>getComputedStyle(e).visibility==='visible').map(e=>{
        const rect=e.getBoundingClientRect(),text=e.firstChild,words=[];
        for(const match of text.textContent.matchAll(/\S+/g)){
          const range=document.createRange();range.setStart(text,match.index);range.setEnd(text,match.index+match[0].length);
          words.push({word:match[0],lines:range.getClientRects().length});
        }
        const dot=dots[buttons.indexOf(e)],x=Number(dot.getAttribute('cx')),y=Number(dot.getAttribute('cy'));
        const coversAnchor=x>=rect.left-overlay.left&&x<=rect.right-overlay.left&&y>=rect.top-overlay.top&&y<=rect.bottom-overlay.top;
        return {name:e.getAttribute('aria-label'),side:e.dataset.side,width:rect.width,height:rect.height,font:getComputedStyle(e).fontSize,coversAnchor,
          left:rect.left-overlay.left,right:rect.right-overlay.left,canvasWidth:overlay.width,words,disabled:e.disabled};
      });
    });
    const row={width,scale,labels,verified:false};cases.push(row);
    for(const name of ['Scapula','Proximal humerus']){
      const label=labels.find(l=>l.name===name);assert(label,'Initial landmark remains visible: '+name);
      assert(label.words.every(w=>w.lines===1),`${width}/${scale}: word split inside ${name}`);
      assert(!label.coversAnchor,`${width}/${scale}: label covers its own anatomical anchor`);
      // Selected Scapula also carries the two-word depth disclosure. Permit
      // those natural three lines plus padding, but not the old broken-word tower.
      assert(!label.disabled);assert(label.height<=4.5*parseFloat(label.font),'Readable label does not form a tall character column');
      assert(label.side==='left'?label.right<label.canvasWidth/2:label.left>label.canvasWidth/2,'Correct screen side, no centre crossing');
    }
    // Use the real button to select, not a state injection. Exact ID is owned by
    // its existing binding; ensure selected-label semantics follow the click.
    const humerus=page.getByRole('button',{name:'Proximal humerus',exact:true});
    await humerus.click();await page.waitForFunction(()=>document.querySelector('button.scene-label[aria-label="Proximal humerus"]')?.getAttribute('aria-current')==='true');
    row.selectionWorks=true;row.verified=true;
  }
  assert.deepEqual(errors,[]);
}catch(e){failure=e.message;throw e;}
finally{await browser.close();await writeFile(report,JSON.stringify({url,scope:'Initial shoulder landmarks, desktop browser emulation and root-font enlargement; not all names, native zoom or clinical acceptance',cases,errors,failure},null,2)+'\n');}
