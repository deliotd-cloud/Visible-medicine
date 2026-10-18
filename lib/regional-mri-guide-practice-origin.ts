import {assertRegionalMriPackageOwnership,type RegionalAnnotation,type RegionalLoadedAnnotation,
  type RegionalLoadedSeries,type RegionalMriPackage} from './regional-mri-package.ts';
import {regionalMriGuideAnnotation,type RegionalStudyGuide} from './regional-mri-guided-study.ts';

declare const originBrand:unique symbol;
/** Opaque local capability: no teaching captions, annotation identity or answer fields. */
export type RegionalMriGuidePracticeOrigin=Readonly<{[originBrand]:true}>;
type Source={revision:string;region:string};
type Snapshot=Readonly<{
  pkg:RegionalMriPackage;study:RegionalLoadedSeries;overlay:RegionalLoadedAnnotation;
  guide:RegionalStudyGuide;index:number;annotation:RegionalAnnotation;
  sourceRevision:string;region:string;identity:string;
}>;
const origins=new WeakMap<object,Snapshot>();

function identity(pkg:RegionalMriPackage,study:RegionalLoadedSeries,guide:RegionalStudyGuide,index:number,annotation:RegionalAnnotation){
  return JSON.stringify([pkg.revision,pkg.manifest.region,study.series.id,study.series.image,
    guide.id,guide.revision,guide.sourceRevision,guide.sequenceId,guide.imageSha256,index,guide.steps[index],annotation]);
}
function valid(source:Source,pkg:RegionalMriPackage,study:RegionalLoadedSeries,overlay:RegionalLoadedAnnotation,
  guide:RegionalStudyGuide,index:number):boolean{
  try{
    assertRegionalMriPackageOwnership(pkg,study,overlay);
    const annotation=overlay.annotation;
    return source.revision===pkg.revision&&source.region===pkg.manifest.region&&
      guide.sourceRevision===pkg.revision&&guide.sequenceId===study.series.id&&guide.imageSha256===study.series.image.sha256&&
      overlay.purpose==='scoped-display'&&annotation.review.status==='accepted-scoped'&&
      annotation.seriesId===study.series.id&&annotation.sourceImageSha256===study.series.image.sha256&&
      study.series.annotations.includes(annotation)&&regionalMriGuideAnnotation(pkg,study,guide,index,annotation.id)===annotation;
  }catch{return false;}
}

/** Capture only the explicitly selected annotation at an owned guide step. */
export function createRegionalMriGuidePracticeOrigin(source:Source,pkg:RegionalMriPackage,study:RegionalLoadedSeries,
  overlay:RegionalLoadedAnnotation,position:{guide:RegionalStudyGuide;index:number}|null):RegionalMriGuidePracticeOrigin|null{
  if(!position||!valid(source,pkg,study,overlay,position.guide,position.index))return null;
  const {guide,index}=position,annotation=overlay.annotation;
  const origin=Object.freeze({}) as RegionalMriGuidePracticeOrigin;
  origins.set(origin,Object.freeze({pkg,study,overlay,guide,index,annotation,
    sourceRevision:source.revision,region:source.region,identity:identity(pkg,study,guide,index,annotation)}));
  return origin;
}

/** Revalidation never chooses a replacement variant or loads geometry. */
export function resolveRegionalMriGuidePracticeOrigin(origin:unknown,source:Source,pkg:RegionalMriPackage,
  study:RegionalLoadedSeries,guides:readonly RegionalStudyGuide[]):{guide:RegionalStudyGuide;index:number;annotation:RegionalAnnotation}|null{
  if(!origin||typeof origin!=='object')return null;
  const saved=origins.get(origin);
  if(!saved||saved.pkg!==pkg||saved.study!==study||source.revision!==saved.sourceRevision||source.region!==saved.region||
    !guides.includes(saved.guide)||!valid(source,pkg,study,saved.overlay,saved.guide,saved.index)||
    saved.overlay.annotation!==saved.annotation||identity(pkg,study,saved.guide,saved.index,saved.annotation)!==saved.identity)return null;
  return Object.freeze({guide:saved.guide,index:saved.index,annotation:saved.annotation});
}
