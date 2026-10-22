// Further-reading links for original draft text; no external text or assets are bundled.
const girdle='https://openstax.org/books/anatomy-and-physiology-2e/pages/8-1-the-pectoral-girdle';
const arm='https://openstax.org/books/anatomy-and-physiology-2e/pages/8-2-bones-of-the-upper-limb';
const bones='https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html';
const muscles='https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html';
const scapula='https://www.orthoinfo.org/diseases--conditions/scapula-shoulder-blade-fractures/';
const movement='https://www.orthoinfo.org/diseases--conditions/scapular-shoulder-blade-disorders/';
const sc='https://www.orthoinfo.org/diseases--conditions/sternoclavicular-sc-joint-disorders/';
const clavicle='https://www.orthoinfo.org/diseases--conditions/clavicle-fracture-broken-collarbone/';
const trauma='https://www.orthoinfo.org/diseases--conditions/shoulder-trauma-fractures-and-dislocations/';
const arthritis='https://www.orthoinfo.org/diseases--conditions/arthritis-of-the-shoulder/';
const slap='https://www.orthoinfo.org/diseases--conditions/slap-tears/';
const mr='https://www.radiologyinfo.org/en/info/muscmr';
const us='https://www.radiologyinfo.org/en/info/musculous';
const shoulderUs='https://www.essr.org/content-essr/uploads/2016/10/shoulder.pdf';
const marrow='https://pubmed.ncbi.nlm.nih.gov/8570312/';
const cortex='https://pubmed.ncbi.nlm.nih.gov/16051035/';

export const legacyShoulderBoneReferences={
  'VM-SHO-R-BON-SCAP':{
    anatomy:[girdle,bones],function:[movement,girdle],ct:[scapula,trauma],
    mri:[cortex,marrow,mr],ultrasound:[us,shoulderUs],pathology:[scapula,shoulderUs,arthritis],
    clinical:[movement,scapula],quiz:[girdle,arm],
  },
  'VM-SHO-R-BON-HUM':{
    anatomy:[arm,bones],function:[arm,muscles],ct:[trauma],
    mri:[mr,slap],ultrasound:[shoulderUs],pathology:[trauma,arthritis],
    clinical:[trauma,sc],quiz:[arm,bones],
  },
  'VM-SHO-R-BON-CLAV':{
    anatomy:[girdle,bones],function:[girdle,movement],ct:[clavicle,sc],
    mri:[mr,sc],ultrasound:[shoulderUs,us],pathology:[clavicle,trauma],
    clinical:[clavicle],quiz:[girdle,bones],
  },
} as const;
