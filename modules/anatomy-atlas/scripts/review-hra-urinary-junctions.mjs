// Offline review aid only. Never repairs, moves, joins or admits source anatomy.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {build} from 'esbuild';
import {readGlb} from './glb-lossless-codec.mjs';
import {hraSource,hraAccessor,hraDigest} from './hra-pelvis-source.mjs';

const args=process.argv.slice(2);
assert(args.length<=1&&args.every(a=>a.startsWith('--source=')));
const directory=args[0]?.slice(9)??'D:/VisibleMedicine-Atlas-Recovery/source-candidates/hra-united-female-v1.10';
const auditBytes=await readFile('docs/hra-urinary-junction-source-audit.json');
const auditHash=hraDigest(auditBytes.toString().replaceAll('\r\n','\n'));
assert.equal(auditHash,'b251217d72ad5d3ffa2db9b873fcb7040d27a7acff2a9e7f844affd974ce2a62');
const audit=JSON.parse(auditBytes),bytes=await readFile(directory+'/3d-vh-f-united.glb');
const contactBytes=await readFile('docs/hra-urinary-contact-audit.json');
const contactHash=hraDigest(contactBytes.toString().replaceAll('\r\n','\n'));
assert.equal(contactHash,'32ebe88107cb85a8b3cc338669e85d75e928c673c50022d0153f7ce11ccbb616');
const contacts=JSON.parse(contactBytes);assert.equal(contacts.sourceAuditSha256,auditHash);assert.equal(contacts.runtimeAdmission,false);
assert.equal(bytes.length,hraSource.bytes);assert.equal(hraDigest(bytes),hraSource.sha256);
const {json:g,bin}=readGlb(bytes),rows=[];
assert.equal(audit.sourceSha256,hraSource.sha256);assert.equal(audit.admitted,false);
for(const row of audit.rows){
 const node=g.nodes[row.nodeIndex];assert.equal(node.name,row.nodeName);assert.equal(node.mesh,row.meshIndex);
 for(const entry of row.ancestry){const n=g.nodes[entry.nodeIndex];assert(!n.matrix&&!n.translation&&!n.rotation&&!n.scale);}
 const p=g.meshes[node.mesh].primitives[0],positions=hraAccessor(g,bin,p.attributes.POSITION),normals=hraAccessor(g,bin,p.attributes.NORMAL),indices=hraAccessor(g,bin,p.indices);
 assert.equal(hraDigest(JSON.stringify(positions)),row.positionAccessorSha256);
 assert.equal(hraDigest(JSON.stringify(normals)),row.attributeAccessorSha256.NORMAL);
 assert.equal(hraDigest(JSON.stringify(indices)),row.indexAccessorSha256);
 assert.equal(indices.length,row.triangles*3);
 const colour=row.role==='candidate'?'#ffd165':row.role==='existing-renal'?'#66d4cb':/artery/.test(row.nodeName)?'#f17980':/cervix/.test(row.nodeName)?'#c98fb2':'#94afce';
 const suffix=row.nodeIndex===707?' (source dome)':row.nodeIndex===709?' (source base)':'';
 rows.push({id:row.nodeIndex,name:row.metadata.label+suffix,sourceName:row.nodeName,role:row.role,colour,positions:positions.flat(),normals:normals.flat(),indices:indices.flat()});
}
const highlights={};
for(const pair of contacts.pairs)for(const faces of pair.intersectingFacePairs){
 for(const [id,face]of [[pair.a,faces[0]],[pair.b,faces[1]]]){
  if(!highlights[id])highlights[id]=new Set();highlights[id].add(face);
 }
}
const overlays=Object.entries(highlights).map(([id,set])=>{const row=rows.find(r=>String(r.id)===id),faces=[...set].sort((a,b)=>a-b);const positions=faces.flatMap(face=>row.indices.slice(face*3,face*3+3).flatMap(i=>row.positions.slice(i*3,i*3+3)));assert.equal(positions.length,faces.length*9);return {id:Number(id),faces,positions};});
const code=`import * as THREE from 'three';import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const rows=${JSON.stringify(rows)};
const scene=new THREE.Scene();scene.background=new THREE.Color('#10232b');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);document.querySelector('#view').append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(32,1,.0001,10),controls=new OrbitControls(camera,renderer.domElement);controls.minDistance=.002;
scene.add(new THREE.HemisphereLight(0xffffff,0x657885,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(-1,2,3);scene.add(light);
const meshes=rows.map(r=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(r.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(r.normals,3));g.setIndex(r.indices);const context=r.role==='existing-pelvic-context';const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:r.colour,roughness:.65,side:THREE.DoubleSide,transparent:context,opacity:context?.2:1,depthWrite:!context}));m.name=String(r.id);scene.add(m);return m});
const markers=${JSON.stringify(overlays)}.map(r=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(r.positions,3));const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:'#ff5ec9',side:THREE.DoubleSide,depthTest:false,depthWrite:false,transparent:true,opacity:.95}));m.visible=false;m.name=String(r.id);m.renderOrder=3;meshes.find(mesh=>mesh.name===m.name).add(m);return m});
let focus='junctions';const render=()=>renderer.render(scene,camera);controls.addEventListener('change',render);
document.querySelector('#contacts').onchange=e=>{markers.forEach(m=>m.visible=e.target.checked);document.querySelector('#contact-note').hidden=!e.target.checked;render()};
function frame(){let ids=focus==='right'?[712]:focus==='left'?[713]:focus==='junctions'?[712,713]:rows.map(r=>r.id);const box=new THREE.Box3();meshes.filter(m=>m.visible&&ids.includes(Number(m.name))).forEach(m=>box.expandByObject(m));if(box.isEmpty())return;if(focus!=='all')box.expandByScalar(focus==='junctions'?.012:.009);const centre=box.getCenter(new THREE.Vector3()),radius=box.getSize(new THREE.Vector3()).length()/2;const angle=Math.min(THREE.MathUtils.degToRad(camera.fov),2*Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)*camera.aspect));const direction=camera.position.clone().sub(controls.target).normalize();if(!direction.lengthSq())direction.set(0,0,1);controls.target.copy(centre);camera.position.copy(centre).addScaledVector(direction,radius/Math.sin(angle/2)*1.08);camera.lookAt(centre);controls.update();render();}
const setFocus=value=>{focus=value;document.querySelectorAll('[data-focus]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.focus===value)));document.querySelector('#focus-note').textContent=value==='all'?'Whole visible surfaces':'Junction close-up: long ureters may extend beyond the viewport; their geometry is not cut.';frame()};
document.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>setFocus(b.dataset.focus));
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{const dir={anterior:[0,0,1],posterior:[0,0,-1],left:[1,0,0],right:[-1,0,0],superior:[0,1,.001]}[b.dataset.view];camera.position.copy(controls.target).add(new THREE.Vector3(...dir));frame()});
for(const r of rows){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=true;input.dataset.source=r.id;input.onchange=()=>{meshes.find(m=>m.name===String(r.id)).visible=input.checked;render()};label.style.borderLeft='4px solid '+r.colour;label.append(input,document.createTextNode(r.name));label.title=r.sourceName;document.querySelector('#parts').append(label)}
document.querySelector('#opacity').oninput=e=>{meshes.filter(m=>rows.find(r=>String(r.id)===m.name).role==='existing-pelvic-context').forEach(m=>m.material.opacity=Number(e.target.value));render()};
const resize=()=>{const host=document.querySelector('#view');renderer.setSize(host.clientWidth,innerWidth<700?420:620);camera.aspect=host.clientWidth/(innerWidth<700?420:620);camera.updateProjectionMatrix();frame()};window.addEventListener('resize',resize);resize();setFocus('junctions');
window.reviewState=()=>({focus,visible:meshes.filter(m=>m.visible).map(m=>Number(m.name)),highlighted:markers.filter(m=>m.visible).map(m=>Number(m.name)),camera:camera.position.toArray(),transforms:meshes.map(m=>({position:m.position.toArray(),scale:m.scale.toArray(),rotation:m.quaternion.toArray()})),opacity:meshes.filter(m=>rows.find(r=>String(r.id)===m.name).role==='existing-pelvic-context').map(m=>m.material.opacity)});
window.sourceAttributes=()=>meshes.map(m=>({id:Number(m.name),positions:Array.from(m.geometry.attributes.position.array),normals:Array.from(m.geometry.attributes.normal.array),indices:Array.from(m.geometry.index.array)}));window.reviewReady=true;`;
const bundled=await build({stdin:{contents:code,resolveDir:process.cwd(),loader:'js'},bundle:true,write:false,platform:'browser',format:'esm',minify:true,tsconfigRaw:{}});
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const license=await readFile('node_modules/three/LICENSE','utf8');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Female urinary junctions · source review</title><style>body{margin:0;padding:18px;background:#10232b;color:#edf5f5;font:15px system-ui}h1{font-size:23px;margin:0 0 8px}p{max-width:1100px;line-height:1.45}button{background:#193b44;color:white;border:1px solid #66868e;border-radius:5px;margin:3px;padding:9px;cursor:pointer}button[aria-pressed=true]{background:#37616b}main{display:grid;grid-template-columns:minmax(0,1fr) 245px;gap:16px}#view{min-width:0}canvas{display:block;max-width:100%;touch-action:none}label{display:block;padding-left:8px;margin:10px 0}input{margin-right:8px}footer{font-size:12px;line-height:1.5}a{color:#7dded0}pre{white-space:pre-wrap}@media(max-width:700px){body{padding:12px}main{grid-template-columns:1fr}#parts{display:grid;grid-template-columns:1fr 1fr;font-size:13px}h1{font-size:20px}}</style><h1>Female urinary junctions · local source review</h1><p>Gold: two candidate orifice surfaces. Teal: existing ureters. Faded blue bladder, red uterine arteries and mauve cervix: same-source context. These are original source positions, not joined lumens, patient registration or clinical approval.</p><nav aria-label="Focus"><button data-focus="junctions">Both junctions</button><button data-focus="right">Right junction</button><button data-focus="left">Left junction</button><button data-focus="all">Fit all visible</button></nav><nav aria-label="Camera"><button data-view="anterior">Anterior</button><button data-view="posterior">Posterior</button><button data-view="left">Left</button><button data-view="right">Right</button><button data-view="superior">Superior</button></nav><p id="focus-note"></p><main><div id="view"></div><aside><div id="parts"></div><label>Context opacity <input id="opacity" type="range" min="0" max="1" step=".05" value=".2"></label></aside></main><footer><p>Source frame: metres; +X inferred left, +Y superior, +Z anterior. No fitting, mirroring, smoothing, bridge geometry or source modification. Two-sided display, colours and opacity are review-only adaptations. Open surfaces do not prove tissue planes or continuity.</p>${escape(hraSource.credit)} <a href="${hraSource.url}">Original HRA source</a> · <a href="${hraSource.licenseUrl}">${hraSource.license}</a>. Attribution retained; no runtime admission.<details><summary>Three.js MIT licence</summary><pre>${escape(license)}</pre></details></footer><script type="module">${bundled.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></html>`;
const reviewedHtml=html.replace('<p id="focus-note">','<label><input type="checkbox" id="contacts">Highlight detected left orifice / bladder-base contacts</label><p id="contact-note" hidden>Magenta, shown through other surfaces: four orifice faces and three bladder-base faces in five detected triangle pairs, not five distinct defects. A numerical contact result does not distinguish normal attachment from crossing. Hidden source surfaces also hide their highlights.</p><p id="focus-note">');
const output='.local/hra-urinary-review';await mkdir(output,{recursive:true});await writeFile(output+'/review.html',reviewedHtml);
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');const browser=await chromium.launch({headless:true}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1390,height:1020},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(reviewedHtml,{waitUntil:'load'});await page.waitForFunction(()=>window.reviewReady===true);
 for(const view of ['Anterior','Posterior','Left','Right','Superior']){await page.getByRole('button',{name:view,exact:true}).click();await page.screenshot({path:output+'/'+view.toLowerCase()+'.png',fullPage:true});}
 await page.getByRole('button',{name:'Posterior',exact:true}).click();
 for(const focus of ['right','left','all','junctions']){await page.locator('[data-focus="'+focus+'"]').click();assert.equal((await page.evaluate(()=>window.reviewState())).focus,focus);await page.screenshot({path:output+'/'+focus+'.png',fullPage:true});}
 for(const row of rows){const input=page.locator('[data-source="'+row.id+'"]');await input.uncheck();assert(!(await page.evaluate(()=>window.reviewState())).visible.includes(row.id));await input.check();}
 await page.locator('[data-focus="left"]').click();await page.locator('#contacts').check();assert.deepEqual((await page.evaluate(()=>window.reviewState())).highlighted,overlays.map(o=>o.id));assert(await page.locator('#contact-note').isVisible());await page.screenshot({path:output+'/contacts.png',fullPage:true});await page.locator('#contacts').uncheck();assert.deepEqual((await page.evaluate(()=>window.reviewState())).highlighted,[]);assert(!(await page.locator('#contact-note').isVisible()));await page.locator('[data-focus="junctions"]').click();
 await page.locator('#opacity').fill('0.5');assert((await page.evaluate(()=>window.reviewState())).opacity.every(n=>n===.5));await page.locator('#opacity').fill('0.2');
 const before=await page.evaluate(()=>window.reviewState().camera);await page.mouse.move(480,400);await page.mouse.down();await page.mouse.move(580,460,{steps:8});await page.mouse.up();assert.notDeepEqual(await page.evaluate(()=>window.reviewState().camera),before);
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Anterior',exact:true}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:output+'/mobile.png',fullPage:true});
 const rendered=await page.evaluate(()=>window.sourceAttributes());for(const r of rendered){const original=rows.find(x=>x.id===r.id);assert.deepEqual(r.positions,original.positions);assert.deepEqual(r.normals,original.normals);assert.deepEqual(r.indices,original.indices);}
 const state=await page.evaluate(()=>window.reviewState());for(const t of state.transforms){assert.deepEqual(t.position,[0,0,0]);assert.deepEqual(t.scale,[1,1,1]);assert.deepEqual(t.rotation,[0,0,0,1]);}assert.deepEqual(errors,[]);
 const verification={auditHash,contactHash,highlightedOriginalFaces:overlays.map(({id,faces})=>({id,faces})),contactHighlightToggle:true,sourceSha256:hraSource.sha256,generatorSha256:hraDigest(await readFile(new URL(import.meta.url))),htmlSha256:hraDigest(reviewedHtml),nodeIndices:rows.map(r=>r.id),sourcePositionsNormalsIndicesVerified:true,sourceFramePreserved:true,sourceMeshes:rows.length,focusPresets:4,cameraPresets:5,contextToggles:10,opacity:true,orbit:true,mobileWidth:390,noHorizontalOverflow:true,browserErrors:errors,runtimeAdmission:false,clinicalApproval:false};
 await writeFile(output+'/verification.json',JSON.stringify(verification,null,2)+'\n');console.log(JSON.stringify({output,...verification}));
}finally{await browser.close()}
