import {imagingBridge} from './imaging-sync';
import {connectDidanixEducation,type DidanixEducationPort,type DidanixLinkStatus} from './didanix-atlas-adapter';
import {createLearningRegistry,type LearningPolicy,type AnatomyRepresentation} from './learning-resources';

/** Internal installation from trusted source records, not a host-supplied
 * anatomy manifest, message endpoint, access grant or patient-space adapter. */
export function installRootEducationApi(target:Window,scope:'body'|'shoulder-pilot',records:AnatomyRepresentation[],gate?:{
  canNavigate:()=>boolean;
  canAccessAnatomy:(anatomy:AnatomyRepresentation)=>boolean;
}) {
  const key=scope==='body'?'visibleMedicineBodyEducation':'visibleMedicineShoulderEducation';
  if(Object.hasOwn(target,key))throw Error('Education API already installed');
  const anatomy=structuredClone(records);
  let active:ReturnType<typeof connectDidanixEducation>|null=null;
  let removed=false,attaching=false;
  const api=Object.freeze({version:1,
    connect(options:{document:unknown;policy:LearningPolicy;viewer:DidanixEducationPort;onStatus?:(status:DidanixLinkStatus)=>void}){
      if(removed)throw Error('This Didanix Education interface has been removed');
      if(active||attaching)throw Error('Disconnect Didanix Education before attaching another viewer');
      attaching=true;
      try{
        const policy:LearningPolicy={...options.policy,
          canNavigate:()=>!removed&&(!gate||gate.canNavigate()===true)&&options.policy.canNavigate()===true,
          canAccessAnatomy:a=>(!gate||gate.canAccessAnatomy(a)===true)&&options.policy.canAccessAnatomy(a)===true,
        };
        const registry=createLearningRegistry(options.document,anatomy,policy);
        if(removed)throw Error('This Didanix Education interface has been removed');
        const connection=connectDidanixEducation({bridge:imagingBridge,registry,viewer:options.viewer,scope,onStatus:options.onStatus});
        if(removed){connection.dispose();throw Error('This Didanix Education interface has been removed');}
        active=connection;
        return {...connection,dispose(){try{connection.dispose();}finally{if(active===connection)active=null;}}};
      }finally{attaching=false;}
    },
  });
  Object.defineProperty(target,key,{value:api,configurable:true,enumerable:false,writable:false});
  return {
    pause(){if(!removed)active?.setEnabled(false);},
    dispose(){
      if(removed)return;removed=true;
      try{active?.dispose();}finally{
        active=null;
        if(Object.getOwnPropertyDescriptor(target,key)?.value===api)Reflect.deleteProperty(target,key);
      }
    },
  };
}
