/** Local still-image teaching packages. These are draft pixel annotations,
 * never DICOM geometry, clinical approvals or registered image/model pairs. */
import {resolveLectureBodyReference,validateLectureBodyReference,type LectureBodyReference} from './lecture-body-reference';

export const ULTRASOUND_MANIFEST='ultrasound-atlas.json';
export const ultrasoundRegions=['head-neck','spine','thorax','abdomen','pelvis','shoulder','knee','ankle-foot'] as const;
export type UltrasoundRegion=typeof ultrasoundRegions[number];
export type UltrasoundPoint=readonly [number,number];
/** Display-only source-pixel panel; never image redaction or patient geometry. */
export type UltrasoundViewport={readonly x:number;readonly y:number;readonly width:number;readonly height:number};
export type UltrasoundAnnotation={
 readonly id:string;readonly label:string;readonly polygon:readonly UltrasoundPoint[];
 readonly notes:readonly string[];readonly atlasReference:LectureBodyReference|null;
};
export type UltrasoundFrame={
 readonly id:string;readonly title:string;readonly orientationNote:string;
 readonly image:{readonly file:string;readonly sha256:string;readonly width:number;readonly height:number};
 readonly viewport?:UltrasoundViewport;
 readonly annotations:readonly UltrasoundAnnotation[];
};
export type UltrasoundStudy={
 readonly schema:'vm-ultrasound-teaching/1';readonly id:string;readonly title:string;readonly region:UltrasoundRegion;
 readonly source:{readonly author:string;readonly license:'CC0-1.0'|'CC-BY-4.0'|'owner-cleared-local';readonly attribution:string;readonly url:string|null};
 readonly frames:readonly UltrasoundFrame[];
};
export class UltrasoundStudyError extends Error {
 constructor(message:string){super(message);this.name='UltrasoundStudyError';}
}
const fail=(message:string):never=>{throw new UltrasoundStudyError(message);};
const id=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hash=/^[a-f0-9]{64}$/;
const fullImage=Object.freeze({x:0,y:0,width:1,height:1});
function validViewport(value:UltrasoundViewport):boolean{
 return !!value&&[value.x,value.y,value.width,value.height].every(v=>typeof v==='number'&&Number.isFinite(v))&&
  value.x>=0&&value.y>=0&&value.width>0&&value.height>0&&value.x+value.width<=1&&value.y+value.height<=1;
}
const unsafeText=/[\u0000-\u001f\u007f-\u009f]/;
function record(value:unknown,required:readonly string[],optional:readonly string[]=[]):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))return fail('The teaching folder has an invalid record.');
 const keys=Reflect.ownKeys(value),descriptors=Object.getOwnPropertyDescriptors(value);
 if(keys.some(key=>typeof key!=='string'||![...required,...optional].includes(key)||!Object.hasOwn(descriptors[key],'value'))||required.some(key=>!Object.hasOwn(descriptors,key)))return fail('The teaching folder has unknown or missing fields.');
 return value as Record<string,unknown>;
}
function text(value:unknown,limit:number,empty=false):string{
 if(typeof value!=='string'||value.length>limit||unsafeText.test(value)||(!empty&&!value.trim()))return fail('The teaching folder contains invalid text.');
 return value;
}
function identifier(value:unknown):string{const s=text(value,80);if(!id.test(s))return fail('Use short, non-identifying study, image and annotation IDs.');return s;}
function array(value:unknown,min:number,max:number):unknown[]{if(!Array.isArray(value)||value.length<min||value.length>max)return fail('The teaching folder has an invalid item count.');return value;}
const same=(a:UltrasoundPoint,b:UltrasoundPoint)=>a[0]===b[0]&&a[1]===b[1];
const cross=(a:UltrasoundPoint,b:UltrasoundPoint,c:UltrasoundPoint)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function onSegment(p:UltrasoundPoint,a:UltrasoundPoint,b:UltrasoundPoint):boolean{return Math.abs(cross(a,b,p))<1e-10&&p[0]>=Math.min(a[0],b[0])-1e-10&&p[0]<=Math.max(a[0],b[0])+1e-10&&p[1]>=Math.min(a[1],b[1])-1e-10&&p[1]<=Math.max(a[1],b[1])+1e-10;}
function intersects(a:UltrasoundPoint,b:UltrasoundPoint,c:UltrasoundPoint,d:UltrasoundPoint):boolean{
 return onSegment(a,c,d)||onSegment(b,c,d)||onSegment(c,a,b)||onSegment(d,a,b)||(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0);
}
function polygon(value:unknown):readonly UltrasoundPoint[]{
 const points=array(value,3,64).map(p=>{if(!Array.isArray(p)||p.length!==2||!p.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1))return fail('Annotations must use normalized image coordinates.');return Object.freeze([p[0],p[1]]) as UltrasoundPoint;});
 if(points.some((p,i)=>points.some((q,j)=>i!==j&&same(p,q))))return fail('Annotation polygons cannot repeat a vertex.');
 const area=points.reduce((total,p,i)=>{const q=points[(i+1)%points.length];return total+p[0]*q[1]-q[0]*p[1];},0);
 if(Math.abs(area)<1e-8)return fail('An annotation has no image area.');
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
  if(j===i+1||i===0&&j===points.length-1)continue;
  if(intersects(points[i],points[(i+1)%points.length],points[j],points[(j+1)%points.length]))return fail('An annotation polygon crosses itself.');
 }
 return Object.freeze(points);
}
export function parseUltrasoundStudy(value:unknown):UltrasoundStudy{
 const input=record(value,['schema','id','title','region','source','frames']);
 if(input.schema!=='vm-ultrasound-teaching/1'||typeof input.region!=='string'||!ultrasoundRegions.includes(input.region as UltrasoundRegion))return fail('This is not a supported ultrasound teaching folder.');
 const origin=record(input.source,['author','license','attribution','url']);
 if(!['CC0-1.0','CC-BY-4.0','owner-cleared-local'].includes(origin.license as string))return fail('The teaching folder needs an explicit supported rights declaration.');
 let sourceUrl:string|null=null;
 if(origin.url!==null){const supplied=text(origin.url,2048);let parsed:URL;try{parsed=new URL(supplied);}catch{return fail('The source link is invalid.');}if(parsed.protocol!=='https:'||parsed.username||parsed.password)return fail('Source links must use HTTPS without credentials.');sourceUrl=parsed.href;}
 const source=Object.freeze({author:text(origin.author,300),license:origin.license as UltrasoundStudy['source']['license'],attribution:text(origin.attribution,1500),url:sourceUrl});
 const frameIds=new Set<string>(),images=new Map<string,string>();let totalAnnotations=0;
 const frames=array(input.frames,1,64).map(raw=>{
  const frame=record(raw,['id','title','orientationNote','image','annotations'],['viewport']),frameId=identifier(frame.id);if(frameIds.has(frameId))return fail('Image IDs must be unique.');frameIds.add(frameId);
  const image=record(frame.image,['file','sha256','width','height']),file=text(image.file,120);
  if(!/^[A-Za-z0-9][A-Za-z0-9_.-]*\.(?:png|jpg|jpeg)$/i.test(file)||file.includes('..'))return fail('Use a PNG or JPEG filename in the teaching folder, without subfolders.');
  if(typeof image.sha256!=='string'||!hash.test(image.sha256))return fail('Every image needs its exact SHA-256.');
  if(!Number.isSafeInteger(image.width)||!Number.isSafeInteger(image.height)||(image.width as number)<1||(image.height as number)<1||(image.width as number)>4096||(image.height as number)>4096)return fail('Image dimensions must be between 1 and 4096 pixels.');
  let viewport:UltrasoundViewport|undefined;
  if(frame.viewport!==undefined){const view=record(frame.viewport,['x','y','width','height']);
   if(!validViewport(view as unknown as UltrasoundViewport)||(view.width as number)*(image.width as number)<1||(view.height as number)*(image.height as number)<1)return fail('An image panel must stay inside the source image and contain at least one pixel.');
   viewport=Object.freeze({x:view.x as number,y:view.y as number,width:view.width as number,height:view.height as number});
  }
  const imageIdentity=JSON.stringify([image.sha256,image.width,image.height]);if(images.has(file)&&images.get(file)!==imageIdentity)return fail('One image file has conflicting definitions.');images.set(file,imageIdentity);
  const annotationIds=new Set<string>();const annotations=array(frame.annotations,0,128).map(rawAnnotation=>{
   const annotation=record(rawAnnotation,['id','label','polygon','notes'],['atlasReference']),annotationId=identifier(annotation.id);if(annotationIds.has(annotationId))return fail('Annotation IDs must be unique within each image.');annotationIds.add(annotationId);
   let atlasReference:LectureBodyReference|null=null;
   if(annotation.atlasReference!==undefined&&annotation.atlasReference!==null){try{atlasReference=Object.freeze(validateLectureBodyReference(annotation.atlasReference));}catch{return fail('A 3D reference has invalid source fields.');}}
   const points=polygon(annotation.polygon);
   if(viewport&&points.some(([x,y])=>x<viewport.x||x>viewport.x+viewport.width||y<viewport.y||y>viewport.y+viewport.height))return fail('Every annotation must stay inside its declared image panel.');
   return Object.freeze({id:annotationId,label:text(annotation.label,160),polygon:points,notes:Object.freeze(array(annotation.notes,0,12).map(note=>text(note,1000))),atlasReference});
  });totalAnnotations+=annotations.length;if(totalAnnotations>2048)return fail('This teaching folder contains too many annotations.');
  return Object.freeze({id:frameId,title:text(frame.title,200),orientationNote:text(frame.orientationNote,1000),image:Object.freeze({file,sha256:image.sha256,width:image.width as number,height:image.height as number}),...(viewport?{viewport}:{}),annotations:Object.freeze(annotations)});
 });
 return Object.freeze({schema:'vm-ultrasound-teaching/1',id:identifier(input.id),title:text(input.title,200),region:input.region as UltrasoundRegion,source,frames:Object.freeze(frames)});
}
export type UltrasoundPick={kind:'match';annotation:UltrasoundAnnotation}|{kind:'miss'}|{kind:'ambiguous';ids:readonly string[]};
function contains(p:readonly UltrasoundPoint[],point:UltrasoundPoint):boolean{
 const [x,y]=point;let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){
  const a=p[j],b=p[i];if(onSegment(point,a,b))return true;
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }return inside;
}
export function pickUltrasoundAnnotation(frame:UltrasoundFrame,x:number,y:number):UltrasoundPick{
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1)return {kind:'miss'};
 const point:UltrasoundPoint=[x,y];
 const matches=frame.annotations.filter(({polygon:p})=>contains(p,point));
 return matches.length===1?{kind:'match',annotation:matches[0]}:matches.length?{kind:'ambiguous',ids:matches.map(a=>a.id)}:{kind:'miss'};
}
/** A bounded interior search; hide a label if no interior sample is found.
 * The vertex average is unsuitable for concave anatomical outlines. */
export function ultrasoundLabelAnchor(annotation:UltrasoundAnnotation):UltrasoundPoint|null{
 const p=annotation.polygon,xs=p.map(v=>v[0]),ys=p.map(v=>v[1]),left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top;
 let best:UltrasoundPoint|null=null,clearance=0;
 for(let row=0;row<17;row++)for(let col=0;col<17;col++){
  const point:UltrasoundPoint=[left+(col+.5)*width/17,top+(row+.5)*height/17];if(!contains(p,point))continue;
  let distance=Infinity;for(let i=0;i<p.length;i++){
   const a=p[i],b=p[(i+1)%p.length],dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
   const fraction=length?Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/length)):0;
   distance=Math.min(distance,(point[0]-a[0]-fraction*dx)**2+(point[1]-a[1]-fraction*dy)**2);
  }
  if(distance>clearance){clearance=distance;best=point;}
 }
 return best?Object.freeze(best):null;
}
/** Normalized image pixels only; clamp the complete window to image bounds. */
export function ultrasoundViewWindow(zoom:number,center:UltrasoundPoint,bounds:UltrasoundViewport=fullImage){
 if(!Number.isFinite(zoom)||zoom<1||zoom>4||!Number.isFinite(center[0])||!Number.isFinite(center[1])||!validViewport(bounds))return fail('The image view is invalid.');
 // Pan is normalized within the panel; returned geometry is always in the
 // original image coordinates, preserving the existing annotation identity.
 const width=bounds.width/zoom,height=bounds.height/zoom;
 const x=bounds.x+Math.max(0,Math.min(bounds.width-width,center[0]*bounds.width-width/2));
 const y=bounds.y+Math.max(0,Math.min(bounds.height-height,center[1]*bounds.height-height/2));
 return {x,y,width,height};
}
/** Display pixels only: the same xMidYMid/meet transform as the image SVG.
 * Hidden image anchors have no callout; this does not change polygon picking. */
export function projectUltrasoundPoint(point:UltrasoundPoint,image:{width:number;height:number},viewport:{width:number;height:number},zoom:number,center:UltrasoundPoint,bounds:UltrasoundViewport=fullImage):{x:number;y:number}|null{
 if(!Array.isArray(point)||point.length!==2||!point.every(v=>Number.isFinite(v)&&v>=0&&v<=1)||
  !image||!viewport||![image.width,image.height,viewport.width,viewport.height].every(v=>Number.isFinite(v)&&v>0)||
  !Number.isFinite(zoom)||zoom<1||zoom>4||!Array.isArray(center)||center.length!==2||!center.every(Number.isFinite)||!validViewport(bounds))return null;
 const window=ultrasoundViewWindow(zoom,center,bounds);
 if(point[0]<window.x||point[0]>window.x+window.width||point[1]<window.y||point[1]>window.y+window.height)return null;
 const width=window.width*image.width,height=window.height*image.height;
 const scale=Math.min(viewport.width/width,viewport.height/height);
 const x=(viewport.width-width*scale)/2+(point[0]-window.x)*image.width*scale;
 const y=(viewport.height-height*scale)/2+(point[1]-window.y)*image.height*scale;
 return scale>0&&[x,y].every(Number.isFinite)?{x,y}:null;
}
export type UltrasoundAnswer='correct'|'incorrect'|'outside'|'ambiguous'|'unavailable';
export function ultrasoundQuizAnswer(frame:UltrasoundFrame,targetId:string,x:number,y:number):UltrasoundAnswer{
 if(!frame.annotations.some(a=>a.id===targetId))return 'unavailable';const pick=pickUltrasoundAnnotation(frame,x,y);
 return pick.kind==='ambiguous'?'ambiguous':pick.kind==='miss'?'outside':pick.annotation.id===targetId?'correct':'incorrect';
}
/** Author-declared semantic comparison, recomputed against the existing source
 * registry. It never infers image laterality, registration, access or approval. */
export function ultrasoundAtlasLink(study:UltrasoundStudy,annotation:UltrasoundAnnotation){
 if(!study.frames.some(frame=>frame.annotations.includes(annotation))||!annotation.atlasReference)return null;
 const link=resolveLectureBodyReference(annotation.atlasReference);const region=study.region==='shoulder'?'shoulder-arm':study.region==='knee'?'leg':study.region==='ankle-foot'?'foot':study.region;
 return link&&link.region===region?link:null;
}
