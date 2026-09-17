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
  let removed=false,attaching=false;
  const api=Object.freeze({
    version:1,
    connect(options:{document:unknown;policy:LearningPolicy;viewer:DidanixEducationPort;onStatus?:(status:DidanixLinkStatus)=>void}) {
      if(removed) throw Error('This Didanix Education interface has been removed');
      if(active || attaching) throw Error('Disconnect Didanix Education before attaching another viewer');
      attaching=true;
      try {
        const registry=createLearningRegistry(options.document,anatomy,options.policy);
        if(removed) throw Error('This Didanix Education interface has been removed');
        const connection=connectDidanixEducation({bridge:imagingBridge,registry,viewer:options.viewer,scope:'shoulder-pilot',onStatus:options.onStatus});
        // Host callbacks can synchronously remove the interface during setup.
        // Do not leave their just-created subscriptions or bridge attached.
        if(removed) {
          connection.dispose();
          throw Error('This Didanix Education interface has been removed');
        }
        active=connection;
        return {...connection,dispose(){try{connection.dispose();}finally{if(active===connection)active=null;}}};
      } finally { attaching=false; }
    },
  });
  Object.defineProperty(target,key,{value:api,configurable:true,enumerable:false,writable:false});
  return ()=>{
    if(removed) return;
    removed=true;
    try{active?.dispose();}finally{
      active=null;
      // An old cleanup must not remove a freshly installed/replaced facade.
      if(Object.getOwnPropertyDescriptor(target,key)?.value===api) Reflect.deleteProperty(target,key);
    }
  };
}
