import {HEAD_LINK_REVISION,headConceptById,type HeadModality} from './head-atlas-links.ts';

// Shared factual wording, explicit paired identities/exercises; no side-specific
// functional dominance or cross-subject coordinate equivalence is implied.
const deepGreyNotes=(['left','right'] as const).flatMap(side=>[
  {conceptId:`deep-${side}-caudate`,group:'deepGrey' as const,anatomy:{text:'The caudate curves beside the lateral ventricle. Its head lies medial to the anterior limb of the internal capsule.',sources:['ut-basal-ganglia','ut-internal-capsule']},function:{text:'Together with the putamen it forms the striatum, an input region of basal ganglia circuits involved in modulating movement.',sources:['ut-basal-ganglia']},task:`Confirm the patient’s ${side} side using native orientation markers. Follow the saved caudate outline beside the lateral ventricle; distinguish the visible saved extent from an inferred full head, body and tail.`},
  {conceptId:`deep-${side}-putamen`,group:'deepGrey' as const,anatomy:{text:'The putamen and globus pallidus form the lentiform nucleus. The anterior internal capsule separates this group from the caudate head.',sources:['ut-pallidum','ut-internal-capsule']},function:{text:'As part of the striatum, the putamen receives cortical input, including motor and somatosensory input.',sources:['ut-basal-ganglia']},task:`Verify the patient’s ${side} side with native orientation markers. Compare the saved putamen and caudate outlines on one native slice, then change plane. Do not mistake a grouped lentiform label for either component alone.`},
  {conceptId:`deep-${side}-globus-pallidus`,group:'deepGrey' as const,anatomy:{text:'The globus pallidus is the pallidal component of the lentiform nucleus and has internal and external segments.',sources:['ut-pallidum']},function:{text:'The internal pallidal segment is a major basal ganglia output structure with inhibitory projections to the thalamus. The two segments are not interchangeable functional labels.',sources:['ut-basal-ganglia']},task:`Use native orientation markers to confirm the patient’s ${side} side. Compare this saved pallidal outline with the adjacent putamen. The whole-structure label does not separately identify internal and external pallidal segments.`},
  {conceptId:`deep-${side}-thalamus`,group:'deepGrey' as const,anatomy:{text:'The thalamus lies beside the third ventricle, medial to the posterior limb of the internal capsule.',sources:['ut-ventricles','ut-internal-capsule']},function:{text:'Different thalamic nuclei participate in sensory, motor and limbic connections with the cortex. This whole-structure mask does not separate those nuclei.',sources:['ut-thalamic-nuclei']},task:`Confirm the patient’s ${side} side with native orientation markers. Compare the saved thalamic outline with the third ventricle and the opposite thalamus in axial and coronal views. Do not infer individual nuclear boundaries or assume symmetry.`},
]);

const cerebralNotes=(['left','right'] as const).flatMap(side=>[
  {conceptId:`cortex-${side}-frontal-lobe`,group:'cerebral' as const,anatomy:{text:`The ${side} frontal lobe lies anterior to the central sulcus.`,sources:['duke-cortical-landmarks']},function:{text:'Frontal motor and prefrontal networks contribute to movement and planning; the whole lobe is not one functional unit.',sources:['ut-cerebral-overview']},task:`Confirm the patient’s ${side} side using native orientation markers. Compare the saved frontal outline with the central sulcus only where that landmark is resolved; inspect another plane with the overlay hidden.`},
  {conceptId:`cortex-${side}-parietal-lobe`,group:'cerebral' as const,anatomy:{text:`The ${side} parietal lobe lies posterior to the central sulcus.`,sources:['duke-cortical-landmarks']},function:{text:'Postcentral cortex receives somatic sensory input; parietal association networks integrate information.',sources:['ut-cerebral-overview']},task:`Confirm the patient’s ${side} side using native orientation markers. Compare the saved parietal and frontal regions across the central sulcus where visible. A saved regional edge is not a validated functional boundary.`},
  {conceptId:`cortex-${side}-temporal-lobe`,group:'cerebral' as const,anatomy:{text:`The ${side} temporal lobe lies below the lateral sulcus.`,sources:['ut-cerebral-overview']},function:{text:'Temporal networks contribute to auditory and visual processing; medial temporal networks support learning and memory.',sources:['ut-cerebral-overview']},task:`Confirm the patient’s ${side} side using native orientation markers. Follow the saved temporal region in more than one plane, showing and hiding its overlay. Distinguish the whole-lobe label from the separate hippocampal target.`},
  {conceptId:`cortex-${side}-occipital-lobe`,group:'cerebral' as const,anatomy:{text:`The ${side} occipital lobe occupies the posterior hemisphere; lateral lobar divisions include conventional boundaries.`,sources:['duke-cortical-landmarks']},function:{text:'Occipital cortex includes primary and higher-order visual processing regions, not a single undifferentiated visual centre.',sources:['ut-cerebral-overview']},task:`Confirm the patient’s ${side} side using native orientation markers. Inspect the saved posterior region with and without its overlay in two planes. Do not infer a visual-field map or vascular territory from this lobe mask.`},
  {conceptId:`limbic-${side}-hippocampus`,group:'hippocampus' as const,anatomy:{text:`The ${side} hippocampus lies in the medial temporal lobe, along the floor of the temporal horn.`,sources:['ut-hippocampal-anatomy']},function:{text:'It helps form new memories for facts and events within a distributed memory network; it is not the storage site for every memory.',sources:['ut-memory']},task:`Confirm the patient’s ${side} side using native orientation markers. Compare the saved hippocampal extent with the temporal horn where resolved in the native image, then change plane. Do not infer internal subfields or normality from this outline.`},
]);

/** Original factual summaries, not imported article text, figures or segmentation. */
export const headTeachingContent = {
  schema:'vm-head-teaching-3',
  headRevision:'0f91f6097e378465827c89a4a10c6ca32ae1bdc276dfbb9c6714527e4f3530c5',
  status:'draft',
  reviewedAt:null,
  sources:[
    {id:'ut-overview',title:'UTHealth · Brainstem overview',url:'https://oac22.hsc.uth.tmc.edu/courses/neuroanatomy/L02P30.html',accessed:'2026-10-08',reuse:'Factual reference only. All rights reserved; no text or images imported.'},
    {id:'ut-midbrain',title:'UTHealth · Midbrain sections',url:'https://oac22.hsc.uth.tmc.edu/courses/neuroanatomy/L02P31.html',accessed:'2026-10-08',reuse:'Factual reference only. All rights reserved; no text or images imported.'},
    {id:'ut-pons',title:'UTHealth · Pons and cerebellum',url:'https://oac22.hsc.uth.tmc.edu/courses/neuroanatomy/L02P32.html',accessed:'2026-10-08',reuse:'Factual reference only. All rights reserved; no text or images imported.'},
    {id:'ut-medulla',title:'UTHealth · Medulla',url:'https://oac22.hsc.uth.tmc.edu/courses/neuroanatomy/L02P33.html',accessed:'2026-10-08',reuse:'Factual reference only. All rights reserved; no text or images imported.'},
    {id:'ostman-2020',title:'Ostman et al. (2020) · Posterior fossa CT study',url:'https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2020.588064/full',accessed:'2026-10-08',reuse:'CC BY, original publication credited. Factual paraphrase only; no figures, images or patient data imported.'},
    {id:'ut-ventricles',title:'UTHealth · Ventricles and CSF spaces',url:'https://nba.uth.tmc.edu/neuroanatomy/l4/Lab04p01_index.html',accessed:'2026-10-08',reuse:'Factual reference only. No reuse permission assumed; no text or images imported.'},
    {id:'bakshi-2000',title:'Bakshi et al. (2000) · Ventricular CSF artifact on fast FLAIR',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8174962/',accessed:'2026-10-08',reuse:'Copyright American Society of Neuroradiology. Factual reference only; no text or images imported.'},
    {id:'ut-basal-ganglia',title:'UTHealth · Basal ganglia anatomy and connections',url:'https://nba.uth.tmc.edu/neuroscience/s3/chapter04.html',accessed:'2026-10-08',reuse:'Factual reference only. No reuse permission assumed; no text or images imported.'},
    {id:'ut-internal-capsule',title:'UTHealth · Internal capsule relationships',url:'https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p01_index.html',accessed:'2026-10-08',reuse:'Factual reference only. No reuse permission assumed; no text or images imported.'},
    {id:'ut-pallidum',title:'UTHealth · Globus pallidus and putamen',url:'https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p11_index.html',accessed:'2026-10-08',reuse:'Factual reference only. No reuse permission assumed; no text or images imported.'},
    {id:'ut-thalamic-nuclei',title:'UTHealth · Thalamic connections and gross-slice limits',url:'https://nba.uth.tmc.edu/neuroanatomy/L5/Lab05p10_index.html',accessed:'2026-10-08',reuse:'Factual reference only. No reuse permission assumed; no text or images imported.'},
    {id:'ut-cerebral-overview',title:'UTHealth · Cerebral hemispheres and cortical organization',url:'https://nba.uth.tmc.edu/neuroscience/s2/chapter01.html',accessed:'2026-10-08',reuse:'Factual reference only. No reuse permission assumed; no text or images imported.'},
    {id:'duke-cortical-landmarks',title:'Duke · Surface anatomy and lobar boundary conventions',url:'https://brain.oit.duke.edu/lab01/lab01.html',accessed:'2026-10-08',reuse:'Factual reference only. No reuse permission assumed; no text or images imported.'},
    {id:'ut-hippocampal-anatomy',title:'UTHealth · Hippocampal formation relationships',url:'https://nba.uth.tmc.edu/neuroanatomy/L11/Lab11p05_index.html',accessed:'2026-10-08',reuse:'Factual reference only. No reuse permission assumed; no text or images imported.'},
    {id:'ut-memory',title:'UTHealth · Learning and memory',url:'https://nba.uth.tmc.edu/neuroscience/s4/chapter07.html',accessed:'2026-10-08',reuse:'Factual reference only. No reuse permission assumed; no text or images imported.'},
  ],
  groups:{
    brainstem:{
      imaging:{
        CT:{text:'Skull-base beam hardening can obscure posterior fossa detail on CT. A clear-looking regional outline does not establish that the underlying tissue is normal.',sources:['ostman-2020']},
        MRI:{text:'Check the actual sequence and native plane before interpreting signal. These regional masks do not demonstrate individual nuclei or fibre tracts, and this atlas is not a diagnostic assessment.',sources:[]},
      },
      scope:'Teaching draft · not clinically signed off. Brainstem masks cover regional portions only, not the complete structure or its internal nuclei, tracts and vascular territories. CT, MRI and the generic 3D Atlas are separate, unregistered subjects.',
    },
    ventricles:{
      imaging:{
        CT:{text:'Compare the saved ventricular outline with the native CT in more than one plane, with the overlay both shown and hidden. Do not infer communication or obstruction from the mask alone.',sources:[]},
        MRI:{text:'Check the actual sequence and native plane before interpreting CSF signal. Fast FLAIR can show ventricular CSF pulsation artifact; a coloured overlay cannot establish whether the underlying signal is normal.',sources:['bakshi-2000']},
      },
      scope:'Teaching draft · not clinically signed off. These static masks represent CSF spaces, not measured CSF flow, pressure or pathway patency. CT, MRI and the generic 3D Atlas are separate, unregistered subjects; matching labels do not establish spatial correspondence.',
    },
    deepGrey:{
      imaging:{
        CT:{text:'Compare the saved outline with the native CT in more than one plane, with the overlay shown and hidden. A coloured boundary does not establish tissue normality or certify the complete anatomical extent.',sources:[]},
        MRI:{text:'Check the actual sequence and native plane before interpreting signal. Compare the native image with the overlay hidden; the saved label does not establish normal tissue, individual nuclear boundaries or tract connections.',sources:[]},
      },
      scope:'Teaching draft · not clinically signed off. These whole-structure labels do not delineate individual thalamic nuclei, pallidal segments or white-matter pathways, and do not measure function. CT, MRI and the generic 3D Atlas are separate, unregistered subjects; comparisons are semantic, not patient-space synchronization.',
    },
    cerebral:{
      imaging:{
        CT:{text:'Compare the saved regional outline with native CT in more than one plane, with the overlay shown and hidden. Use only landmarks resolved on the actual image; the outline does not certify full lobar extent or tissue normality.',sources:[]},
        MRI:{text:'Check the actual sequence and native plane, then inspect the MRI with the overlay hidden. A regional lobe label does not establish signal normality, functional organization or a vascular territory.',sources:[]},
      },
      scope:'Teaching draft · not clinically signed off. These saved regional masks are not validated functional maps or vascular territories, and do not certify full lobar extent or patient-specific functional boundaries. CT, MRI and the generic 3D Atlas are separate, unregistered subjects; matching names do not establish patient-space synchronization.',
    },
    hippocampus:{
      imaging:{
        CT:{text:'Inspect native CT with the overlay hidden before comparing the saved hippocampal outline. Do not infer fine internal detail, complete anatomical extent or tissue normality from a coloured mask.',sources:[]},
        MRI:{text:'Check the actual sequence and native plane, and compare the MRI with the overlay hidden. This saved label does not delineate hippocampal subfields or provide a diagnostic assessment of underlying signal.',sources:[]},
      },
      scope:'Teaching draft · not clinically signed off. The saved hippocampal extent does not identify internal subfields, certify the complete hippocampal formation or measure memory function. CT, MRI and the generic 3D Atlas are separate, unregistered subjects; comparisons are semantic, not spatial registration.',
    },
  },
  notes:[
    {conceptId:'brainstem-midbrain',group:'brainstem',anatomy:{text:'The midbrain is the rostral brainstem, adjoining the diencephalon. Its cerebral peduncles lie ventrally; the colliculi lie behind the cerebral aqueduct.',sources:['ut-overview','ut-midbrain']},function:{text:'Ascending and descending pathways pass through it; the surrounding brainstem contains cranial-nerve nuclei. These internal components are not separate targets in this regional mask.',sources:['ut-overview']},task:'In sagittal view, follow the selected region towards the pons. In axial view, describe ventral versus dorsal relationships without assuming every landmark is resolved.'},
    {conceptId:'brainstem-pons',group:'brainstem',anatomy:{text:'The dorsal pons contributes to the floor of the fourth ventricle. Its ventral midline groove accommodates the basilar artery; pontocerebellar fibres pass into the middle cerebellar peduncles.',sources:['ut-pons']},function:{text:'Pontine nuclei relay cortical input towards the cerebellum, contributing to motor coordination. The tegmentum also contains cranial-nerve nuclei and longitudinal pathways.',sources:['ut-pons']},task:'Follow the pontine region between the midbrain and medulla, then look for the fourth ventricular space dorsally. Distinguish a relationship from a separately labelled structure.'},
    {conceptId:'brainstem-medulla',group:'brainstem',anatomy:{text:'The medulla is the caudal brainstem, continuous with the spinal cord. Its pyramids are ventral landmarks; the inferior olivary complex is another identifying feature.',sources:['ut-overview','ut-medulla']},function:{text:'Descending corticospinal fibres form compact pyramidal bundles here. A whole-region teaching label does not delineate these pathways individually.',sources:['ut-medulla']},task:'Trace the selected regional portion caudally in sagittal view. Note where the saved mask ends: that edge is not proof of the full anatomical boundary.'},
    {conceptId:'ventricle-left-lateral',group:'ventricles',anatomy:{text:'The left lateral ventricle is a CSF space in the left cerebral hemisphere, with frontal, temporal and occipital horns, a body and an atrium.',sources:['ut-ventricles']},function:{text:'It communicates with the third ventricle through the left interventricular foramen.',sources:['ut-ventricles']},task:'Use the native orientation markers to confirm the patient’s left side; screen-left is not a reliable substitute. Follow the saved outline through adjacent slices and compare its shape with the right lateral ventricle, without assuming symmetry.'},
    {conceptId:'ventricle-right-lateral',group:'ventricles',anatomy:{text:'The right lateral ventricle is the ventricular CSF space within the right cerebral hemisphere.',sources:['ut-ventricles']},function:{text:'Its interventricular foramen provides a connection to the third ventricle, as on the left.',sources:['ut-ventricles']},task:'Confirm the patient’s right side from the native orientation markers. Compare the saved right and left outlines at the same native slice level; their shared names do not establish matching coordinates in another subject.'},
    {conceptId:'ventricle-third',group:'ventricles',anatomy:{text:'The third ventricle is a midline diencephalic cavity; the thalami and hypothalamus form its lateral walls.',sources:['ut-ventricles']},function:{text:'It receives the lateral ventricular connections and communicates with the fourth ventricle through the cerebral aqueduct in the midbrain.',sources:['ut-ventricles']},task:'Locate the saved third ventricular outline in axial and sagittal views. Describe its midline position relative to the thalami; do not assume the narrow connecting foramina or aqueduct are resolved or separately segmented.'},
    {conceptId:'ventricle-fourth',group:'ventricles',anatomy:{text:'The fourth ventricle lies dorsal to the pons and medulla, with the cerebellum above and behind it.',sources:['ut-ventricles']},function:{text:'Its median and paired lateral apertures connect ventricular CSF with the subarachnoid space.',sources:['ut-ventricles']},task:'In sagittal view, compare the saved outline with the brainstem and cerebellum. Then inspect an axial slice. Identify the cavity, not a visible flow direction: neither these static masks nor the generic 3D model measure CSF movement.'},
    ...deepGreyNotes,
    ...cerebralNotes,
  ],
  reviewChecks:[
    'Check every factual sentence and cited reference; amend wording or level of detail where needed.',
    'Check each CT/MRI regional extent against the accepted source, without moving accepted boundaries in this website task.',
    'Check the matching existing 3D target and family-specific limits: partial brainstem tissue, static CSF spaces, deep-grey labels without separate nuclei/segments, regional lobes without functional maps, and hippocampus without subfields; always unregistered subjects.',
    'Check each exercise on the actual native image and sequence, including orientation, landmark visibility, regional extent and sequence/artifact caveats; no implied flow, pathway-patency or functional assessment.',
    'Record any future sign-off against this exact packet revision; content, mapping or source changes require fresh review.',
  ],
} as const;

/** Hash covers original notes, references, limitations and all exact CT/MRI/3D bindings. */
export const HEAD_TEACHING_REVISION='2d6f59ea907384c10eccad3ebb1367e3118be6fe9c6dec61262e9c43bfcda77a';
export function headTeachingPacket(){
  return {content:headTeachingContent,bindings:headTeachingContent.notes.map(note=>headConceptById(note.conceptId))};
}
export function headTeachingForConcept(conceptId:string,modality:HeadModality,revision:string=HEAD_LINK_REVISION){
  if(revision!==HEAD_LINK_REVISION||revision!==headTeachingContent.headRevision||(modality!=='CT'&&modality!=='MRI'))return null;
  const note=headTeachingContent.notes.find(item=>item.conceptId===conceptId),concept=headConceptById(conceptId);
  if(!note||!concept)return null;
  const group=headTeachingContent.groups[note.group],imaging=group.imaging[modality];
  const ids=new Set<string>([...note.anatomy.sources,...note.function.sources,...imaging.sources]);
  return {note,concept,imaging,sources:headTeachingContent.sources.filter(source=>ids.has(source.id)),scope:group.scope,revision:HEAD_TEACHING_REVISION};
}

/** Common facts only for the exact linked reference focus; never scan exercises or signal guidance. */
export function headTeachingForReference(conceptId:string,revision:string){
  if(revision!==HEAD_LINK_REVISION||revision!==headTeachingContent.headRevision)return null;
  const note=headTeachingContent.notes.find(item=>item.conceptId===conceptId),concept=headConceptById(conceptId);
  if(!note||!concept)return null;
  const ids=new Set<string>([...note.anatomy.sources,...note.function.sources]);
  return {concept,anatomy:note.anatomy,function:note.function,
    sources:headTeachingContent.sources.filter(source=>ids.has(source.id)),
    scope:headTeachingContent.groups[note.group].scope,revision:HEAD_TEACHING_REVISION};
}
