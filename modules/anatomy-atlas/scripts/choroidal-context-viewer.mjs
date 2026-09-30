import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

const el=id=>document.getElementById(id),viewport=el('viewport');
try {
 const response=await fetch('./scene.json');if(!response.ok)throw new Error('Source scene unavailable');const data=await response.json();
 if(data.purpose!=='source-only-choroidal-context-review'||data.admissions!==0||data.clinicalValidation!==false||data.sourceGeometryChanged!==false)throw new Error('Invalid review scene');
 const scene=new THREE.Scene();scene.background=new THREE.Color('#f5f8f6');
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));viewport.append(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(35,1,.001,100),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.09;
 scene.add(new THREE.HemisphereLight(0xffffff,0x69766f,2.5));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,5,4);scene.add(light);
 const matrix=new THREE.Matrix4().fromArray(data.coordinateSystem.sourceToSceneColumnMajor),candidates=[],objects=[];
 const colors={parent:'#da6655',branch:'#da6655','arterial-context':'#b55754',plexus:'#96749f','visual-source-context':'#469b97'};
 for(const entry of data.meshes){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(entry.vertices.flat(),3));geometry.setIndex(entry.faces.flat());geometry.applyMatrix4(matrix);geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({color:colors[entry.role],roughness:.72,metalness:0,side:THREE.DoubleSide,transparent:true,opacity:.2,depthWrite:false});
  const mesh=new THREE.Mesh(geometry,material);mesh.userData=entry;scene.add(mesh);objects.push(mesh);
  if(['parent','branch'].includes(entry.role)){candidates.push(mesh);const option=document.createElement('option');option.value=entry.id;option.textContent=entry.name;el('candidate').append(option);}
 }
 if(candidates.length!==4||objects.length!==12)throw new Error('Incomplete source scene');
 el('candidate').disabled=false;el('candidate').value='FMA50089';
 const box=new THREE.Box3();for(const m of objects.filter(m=>m.userData.role!=='arterial-context'))box.union(new THREE.Box3().setFromObject(m));
 const centre=box.getCenter(new THREE.Vector3()),radius=box.getSize(new THREE.Vector3()).length()*.5,range=radius/Math.sin(THREE.MathUtils.degToRad(17.5))*1.08;
 controls.minDistance=radius*.2;controls.maxDistance=range*8;camera.far=range*30;camera.updateProjectionMatrix();
 let motion=null;const directions={anterior:[0,.12,1],posterior:[0,.12,-1],right:[-1,.08,0],left:[1,.08,0],inferior:[0,-1,.08]};
 function view(key,immediate=false){const position=new THREE.Vector3(...directions[key]).normalize().multiplyScalar(range).add(centre);const instant=immediate||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const offset=camera.position.clone().sub(controls.target),toOffset=position.clone().sub(centre);
  motion=instant?null:{start:performance.now(),direction:offset.clone().normalize(),distance:offset.length(),fromTarget:controls.target.clone(),rotation:new THREE.Quaternion().setFromUnitVectors(offset.clone().normalize(),toOffset.clone().normalize())};
  controls.enableDamping=instant;
  viewport.dataset.cameraState=instant?'settled':'moving';viewport.dataset.cameraView=key;
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===key)));
  if(instant){camera.position.copy(position);controls.target.copy(centre);controls.update();}
 }
 controls.addEventListener('start',()=>{motion=null;controls.enableDamping=true;viewport.dataset.cameraState='manual';document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));});
 function appearance(){const id=el('candidate').value,opacity=+el('opacity').value/100;for(const m of objects){const role=m.userData.role,isCandidate=candidates.includes(m);m.visible=isCandidate||(role==='arterial-context'?el('arterial').checked:role==='plexus'?el('plexus').checked:el('visual').checked);
   m.material.color.set(isCandidate?(m.userData.id===id?'#e06048':'#d2a34d'):colors[role]);m.material.opacity=isCandidate?(m.userData.id===id?1:.55):opacity;m.material.depthWrite=isCandidate&&m.userData.id===id;}
  el('opacity-value').value=Math.round(opacity*100)+'%';const selected=candidates.find(m=>m.userData.id===id).userData;
  el('selection').textContent=selected.id+' · '+selected.side+' · '+selected.faces.length+' source triangles · Unadmitted';
  const unsupported=data.probes.filter(p=>p.candidate===id&&!p.supported).map(p=>p.targetName);
  el('evidence').textContent=data.duplicateScreen.verifiedSources+' source files hash-verified. No matching translated/reflected triangle signatures found; this does not rule out remeshing or partial overlap. '+(unsupported.length?'Envelope classification unavailable for '+unsupported.join(', ')+'. The plexus near-contact flag remains unresolved.':'No continuous-intersection or tissue certification.');
 }
 for(const id of ['candidate','arterial','plexus','visual','opacity'])el(id).addEventListener('input',appearance);
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));el('reset').addEventListener('click',()=>{for(const id of ['arterial','plexus','visual'])el(id).checked=true;el('opacity').value='20';appearance();view('anterior');});
 let down;renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const r=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(candidates)[0];if(hit){el('candidate').value=hit.object.userData.id;appearance();}});
 el('credit').textContent=data.credit+' · '+data.license+' · Geometry unchanged; colours/transparency are review presentation only. Three.js and OrbitControls: MIT.';
 el('limits').textContent=data.limitations.join(' ');
 new ResizeObserver(()=>{const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}).observe(viewport);
 view('anterior',true);appearance();
 renderer.setAnimationLoop(time=>{if(motion){const t=Math.min(1,(time-motion.start)/900),s=t*t*(3-2*t);controls.target.lerpVectors(motion.fromTarget,centre,s);const rotation=new THREE.Quaternion().slerp(motion.rotation,s);camera.position.copy(motion.direction).applyQuaternion(rotation).multiplyScalar(THREE.MathUtils.lerp(motion.distance,range,s)).add(controls.target);if(t===1){motion=null;controls.enableDamping=true;viewport.dataset.cameraState='settled';}}controls.update();renderer.render(scene,camera);});
 document.body.dataset.reviewReady='true';
}catch(error){el('error').textContent='Review unavailable: '+error.message;el('candidate').disabled=true;document.body.dataset.reviewReady='false';}
