import type {HeadStudy,LocalHeadPackage,Modality} from './head-atlas-import';
import type {Vec3,Plane} from './head-atlas-geometry.mjs';

export type HeadRememberedView={cursor:Vec3;layout:Plane|'multiplanar'};
function validView(definition:HeadStudy,view:HeadRememberedView){
  const shape=definition?.image?.shape_kji;
  return !!view&&['axial','coronal','sagittal','multiplanar'].includes(view.layout)&&
    Array.isArray(shape)&&shape.length===3&&[0,1,2].every(axis=>Number.isSafeInteger(shape[axis])&&shape[axis]>0&&shape[axis]<=4096)&&
    Array.isArray(view.cursor)&&view.cursor.length===3&&
    [0,1,2].every(axis=>Number.isSafeInteger(view.cursor[axis])&&view.cursor[axis]>=0&&view.cursor[axis]<shape[2-axis]);
}
const copyView=(view:HeadRememberedView):HeadRememberedView=>({cursor:[...view.cursor],layout:view.layout});

/** Tab-memory references only: never serialize files, images, answers or scores. */
export function createHeadFolderSession(revision:string){
  let retained:LocalHeadPackage|null=null;
  const windows=new Map<Modality,{definition:HeadStudy;value:[number,number]}>();
  const views=new Map<Modality,{definition:HeadStudy;value:HeadRememberedView}>();
  const matches=(pkg:LocalHeadPackage,modality:Modality,definition:HeadStudy,expectedRevision:string)=>
    expectedRevision===revision&&pkg===retained&&(modality==='CT'||modality==='MRI')&&
    !!definition&&definition===pkg?.manifest?.studies?.[modality];
  return {
    read(expectedRevision:string){return expectedRevision===revision?retained:null;},
    keep(pkg:LocalHeadPackage,expectedRevision:string){
      if(pkg!==retained||expectedRevision!==revision){windows.clear();views.clear();}
      retained=expectedRevision===revision?pkg:null;
    },
    readWindow(pkg:LocalHeadPackage,modality:Modality,definition:HeadStudy,expectedRevision:string):[number,number]|null{
      const saved=windows.get(modality);
      return matches(pkg,modality,definition,expectedRevision)&&saved?.definition===definition?[...saved.value]:null;
    },
    keepWindow(pkg:LocalHeadPackage,modality:Modality,definition:HeadStudy,expectedRevision:string,value:[number,number]){
      if(!matches(pkg,modality,definition,expectedRevision)||!Array.isArray(value)||value.length!==2||
        !value.every(Number.isFinite)||value[1]<1)return false;
      windows.set(modality,{definition,value:[...value]});return true;
    },
    readView(pkg:LocalHeadPackage,modality:Modality,definition:HeadStudy,expectedRevision:string):HeadRememberedView|null{
      const saved=views.get(modality);
      return matches(pkg,modality,definition,expectedRevision)&&saved?.definition===definition&&validView(definition,saved.value)?copyView(saved.value):null;
    },
    keepView(pkg:LocalHeadPackage,modality:Modality,definition:HeadStudy,expectedRevision:string,value:HeadRememberedView){
      if(!matches(pkg,modality,definition,expectedRevision)||!validView(definition,value))return false;
      views.set(modality,{definition,value:copyView(value)});return true;
    },
    clear(){retained=null;windows.clear();views.clear();},
  };
}
export function isHeadFolderSessionRoute(pathname:string|null){
  return pathname==='/atlas/ct-head'||pathname==='/atlas/mri-head';
}
