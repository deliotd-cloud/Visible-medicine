import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const mount=document.querySelector('#view'),status=document.querySelector('#status');
const scene=new THREE.Scene();scene.background=new THREE.Color('#071b24');
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;mount.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(36,1,.01,10000);camera.up.set(0,0,1);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;
scene.add(new THREE.HemisphereLight(0xe8f5ff,0x263b3f,2.3));
const light=new THREE.DirectionalLight(0xffffff,3.2);light.position.set(100,200,500);scene.add(light);
const fill=new THREE.DirectionalLight(0x87b8d8,1.3);fill.position.set(-300,-400,200);scene.add(fill);
const group=new THREE.Group();scene.add(group);const objects=new Map();
const colors={AC_Lig:'#dfad6c',Gcart:'#65b7d2',Hcart:'#87cbd6',Labrum:'#c76478',CLAVICLE:'#e6dcc5',Humerus:'#e6dcc5',SCAPULA:'#e6dcc5'};
const names={AC_Lig:'Acromioclavicular ligament',Gcart:'Constructed glenoid cartilage',Hcart:'Constructed humeral cartilage',Labrum:'Labrum',CLAVICLE:'Clavicle',Humerus:'Humerus',SCAPULA:'Scapula'};
let manifest,axes;
function sourceIndexedGeometry(text){const vertices=[],indices=[];for(const line of text.split('\n')){if(line.startsWith('v '))vertices.push(...line.slice(2).split(' ').map(Number));else if(line.startsWith('f '))indices.push(...line.slice(2).split(' ').map(n=>Number(n)-1));}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;}
function fit(){const box=new THREE.Box3();for(const o of objects.values())if(o.visible)box.expandByObject(o);const center=box.getCenter(new THREE.Vector3()),radius=Math.max(box.getSize(new THREE.Vector3()).length()/2,1);controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(radius*1.6,-radius*2.2,radius*.8));camera.near=radius/1000;camera.far=radius*100;camera.updateProjectionMatrix();controls.update();if(axes){axes.position.copy(center);axes.scale.setScalar(radius/5);}}
function update(){const selected=document.querySelector('#part').value;let triangles=0;const visible=[];for(const [name,o]of objects){o.visible=selected==='all'||selected===name||(selected==='joint'&&['AC_Lig','Gcart','Hcart','Labrum'].includes(name));if(o.visible){triangles+=manifest.exports.find(r=>r.part===name).assembledAudit.triangles;visible.push(names[name]);}}status.textContent=visible.join(' · ')+' — '+triangles.toLocaleString()+' source-sampled triangles. Local draft; not installed.';fit();}
document.querySelector('#part').addEventListener('change',update);document.querySelector('#fit').addEventListener('click',fit);
try{manifest=await(await fetch('/meshes/MANIFEST.json')).json();for(const row of manifest.exports){const text=await(await fetch('/meshes/'+row.part+'.obj')).text(),geometry=sourceIndexedGeometry(text);const object=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:colors[row.part],roughness:.62,metalness:0,side:THREE.DoubleSide}));group.add(object);objects.set(row.part,object);}axes=new THREE.AxesHelper(1);scene.add(axes);update();}catch(error){status.textContent='Failed to load prototype: '+error.message;throw error;}
function size(){const r=mount.getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}new ResizeObserver(size).observe(mount);size();
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
