// Original introductory drafts; reference links do not grant reuse of source media.
export const abdominalOrganImagingGroups = {
  liver: ['FMA7197'], pancreas: ['FMA7198'], gallbladder: ['FMA7202'], spleen: ['FMA7196'],
  kidney: ['FMA7204', 'FMA7205'], adrenal: ['FMA15629', 'FMA15630'],
} as const;
export type AbdominalOrganImagingGroup = keyof typeof abdominalOrganImagingGroups;
export type AbdominalOrganImagingModality = 'ct' | 'mri' | 'ultrasound' | 'xray';
export const abdominalOrganImagingReferences = {
  landmarks: 'https://anatomy.ttuhscep.edu/anatomytables/viscera_abdomen.html',
  liver: 'https://www.ncbi.nlm.nih.gov/books/NBK543812/',
  ultrasound: 'https://www.radiologyinfo.org/en/info/abdominus',
  ct: 'https://www.radiologyinfo.org/en/info/bodyct',
  mrcp: 'https://www.radiologyinfo.org/en/info/mrcp',
  gallstones: 'https://www.niddk.nih.gov/health-information/digestive-diseases/gallstones/diagnosis',
  spleen: 'https://pubmed.ncbi.nlm.nih.gov/25820845/',
  splenicVariantCt: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4418109/',
  splenicUltrasound: 'https://www.bmus.org/media/resources/files/2021_SCoR_BMUS_guidelines_-_FINAL.pdf',
  splenicWindows: 'https://www.jss.org/english/standard-method/abdominal/?l=en_US',
  renal: 'https://www.ncbi.nlm.nih.gov/books/NBK543811/',
  renalUltrasound: 'https://onlinelibrary.wiley.com/doi/10.1002/jum.70430',
  renalDuplex: 'https://onlinelibrary.wiley.com/doi/10.1002/jum.16353',
  renalGrayscale: 'https://pubmed.ncbi.nlm.nih.gov/674648/',
  urography: 'https://www.radiologyinfo.org/en/info/urography',
  renalPlainFilm: 'https://www.bmj.com/content/345/sbmj.e5375',
  renalIvp: 'https://www.radiologyinfo.org/en/info/ivp',
  renalStoneRadiopacity: 'https://uroweb.org/guidelines/urolithiasis/chapter/guidelines',
  adrenal: 'https://www.ncbi.nlm.nih.gov/books/NBK543796/',
  adrenalUltrasound: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4710689/',
  xray: 'https://www.radiologyinfo.org/en/info/abdominrad',
} as const;
export const abdominalOrganImagingLandmarks: Record<AbdominalOrganImagingGroup, string> = {
  liver: 'Orient the diaphragmatic surface and inferior gallbladder bed. The gallbladder is a separate organ, not an extra liver lobe.',
  pancreas: 'The head lies within the duodenal curve; the body extends leftwards and the tail approaches the splenic hilum, behind the stomach.',
  gallbladder: 'Below the liver, follow fundus and body towards the narrowing neck and cystic duct. The gallbladder is not the common bile duct.',
  spleen: 'Orient the spleen in the left upper abdomen near the stomach and left kidney; the pancreatic tail approaches its hilum.',
  kidney: 'The kidneys lie retroperitoneally on the posterior abdominal wall. The right is generally lower than the left; confirm the selected side.',
  adrenal: 'Each adrenal is superomedial to its kidney. It is a separate endocrine gland, not the renal upper pole.',
};
export const abdominalOrganImagingScope: Record<AbdominalOrganImagingGroup, string> = {
  liver: 'This parent aggregates source surfaces. Internal source branches are not a validated Couinaud segment map or a measured perfusion territory.',
  pancreas: 'The corrected parent retains one envelope and two source duct components. They do not establish two independent complete drainage trees.',
  gallbladder: 'This reference surface has no measured wall, bile, stones, contractility or patient-specific distension.',
  spleen: 'This whole-organ surface provides no red/white-pulp segmentation, perfusion map or patient-specific size assessment.',
  kidney: 'The root kidney is an outer reference surface. The separate HRA kidney specimen is not registered to this donor or to a patient scan.',
  adrenal: 'This is a whole-gland surface, not separately validated cortex and medulla or an adrenal lesion model.',
};
type Topic = {body:string; bullets:[string,string,...string[]]; references:(keyof typeof abdominalOrganImagingReferences)[]};
const plainFilm:Topic = {
  body:'Abdominal radiographs provide less internal soft-tissue detail than CT or MRI. Use the selected organ to learn regional position, not to assume that its full border or internal architecture is visible on X-ray.',
  bullets:['An absent radiographic finding does not establish a normal organ.','Atlas transparency is not X-ray attenuation; no calibrated projection is generated.'],
  references:['xray'],
};
export const abdominalOrganImagingTopics:Record<AbdominalOrganImagingGroup,Record<AbdominalOrganImagingModality,Topic>> = {
  liver: {
    ct:{body:'Liver enhancement depends on contrast timing. Arterial and portal-venous images answer different questions; the same region can look different between phases.',bullets:[
      'Record the actual phase before comparing a finding across series.','Follow source sections and reformations; a surface highlight does not identify lesion enhancement or a functional segment.',
    ],references:['liver']},
    mri:{body:'T1, T2, diffusion and contrast-enhanced images supply different liver information. In-phase/opposed-phase imaging can help identify tissue containing fat.',bullets:[
      'Match the sequence and contrast phase before comparing appearances.','A bright focus on one sequence is not, by itself, a tissue diagnosis; atlas colour carries no MRI signal.',
    ],references:['liver']},
    ultrasound:{body:'Abdominal ultrasound evaluates liver tissue and, with Doppler, blood flow. A local acoustic window is different from an unrestricted 3D view.',bullets:[
      'Keep the gallbladder and nearby vessels distinguished from liver tissue.','Gas and overlying bone can obscure anatomy; hiding meshes does not simulate removing those acoustic barriers.',
    ],references:['ultrasound']},
    xray:plainFilm,
  },
  pancreas: {
    ct:{body:'CT depicts the pancreas together with surrounding bowel, vessels and fat. Trace its head, body and tail across the acquired sections rather than interpreting one cross-section as the whole gland.',bullets:[
      'Use adjacent structures to establish location before isolating the pancreas.','Source-surface separation does not demonstrate tissue planes, invasion or a lesion margin.',
    ],references:['ct']},
    mri:{body:'MRCP is a specialised MRI examination of the pancreatic and biliary systems. Duct-focused images and pancreatic tissue sequences provide complementary, not interchangeable, information.',bullets:[
      'Distinguish gland tissue from the pancreatic duct and adjacent bile duct.','The two retained source duct components are not evidence of two normal complete duct systems or patient duct patency.',
    ],references:['mrcp']},
    ultrasound:{body:'Transabdominal ultrasound can assess the pancreas, but intervening stomach or bowel gas may obscure part of it.',bullets:[
      'A visible head does not prove that the tail has also been examined.','Use the actual examination to judge coverage; the atlas does not model the acoustic window or endoscopic ultrasound.',
    ],references:['ultrasound']},
    xray:plainFilm,
  },
  gallbladder: {
    ct:{body:'CT can show the gallbladder, bile ducts and complications of gallstone disease, but can miss gallstones.',bullets:[
      'Distinguish the gallbladder lumen from adjacent liver and bowel on the acquired sections.','A stone-free CT appearance or this smooth reference surface does not exclude stones.',
    ],references:['gallstones']},
    mri:{body:'MRCP depicts the biliary system, including gallbladder and bile ducts. Follow the gallbladder neck towards the cystic-duct connection without conflating the different structures.',bullets:[
      'Compare the duct-focused acquisition with the other MRI sequences and source images.','No stone, obstruction, duct diameter or gallbladder emptying result is encoded by this mesh.',
    ],references:['mrcp']},
    ultrasound:{body:'Ultrasound is a key examination for detecting gallstones. Localise the fundus, body and neck rather than accepting a single view as the entire gallbladder.',bullets:[
      'Interpret suspected contents on the acquired examination, not from the empty model surface.','This atlas cannot reproduce acoustic shadowing, tenderness or a dynamic gallbladder assessment.',
    ],references:['gallstones']},
    xray:plainFilm,
  },
  spleen: {
    ct:{body:'Normal splenic enhancement can be heterogeneous in the arterial phase and become more uniform in the portal-venous phase.',bullets:[
      'Check contrast timing before mistaking an early mottled pattern for disease.',
      'An accessory spleen is separate splenic tissue and may appear as a rounded or oval focus near the main spleen. Compare its attenuation with the spleen on the same acquired phase; a similar appearance is a clue, not a diagnosis by itself.',
      'Small accessory spleens may have an apparently different attenuation because a voxel also includes adjacent tissue (partial-volume averaging). Review neighbouring sections and available reformations before assigning tissue of origin.',
      'An intact reference outline cannot exclude trauma, a focal lesion or a perfusion defect. This single surface neither depicts nor excludes accessory splenic tissue.',
    ],references:['spleen','splenicVariantCt']},
    mri:{body:'Splenic signal and enhancement depend on sequence and phase. An accessory spleen may resemble the main spleen and occur near the pancreatic tail.',bullets:[
      'Compare appearances across the actual sequences before assigning tissue of origin.','No accessory spleen is added or diagnosed by this whole-organ selection.',
    ],references:['spleen']},
    ultrasound:{body:'Normal splenic parenchyma usually has a homogeneous echotexture. Follow the acquired views across the organ: one ultrasound section and a whole-organ 3D outline represent different coverage.',bullets:[
      'Left intercostal views can show the spleen and its relationships to the left kidney and diaphragm. Overlying ribs and body habitus may limit the window; rotating or hiding atlas surfaces does not reproduce these limitations.',
      'Distinguish splenic parenchyma from the adjacent left kidney and pancreatic-tail region. Review the hilum as well as the outer contour; accessory splenic tissue can resemble the main spleen on ultrasound.',
      'Size and focal findings require an acquired examination; mesh bounds are not clinical measurements. A homogeneous appearance in one view does not establish whole-organ normality.',
    ],references:['spleen','splenicUltrasound','splenicWindows']},
    xray:plainFilm,
  },
  kidney: {
    ct:{body:'Contrast phase affects renal tissue and collecting-system appearances. Nephrographic tissue assessment is distinct from the later depiction of excreted contrast in the collecting system.',bullets:[
      'Identify the kidney and side before assessing a focal finding.','Enhancement cannot be established from a single model surface or by comparing unmatched scan phases.',
    ],references:['renal']},
    mri:{body:'Renal MRI uses complementary tissue sequences and, when acquired, contrast-enhanced images. A renal mass assessment is different from following urine-containing collecting-system anatomy.',bullets:[
      'Localise parenchyma separately from the renal pelvis and ureter.','A generic outer contour cannot distinguish a cyst from a solid lesion or quantify enhancement.',
    ],references:['renal']},
    ultrasound:{body:'Renal ultrasound provides acquired slices, not the complete volume suggested by an atlas surface. Establish the recorded side and image plane before following the visible parenchyma and central collecting region across views. Grayscale appearance and Doppler flow information are distinct; neither is encoded by this outer reference mesh.',bullets:[
      'When a complete kidney examination is acquired, compare long-axis and transverse views and check which upper- and lower-pole regions were actually shown on each side.',
      'Where discernible, distinguish cortical tissue and medullary pyramids from the central sinus and renal pelvis; the sinus is not simply a fluid-filled collecting space.',
      'Use acquired grayscale images for tissue echoes and contour. Flow assessment requires separately acquired Doppler data; mesh colour is not a Doppler result.',
      'Recognise a poorly seen pole or other coverage limit. A clear model silhouette cannot establish sonographic visibility, a complete examination or normality.',
    ],references:['renalUltrasound','renalDuplex','renalGrayscale']},
    xray:{body:'On a plain abdominal radiograph, orient the renal regions beside the lumbar spine and any visible psoas margins. Renal soft-tissue outlines may be only partly discernible; their visibility depends on surrounding fat contrast and overlapping abdominal contents. A visible outer shadow is not a view of the internal collecting system.',bullets:[
      'Confirm the recorded patient side, projection and image coverage before comparing the two renal regions. A poorly seen outline does not establish an absent or abnormal kidney.',
      'A projected opacity is not automatically a urinary calculus. Stone radiopacity varies with composition; some stones are radiolucent, so a negative plain film cannot exclude them.',
      'Intravenous pyelography uses injected iodinated contrast and timed radiographs to outline the urinary tract. It is a different examination from a non-contrast plain film or CT/MR urography.',
      'Reassemble the atlas before studying spatial relationships. This outer surface supplies no radiographic attenuation, collecting-system opacification, stone diagnosis, excretion, obstruction assessment or renal function.',
    ],references:['renalPlainFilm','renalIvp','renalStoneRadiopacity']},
  },
  adrenal: {
    ct:{body:'Unenhanced CT attenuation and contrast-enhancement behaviour provide different information about an adrenal finding. Do not apply an unenhanced attenuation interpretation to a contrast-enhanced image.',bullets:[
      'Confirm the gland and side, separate from the kidney and adjacent vessels.','This model contains no Hounsfield values, washout calculation or lesion classification.',
    ],references:['adrenal']},
    mri:{body:'Chemical-shift MRI compares in-phase and opposed-phase signal to detect intracellular lipid. Signal loss may support an adenoma, but is not an infallible tissue diagnosis.',bullets:[
      'Not all adenomas contain enough lipid to show signal loss; some other lesions can also contain lipid.','Atlas colour and shape cannot replace the paired acquired sequences.',
    ],references:['adrenal']},
    ultrasound:{body:'Adult adrenal visualisation can be limited by bowel gas, body habitus and the acoustic window. Not seeing a gland does not prove its absence or normality.',bullets:[
      'Keep the suprarenal region separate from the renal upper pole.','The clear atlas view does not establish ultrasound visibility or a complete adrenal examination.',
    ],references:['adrenalUltrasound']},
    xray:plainFilm,
  },
};
