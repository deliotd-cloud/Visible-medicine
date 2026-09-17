// Public licensed source only. Run from outputs. Diagnostic, not an atlas release.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const output='.local/colonic-components-review';await mkdir(output,{recursive:true});
const audit=JSON.parse(await readFile('docs/colonic-components-source-audit.json'));
const bytes=await readFile(audit.prototype.path);
assert.equal(createHash('sha256').update(bytes).digest('hex'),audit.prototype.sha256);
const code=`import * as THREE from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const rows=${JSON.stringify(audit.parts.map(({fma,name,role,colour})=>({fma,name,role,colour})))};
const bytes=Uint8Array.from(atob('${bytes.toString('base64')}'),c=>c.charCodeAt(0));
const model=await new GLTFLoader().parseAsync(bytes.buffer,'');
const scene=new THREE.Scene();scene.background=new THREE.Color('#10232b');scene.add(model.scene);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);document.querySelector('#view').appendChild(renderer.domElement);
const camera=new THREE.PerspectiveCamera(32,1050/760,.01,100),controls=new OrbitControls(camera,renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x77929b,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(-4,6,9);scene.add(light);
const box=new THREE.Box3().setFromObject(model.scene),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()).length();controls.target.copy(center);
const render=()=>renderer.render(scene,camera);controls.addEventListener('change',render);
const frame=()=>{const bounds=new THREE.Box3().setFromObject(model.scene),target=bounds.getCenter(new THREE.Vector3()),radius=bounds.getSize(new THREE.Vector3()).length()/2;const vertical=THREE.MathUtils.degToRad(camera.fov),horizontal=2*Math.atan(Math.tan(vertical/2)*camera.aspect),distance=radius/Math.sin(Math.min(vertical,horizontal)/2)*1.08;const direction=camera.position.clone().sub(controls.target).normalize();if(!direction.lengthSq())direction.set(0,0,1);controls.target.copy(target);camera.position.copy(target).addScaledVector(direction,distance);camera.lookAt(target);controls.update();render()};
const pose=name=>{const direction=name==='posterior'?[0,0,-1]:name==='right'?[-1,0,0]:name==='left'?[1,0,0]:[0,0,1];camera.position.copy(controls.target).add(new THREE.Vector3(...direction));frame()};
const meshes=[];model.scene.traverse(m=>{if(m.isMesh)meshes.push(m)});
for(const row of rows){const button=document.createElement('button');button.textContent=row.name;button.style.borderLeft='5px solid '+row.colour;button.onclick=()=>{meshes.forEach(m=>m.visible=m.name===row.fma);render()};document.querySelector('#parts').append(button)};
document.querySelector('#all').onclick=()=>{meshes.forEach(m=>m.visible=true);render()};
const offsets=new Map(meshes.map(m=>[m.name,new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()).sub(center).normalize()]));
const spread=()=>{const amount=Number(document.querySelector('#spread').value);meshes.forEach(m=>m.position.copy(offsets.get(m.name)).multiplyScalar(amount/100*size*.3));document.querySelector('#spread-value').textContent=amount?'Separated layout · not anatomical positions':'Original source positions';frame()};document.querySelector('#spread').oninput=spread;
document.querySelector('#restore').onclick=()=>{document.querySelector('#spread').value='0';spread()};
const resize=()=>{const host=document.querySelector('#view'),w=host.clientWidth,h=Math.min(760,innerWidth<700?450:760);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();frame()};window.addEventListener('resize',resize);resize();
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>pose(b.dataset.view));pose('anterior');window.reviewReady=true;
window.fits=()=>{camera.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model.scene);return [box.min.x,box.max.x].every(x=>[box.min.y,box.max.y].every(y=>[box.min.z,box.max.z].every(z=>{const p=new THREE.Vector3(x,y,z).project(camera);return Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z>-1&&p.z<1}))) };
window.state=()=>({visible:meshes.filter(m=>m.visible).map(m=>m.name),camera:camera.position.toArray(),positions:meshes.map(m=>m.position.toArray())});`;
const bundled=await build({stdin:{contents:code,resolveDir:process.cwd(),loader:'js'},bundle:true,write:false,platform:'browser',format:'esm',minify:true});
const html=`<!doctype html><meta charset="utf-8"><title>Colon source components · review</title><style>body{margin:0;background:#10232b;color:#edf5f5;font:16px system-ui;padding:24px}h1{font-size:24px;margin:0 0 10px}p{max-width:1100px;line-height:1.5}button{background:#193b44;color:white;border:1px solid #66868e;border-radius:5px;margin:4px;padding:10px;text-transform:capitalize}main{display:flex;gap:20px}aside{width:250px}aside button{display:block;width:100%;text-align:left}footer{font-size:13px}a{color:#7dded0}</style><h1>Colon and taenia source surfaces · review only</h1><p>Exact parent triangles and shading retained. Names are source labels, not clinically validated boundaries. The three taenia files contain fragmented geometry; no repair or connections have been invented.</p><div><button data-view="anterior">Anterior</button><button data-view="posterior">Posterior</button><button data-view="left">Left</button><button data-view="right">Right</button><button id="all">Show all</button></div><main><div id="view"></div><aside id="parts"></aside></main><footer>BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Diagnostic derivative: coloured, separated source surfaces. <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html">Source licence</a>. No patient data or clinical approval.</footer><script type="module">${bundled.outputFiles[0].text.replaceAll('</script','<\\/script')}</script>`;
const threeLicense=await readFile('node_modules/three/LICENSE','utf8');
const reviewedHtml=html.replace('</style>','main{display:grid;grid-template-columns:minmax(0,1fr) 260px}#view{min-width:0}canvas{display:block;max-width:100%}aside{width:auto}#spread{width:200px;vertical-align:middle}label{display:inline-block;margin:8px}output{display:block;color:#ffd899}@media(max-width:700px){body{padding:12px}main{grid-template-columns:1fr}aside{display:grid;grid-template-columns:1fr 1fr;gap:6px}aside button{width:auto;margin:0}button{font-size:14px;padding:10px}h1{font-size:21px}}</style>')
 .replace('<main>','<label>Spread surfaces <input id="spread" type="range" min="0" max="100" value="0"></label><button id="restore">Restore positions</button><output id="spread-value">Original source positions</output><main>')
 .replace('The three taenia files contain fragmented geometry; no repair or connections have been invented.','The source-labelled descending-colon file includes a curved distal section: its descending/sigmoid boundary needs radiologist review. Taenia files have disconnected mesh components; these are not anatomical subdivisions. No repair or connections have been invented.')
 .replace('</footer>','<details><summary>Three.js MIT licence</summary><pre>'+threeLicense.replaceAll('&','&amp;').replaceAll('<','&lt;')+'</pre></details></footer>');
await writeFile(output+'/review.html',reviewedHtml);
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1390,height:1050},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(reviewedHtml,{waitUntil:'load'});await page.waitForFunction(()=>window.reviewReady===true);
 for(const view of ['Anterior','Posterior','Left','Right']){await page.getByRole('button',{name:view,exact:true}).click();const camera=await page.evaluate(()=>window.state().camera);if(view==='Left')assert(camera[0]>0);if(view==='Right')assert(camera[0]<0);await page.screenshot({path:output+'/'+view.toLowerCase()+'.png',fullPage:true});}
 await page.getByRole('button',{name:'Anterior',exact:true}).click();
 for(const row of audit.parts){await page.getByRole('button',{name:row.name,exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.state().visible),[row.fma]);await page.screenshot({path:output+'/'+row.file+'.png',fullPage:true});}
 await page.getByRole('button',{name:'Show all',exact:true}).click();assert.equal((await page.evaluate(()=>window.state().visible)).length,6);
 const before=await page.evaluate(()=>window.state().camera);await page.mouse.move(500,500);await page.mouse.down();await page.mouse.move(600,550,{steps:8});await page.mouse.up();assert.notDeepEqual(await page.evaluate(()=>window.state().camera),before);assert.deepEqual(errors,[]);
 await page.locator('#spread').fill('100');assert(await page.evaluate(()=>window.fits()));await page.locator('#spread').fill('75');assert(await page.evaluate(()=>window.fits()));assert((await page.evaluate(()=>window.state().positions)).every(p=>p.some(v=>v!==0)));assert((await page.locator('#spread-value').innerText()).includes('not anatomical positions'));
 await page.screenshot({path:output+'/spread.png',fullPage:true});await page.getByRole('button',{name:'Restore positions',exact:true}).click();assert((await page.evaluate(()=>window.state().positions)).every(p=>p.every(v=>v===0)));
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Anterior',exact:true}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.evaluate(()=>window.fits()));await page.screenshot({path:output+'/mobile.png',fullPage:true});await page.locator('#spread').fill('100');assert(await page.evaluate(()=>window.fits()));await page.getByRole('button',{name:'Restore positions',exact:true}).click();assert.deepEqual(errors,[]);
 await writeFile(output+'/visual-check.json',JSON.stringify({prototypeSha256:audit.prototype.sha256,parts:6,presets:['anterior','posterior','left','right'],leftRightSourceAxesVerified:true,isolated:audit.parts.map(p=>p.fma),orbit:true,restoreAll:true,spreadAndRestore:true,expandedBoundsFitDesktopAndMobile:true,mobileWidth:390,noHorizontalOverflow:true,browserErrors:errors,clinicalApproval:false},null,2)+'\n');
 console.log('Six isolated surfaces, four views, orbit, spread/restore and mobile-width review verified; no browser errors.');
}finally{await browser.close()}
