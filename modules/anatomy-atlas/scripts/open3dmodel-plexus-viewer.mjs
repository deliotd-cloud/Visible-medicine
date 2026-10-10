import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {candidateCameraArc,candidateCameraProgress,candidateLabelPlacement} from './open3dmodel-plexus-presentation.mjs';
import {validatePlexusScene} from './open3dmodel-plexus-scene.mjs';

const el = id => document.getElementById(id);
const hash = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), n => n.toString(16).padStart(2,'0')).join('');
const axes = {px:[1,0,0],nx:[-1,0,0],py:[0,1,0],ny:[0,-1,0],pz:[0,0,1],nz:[0,0,-1]};
const viewport = el('viewport');
try {
  if (location.protocol !== 'http:' || location.hostname !== '127.0.0.1') throw Error('Local loopback review only');
  const response = await fetch('./scene.json', {cache:'no-store',credentials:'same-origin'});
  if (!response.ok) throw Error('Source scene unavailable');
  const raw = await response.text(), data = JSON.parse(raw), sceneSha256 = await hash(raw);
  const contextItems = validatePlexusScene(data), objects = [], contextMeshes = [];
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2)); viewport.append(renderer.domElement);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label','Unregistered source objects; drag to orbit or use arrow keys');
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#f4f7f6');
  scene.add(new THREE.HemisphereLight(0xffffff,0x6c7774,2.3));
  const light = new THREE.DirectionalLight(0xffffff,2); light.position.set(3,5,4); scene.add(light);
  const camera = new THREE.PerspectiveCamera(35,1,.001,1e9);
  const controls = new OrbitControls(camera,renderer.domElement); controls.enableDamping = true; controls.dampingFactor = .09;
  for (const item of data.objects) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(item.vertices.flat(),3));
    geometry.setIndex(item.faces.flat()); geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({color:item.core?'#c87756':'#7a9caa',side:THREE.DoubleSide,roughness:.8,transparent:true,opacity:1,depthWrite:false});
    const mesh = new THREE.Mesh(geometry,material); mesh.userData = item; scene.add(mesh); objects.push(mesh);
  }
  for (const item of contextItems) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(item.vertices.flat(),3));
    geometry.setIndex(item.faces.flat()); geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({color:'#f0e8d1',side:THREE.DoubleSide,roughness:1,transparent:true,opacity:.2,depthWrite:false});
    const mesh = new THREE.Mesh(geometry,material); mesh.userData = item; mesh.visible = false; scene.add(mesh); contextMeshes.push(mesh);
  }
  function frameVisible(){
    const selected=objects.find(mesh=>mesh.userData.id===el('candidate').value && mesh.visible);
    const primary=el('isolate').checked || (selected && !selected.userData.core) ? [selected].filter(Boolean) : objects.filter(mesh=>mesh.visible && mesh.userData.core);
    const included=primary.length?primary:objects.filter(mesh=>mesh.visible);
    const bounds=new THREE.Box3();for(const mesh of included)bounds.expandByObject(mesh);
    const centre=bounds.getCenter(new THREE.Vector3()),radius=Math.max(bounds.getSize(new THREE.Vector3()).length()/2,1e-6);
    const aspect=Math.max(viewport.clientWidth,1)/Math.max(viewport.clientHeight,1);
    const distance=radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*1.15*Math.max(1,1/aspect);
    controls.minDistance=radius*.05;controls.maxDistance=distance*20;
    camera.near=Math.max(radius/100000,1e-9);camera.far=distance*100;camera.updateProjectionMatrix();
    return {centre,distance};
  }
  const choices = data.objects.map(item => ({id:item.id,name:item.sourceName,core:item.core}))
    .sort((a,b)=>Number(b.core)-Number(a.core) || a.name.localeCompare(b.name));
  function fillChoices() {
    const previous = el('candidate').value, q = el('search').value.trim().toLowerCase();
    const list = choices.filter(item => item.name.toLowerCase().includes(q) || item.id.toLowerCase() === q);
    el('candidate').replaceChildren(...list.map(item => {const option=document.createElement('option');option.value=item.id;option.textContent=item.name+(item.core?' · core':' · branch');return option;}));
    if (list.some(item=>item.id===previous)) el('candidate').value=previous;
    if (el('candidate').value) { const selected=data.objects.find(item=>item.id===el('candidate').value); if(selected&&!selected.core)el('branches').checked=true; }
    appearance();
  }
  function appearance() {
    const id=el('candidate').value, selected=data.objects.find(item=>item.id===id);
    for(const mesh of objects){const item=mesh.userData, chosen=item.id===id;
      mesh.visible=(item.core||el('branches').checked||chosen)&&(!el('isolate').checked||chosen);
      mesh.material.color.set(chosen?'#e55942':item.core?'#c87756':'#7a9caa');
      mesh.material.opacity=chosen?1:el('fade').checked?.13:.9;
    }
    for (const mesh of contextMeshes) mesh.visible=el('bone-context').checked&&!el('isolate').checked;
    el('details').textContent=selected?`${selected.sourceName} · ${selected.sourceNamedRight?'source-named right':'laterality not explicit in source name'} · ${selected.groupedDivisions?'grouped divisions; individual divisions not established':'source object'} · ${selected.quality?.components??'?'} component(s), ${selected.quality?.boundaryEdges??'?'} boundary edges.`:'No matching source object.';
    if(framed)reframe();
  }
  let motion=null,framed=false;
  function startArc(direction,instant=false){const {centre,distance}=frameVisible();
    const reduced=instant||matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.enableDamping=false;
    motion=reduced?null:{start:performance.now(),from:camera.position.toArray(),target:controls.target.toArray(),toTarget:centre.toArray(),direction:direction.toArray(),distance};
    if(reduced){controls.target.copy(centre);camera.position.copy(centre).addScaledVector(direction,distance);controls.update();controls.enableDamping=true;}
    framed=true;
  }
  function reframe(){const direction=camera.position.clone().sub(controls.target).normalize();startArc(direction.length()?direction:new THREE.Vector3(0,0,1));}
  function view(key,instant=false){const direction=new THREE.Vector3(...axes[key]).normalize();
    document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===key)));
    startArc(direction,instant);
  }
  controls.addEventListener('start',()=>{motion=null;controls.enableDamping=true;document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed','false'));});
  renderer.domElement.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();motion=null;controls.enableDamping=true;const offset=camera.position.clone().sub(controls.target), spherical=new THREE.Spherical().setFromVector3(offset),step=event.shiftKey?.025:.1;
    if(event.key==='ArrowLeft')spherical.theta-=step;if(event.key==='ArrowRight')spherical.theta+=step;if(event.key==='ArrowUp')spherical.phi-=step;if(event.key==='ArrowDown')spherical.phi+=step;
    spherical.makeSafe();camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));controls.update();
  });
  el('search').addEventListener('input',fillChoices);
  for(const id of ['candidate','branches','isolate','fade','bone-context'])el(id).addEventListener('input',appearance);
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>view(button.dataset.view)));
  el('reset').addEventListener('click',()=>{el('search').value='';el('candidate').value=choices.find(item=>item.core).id;el('branches').checked=false;el('isolate').checked=false;el('fade').checked=true;el('bone-context').checked=false;fillChoices();view('pz');});
  const raycaster=new THREE.Raycaster(); let pointer=null;
  renderer.domElement.addEventListener('pointerdown',event=>{pointer=[event.clientX,event.clientY];});
  renderer.domElement.addEventListener('pointerup',event=>{if(!pointer||Math.hypot(event.clientX-pointer[0],event.clientY-pointer[1])>5)return;
    const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2),camera);
    const hit=raycaster.intersectObjects(objects.filter(mesh=>mesh.visible))[0];if(hit){el('search').value='';fillChoices();el('candidate').value=hit.object.userData.id;appearance();}
  });
  const label=el('selected-label'),leader=el('label-leader-line');
  function updateLabel(){const mesh=objects.find(m=>m.userData.id===el('candidate').value && m.visible);if(!mesh){label.style.display=leader.style.display='none';delete viewport.dataset.labelSide;return;}
    const point=new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3()).project(camera);
    if(point.z < -1 || point.z > 1){label.style.display=leader.style.display='none';delete viewport.dataset.labelSide;return;}
    const rect=viewport.getBoundingClientRect(),projectedX=(point.x+1)*rect.width/2,projectedY=(1-point.y)*rect.height/2;
    label.textContent=mesh.userData.sourceName;label.style.display='block';
    const provisional=candidateLabelPlacement(rect.width,rect.height,projectedX,projectedY);
    label.style.maxWidth=`${provisional.maxWidth}px`;
    const placement=candidateLabelPlacement(rect.width,rect.height,projectedX,projectedY,label.offsetHeight,label.offsetWidth);
    label.style.left=`${placement.left}px`;label.style.top=`${placement.top}px`;
    viewport.dataset.labelSide=placement.side;leader.style.display='block';
    leader.setAttribute('x1',String(placement.pointX));leader.setAttribute('y1',String(placement.pointY));
    leader.setAttribute('x2',String(placement.edgeX));leader.setAttribute('y2',String(placement.edgeY));
  }
  el('export').addEventListener('click',async()=>{const chosen=data.objects.find(item=>item.id===el('candidate').value);
    if(!chosen)return;const objectSha256=await hash(JSON.stringify({id:chosen.id,sourceName:chosen.sourceName,vertices:chosen.vertices,faces:chosen.faces}));
    const draft={schemaVersion:1,purpose:'open3dmodel-plexus-candidate-observation',scope:'offline source-frame candidate only',
      sourceObjSha256:data.sourceObjSha256,sourceInventorySha256:data.sourceInventorySha256,conversionReportSha256:data.conversionReportSha256,sceneSha256,
      objectId:chosen.id,objectSha256,sourceName:chosen.sourceName,sourceNamedRight:chosen.sourceNamedRight,groupedDivisions:chosen.groupedDivisions,
      observations:el('notes').value.slice(0,4000),units:'unknown-source-units',registered:false,mirrored:false,admissions:0,clinicalApproved:false,approval:false};
    const url=URL.createObjectURL(new Blob([JSON.stringify(draft,null,2)+'\n'],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`plexus-source-observation-${sceneSha256.slice(0,12)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    el('export-status').textContent='Draft download requested; check your browser downloads. No clinical approval or atlas admission.';
  });
  el('held').textContent=data.held.length?data.held.map(item=>`${item.sourceName}: ${item.reasons.join('; ')}`).join(' · '):'No separate held objects listed.';
  el('limits').textContent=data.limitations.join(' ')+(contextItems.length?' Bone context uses the original source labels Humerus.r, Scapula.r. and Clavicle.r; it can extend beyond the core view, so zoom out to inspect it.':'' );el('credit').textContent=`${data.credit} · ${data.license}. Source OBJ coordinates retained; display uses Float32 positions. Model adaptations require CC BY-SA 4.0.`;
  new ResizeObserver(()=>{const rect=viewport.getBoundingClientRect();renderer.setSize(Math.max(rect.width,1),Math.max(rect.height,1));camera.aspect=Math.max(rect.width,1)/Math.max(rect.height,1);camera.updateProjectionMatrix();}).observe(viewport);
  fillChoices();view('pz',true);el('search').disabled=el('candidate').disabled=el('export').disabled=false;
  renderer.setAnimationLoop(time=>{try{if(motion){const t=candidateCameraProgress(time,motion.start),pose=candidateCameraArc(motion.from,motion.target,motion.toTarget,motion.direction,motion.distance,t);controls.target.fromArray(pose.target);camera.position.fromArray(pose.position);if(t===1){motion=null;controls.enableDamping=true;}}
    controls.update();renderer.render(scene,camera);updateLabel();}catch(error){renderer.setAnimationLoop(null);document.body.dataset.reviewReady='false';el('error').textContent='Candidate rendering stopped: '+error.message;}});document.body.dataset.reviewReady='true';
} catch(error){el('error').textContent='Source review unavailable: '+error.message;document.body.dataset.reviewReady='false';}
