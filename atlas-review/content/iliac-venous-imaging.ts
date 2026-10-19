export type IliacVenousModality = 'ct' | 'mri' | 'ultrasound';
export type IliacVenousGroup = 'common' | 'external' | 'internal';
export const iliacVenousReferences = {
  pelvis: 'https://anatomy.ttuhscep.edu/anatomytables/veins_pelvis_perineum.html',
  femoral: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12032564/',
  variation: 'https://pubmed.ncbi.nlm.nih.gov/24874031/',
  mrv: 'https://pubmed.ncbi.nlm.nih.gov/10796919/',
  iliacUs: 'https://pubmed.ncbi.nlm.nih.gov/37353157/',
  pelvicUs: 'https://pubmed.ncbi.nlm.nih.gov/40537052/',
};
type Ref = keyof typeof iliacVenousReferences;
type Topic = { body: string; bullets: string[]; references: Ref[] };
export const iliacVenousSelections: {fmas: string[]; group: IliacVenousGroup; landmark: string; limit: string; references: Ref[]}[] = [
  {fmas:['FMA21387','FMA21388'],group:'common',landmark:'The paired common iliac veins unite to form the inferior vena cava. Identify the selected side before following its proximal route.',limit:'Each common-iliac selection uses one archived file. Its outline does not establish a complete confluence, normal calibre or a patent lumen.',references:['pelvis']},
  {fmas:['FMA18885','FMA18886'],group:'external',landmark:'The femoral vein continues as the external iliac vein on entering the pelvis beneath the inguinal ligament.',limit:'The right selection uses one source file; the left groups four. This asymmetry is an archive property, not evidence of duplication or disease.',references:['femoral']},
  {fmas:['FMA18887','FMA18888'],group:'internal',landmark:'Internal iliac drainage includes pelvic visceral and perineal tributaries. Bladder and prostatic venous connections are distinct from the lower-limb route.',limit:'Six right and three left source files are grouped here. Their surfaces do not validate every pelvic tributary or continuous connection.',references:['pelvis']},
];
// Original, short factual teaching; reference links do not license publisher media.
export const iliacVenousTopics: Record<IliacVenousGroup,Record<IliacVenousModality,Topic>> = {
  common: {
    ct:{body:'On acquired CT, trace the iliac confluence and its connection to the inferior vena cava. CT studies demonstrate variant iliac drainage and communicating veins; a single donor arrangement is not universal.',bullets:['A source surface is not an opacified lumen. Apparent narrowing here cannot diagnose venous compression or obstruction.'],references:['variation']},
    mri:{body:'Dedicated contrast-enhanced MR venography has been studied for pelvic and lower-limb venous mapping. Use the common iliac route to orient yourself towards the caval junction.',bullets:['The cited initial study excluded acute DVT. It does not validate clot exclusion on routine pelvic MRI or on this static model.'],references:['mrv']},
    ultrasound:{body:'Duplex research has measured common iliac velocity spectra alongside CT-derived anatomy. Those measurements belong to the acquired examination, not the colour or shape of an atlas vein.',bullets:['The cited CT/US flow-modelling study was proof-of-concept in one subject and one control, not a validated atlas-based diagnostic test.'],references:['iliacUs']},
  },
  external: {
    ct:{body:'Distinguish the external iliac channel from the internal iliac tributary at their junction. CT studies show that the joining level and venous connections can vary.',bullets:['Follow acquired continuity rather than assuming that an archived mesh endpoint marks the junction in every patient.'],references:['variation']},
    mri:{body:'The external iliac vein provides a pelvic continuation of the lower-limb venous route for MRV orientation. Dedicated venography and routine pelvic MRI are different acquisitions.',bullets:['The cited early MRV study used a specific contrast technique; it is not a current acquisition prescription or evidence that every tributary is visible.'],references:['mrv']},
    ultrasound:{body:'External iliac Doppler measurements were acquired separately on both sides in the cited CT/US study. An anatomical label and an acquired flow waveform answer different questions.',bullets:['No spectral trace, probe pressure, compressibility or patient-specific flow measurement is encoded in these surfaces.'],references:['iliacUs']},
  },
  internal: {
    ct:{body:'Trace the internal iliac drainage on acquired CT instead of assuming a fixed ipsilateral junction. Reported variants include cross-pelvic communications and alternative drainage patterns.',bullets:['The grouped source pieces are not a complete map of a patient’s pelvic venous plexuses.'],references:['variation']},
    mri:{body:'Use the internal iliac selection to distinguish pelvic tributary territory from the external iliac lower-limb route. Published pelvic MRV feasibility does not guarantee depiction of every small tributary.',bullets:['This source has no MR signal, sequence-dependent visibility or validated correspondence to an acquired slice.'],references:['mrv']},
    ultrasound:{body:'A study of women with suspected pelvic vein incompetence compared transvaginal duplex with venography, including internal iliac reflux. Position and the reflux criterion affected performance.',bullets:['That population and examination route do not transfer directly to this male-donor source. Static branches demonstrate neither reflux nor a complete ultrasound examination.'],references:['pelvicUs']},
  },
};
