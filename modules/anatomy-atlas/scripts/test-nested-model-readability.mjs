// Focused CSS geometry probe, not production/GPU or physical-device acceptance.
// Uses the existing local Playwright installation; writes no generated files.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium} = await import(process.env.VM_PLAYWRIGHT_MODULE || 'playwright');
const css = (await Promise.all(['eye-layers', 'study-surface', 'atlas-panel', 'scene-orientation'].map(name =>
  readFile(new URL(`../app/${name}.css`, import.meta.url), 'utf8')))).join('\n');
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage();
  for (const width of [320, 375, 700]) for (const height of [320, 577, 812]) for (const scale of [1, 2]) {
    await page.setViewportSize({width, height});
    await page.setContent(`<style>
      *{box-sizing:border-box}html{font-size:${scale * 100}%}body{margin:0}
      button{font:inherit; padding:.3rem .6rem; line-height:1.4}
      html,body{height:100%}.body-topbar{flex:none;height:140px}.body-app{height:100dvh}
      .body-scene canvas{display:block;width:100%;height:100%}
      [data-slot='switch']{position:relative;display:inline-flex;align-items:center;flex:none;padding:0;border:1px solid transparent}
      [data-slot='switch'][data-size='default']{width:32px;height:18.4px}
      [data-slot='switch'][data-size='sm']{width:24px;height:14px}
      [data-slot='switch']::after{content:'';position:absolute;inset:-.5rem -.75rem}
      [data-slot='switch-thumb']{display:block;flex:none;width:1rem;height:1rem;pointer-events:none}
      [data-size='sm'] [data-slot='switch-thumb']{width:.75rem;height:.75rem}
      [data-checked] [data-slot='switch-thumb']{transform:translateX(calc(100% - 2px))}
      ${css}
    </style><main class="body-app" data-presentation="panel" data-panel-short="true">
      <header class="body-topbar">Atlas shared header</header>
      <section class="atlas-inline-study eye-layers-dialog" data-study-surface="inline" data-slot="dialog-content">
        <div class="eye-layer-heading"><div><h2 data-slot="dialog-title">Ventricular dissection</h2>
          <p data-slot="dialog-description">Source-bound anatomical teaching model, pending review.</p></div><button>Back to atlas</button></div>
        <div class="eye-layer-workbench"><div class="eye-layer-viewport">
          <div class="eye-layer-scene-tools"><button data-slot="select-trigger">Anterior</button><button>Labels</button><button>Frame ventricles</button></div>
          <div class="body-scene"><div class="anatomy-oriented-scene" data-orientation="true">
            <p class="anatomy-live-orientation">View from: <span>anterior-left</span></p>
            <div style="position:relative;min-height:0"><canvas aria-label="Model drawing area"></canvas></div>
          </div></div>
          <p class="eye-layer-layout-note"><span>Separated teaching layout · not anatomical positions</span><button>Restore whole view</button></p>
        </div><aside class="eye-layer-controls">
          <ul class="eye-layer-list">${['default','sm'].flatMap(size=>[true,false].map(checked=>
            `<li><button>${size} component ${checked?'shown':'hidden'}</button><button role="switch" aria-label="${size} ${checked?'shown':'hidden'}" aria-checked="${checked}" data-slot="switch" data-size="${size}" ${checked?'data-checked':'data-unchecked'}><span data-slot="switch-thumb"></span></button></li>`)).join('')}</ul>
          ${Array.from({length:12},(_,i)=>`<p><button>Component ${i+1} visibility</button></p>`).join('')}
          <p class="eye-layer-cut-warning">Cut teaching view · not a scan. Original source boundaries remain unchanged.</p>
          <button id="last-control">Restore all components</button>
        </aside></div>
      </section></main>`);
    const dimensions = await page.evaluate(() => {
      const app=document.querySelector('.body-app'), study=document.querySelector('.atlas-inline-study'), canvas=document.querySelector('canvas');
      return {canvasHeight:canvas.getBoundingClientRect().height,
        overflow:app.scrollWidth>app.clientWidth+1 || study.scrollWidth>study.clientWidth+1 || document.documentElement.scrollWidth>innerWidth+1,
        switchThumbsContained:[...document.querySelectorAll('[data-slot="switch"]')].every(e=>{
          const r=e.getBoundingClientRect(),t=e.firstElementChild.getBoundingClientRect();
          return t.left>=r.left && t.right<=r.right+0.1 && t.top>=r.top && t.bottom<=r.bottom+0.1;
        }),
        toolHeights:[...document.querySelectorAll('.eye-layer-scene-tools button')].map(e=>e.getBoundingClientRect().height)};
    });
    assert(dimensions.canvasHeight>=200, `${width}x${height}/${scale}: canvas ${dimensions.canvasHeight}px`);
    assert(!dimensions.overflow, `${width}x${height}/${scale}: horizontal overflow`);
    assert(dimensions.switchThumbsContained, `${width}x${height}/${scale}: switch thumb extends beyond track`);
    assert(dimensions.toolHeights.every(h=>h>=44), `${width}x${height}/${scale}: small scene target`);
    for (const selector of ['canvas', '.eye-layer-layout-note', '.eye-layer-cut-warning', '#last-control']) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      const visible = await page.locator(selector).evaluate(e => {
        const r=e.getBoundingClientRect();let top=Math.max(0,r.top),bottom=Math.min(innerHeight,r.bottom);
        for(let p=e.parentElement;p;p=p.parentElement) if(/auto|scroll|hidden|clip/.test(getComputedStyle(p).overflowY)) {
          const pr=p.getBoundingClientRect();top=Math.max(top,pr.top);bottom=Math.min(bottom,pr.bottom);
        }
        return Math.max(0,bottom-top);
      });
      const elementHeight=await page.locator(selector).evaluate(e=>e.getBoundingClientRect().height);
      assert(visible>=Math.min(selector==='canvas'?190:24,height,elementHeight)-1, `${width}x${height}/${scale}: ${selector} clipped (${visible}px)`);
    }
    console.log(JSON.stringify({width,height,scale,...dimensions,reachable:true}));
  }
} finally { await browser.close(); }
