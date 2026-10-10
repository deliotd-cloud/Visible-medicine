import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {opticReviewDraft} from './optic-alternative-review-draft.mjs';
import {opticCameraArc} from './optic-alternative-camera.mjs';
import {opticSceneRequest,assertOpticSceneRevision} from './optic-alternative-request.mjs';
const el=id=>document.getElementById(id),viewport=el('viewport');
try{
 const request=opticSceneRequest(location.href);
 const response=await fetch(request.url,{cache:'no-store',credentials:'same-origin'});if(!response.ok)throw Error('Source scene unavailable');const data=await response.json();
 assertOpticSceneRevision(data,request.expectedRevision);
 if(data.purpose!=='source-only-optic-alternative-review'||data.admissions!==0||data.clinicalValidation!==false||data.sourceGeometryChanged!==false)throw Error('Invalid source scene');
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));viewport.append(renderer.domElement);
 const scenes=Array.from({length:3},()=>{const s=new THREE.Scene();s.background=new THREE.Color('#f5f8f6');s.add(new THREE.HemisphereLight(0xffffff,0x69766f,2.4));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(3,5,4);s.add(light);return s;});
 const camera=new THREE.PerspectiveCamera(35,1,.001,100),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.09;
 const matrix=new THREE.Matrix4().fromArray(data.coordinateSystem.sourceToSceneColumnMajor),objects=[];
 for(const entry of data.meshes){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(entry.vertices.flat(),3));geometry.setIndex(entry.faces.flat());geometry.applyMatrix4(matrix);geometry.computeVertexNormals();
  const group=scenes.map(scene=>{const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({roughness:.72,side:THREE.DoubleSide,transparent:true,depthWrite:false}));mesh.userData=entry;scene.add(mesh);return mesh;});objects.push({entry,group});
 }
 if(objects.filter(o=>o.entry.role==='candidate').length!==4||data.pairs.length!==2)throw Error('Incomplete comparison');
 const directions={anterior:[0,.1,1],posterior:[0,.1,-1],right:[-1,.1,0],left:[1,.1,0],superior:[0,1,.1]};let motion=null,centre=new THREE.Vector3(),range=1,radius=.1,currentView='anterior';
 function view(key,immediate=false){currentView=key;const direction=new THREE.Vector3(...directions[key]).normalize(),from=camera.position.clone().sub(controls.target);
  const instant=immediate||matchMedia('(prefers-reduced-motion: reduce)').matches;
  motion=instant?null:{start:performance.now(),position:camera.position.toArray(),target:controls.target.toArray(),direction:direction.toArray()};
  controls.enableDamping=instant;viewport.dataset.cameraState=instant?'settled':'moving';
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===key)));
  if(instant){controls.target.copy(centre);camera.position.copy(direction).multiplyScalar(range).add(centre);controls.update();}
 }
 controls.addEventListener('start',()=>{motion=null;controls.enableDamping=true;viewport.dataset.cameraState='manual';});
 function appearance(refit=false){const pair=data.pairs.find(p=>p.side===el('side').value);if(!pair)throw Error('Missing source pair');const split=el('mode').value==='split';
  for(const{entry,group}of objects){const candidate=entry.role==='candidate',index=candidate?pair.files.indexOf(entry.sources[0].file):-1;
   group.forEach((mesh,pane)=>{mesh.visible=candidate?entry.side===pair.side&&index>=0&&(pane===2||pane===index):entry.role==='bone-context'?el('bone').checked:el('context').checked;
    mesh.material.color.set(candidate?index===0?'#d36954':'#458ca2':entry.role==='bone-context'?'#c4b79c':entry.role==='globe-context'?'#9c7fa5':'#5b9c8d');
    mesh.material.opacity=candidate?(split?1:.7):+el('opacity').value/100;mesh.material.depthWrite=candidate;
   });
  }
  el('divider').hidden=!split;el('label-a').textContent=pair.side+' · '+pair.files[0]+' (A)';el('label-b').textContent=pair.side+' · '+pair.files[1]+' (B)';
  el('opacity-value').value=el('opacity').value+'%';
  const contextSummary=data.meshes.filter(m=>m.role!=='candidate').map(m=>m.name).join(', ');
  const metrics=pair.metrics,fmt=n=>n.toFixed(3),direction=(key,label)=>label+': median '+fmt(metrics[key].vertices.medianMm)+' mm, maximum '+fmt(metrics[key].vertices.maxMm)+' mm; '+metrics[key].vertices.samples+' unique vertices. ';
  el('evidence').textContent=pair.id+' · Original-frame millimetres. '+metrics.exactSharedTriangles+' exactly shared triangles. '+direction('aToB','A to B')+direction('bToA','B to A')+'These are sampled, unsigned surface distances, not an overlap diagnosis. Both candidates remain held. Context: '+contextSummary+'. Report '+data.reportSha256.slice(0,12)+'.';
  if(refit){const box=new THREE.Box3();for(const o of objects.filter(o=>o.entry.role==='candidate'&&o.entry.side===pair.side))box.union(new THREE.Box3().setFromObject(o.group[2]));
   centre=box.getCenter(new THREE.Vector3());radius=box.getSize(new THREE.Vector3()).length()/2;range=radius/Math.sin(THREE.MathUtils.degToRad(17.5))*1.25;controls.minDistance=radius*.15;controls.maxDistance=range*8;camera.far=range*30;
   view(currentView,!document.body.dataset.reviewReady);
   el('choice').replaceChildren();for(const[value,label]of [['retain-hold','Retain hold / unresolved'],[pair.files[0],'Prefer '+pair.files[0]+' for further review'],[pair.files[1],'Prefer '+pair.files[1]+' for further review'],['compare-both','Both need further extent review']]){const option=document.createElement('option');option.value=value;option.textContent=label;el('choice').append(option);}el('notes').value='';
  }
 }
 el('side').disabled=false;el('export').disabled=false;
 for(const id of ['context','bone','opacity'])el(id).addEventListener('input',()=>appearance());el('side').addEventListener('change',()=>appearance(true));el('mode').addEventListener('change',()=>appearance());
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));el('reset').addEventListener('click',()=>{el('context').checked=true;el('bone').checked=false;el('opacity').value='15';appearance(true);view('anterior');});
 el('export').addEventListener('click',()=>{try{const draft=opticReviewDraft(data,el('side').value,el('choice').value,el('notes').value),url=URL.createObjectURL(new Blob([JSON.stringify(draft,null,2)+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='visible-medicine-optic-review-draft-'+draft.side+'-'+data.reportSha256.slice(0,12)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);el('export-status').textContent='Draft exported. No approval submitted; both holds remain.';}catch(error){el('error').textContent=error.message;}});
 el('limits').textContent=data.limitations.join(' ');el('credit').textContent=data.credit+' · '+data.license+'. Geometry unchanged; presentation only. Three.js / OrbitControls MIT.';
 let width=1,height=1;new ResizeObserver(()=>{const box=viewport.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);renderer.setSize(width,height);}).observe(viewport);
 appearance(true);renderer.setAnimationLoop(time=>{if(motion){const t=Math.min(1,(time-motion.start)/900),pose=opticCameraArc(motion.position,motion.target,centre.toArray(),motion.direction,range,t);controls.target.fromArray(pose.target);camera.position.fromArray(pose.position);if(t===1){motion=null;controls.enableDamping=true;viewport.dataset.cameraState='settled';}}controls.update();
  const split=el('mode').value==='split';renderer.setScissorTest(split);const panes=split?2:1;
  for(let pane=0;pane<panes;pane++){const w=width/panes;camera.aspect=w/height;camera.updateProjectionMatrix();renderer.setViewport(pane*w,0,w,height);if(split)renderer.setScissor(pane*w,0,w,height);renderer.render(scenes[split?pane:2],camera);}
 });document.body.dataset.reviewReady='true';
}catch(error){el('error').textContent='Review unavailable: '+error.message;el('side').disabled=true;el('export').disabled=true;document.body.dataset.reviewReady='false';}
