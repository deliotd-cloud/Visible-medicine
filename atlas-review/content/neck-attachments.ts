/** Typical bony partners, not measured footprints, ligament reconstruction or motion. */
export const neckAttachmentReferences = {
  neck:{title:'UAMS · head and neck muscle anatomy',url:'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-head-and-neck/'},
  back:{title:'TTUHSC El Paso · back muscle anatomy',url:'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html'},
  cervical:{title:'Cervical muscle anatomy with MR cross-reference',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5972401/'},
  craniocervical:{title:'Craniovertebral junction · anatomical study',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5111321/'},
} as const;
// Midline bones are shared by both sides; paired bones retain explicit right/left IDs.
export const neckAttachmentBones = {
  occipital:['FMA52735'],
  c1:['FMA12519'],c2:['FMA12520'],c3:['FMA12521'],c4:['FMA12522'],c5:['FMA12523'],c6:['FMA12524'],
  t3:['FMA9209'],t4:['FMA9248'],t5:['FMA9922'],t6:['FMA9945'],
  scapula:['FMA13395','FMA13396'],
} as const;
export type NeckAttachmentBone=keyof typeof neckAttachmentBones;
type Endpoint={role:'proximal'|'distal';label:string;bones:readonly NeckAttachmentBone[];site:string};
type Relationship={key:string;fmas:readonly [string,string];endpoints:readonly Endpoint[];reference:keyof typeof neckAttachmentReferences;note:string};
const origin=(bones:readonly NeckAttachmentBone[],site:string):Endpoint=>({role:'proximal',label:'Origin · bony partners',bones,site});
const insertion=(bones:readonly NeckAttachmentBone[],site:string):Endpoint=>({role:'distal',label:'Insertion · bony partners',bones,site});
export const neckAttachments:readonly Relationship[]=[
  {key:'rectus-capitis-anterior',fmas:['FMA46313','FMA46314'],reference:'neck',
    endpoints:[origin(['c1'],'Anterior atlas lateral-mass region'),insertion(['occipital'],'Basilar occiput, anterior to the condyle')],
    note:'An anterior craniocervical muscle, not a posterior suboccipital-triangle border.'},
  {key:'rectus-capitis-lateralis',fmas:['FMA46317','FMA46318'],reference:'craniocervical',
    endpoints:[origin(['c1'],'Atlas transverse process'),insertion(['occipital'],'Occipital jugular process')],
    note:'The occipital jugular process is not the temporal mastoid process.'},
  {key:'rectus-capitis-posterior-major',fmas:['FMA32530','FMA32531'],reference:'back',
    endpoints:[origin(['c2'],'Axis spinous process'),insertion(['occipital'],'Lateral inferior-nuchal region')],
    note:'Starts on C2; do not substitute the C1 origin of the posterior minor muscle.'},
  {key:'rectus-capitis-posterior-minor',fmas:['FMA32532','FMA32533'],reference:'back',
    endpoints:[origin(['c1'],'Atlas posterior tubercle'),insertion(['occipital'],'Medial inferior-nuchal region')],
    note:'The atlas has a posterior tubercle, not a typical bifid spinous process.'},
  {key:'obliquus-capitis-superior',fmas:['FMA32534','FMA32535'],reference:'back',
    endpoints:[origin(['c1'],'Atlas transverse process'),insertion(['occipital'],'Occiput above the inferior nuchal line')],
    note:'Reaches the skull; the inferior oblique muscle does not.'},
  {key:'obliquus-capitis-inferior',fmas:['FMA32536','FMA32537'],reference:'back',
    endpoints:[origin(['c2'],'Axis spinous process'),insertion(['c1'],'Atlas transverse process')],
    note:'C2-to-C1 relationship only: the skull is not an attachment bone.'},
  {key:'longus-capitis',fmas:['FMA46309','FMA46310'],reference:'neck',
    endpoints:[origin(['c3','c4','c5','c6'],'Anterior tubercles of the C3–C6 transverse processes'),insertion(['occipital'],'Basilar occiput')],
    note:'Longus capitis reaches the skull. This does not map the separate longus colli.'},
  {key:'splenius-cervicis',fmas:['FMA22726','FMA22727'],reference:'cervical',
    endpoints:[origin(['t3','t4','t5','t6'],'Typical T3–T6 spinous-process attachments'),insertion(['c1','c2','c3'],'Upper cervical transverse processes, typically C1–C3')],
    note:'Typical regional teaching only; the donor slip endpoints are unverified. Do not transfer the mastoid insertion of splenius capitis.'},
  {key:'levator-scapulae',fmas:['FMA32540','FMA32541'],reference:'neck',
    endpoints:[origin(['c1','c2','c3','c4'],'C1–C4 transverse-process attachments'),insertion(['scapula'],'Medial scapular border between superior angle and scapular spine')],
    note:'Connects the neck to the scapula. Regional views may show only one end.'},
];
