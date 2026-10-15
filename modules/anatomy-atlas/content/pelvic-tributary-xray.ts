// Original teaching text. Linked sources are evidence, not reusable image assets.
const pelvicVenography='https://www.frontiersin.org/journals/cardiovascular-medicine/articles/10.3389/fcvm.2021.751178/full';
const branchStudy='https://pubmed.ncbi.nlm.nih.gov/37496569/';
const iliolumbarStudy='https://pubmed.ncbi.nlm.nih.gov/17373712/';
const lateralSacralStudy='https://pubmed.ncbi.nlm.nih.gov/139676/';
const pelvicVeinTable='https://anatomy.ttuhscep.edu/anatomytables/veins_pelvis_perineum.html';

export const pelvicTributaryXrayTopics={
  iliolumbar:{
    title:'Iliolumbar vein: contrast X-ray orientation',
    body:'Compare the separately selected left and right iliolumbar surfaces beside the common iliac context. In an acquired contrast venogram, follow only the column that actually fills; the lumbar-to-iliac receiving pattern varies and a projected crossing does not establish a junction.',
    bullets:[
      'A combined cadaver and in-vivo venogram study described variable drainage into common, external or internal iliac veins. Its observations cannot identify the termination of either atlas mesh.',
      'These surfaces do not establish a continuous lumen, valve, flow direction or patency. Routine non-contrast pelvic radiographs are not evidence that a normal iliolumbar vein is visible.',
    ],
    citations:[iliolumbarStudy],
  },
  'inferior-gluteal':{
    title:'Inferior gluteal vein: contrast X-ray orientation',
    body:'Compare the left and right inferior gluteal selections with their respective internal iliac context. On a contrast venogram, name a gluteal channel only where the acquired sequence actually opacifies it; the projection and the selected surfaces do not show its whole gluteal drainage territory.',
    bullets:[
      'A surgical-video and CT-based study of 60 half-pelvises found heterogeneous relationships among inferior gluteal, internal pudendal and internal iliac veins. Do not assign its common branch pattern to either donor side.',
      'A venography treatment cohort recorded inferior gluteal tributaries in selected symptomatic women. It does not establish normal plain-film visibility, diagnostic performance or a route through these meshes.',
    ],
    citations:[branchStudy,pelvicVenography],
  },
  obturator:{
    title:'Obturator vein: contrast X-ray orientation',
    body:'Use the paired obturator selections to orient the lateral pelvic wall beside each hip bone. If contrast outlines an obturator channel on an acquired venogram, check its side and demonstrated course; overlap with another projected vessel is not proof of an anastomosis or depth.',
    bullets:[
      'The CT-and-surgical-video branch study found more than one obturator venous receiving pattern. The paired atlas surfaces do not resolve a specific receiving junction or reconstruct the obturator canal.',
      'A selected pelvic venography cohort reported obturator tributaries, but its symptomatic female population does not establish routine radiographic visibility or a diagnostic threshold for this donor.',
    ],
    citations:[branchStudy,pelvicVenography],
  },
  'superior-gluteal':{
    title:'Superior gluteal vein: contrast X-ray orientation',
    body:'The left and right superior gluteal selections are short source surfaces. Use them only as local orientation beside the internal iliac context. An acquired contrast projection may outline more, less or different anatomy; the mesh endpoint is not a venographic endpoint.',
    bullets:[
      'A 60-half-pelvis CT-and-surgical-video study documented variable superior gluteal venous branch patterns. Neither an expected junction nor the full gluteal drainage field can be read from these short meshes.',
      'A symptomatic venography cohort included superior gluteal tributaries, without testing visibility of normal veins on plain pelvic radiographs or validating this source geometry.',
    ],
    citations:[branchStudy,pelvicVenography],
  },
  'internal-pudendal':{
    title:'Right internal pudendal vein: contrast X-ray orientation',
    body:'Only the right internal pudendal vein is selected. The university anatomy table places this venous family in perineal drainage and describes a pudendal-canal course; the atlas does not reconstruct that canal or the complete route. Read any X-ray contrast column only in the acquired projection and on its labelled side.',
    bullets:[
      'The CT-and-surgical-video study documented variable relationships with inferior gluteal and obturator veins; it does not validate a connected junction in this donor mesh.',
      'The left-labelled candidate remains held for coordinate and laterality review. A selected symptomatic venography cohort cannot supply that missing counterpart or establish normal plain-film visibility.',
    ],
    citations:[pelvicVeinTable,branchStudy,pelvicVenography],
  },
  'lateral-sacral':{
    title:'Right lateral sacral vein: contrast X-ray orientation',
    body:'Only the right lateral sacral selection is available beside the sacrum. Treat it as a local source-surface landmark. A historical phlebography report used selective lateral sacral contrast injection for lumbar venous imaging, not a routine plain pelvic radiograph. This model cannot predict that acquired projection.',
    bullets:[
      'The historical report investigated lumbar and epidural venous filling, not the visibility, sensitivity or normal anatomy of this present pelvic donor surface.',
      'The left-labelled candidate remains held. Do not infer a paired vessel, a complete sacral plexus, a verified junction, flow or an interventional route from the right selection.',
    ],
    citations:[lateralSacralStudy],
  },
} as const;
