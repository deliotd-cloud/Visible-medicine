// Original factual teaching. Reference links do not grant rights to publisher media.
const vidio='https://pubmed.ncbi.nlm.nih.gov/28818221/';
const variation='https://pubmed.ncbi.nlm.nih.gov/24874031/';
const pelvicReflux='https://pubmed.ncbi.nlm.nih.gov/40537052/';

export const iliacVenousXrayTopics={
  common:{
    title:'Common iliac contrast venography',
    body:'On an acquired contrast X-ray venogram, identify the selected side and follow the opacified common iliac route toward the caval confluence. A projection of the contrast column is not a cross-sectional view of the lumen or an image of this donor surface.',
    bullets:[
      'The prospective VIDIO study compared multiplanar venography with intravascular ultrasound (IVUS) in 100 patients with advanced chronic venous disease and suspected iliofemoral obstruction. Venography detected fewer significant lesions; this selected cohort does not establish normal visibility or an atlas-based diagnostic threshold.',
      'A retrospective CT study of 2,488 patients documented alternative iliac drainage and communicating veins. Confirm acquired continuity rather than treating this single donor arrangement as universal or a projected crossing as a connection.',
    ],
    citations:[vidio,variation],
  },
  external:{
    title:'External iliac contrast venography',
    body:'Use the external iliac selection to orient the pelvic continuation of the lower-limb venous route. On an acquired contrast X-ray venogram, distinguish a demonstrated external iliac channel from the internal iliac drainage at its junction; do not infer depth from projection overlap alone.',
    bullets:[
      'VIDIO included the common and external iliac and common femoral veins. Its venographic diameter measurements and IVUS area measurements are not interchangeable, and their disease-selected results do not prescribe treatment from this model.',
      'Contrast filling and an acquired sequence answer different questions from a static surface. These archived pieces supply no thrombus map, patency test, measured calibre or reliable collateral-flow direction.',
    ],
    citations:[vidio,variation],
  },
  internal:{
    title:'Internal iliac contrast venography',
    body:'Use the internal iliac selection to orient pelvic tributary drainage separately from the external iliac lower-limb route. Inspect only the channels actually opacified on an acquired contrast X-ray venogram; this grouped source is not a complete pelvic venous plexus or reflux study.',
    bullets:[
      'CT research documented high, contralateral and communicating iliac drainage patterns. Those cross-sectional observations describe anatomical variation, not the sensitivity of catheter venography or a connection validated in these grouped meshes.',
      'A cohort of 31 women with suspected pelvic vein incompetence compared transvaginal duplex with catheter venography, including bilateral internal iliac reflux. That selected female population does not establish reflux, normal visibility or diagnostic performance in this separate male-donor atlas.',
    ],
    citations:[variation,pelvicReflux],
  },
} as const;
