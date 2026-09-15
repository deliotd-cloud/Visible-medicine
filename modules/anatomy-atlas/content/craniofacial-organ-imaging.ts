// Original concise teaching. References are reading links, not image licences.
export const craniofacialOrganImagingReferences = {
  pituitary: 'https://www.ncbi.nlm.nih.gov/books/NBK279161/',
  pituitaryLimits: 'https://www.ncbi.nlm.nih.gov/books/NBK555989/',
  globe: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5007393/',
  orbit: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3624745/',
  ocularUltrasound: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3983623/',
  mrSafety: 'https://www.radiologyinfo.org/en/info/safety-mr',
  lacrimal: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10996330/',
  lacrimalUs: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10501785/',
  salivary: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3698896/',
  floor: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5990998/',
} as const;
export type CraniofacialOrganModality = 'ct' | 'mri' | 'ultrasound' | 'xray';
type Reference = keyof typeof craniofacialOrganImagingReferences;
type Topic = { body: string; pitfall: string; references: Reference[] };
type Group = {
  fmas: readonly string[];
  limit: string;
  focus: Record<CraniofacialOrganModality, Topic>;
};
const limitedFilm: Topic = {
  body: 'Plain radiographs do not provide the cross-sectional soft-tissue detail needed to delineate this orbital structure.',
  pitfall: 'A visible orbital outline is not a visible gland or a normal globe assessment.',
  references: ['orbit'],
};
export const craniofacialOrganImagingGroups: Record<string, Group> = {
  pituitary: {
    fmas: ['FMA13889'],
    limit: 'Whole-gland reference only: no validated anterior/posterior lobe boundary, stalk attachment, lesion or hormonal state.',
    focus: {
      ct: { body: 'Locate the gland within the sella. CT helps assess adjacent bone and calcification; routine head CT is not equivalent to a dedicated pituitary examination.', pitfall: 'A small sellar lesion may not be resolved on a routine head study.', references: ['pituitary'] },
      mri: { body: 'Coronal and sagittal sellar images clarify the gland, stalk and suprasellar relationships. T1/T2 appearance and enhancement depend on the acquired sequence and timing.', pitfall: 'The posterior bright spot is an MR appearance, not a labelled compartment in this surface.', references: ['pituitary'] },
      ultrasound: { body: 'Routine ultrasound is not a method for delineating the adult pituitary gland.', pitfall: 'No acoustic window, probe route or ultrasound correspondence is supplied by this atlas.', references: ['pituitaryLimits'] },
      xray: { body: 'Skull films can show the bony sella but do not delineate the gland. Sellar bony changes are not specific for a pituitary lesion.', pitfall: 'Do not interpret an apparently normal sella as exclusion of pituitary disease.', references: ['pituitaryLimits'] },
    },
  },
  globe: {
    fmas: ['FMA12514', 'FMA12515'],
    limit: 'Root whole-globe selection: no lesion, measured wall thickness, pressure or visual function. Nested eye layers are separate source selections.',
    focus: {
      ct: { body: 'On orbital CT distinguish the globe contour, lens and vitreous compartment from surrounding orbital fat and the adjacent bony walls.', pitfall: 'A reference surface cannot exclude globe injury or an intraocular foreign body.', references: ['globe'] },
      mri: { body: 'Fluid-rich globe contents contrast with the lens and outer coats on suitable sequences. Read globe findings with the surrounding orbit rather than treating the globe as an isolated sphere.', pitfall: 'MRI safety screening, including possible metallic foreign bodies, is a separate clinical requirement.', references: ['globe', 'mrSafety'] },
      ultrasound: { body: 'Ocular ultrasound depicts intraocular interfaces and can assess the posterior segment when optical inspection is limited.', pitfall: 'Suspected open-globe injury requires specialist assessment; this atlas does not authorise probe pressure on an injured eye.', references: ['ocularUltrasound'] },
      xray: limitedFilm,
    },
  },
  lacrimal: {
    fmas: ['FMA59102', 'FMA59103'],
    limit: 'Whole lacrimal-gland source only: lobes, ducts, secretion and disease extent are not independently validated.',
    focus: {
      ct: { body: 'Identify the lacrimal gland in the superolateral orbit and compare the opposite side. CT also shows adjacent orbital bone.', pitfall: 'The inferomedial lacrimal sac and drainage pathway are different structures.', references: ['lacrimal'] },
      mri: { body: 'MRI helps define gland tissue and surrounding orbital soft tissues. Assess enhancement and morphology in the context of the actual sequence and both orbits.', pitfall: 'Enhancement alone does not distinguish inflammation from a tumour.', references: ['lacrimal'] },
      ultrasound: { body: 'Specialised high-frequency ultrasound can evaluate the accessible lacrimal gland; it is not a complete deep-orbit examination.', pitfall: 'Visible portions and measurements depend on equipment and access. No probe-position or lesion-characterisation claim is made here.', references: ['lacrimalUs'] },
      xray: limitedFilm,
    },
  },
  submandibular: {
    fmas: ['FMA59802', 'FMA59803'],
    limit: 'Gland envelope only: no validated duct lumen, stone, salivary flow or gland-space boundary is encoded.',
    focus: {
      ct: { body: 'Locate the gland below the mandibular body and its deep extension around the posterior mylohyoid margin. Review the floor of mouth as well as the superficial gland.', pitfall: 'A gland surface is not the complete submandibular space.', references: ['floor'] },
      mri: { body: 'MRI separates gland tissue from neighbouring floor-of-mouth muscles and helps assess soft-tissue extent.', pitfall: 'Signal and enhancement are not tissue diagnosis or proof of duct patency.', references: ['floor'] },
      ultrasound: { body: 'Ultrasound can examine gland texture and accessible ductal dilatation or calculi.', pitfall: 'Deep portions and small stones may be missed; a negative view is not a complete duct survey.', references: ['salivary'] },
      xray: { body: 'Some salivary calculi are radiopaque, but a plain film does not show the full gland or duct.', pitfall: 'Absent visible calcification does not exclude obstruction.', references: ['salivary'] },
    },
  },
  sublingual: {
    fmas: ['FMA59804', 'FMA59805'],
    limit: 'Gland envelope only: the small draining ducts, cyst communication and mucosal boundaries are not validated source partitions.',
    focus: {
      ct: { body: 'Locate the gland in the floor of mouth above the mylohyoid, medial to the mandible. Relate it to the adjacent submandibular space.', pitfall: 'A floor-of-mouth collection is not automatically confined to one gland.', references: ['floor'] },
      mri: { body: 'MRI depicts the sublingual space and fluid-containing lesions in relation to the mylohyoid and adjacent soft tissues.', pitfall: 'No ranula, communication tract or tissue invasion is present in this normal reference model.', references: ['floor'] },
      ultrasound: { body: 'Ultrasound can assess accessible floor-of-mouth abnormalities, but the mandible and air limit acoustic access.', pitfall: 'An incomplete sonographic view should not be mistaken for an absent gland.', references: ['salivary'] },
      xray: { body: 'Plain films do not delineate the sublingual gland. A floor-of-mouth calcification needs localisation with the clinical and cross-sectional context.', pitfall: 'A calculus near the gland may belong to the submandibular duct.', references: ['salivary'] },
    },
  },
};
