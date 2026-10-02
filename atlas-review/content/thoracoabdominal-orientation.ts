// Original, source-limited orientation prose. Links provide factual context only;
// no external figure, scan, article text or anatomical asset is redistributed.
export const thoracoabdominalOrientationReferences = {
  thoracicArteries: 'https://anatomy.ttuhscep.edu/anatomytables/arteries_thorax.html',
  abdominalWall: 'https://anatomy.ttuhscep.edu/schemes/abdo_wall_tables.html',
  thoracicVeins: 'https://anatomy.ttuhscep.edu/cardiovascular_system/sup_med_tables.html',
  mraLimits: 'https://www.radiologyinfo.org/en/info/angiomr',
  lineaMri: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8913712/',
  appendixCt: 'https://pubmed.ncbi.nlm.nih.gov/16819637/',
  appendixMri: 'https://pubmed.ncbi.nlm.nih.gov/15666398/',
  mesoappendixAnatomy: 'https://pubmed.ncbi.nlm.nih.gov/37691509/',
  peritonealAnatomy: 'https://anatomy.ttuhscep.edu/gastrointestinal_system/peritoneum_tables.html',
} as const;

type Reference = keyof typeof thoracoabdominalOrientationReferences;
type Topic = { body: string; pitfall: string; references: readonly Reference[] };
type Group = Partial<Record<'ct' | 'mri', Topic>>;

export const thoracoabdominalOrientationGroups: Record<string, Group> = {
  'superior-epigastric-artery': {
    mri: {
      body: 'Use the internal thoracic region and upper rectus abdominis as orientation landmarks for the superior epigastric artery. Follow only a vessel actually resolved on consecutive MR source sections.',
      pitfall: 'The expected communication with the inferior epigastric artery is an anatomical relationship, not a demonstrated junction, patent lumen or measured flow in this source segment.',
      references: ['thoracicArteries', 'abdominalWall', 'mraLimits'],
    },
  },
  'musculophrenic-artery': {
    mri: {
      body: 'Orient the musculophrenic artery toward the anterior diaphragm and lower costal margin, using the internal thoracic territory as proximal context where the study resolves it.',
      pitfall: 'The selected surface does not prove continuity with the internal thoracic artery or resolve every anterior intercostal branch. A neighbouring vein is not an arterial branch.',
      references: ['thoracicArteries', 'mraLimits'],
    },
  },
  'musculophrenic-vein': {
    mri: {
      body: 'Use the anterior diaphragm and lower costal margin as regional landmarks for the musculophrenic vein; identify venous signal and continuity on the actual MR series before naming a channel.',
      pitfall: 'The vein and artery are separate selections. The internal thoracic venous drainage pattern is anatomical context, not proof of a terminal junction or complete venous map in this donor.',
      references: ['thoracicVeins', 'mraLimits'],
    },
  },
  'linea-alba': {
    mri: {
      body: 'Orient the midline linea alba between the paired rectus abdominis muscles on abdominal-wall MR sections, comparing the same level and plane in the actual series.',
      pitfall: 'This single fascial surface does not reproduce MR tissue signal, distinguish every aponeurotic layer or supply a patient-specific inter-rectus measurement. An exploded gap is not diastasis.',
      references: ['lineaMri'],
    },
  },
  mesoappendix: {
    ct: {
      body: 'First locate the appendix and adjacent mesenteric region on CT, then use the separately labelled mesoappendix selection only to discuss the expected fold relationship.',
      pitfall: 'Appendix or periappendiceal fat visibility does not establish a separately resolved mesoappendix boundary. Its extent, attachment and embedded appendicular vessels remain unvalidated in this donor.',
      references: ['appendixCt', 'mesoappendixAnatomy', 'peritonealAnatomy'],
    },
    mri: {
      body: 'First locate the appendix when it is identifiable on MR source sections; use the separate mesoappendix label to orient the neighbouring mesenteric region, not to assert a visible membrane.',
      pitfall: 'An MR-demonstrated appendix does not validate mesoappendix thickness, leaf boundaries, attachment or contained vessels. Position and mesoappendix extent vary.',
      references: ['appendixMri', 'mesoappendixAnatomy', 'peritonealAnatomy'],
    },
  },
};
