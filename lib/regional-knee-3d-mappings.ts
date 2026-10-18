/** Authored semantic drafts, not acquired-image geometry, correspondence or approval. */
export type KneeReferenceSpec={anatomyId:string;kind:'body'|'specimen';slug:string;region:'leg'|'thigh'|'knee';
 category?:'bone'|'muscle'|'vessel';idRegion?:'leg'|'thigh';relation:'same-structure'|'parent-reference'|'group-reference'};
const body=(concept:string,slug:string,category:KneeReferenceSpec['category'],region:'leg'|'thigh',relation:KneeReferenceSpec['relation']='same-structure',idRegion=region):KneeReferenceSpec=>
 ({anatomyId:'anat.knee.'+concept,kind:'body',slug,category,region,idRegion,relation});
const specimen=(concept:string,slug:string,relation:KneeReferenceSpec['relation']='same-structure'):KneeReferenceSpec=>
 ({anatomyId:'anat.knee.'+concept,kind:'specimen',slug,region:'knee',relation});
export const kneeReferenceSpecs:readonly KneeReferenceSpec[]=[
 ...['distal_femur','femoral_trochlea','lateral_femoral_condyle','medial_femoral_condyle'].map(c=>body('bne.'+c,'femur','bone','leg','parent-reference','thigh')),
 ...['proximal_tibia','lateral_tibial_plateau','medial_tibial_plateau','tibial_tuberosity'].map(c=>body('bne.'+c,'tibia','bone','leg','parent-reference')),
 ...['proximal_fibula','fibular_head'].map(c=>body('bne.'+c,'fibula','bone','leg','parent-reference')),
 body('bne.patella','patella','bone','leg'),
 ...['patellar_lateral_facet','patellar_medial_facet'].map(c=>body('bne.'+c,'patella','bone','leg','parent-reference')),
 body('msk.popliteus_muscle','popliteus','muscle','leg'),body('msk.soleus_muscle','soleus','muscle','leg'),
 body('msk.vastus_lateralis','vastus-lateralis','muscle','thigh'),body('msk.vastus_medialis','vastus-medialis','muscle','thigh'),
 body('nvs.popliteal_artery','popliteal-artery','vessel','leg'),body('nvs.popliteal_vein','popliteal-vein','vessel','leg'),
 ...['medial','lateral'].map(side=>body(`msk.${side}_gastrocnemius_muscle`,`${side}-head-of-SIDE-gastrocnemius`,'muscle','leg')),
 specimen('lig.anterior_cruciate_ligament','acl'),specimen('lig.posterior_cruciate_ligament','pcl'),
 specimen('lig.medial_collateral_ligament','mcl'),specimen('lig.lateral_collateral_ligament','lcl'),
 specimen('tdn.quadriceps_tendon','quadriceps-tendon'),specimen('crt.patellar_cartilage','patellar-cartilage'),
 ...['medial','lateral'].flatMap(side=>['meniscus','meniscus_anterior_horn','meniscus_posterior_horn','meniscus_body','meniscus_anterior_root','meniscus_posterior_root']
  .map(c=>specimen(`men.${side}_${c}`,'meniscus-group','group-reference'))),
 ...['medial_femoral_cartilage','lateral_femoral_cartilage'].map(c=>specimen('crt.'+c,'femoral-cartilage','group-reference')),
 ...['medial_tibial_cartilage','lateral_tibial_cartilage'].map(c=>specimen('crt.'+c,'tibial-cartilage','group-reference')),
];
export function kneeBodyReferenceId(spec:KneeReferenceSpec,side:'left'|'right'){
 if(spec.kind!=='body')return null;
 const slug=spec.slug.includes('SIDE')?spec.slug.replace('SIDE',side):side+'-'+spec.slug;
 return `vm:anatomy:body:${spec.idRegion}:${side}:${spec.category}:${slug}`;
}
// Compact reviewed reference pins only, never MRI data. Tests bind these to the
// current canonical catalogues; a changed source must be deliberately remapped.
export function kneeReferencePin(spec:KneeReferenceSpec,side:'left'|'right'){
 const bodyPins:Record<string,string>={
  femur:'27bd799bd85387beea9fab40cbe2f83a5e780983170db4dfd1d2e0eda8fd2b59',
  skeleton:'8885078bc114d8cf5c2ebd12f393761965b2016bf6f5fc196c83549527e2c0af',
  muscle:'c535a021142b325daebfd0a8bca2b0406f05fae820870d524dc0a6993d3eb72d',
  thigh:'f39c954742853c7e583570779b70a9f3ef844d9061055b083adb9912732c235c',
  gastrocnemius:'3f6f533850ecd3017a742f140e7779a901dda238eaaac42b6bf6eb9b3d2347b1',
  vessel:'e2751d62cf20f86ec14865a79bad26e70245443965702d98512541378851e466',
 };
 if(spec.kind==='body'){
  const group=spec.slug==='femur'?'femur':spec.category==='bone'?'skeleton':spec.category==='vessel'?'vessel':
   spec.slug.includes('gastrocnemius')?'gastrocnemius':spec.region==='thigh'?'thigh':'muscle';
  const label=spec.slug.includes('SIDE')?spec.slug.replace('SIDE',side).replaceAll('-',' ').replace(/^./,c=>c.toUpperCase()):
   `${side==='left'?'Left':'Right'} ${spec.slug.replaceAll('-',' ')}`;
  return {sourceHash:bodyPins[group],specimenRevision:null,label};
 }
 const labels:Record<string,string>={acl:'Anterior cruciate ligament',pcl:'Posterior cruciate ligament',mcl:'Medial collateral ligament',lcl:'Lateral collateral ligament',
  'quadriceps-tendon':'Quadriceps tendon','patellar-cartilage':'Patellar cartilage','meniscus-group':'Knee meniscus (source group)',
  'femoral-cartilage':'Distal femoral cartilage','tibial-cartilage':'Tibial cartilage (source group)'};
 return {sourceHash:'cf61571a8c80f463805b1362bb81b3d9eec3c62a1780c7288355e4a20fa8515b',
  specimenRevision:'33c5194dfa9493d9b0cb4db6d9623b8a1d8daba1d17cf7a486131a339d5287f3',label:labels[spec.slug]};
}
