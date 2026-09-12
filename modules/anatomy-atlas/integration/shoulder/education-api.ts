import { imagingBridge } from '../../lib/imaging-sync';
import { connectDidanixEducation, type DidanixEducationPort, type DidanixLinkStatus } from '../../lib/didanix-atlas-adapter';
import { createLearningRegistry, type LearningPolicy } from '../../lib/learning-resources';
import { shoulderLinkEntries } from '../../lib/anatomy-link-registry';
import { structures } from '../../app/anatomy-data';
import manifest from '../../public/models/bodyparts3d/manifest.json';

/** Same-origin, in-memory integration only. No postMessage receiver or remote
 * configuration is installed. The host is responsible for actual media access. */
export function installShoulderEducationApi(target:Window) {
  const key='visibleMedicineShoulderEducation';
  if(Object.hasOwn(target,key)) throw Error('Shoulder education API already installed');
  const anatomy=shoulderLinkEntries(manifest,structures).map(entry=>({scope:'shoulder-pilot' as const,structureId:entry.id,sources:entry.sources}));
  let active:ReturnType<typeof connectDidanixEducation>|null=null;
  const api=Object.freeze({
    version:1,
    connect(options:{document:unknown;policy:LearningPolicy;viewer:DidanixEducationPort;onStatus?:(status:DidanixLinkStatus)=>void}) {
      if(active) throw Error('Disconnect Didanix Education before attaching another viewer');
      const registry=createLearningRegistry(options.document,anatomy,options.policy);
      const connection=connectDidanixEducation({bridge:imagingBridge,registry,viewer:options.viewer,scope:'shoulder-pilot',onStatus:options.onStatus});
      active=connection;
      return {...connection,dispose(){try{connection.dispose();}finally{if(active===connection)active=null;}}};
    },
  });
  Object.defineProperty(target,key,{value:api,configurable:true,enumerable:false,writable:false});
  return ()=>{try{active?.dispose();}finally{active=null;Reflect.deleteProperty(target,key);}};
}
