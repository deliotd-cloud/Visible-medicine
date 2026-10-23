// Inventory-only Abaqus text reader. No publisher code, solver or mesh execution.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const FDA_SHOULDER_SOURCE=Object.freeze({
  repository:'https://github.com/OSEL-DAM/ShoulderFiniteElementModel',
  commit:'fc9f3e56b104c06759750495be1f8dd5d53c1741',
  file:'Male-Shoulder.inp',bytes:59793091,
  sha256:'547de9cff23a4ae98d5a297ba32d8b01fe042739160c4b7144dfe7066d08c70a',
  license:'CC0-1.0',
});
const sourceParts=['AC_Lig','CLAVICLE','Gcart','Hcart','Humerus','Labrum','SCAPULA'];
const number=token=>{assert(token.trim()!=='','Empty number');const n=Number(token.replace(/[dD]/,'E'));assert(Number.isFinite(n),'Non-finite number');return n;};
const id=token=>{const n=number(token);assert(Number.isSafeInteger(n)&&n>0,'Invalid positive integer ID');return n;};
const row=line=>line.split(',').map(t=>t.trim());
const keyword=line=>{const [name,...fields]=row(line.slice(1));const args={};for(const field of fields){const i=field.indexOf('=');if(i>=0){const key=field.slice(0,i).toLowerCase();assert(!Object.hasOwn(args,key),'Duplicate keyword argument');args[key]=field.slice(i+1);}else if(field)args[field.toLowerCase()]=true;}return {name:name.toLowerCase(),args};};

export function readAbaqusGeometry(text){
  assert(typeof text==='string'&&!text.includes('\0'),'Expected plain text');
  const parts=new Map(),instances=[],assemblyElementTypes={},unsupportedAssemblyTransforms=[];
  let part=null,instance=null,mode='',ended=false,assemblyNodeCount=0;
  for(const [offset,raw]of text.split(/\r?\n/).entries()){
    const line=raw.trim();if(!line||line.startsWith('**'))continue;
    if(line.startsWith('*')){
      const {name,args}=keyword(line);mode='';
      assert(!['include','parameter','system'].includes(name),`Unsupported indirection ${name} at ${offset+1}`);
      if(name==='part'){
        assert(!part&&!instance&&!ended,'Unexpected Part');assert(typeof args.name==='string'&&args.name.length>0,'Missing part name');
        assert(!parts.has(args.name),'Duplicate part name');
        part={name:args.name,nodes:new Map(),elements:new Map(),elementType:null};parts.set(args.name,part);
      }else if(name==='end part'){
        assert(part,'End Part without Part');assert(part.nodes.size&&part.elements.size,'Empty mesh part');part=null;
      }else if(name==='assembly'){assert(!part&&!instance,'Assembly inside mesh');ended=true;}
      else if(name==='instance'){
        assert(ended&&!part&&!instance,'Unexpected Instance');
        assert(typeof args.name==='string'&&parts.has(args.part),'Unknown instance part');
        assert(!instances.some(i=>i.name===args.name),'Duplicate instance');
        instance={name:args.name,part:args.part,transformRows:[]};instances.push(instance);mode='instance';
      }else if(name==='end instance'){assert(instance,'End Instance without Instance');instance=null;}
      else if(name==='node'){
        assert(!instance,'Instance-local nodes unsupported');
        assert(Object.keys(args).length===0,'Node coordinate options unsupported');mode=part?'nodes':'assembly-nodes';
      }else if(name==='element'){
        assert(!instance,'Instance-local elements unsupported');assert(typeof args.type==='string','Missing element type');
        if(part){assert(args.type==='C3D10M','Unsupported part element type');assert(!part.elementType||part.elementType===args.type,'Mixed part element types');part.elementType=args.type;mode='elements';}
        else{assert(ended,'Assembly element before Assembly');mode='assembly-elements';assemblyElementTypes[args.type]??=0;mode+=':'+args.type;}
      }else if(name==='transform'){
        assert(!part&&!instance,'Part coordinate transformation unsupported');
        unsupportedAssemblyTransforms.push({keyword:line,line:offset+1});
      }
      continue;
    }
    if(mode==='nodes'){
      const values=row(line);assert(values.length===4,'Node must contain ID and three coordinates');const node=id(values[0]);
      assert(!part.nodes.has(node),'Duplicate node ID');part.nodes.set(node,values.slice(1).map(number));
    }else if(mode==='elements'){
      const values=row(line);assert(values.length===11,'C3D10M must contain element ID and ten node IDs on one line');const element=id(values[0]),nodes=values.slice(1).map(id);
      assert(!part.elements.has(element),'Duplicate element ID');assert(new Set(nodes).size===10,'Repeated element node');part.elements.set(element,nodes);
    }else if(mode==='instance'){
      const values=row(line).map(number);const length=instance.transformRows.length===0?3:7;
      assert(values.length===length&&instance.transformRows.length<2,'Unsupported instance transform sequence');
      if(length===7)assert(values.slice(0,3).some((v,i)=>v!==values[i+3]),'Zero-length rotation axis');instance.transformRows.push(values);
    }else if(mode==='assembly-nodes'){const values=row(line);assert(values.length===4,'Invalid assembly node');id(values[0]);values.slice(1).map(number);assemblyNodeCount++;}
    else if(mode.startsWith('assembly-elements:')){assert(row(line).length>=3,'Invalid assembly element');assemblyElementTypes[mode.slice(18)]++;}
  }
  assert(!part&&!instance,'Unclosed part or instance');
  const result=[];
  for(const p of parts.values()){
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(const xyz of p.nodes.values())for(let i=0;i<3;i++){min[i]=Math.min(min[i],xyz[i]);max[i]=Math.max(max[i],xyz[i]);}
    for(const nodes of p.elements.values())for(const n of nodes)assert(p.nodes.has(n),'Element references missing part node');
    result.push({name:p.name,nodeCount:p.nodes.size,elementCount:p.elements.size,elementType:p.elementType,rawPartBounds:{min,max},assembledBounds:null});
  }
  const inventory={parts:result,instances,assemblyNodeCount,assemblyElementTypes,unsupportedAssemblyTransforms,
    geometryExported:false,assemblyTransformsApplied:false,unitsVerified:false,lateralityVerified:false,
    anatomicalReview:false,registeredToBodyParts3D:false,patientSpaceRegistration:false};
  return {parts,inventory};
}
export function inspectAbaqusGeometry(text){return readAbaqusGeometry(text).inventory;}

export function readPinnedShoulder(data){
  assert(Buffer.isBuffer(data),'Expected source bytes');assert.equal(data.length,FDA_SHOULDER_SOURCE.bytes,'Pinned source length');
  assert.equal(createHash('sha256').update(data).digest('hex'),FDA_SHOULDER_SOURCE.sha256,'Pinned source SHA256');
  const {parts,inventory}=readAbaqusGeometry(new TextDecoder('utf-8',{fatal:true}).decode(data));
  assert.deepEqual(inventory.parts.map(p=>p.name),sourceParts,'Exact seven source parts');
  assert.equal(inventory.instances.length,7,'Exact seven source instances');
  assert.deepEqual(inventory.instances.map(i=>i.part).sort(),[...sourceParts].sort(),'Each source part instanced once');
  const manifest={schema:'visible-medicine-fda-shoulder-inventory/1',source:FDA_SHOULDER_SOURCE,...inventory,
    provenance:{AC_Lig:'publisher-reported-CT-segmentation',CLAVICLE:'publisher-reported-CT-segmentation',Gcart:'publisher-reported-offset-constructed',Hcart:'publisher-reported-offset-constructed',Humerus:'publisher-reported-CT-segmentation',Labrum:'publisher-reported-CT-segmentation',SCAPULA:'publisher-reported-CT-segmentation'},
    status:'quarantined-not-admitted',publisherCodeExecuted:false,abaqusSolverRun:false,
    geometryCountsAreNotAnatomyCompleteness:true,installed:false,previewChanged:false};
  return {parts,manifest};
}
export function inspectPinnedShoulder(data){return readPinnedShoulder(data).manifest;}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  assert.equal(process.argv.length,3,'Usage: node scripts/inspect-abaqus-shoulder-source.mjs <pinned-public-Male-Shoulder.inp>');
  console.log(JSON.stringify(inspectPinnedShoulder(fs.readFileSync(process.argv[2])),null,2));
}
