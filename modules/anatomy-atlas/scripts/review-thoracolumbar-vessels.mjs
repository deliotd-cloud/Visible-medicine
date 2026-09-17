// Local diagnostic only; no admission, remote assets, source repair or clinical approval.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {loadCurrentSourceHolds} from './current-source-holds.mjs';
import {sourceObjShape} from './source-surface-audit.mjs';

const hash=b=>createHash('sha256').update(b).digest('hex');
const auditBytes=await readFile('docs/thoracolumbar-vessel-source-audit.json');
const auditHash=hash(auditBytes.toString().replace(/\r\n/g,'\n'));
assert.equal(auditHash,'961c6a06487ac66016e6a244989db6dfa44e5a69209c53579ca9a55e8059109d');
const audit=JSON.parse(auditBytes), {catalog,policy}=await loadCurrentSourceHolds();
const candidateIds=['FMA4634','FMA4654','FMA4844','FMA4951'];
const heldIds=['FMA4843','FMA4950'], heldFiles=['FJ3589','FJ3493'];
assert.deepEqual(audit.groups.filter(g=>g.status==='held').map(g=>g.id),heldIds);
const candidates=candidateIds.map(id=>{
 const g=audit.groups.find(g=>g.id===id);assert.equal(g.status,'candidate-source-review');
 policy.assertNoKnownHolds([g.definition]);
 return {id,name:g.name,kind:'candidate',sources:[{file:g.file,sha256:g.sha256}],tree:'isa'};
});
const contextIds=['FMA8533','FMA8534','FMA13295','FMA87217','FMA3789','FMA4838','FMA4944'];
const context=contextIds.map(id=>{
 const s=catalog.structures.find(s=>s.fmaId===id);assert(s);assert.equal(s.sourceTree,'isa');
 return {id,name:s.name,kind:'context',sources:s.sources,tree:s.sourceTree};
});
const rows=[], evidence=[];
for(const row of [...candidates,...context]){
 assert(!heldIds.includes(row.id));assert.equal(row.sources.length,1);
 const source=row.sources[0];assert(!heldFiles.includes(source.file));
 const bytes=await readFile(`../work/bodyparts3d/${row.tree}/${source.file}.obj`);
 assert.equal(hash(bytes),source.sha256);
 const shape=sourceObjShape(bytes), parsed=new OBJLoader().parse(bytes.toString()), meshes=[];
 parsed.traverse(m=>{if(m.isMesh)meshes.push(m)});assert.equal(meshes.length,1);
 const geometry=meshes[0].geometry, positions=geometry.attributes.position.array;
 assert.equal(positions.length,shape.faces.length*9);
 // Prove every ordered source triangle survives parsing, allowing only Float32 storage.
 let cursor=0;for(const face of shape.faces){assert.equal(face.length,3);for(const index of face)for(const n of shape.vertices[index])assert.equal(positions[cursor++],Math.fround(n));}
 const normals=geometry.attributes.normal.array;assert.equal(normals.length,positions.length);
 const suppliedNormals=[];let normalCursor=0;
 for(const line of bytes.toString().split(/\r?\n/)){
  const tokens=line.trim().split(/\s+/);
  if(tokens[0]==='vn')suppliedNormals.push(tokens.slice(1).map(Number));
  if(tokens[0]==='f')for(const token of tokens.slice(1)){
   const index=Number(token.split('/')[2]);assert(Number.isInteger(index)&&index!==0,'Original vertex normal required');
   const normal=suppliedNormals[index<0?suppliedNormals.length+index:index-1];assert(normal&&normal.length===3);
   for(const value of normal)assert.equal(normals[normalCursor++],Math.fround(value));
  }
 }
 assert.equal(normalCursor,normals.length,'Every original face-corner normal retained');
 const colour=/artery/i.test(row.name)?'#f77965':/vein/i.test(row.name)?'#60bbf2':/aorta/i.test(row.name)?'#d98478':/rib/i.test(row.name)?'#e5d7b7':'#ba8aa5';
 rows.push({...row,file:source.file,colour,positions:Array.from(positions),normals:Array.from(normals)});
 evidence.push({id:row.id,name:row.name,kind:row.kind,file:source.file,sourceSha256:source.sha256,triangles:shape.faces.length,orderedSourcePositionsVerified:true,orderedSourceNormalsVerified:true,positionSha256:hash(Buffer.from(positions.buffer,positions.byteOffset,positions.byteLength)),normalSha256:hash(Buffer.from(normals.buffer,normals.byteOffset,normals.byteLength))});
}
assert.equal(evidence.filter(r=>r.kind==='candidate').reduce((n,r)=>n+r.triangles,0),5104);
const contactBytes=await readFile('docs/subcostal-intersection-audit.json');
assert.equal(hash(contactBytes),'b2ea776f95f1b9b305458e3ac10c69b2f111223ed478a4874c998a5f2007a65c','Changed intersection evidence');
const contacts=JSON.parse(contactBytes);assert.equal(contacts.sourceAudit.sha256,auditHash);
assert.equal(contacts.admissionApproved,false);assert.equal(contacts.geometryModified,false);
assert.deepEqual(contacts.sources.map(s=>s.id),rows.map(r=>r.id));
for(const source of contacts.sources)assert.equal(source.sha256,evidence.find(r=>r.id===source.id).sourceSha256);
const hitFaces=Object.fromEntries(candidateIds.map(id=>[id,new Set()]));
for(const pair of contacts.candidatePairs)for(const hit of pair.facePairs){hitFaces[pair.candidateA].add(hit.faceA);hitFaces[pair.candidateB].add(hit.faceB);}
for(const pair of contacts.contextPairs)for(const hit of pair.facePairs)hitFaces[pair.candidate].add(hit.faceA);
const overlays=Object.fromEntries(candidateIds.map(id=>{
 const source=rows.find(r=>r.id===id);const faces=[...hitFaces[id]].sort((a,b)=>a-b);
 for(const face of faces)assert(Number.isInteger(face)&&face>=0&&face<source.positions.length/9);
 return [id,faces.flatMap(face=>source.positions.slice(face*9,face*9+9))];
}));
const code=`import * as THREE from 'three';import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const rows=${JSON.stringify(rows)}, matrix=${JSON.stringify(catalog.coordinateSystem.sourceToSceneColumnMajor)};
const scene=new THREE.Scene();scene.background=new THREE.Color('#10232b');
const group=new THREE.Group();group.matrixAutoUpdate=false;group.matrix.fromArray(matrix);scene.add(group);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);document.querySelector('#view').append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(32,1,.01,100),controls=new OrbitControls(camera,renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x637a89,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(-4,8,9);scene.add(light);
const meshes=rows.map(row=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(row.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(row.normals,3));const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:row.colour,roughness:.65,transparent:row.kind==='context',opacity:row.kind==='context'?.24:1,depthWrite:row.kind!=='context'}));m.name=row.id;m.userData.kind=row.kind;m.visible=row.kind==='candidate'||/rib/i.test(row.name);group.add(m);return m});
const overlays=${JSON.stringify(overlays)};const markers=Object.entries(overlays).map(([id,positions])=>{const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const marker=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:'#ffc046',side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));marker.visible=false;marker.name=id;marker.renderOrder=3;meshes.find(m=>m.name===id).add(marker);return marker});
const render=()=>renderer.render(scene,camera);controls.addEventListener('change',render);
document.querySelector('#contacts').onchange=event=>{markers.forEach(m=>m.visible=event.target.checked);document.querySelector('#contact-note').hidden=!event.target.checked;render()};
const bounds=()=>{const b=new THREE.Box3();group.updateMatrixWorld(true);meshes.filter(m=>m.visible).forEach(m=>b.expandByObject(m));return b};
const frame=()=>{const b=bounds();if(b.isEmpty())return;const target=b.getCenter(new THREE.Vector3()),r=b.getSize(new THREE.Vector3()).length()/2;const v=THREE.MathUtils.degToRad(camera.fov),h=2*Math.atan(Math.tan(v/2)*camera.aspect),d=r/Math.sin(Math.min(v,h)/2)*1.08;const direction=camera.position.clone().sub(controls.target).normalize();if(!direction.lengthSq())direction.set(0,0,-1);controls.target.copy(target);camera.position.copy(target).addScaledVector(direction,d);camera.lookAt(target);controls.update();render()};
const pose=name=>{const direction=name==='posterior'?[0,0,-1]:name==='right'?[-1,0,0]:name==='left'?[1,0,0]:[0,0,1];camera.position.copy(controls.target).add(new THREE.Vector3(...direction));frame()};
const selection=document.querySelector('#selection');
const choose=id=>{meshes.filter(m=>m.userData.kind==='candidate').forEach(m=>m.visible=id===null||m.name===id);selection.textContent=id?rows.find(r=>r.id===id).name+' · original source positions':'Four subcostal candidates · original source positions';document.querySelectorAll('[data-candidate]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.candidate===id)));frame()};
for(const row of rows){if(row.kind==='candidate'){const b=document.createElement('button');b.textContent=row.name;b.dataset.candidate=row.id;b.style.borderLeft='5px solid '+row.colour;b.onclick=()=>choose(row.id);document.querySelector('#parts').append(b)}else{const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=meshes.find(m=>m.name===row.id).visible;input.dataset.context=row.id;input.onchange=()=>{meshes.find(m=>m.name===row.id).visible=input.checked;frame()};label.append(input,document.createTextNode(row.name));document.querySelector('#context').append(label)}}
document.querySelector('#all').onclick=()=>choose(null);document.querySelector('#fit').onclick=frame;
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>pose(b.dataset.view));
const resize=()=>{const host=document.querySelector('#view'),w=host.clientWidth,h=innerWidth<700?430:680;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();frame()};window.addEventListener('resize',resize);resize();pose('posterior');
window.reviewState=()=>({visible:meshes.filter(m=>m.visible).map(m=>m.name),highlighted:markers.filter(m=>m.visible).map(m=>m.name),camera:camera.position.toArray(),positions:meshes.map(m=>m.position.toArray()),sourceTransform:group.matrix.toArray()});
window.sourceAttributes=()=>meshes.map(m=>({id:m.name,positions:Array.from(m.geometry.attributes.position.array),normals:Array.from(m.geometry.attributes.normal.array)}));
window.fits=()=>{const b=bounds();camera.updateMatrixWorld(true);return [b.min.x,b.max.x].every(x=>[b.min.y,b.max.y].every(y=>[b.min.z,b.max.z].every(z=>{const p=new THREE.Vector3(x,y,z).project(camera);return Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z>-1&&p.z<1}))) };window.reviewReady=true;`;
const bundled=await build({stdin:{contents:code,resolveDir:process.cwd(),loader:'js'},bundle:true,write:false,platform:'browser',format:'esm',minify:true,tsconfigRaw:{}});
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const license=await readFile('node_modules/three/LICENSE','utf8');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Subcostal sources · local review</title><style>body{margin:0;padding:20px;background:#10232b;color:#edf5f5;font:15px system-ui}h1{font-size:23px;margin:0 0 8px}p{max-width:1100px;line-height:1.45}button{background:#193b44;color:white;border:1px solid #66868e;border-radius:5px;margin:3px;padding:9px;text-transform:capitalize;cursor:pointer}button[aria-pressed=true]{background:#37616b}main{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:16px}#view{min-width:0}canvas{display:block;max-width:100%;touch-action:none}aside button{display:block;width:100%;text-align:left;margin:0 0 6px}label{display:block;margin:10px 0}input{margin-right:8px}summary{cursor:pointer;margin:12px 0}output{display:block;color:#ffd899;margin:8px 0}footer{font-size:12px;line-height:1.5}a{color:#7dded0}pre{white-space:pre-wrap}@media(max-width:700px){body{padding:12px}main{grid-template-columns:1fr}#parts{display:grid;grid-template-columns:1fr 1fr;gap:6px}aside button{width:auto;margin:0}h1{font-size:20px}}</style><h1>Subcostal vessels · source review</h1><p>Four complete candidate surfaces in their original body frame. Ribs and existing vessels provide context; source labels and vessel junctions remain unvalidated. Two opposite-side ascending lumbar sources are excluded. This is a local diagnostic, not new Atlas anatomy.</p><nav aria-label="Camera"><button data-view="anterior">Anterior</button><button data-view="posterior">Posterior</button><button data-view="left">Left</button><button data-view="right">Right</button><button id="all">All candidates</button><button id="fit">Fit visible</button></nav><output id="selection">Four subcostal candidates · original source positions</output><main><div id="view"></div><aside><div id="parts" aria-label="Candidate selection"></div><details open><summary>Same-source context</summary><div id="context"></div></details><p>Red: arterial source. Blue: venous source. Faded surfaces: context. No bridges, smoothing, mirroring or anatomical repositioning.</p></aside></main><footer>BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Diagnostic adaptation: Float32 storage, source-to-scene transform, colours and context transparency. <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html">Source licence</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. No patient data or clinical approval.<details><summary>Three.js MIT licence</summary><pre>${escape(license)}</pre></details></footer><script type="module">${bundled.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></html>`;
const reviewedHtml=html.replace('</nav>','</nav><label><input type="checkbox" id="contacts">Highlight detected surface contacts</label><p id="contact-note" hidden>Orange marks candidate faces with a triangle-intersection result against any reviewed vessel or context surface, including context currently hidden. It is not pathology or a validated tissue boundary.</p>');
const output='.local/thoracolumbar-review';await mkdir(output,{recursive:true});await writeFile(output+'/review.html',reviewedHtml);
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true}), errors=[];
try{
 const page=await browser.newPage({viewport:{width:1390,height:1050},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(reviewedHtml,{waitUntil:'load'});await page.waitForFunction(()=>window.reviewReady===true);
 for(const view of ['Anterior','Posterior','Left','Right']){await page.getByRole('button',{name:view,exact:true}).click();assert(await page.evaluate(()=>window.fits()));await page.screenshot({path:output+'/'+view.toLowerCase()+'.png',fullPage:true});}
 await page.getByRole('button',{name:'Posterior',exact:true}).click();
 for(const row of candidates){await page.getByRole('button',{name:row.name,exact:true}).click();const state=await page.evaluate(()=>window.reviewState());assert.deepEqual(state.visible.filter(id=>candidateIds.includes(id)),[row.id]);await page.screenshot({path:output+'/'+row.id+'.png',fullPage:true});}
 await page.getByRole('button',{name:'All candidates',exact:true}).click();
 await page.locator('#contacts').check();assert.deepEqual((await page.evaluate(()=>window.reviewState())).highlighted,candidateIds);assert(await page.locator('#contact-note').isVisible());await page.screenshot({path:output+'/contacts.png',fullPage:true});
 await page.locator('#contacts').uncheck();assert.deepEqual((await page.evaluate(()=>window.reviewState())).highlighted,[]);assert(!(await page.locator('#contact-note').isVisible()));
 for(const id of contextIds){await page.locator('[data-context="'+id+'"]').check();assert((await page.evaluate(()=>window.reviewState())).visible.includes(id));assert(await page.evaluate(()=>window.fits()));}
 await page.screenshot({path:output+'/all-context.png',fullPage:true});
 const before=await page.evaluate(()=>window.reviewState().camera);await page.mouse.move(500,400);await page.mouse.down();await page.mouse.move(620,470,{steps:8});await page.mouse.up();assert.notDeepEqual(await page.evaluate(()=>window.reviewState().camera),before);
 for(const id of contextIds)if(!['FMA8533','FMA8534'].includes(id))await page.locator('[data-context="'+id+'"]').uncheck();
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Posterior',exact:true}).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.evaluate(()=>window.fits()));await page.screenshot({path:output+'/mobile.png',fullPage:true});
 const attributes=await page.evaluate(()=>window.sourceAttributes());
 for(const r of attributes){const source=rows.find(s=>s.id===r.id);assert.deepEqual(r.positions,source.positions);assert.deepEqual(r.normals,source.normals);}
 const state=await page.evaluate(()=>window.reviewState());assert.deepEqual(state.sourceTransform,catalog.coordinateSystem.sourceToSceneColumnMajor);assert(state.positions.every(p=>p.every(n=>n===0)));assert.deepEqual(errors,[]);
 await writeFile(output+'/verification.json',JSON.stringify({auditHash,contactAuditSha256:hash(contactBytes),generatorSha256:hash(await readFile(new URL(import.meta.url))),htmlSha256:hash(reviewedHtml),sourceMeshes:evidence,excludedHeldIds:heldIds,excludedHeldFiles:heldFiles,orderedSourceTrianglesPreserved:true,sourceNormalsPreserved:true,sourceFramePreserved:true,isolatedCandidates:candidateIds,contextToggles:contextIds,contactHighlightToggle:true,highlightedCandidateFaces:Object.fromEntries(candidateIds.map(id=>[id,hitFaces[id].size])),views:['anterior','posterior','left','right'],orbit:true,desktopMobileFit:true,mobileWidth:390,noHorizontalOverflow:true,browserErrors:errors,clinicalApproval:false,runtimeAdmission:false},null,2)+'\n');
 console.log(JSON.stringify({output,htmlSha256:hash(reviewedHtml),candidates:4,candidateTriangles:5104,contextSurfaces:7,sourcePositionsNormalsAndFrameVerified:true,contactHighlightToggle:true,browserErrors:errors,clinicalApproval:false}));
}finally{await browser.close()}
