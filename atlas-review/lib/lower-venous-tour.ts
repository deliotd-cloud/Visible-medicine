import type {RegionalTour} from './regional-tours';

const veins=[
  ['small','vm:anatomy:body:leg:right:vessel:right-small-saphenous-vein','leg-vessels-recovery'],
  ['popliteal','vm:anatomy:body:leg:right:vessel:right-popliteal-vein','leg-vessels-recovery'],
  ['femoral','vm:anatomy:body:thigh:right:vessel:right-femoral-vein','thigh-vessels-recovery'],
  ['great','vm:anatomy:body:thigh:right:vessel:right-great-saphenous-vein','thigh-vessels-recovery'],
  ['external','vm:anatomy:body:pelvis:right:vessel:right-external-iliac-vein','pelvis-vessels-recovery'],
  ['common','vm:anatomy:body:pelvis:right:vessel:right-common-iliac-vein','pelvis-vessels-recovery'],
] as const;
type Vein=typeof veins[number][0];
const id=(name:Vein)=>veins.find(v=>v[0]===name)![1];
const posterior='https://anatomy.ttuhscep.edu/musculoskeletal_system/gluteal_tables.html';
const thigh='https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh_tables.html';
const venous='https://med.stanford.edu/content/dam/sm/vascular/documents/endovasc/guidelines/hemodynamics_and_diagnosis_venous_disease-jvs_1207.pdf';
const stop=(name:Vein,title:string,view:RegionalTour['steps'][number]['view'],frame:Vein[],caption:string,references:string[]):RegionalTour['steps'][number]=>({
  id:name,title,selectedId:id(name),view,frameIds:frame.map(id),caption,references,durationMs:14000,fadeOthers:true,
});
export const lowerVenousTour:RegionalTour={
  id:'right-lower-limb-venous-orientation',title:'Right lower limb: superficial & deep veins',region:'whole-body',
  revision:'right-lower-limb-venous-orientation-v1',status:'draft',contextIds:[],
  // Exact union of existing regional memberships, not added abdominal/foot anatomy.
  scopeRegions:['pelvis','abdomen','thigh','leg','foot'],
  requiredDisplayBundles:Object.fromEntries(veins.map(([,target,bundle])=>[target,bundle])),
  description:'Six source-bound stops compare selected superficial and deep right-sided veins, from posterior leg to pelvic outflow. Fading preserves their assembled positions.',
  limitations:'Selected exterior segments only, not a continuous lumen or complete venous network. Calf deep veins, perforators, valves and the common-femoral junction are not independently delineated here. Source extents and apparent junctions require anatomical review; small-saphenous termination varies. Blue denotes veins, not oxygenation. Fading is not tissue dissection; camera windows can leave context outside view without removing or moving it. No patency, flow, reflux, compressibility, thrombus diagnosis, diagnostic protocol, procedural route, acquired images, patient registration or clinical approval. Right side only; no mirrored counterpart. References support anatomical orientation, not current management guidance. Draft pending revision-bound radiologist sign-off.',
  steps:[
    stop('small','Small saphenous vein · Superficial posterior leg','posterior',['small','popliteal'],
      'Begin with the small saphenous surface. This superficial posterior-leg vein commonly joins the popliteal vein, but termination varies; the selected meshes do not prove a junction.',[posterior,venous]),
    stop('popliteal','Popliteal vein · Deep knee region','posterior',['popliteal','small'],
      'Compare the deep popliteal segment with the superficial small saphenous surface. The calf deep veins and their confluence are outside this sequence.',[posterior]),
    stop('femoral','Femoral vein · Deep thigh','anterior',['femoral','external'],
      'Move up the thigh to the femoral vein. It belongs to the deep venous system; the older name "superficial femoral vein" is misleading.',[venous]),
    stop('great','Great saphenous vein · Superficial medial limb','anterior',['great','femoral'],
      'Compare the great saphenous surface with the deep femoral vein. Their usual proximal connection is not an independently delineated junction in this model.',[thigh,venous]),
    stop('external','External iliac vein · Pelvic outflow','anterior',['external','common'],
      'Shift to the separate external iliac surface. It participates in pelvic venous outflow; these static segments do not demonstrate a continuous passage from the femoral vein.',[venous]),
    stop('common','Common iliac vein · Proximal comparison','right',['common','external'],
      'Finish on the right common iliac segment. Compare it with the external iliac surface; internal iliac tributaries and the vena cava are outside this focused sequence.',[venous]),
  ],
};
