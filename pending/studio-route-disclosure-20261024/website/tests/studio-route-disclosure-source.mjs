import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export const studioRouteComponentSha256='d2ac47b267ac7122e664c5341bcdb7e3d21f1f60882b186968c54b86bc894232';
export const studioRouteParentSha256='de7532406b4def25c1dfad8bfa024cfe1b249f7f04603b5853691c416c398ef1';
export const atlasRegionGuardSha256='16e15296f9a3c5241a4b76edf99dbb608be9b4d5206c4e1f86b5a0df02484ba1';
export function restoreAtlasRegionGuardDisclosure(bytes){
 assert.equal(sha(bytes),atlasRegionGuardSha256,'Exact existing region-guard consumer required');let text=Buffer.from(bytes).toString();
 const seams=[
  ['export function AtlasWorkspaceNavigation({modality,regionId,headNavigation,onBeforeRegionNavigate}:{modality:AtlasModalityId;regionId:string;headNavigation?:HeadImageNavigationContext;onBeforeRegionNavigate?:(href:string)=>boolean}){','export function AtlasWorkspaceNavigation({modality,regionId,headNavigation}:{modality:AtlasModalityId;regionId:string;headNavigation?:HeadImageNavigationContext}){'],
  ['<AtlasRegionNavigation modality={modality} selected={regionId} onBeforeNavigate={onBeforeRegionNavigate}/>','<AtlasRegionNavigation modality={modality} selected={regionId}/>']
 ];
 for(const[current,old]of seams){assert.equal(text.split(current).length,2);text=text.replace(current,old);}const before=Buffer.from(text);assert.equal(sha(before),'bdb3b0801d047c0061ea5cd4db6080c4c2fa5e6c4777f32469844711c7458aec');return before;
}
export function restoreStudioRouteDisclosure(bytes){
 assert.equal(sha(bytes),studioRouteComponentSha256,'Exact route-synchronized Studio source required');let text=Buffer.from(bytes).toString();
 const seams=[
  ['import {useLayoutEffect,useRef} from "react";\n',''],
  ['  const navigation = useRef<HTMLElement | null>(null);\n  useLayoutEffect(() => {\n    const disclosure = navigation.current?.querySelector<HTMLDetailsElement>(":scope > .studio-manage-navigation");\n    if (disclosure) disclosure.open = pathname.startsWith("/studio/cohorts") || pathname.startsWith("/studio/analytics");\n  }, [pathname]);\n',''],
  ['return <nav ref={navigation} className="studio-navigation"','return <nav className="studio-navigation"']
 ];
 for(const[next,old]of seams){assert.equal(text.split(next).length,2,'One exact declared navigation seam');text=text.replace(next,old);}const before=Buffer.from(text);assert.equal(sha(before),studioRouteParentSha256,'Entire original Studio source reconstructed');return before;
}
