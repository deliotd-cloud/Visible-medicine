// Original teaching synthesis. References are reading links, not reusable image assets.
export const abdominalBranchImagingReferences={
  colicCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9423717/',
  leftColicCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7644475/',
  marginalCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4308041/',
  appendixAnatomy:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12717497/',
  appendixCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4324638/',
  imvCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9652173/',
  bowelVeinsCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4263800/',
  middleColicVeinCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5257301/',
  gastrocolicCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11685880/',
  pancreaticCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8816990/',
  dorsalPancreaticCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11769064/',
  pancreaticAnatomy:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12386335/',
  gastroduodenalCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8421881/',
  gastricVeins:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12651528/',
  leftGastricCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3384867/',
  rightGastricCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4463322/',
  leftGastricMRUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5768503/',
  hepaticCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12916557/',
  hepaticMR:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8871101/',
  hepaticUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3478706/',
  epigastricCT:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4115991/',
  epigastricMR:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6732116/',
  epigastricUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3932585/',
  epigastricHerniaUS:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9262670/',
} as const;
type Reference=keyof typeof abdominalBranchImagingReferences;
export type AbdominalBranchImagingModality='ct'|'mri'|'ultrasound';
type Fact={body:string;pitfall:string;references:readonly Reference[]};
type Group={fmaId:string;region:'abdomen';laterality:'midline'|'unspecified'|'left'|'right';focus:Partial<Record<AbdominalBranchImagingModality,Fact>>};
const fact=(body:string,pitfall:string,...references:Reference[]):Fact=>({body,pitfall,references});
const group=(fmaId:string,laterality:Group['laterality'],focus:Group['focus']):Group=>({fmaId,region:'abdomen',laterality,focus});
const hepaticTributaryCT=fact('Follow resolved tributaries into the selected hepatic outflow, then towards the caval junction on venous-enhanced multiplanar sections.','Disconnected donor components are not separately named veins, segment boundaries or proven drainage territories.','hepaticCT');
const hepaticTributaryMR=fact('Compare hepatic tributaries on appropriate venous-sensitive source sections, tracing their actual receiving vein rather than relying on a projection.','Small-branch visibility varies; this grouped surface cannot establish a patient-specific hepatic segment.','hepaticMR');
const hepaticTributaryUS=fact('Use hepatic-vein continuity and Doppler to distinguish visible outflow tributaries from portal branches.','Not every intrasegmental vessel is resolved; incomplete coverage or absent colour alone does not establish obstruction.','hepaticUS');
const epigastricArteryCT=fact('Follow the external iliac origin into the deep rectus region, separating the artery from accompanying veins and superficial epigastric vessels.','Position varies; donor distances cannot define a safe puncture corridor.','epigastricCT');
const epigastricVeinCT=fact('Trace the deep rectus venous channel towards external iliac drainage on adequately enhanced sections.','Accompanying channels and superficial connections vary; one source vein is not the complete abdominal-wall drainage network.','epigastricCT');
const epigastricArteryMR=fact('Dedicated high-resolution vascular MR images can map the deep inferior epigastric course and resolved intramuscular branches.','Routine abdominal MRI is not equivalent to dedicated perforator mapping; check the actual acquisition.','epigastricMR');
const epigastricVeinMR=fact('Inspect venous-sensitive mapping for the deep epigastric channel and its connections with superficial drainage.','An arterial-only phase cannot establish the entire venous network or flap drainage.','epigastricMR');
const epigastricArteryUS=fact('Identify the deep epigastric artery beside or within rectus and trace it towards its external iliac origin. Relate an inguinal protrusion to this landmark.','Hernia assessment requires dynamic patient imaging; the stationary donor is not diagnostic.','epigastricHerniaUS');
const epigastricVeinUS=fact('Locate the epigastric bundle in the deep rectus region and distinguish venous from arterial flow using Doppler and continuity.','Do not name a vessel from red or blue colour alone; settings and beam direction affect the display.','epigastricUS');
export const abdominalBranchImagingGroups:Record<string,Group>={
  'middle-colic-artery':group('FMA14810','midline',{ct:fact('Trace the middle colic origin and division through the transverse mesocolon on arterial CT, relating it to the SMV.','A common trunk or accessory supply must be confirmed rather than assumed from this selection.','colicCT')}),
  'right-colic-artery':group('FMA14811','right',{ct:fact('Follow the right-colon arterial branch back to its actual origin and inspect its relationship to the mesenteric veins.','Origin and presence vary; an unseen independent right colic trunk is not automatically an occlusion.','colicCT')}),
  'ileocolic-artery':group('FMA14815','unspecified',{ct:fact('Trace the ileocolic pedicle from the SMA towards the ileocaecal region, checking whether it crosses anterior or posterior to the SMV.','Crossing relationships vary; one axial slice does not establish the complete pedicle.','colicCT')}),
  'appendicular-artery':group('FMA14818','unspecified',{ct:fact('Locate the appendix and mesoappendix first, then inspect any resolved arterial branch approaching from the ileocolic region.','Small-vessel nonvisualisation is not absent supply; accessory arteries and appendix position vary.','appendixAnatomy','appendixCT')}),
  'ileocolic-ascending-branch':group('FMA14820','unspecified',{ct:fact('Orient this source-labelled distal branch using the parent ileocolic pedicle and ileocaecal bowel on thin arterial sections.','The source wording does not establish an individually identifiable CT branch or justify relabelling it as a specific caecal artery.','colicCT')}),
  'marginal-colic-artery':group('FMA14824','midline',{ct:fact('Follow the marginal vascular pathway beside the mesenteric border of the colon, checking source sections for artery–vein distinction.','A projected continuous line does not prove a patent arterial arcade or adequate collateral perfusion.','marginalCT')}),
  'left-colic-artery':group('FMA14826','left',{ct:fact('Trace the left colic pathway from the IMA towards the descending colon, distinguishing it from an accessory middle colic artery.','Splenic-flexure supply and branch origins vary; the displayed source is not a universal pattern.','leftColicCT')}),
  'left-colic-ascending-branch':group('FMA14828','left',{ct:fact('Follow the ascending left-colic branch towards the splenic-flexure region in relation to the IMV and lower pancreatic border.','Do not identify an adjacent artery by proximity to the IMV alone; confirm its origin.','leftColicCT')}),
  'left-colic-descending-branch':group('FMA14829','left',{ct:fact('Follow the inferiorly directed left-colic branch towards descending-colon marginal vessels, using multiplanar continuity with its parent.','A small resolved segment does not prove its full anastomosis with sigmoid supply.','leftColicCT')}),
  'inferior-mesenteric-vein':group('FMA15391','unspecified',{ct:fact('Trace the IMV cranially from the left mesocolon towards its actual confluence near the pancreas.','Termination may involve the splenic, superior mesenteric or jejunal venous pathway; do not impose a single junction.','imvCT')}),
  'ileal-vein':group('FMA15405','unspecified',{ct:fact('Follow visible ileal mesenteric tributaries towards the SMV on portal-venous sections, distinguishing veins from adjacent arterial branches.','This single source selection is not every ileal vein or a complete bowel drainage map.','bowelVeinsCT')}),
  'middle-colic-vein':group('FMA15406','midline',{ct:fact('Follow transverse-mesocolon venous return to its receiving vein on venous-enhanced CT, checking the junction on source images.','Middle-colic venous tributaries and drainage routes vary; arterial branching does not determine the venous pattern.','middleColicVeinCT')}),
  'right-colic-vein':group('FMA15407','right',{ct:fact('Trace right-colon venous return towards the SMV region and inspect whether it joins a gastrocolic confluence.','A right colic and accessory right colic vein are not interchangeable labels; identify the actual course.','gastrocolicCT')}),
  'anterior-superior-pancreaticoduodenal-artery':group('FMA14782','unspecified',{ct:fact('Trace the anterior superior branch from the gastroduodenal pathway around the pancreatic head towards the anterior inferior arcade.','Anterior and posterior arcades must be distinguished on source sections, not a single overlapping projection.','pancreaticAnatomy')}),
  'posterior-superior-pancreaticoduodenal-artery':group('FMA14784','unspecified',{ct:fact('Inspect the posterior pancreaticoduodenal course and its actual proximal origin on arterial-enhanced sections.','Hepatic-origin variants occur; a posterior location alone does not establish gastroduodenal continuity.','pancreaticAnatomy')}),
  'dorsal-pancreatic-artery':group('FMA14787','unspecified',{ct:fact('Trace the dorsal pancreatic artery from its actual origin to the pancreas using arterial source images and multiplanar views.','Splenic, mesenteric and hepatic origins occur; failure to resolve this small vessel is not proof of absence.','dorsalPancreaticCT')}),
  'inferior-pancreatic-artery':group('FMA14790','unspecified',{ct:fact('Inspect the inferior/transverse arterial pathway along the pancreatic body in relation to dorsal pancreatic branches.','Fine intrapancreatic arcades may remain unresolved; preserve the source name rather than inventing a complete connection.','dorsalPancreaticCT')}),
  'great-pancreatic-artery':group('FMA14792','unspecified',{ct:fact('Look for a larger pancreatic branch from the splenic arterial course into the body, confirming origin on source sections.','Visibility and branching vary; calibre alone does not establish the great pancreatic artery.','pancreaticCT')}),
  'caudal-pancreatic-artery':group('FMA14793','unspecified',{ct:fact('Inspect resolved tail-directed arterial branches near the splenic end of the pancreas.','A tail vessel on one section cannot establish its origin or a complete transverse-pancreatic anastomosis.','pancreaticCT')}),
  'inferior-pancreaticoduodenal-artery':group('FMA14805','unspecified',{ct:fact('Trace the inferior pancreaticoduodenal supply from the mesenteric region towards the pancreatic head.','A common first-jejunal trunk or separate anterior/posterior origins may replace one shared trunk.','pancreaticCT')}),
  'pancreaticoduodenal-vein':group('FMA15398','unspecified',{ct:fact('Follow resolved pancreatic-head venous channels towards mesenteric or portal drainage on venous-enhanced CT.','The grouped source contains three components; these are not three validated named veins or a complete gastrocolic trunk.','gastrocolicCT')}),
  'anterior-inferior-pancreaticoduodenal-artery':group('FMA70479','unspecified',{ct:fact('Follow the anterior inferior branch around the pancreatic head towards the anterior superior arcade.','Confirm its mesenteric or variant origin; anterior and posterior branches need not share one trunk.','pancreaticCT')}),
  'posterior-inferior-pancreaticoduodenal-artery':group('FMA70480','unspecified',{ct:fact('Inspect the posterior inferior course behind the pancreatic head on arterial source sections.','Separate origins and retropancreatic anastomoses vary; do not infer them from a projected crossing.','pancreaticCT')}),
  'gastroduodenal-trunk':group('FMA76574','unspecified',{ct:fact('Follow the gastroduodenal trunk from the hepatic region towards the proximal duodenum and pancreatic head on arterial CT.','Preserve this trunk-only selection; its display does not establish all pancreaticoduodenal or gastro-omental branches.','gastroduodenalCT')}),
  'left-gastroepiploic-vein':group('FMA15390','left',{ct:fact('Follow the greater-curvature venous pathway towards the splenic region on appropriately enhanced CT sections.','Do not confuse this with the lesser-curvature left gastric vein; the exact terminal junction needs confirmation.','gastricVeins')}),
  'right-gastroepiploic-vein':group('FMA15397','right',{ct:fact('Follow the right greater-curvature vein towards the pancreatic-head and SMV region, inspecting its confluence.','Joining pancreatic or colic tributaries is variable; the right pathway is not a mirror of the left.','gastrocolicCT')}),
  'left-gastric-vein':group('FMA15399','left',{
    ct:fact('Trace the lesser-curvature vein past the coeliac arterial region to its actual portal-system termination.','Portal, splenic and confluence drainage patterns vary; crossing a named artery does not define one universal route.','leftGastricCT'),
    mri:fact('Dedicated venous-sensitive or flow-selective MR can depict the left gastric vein; confirm its lesser-curvature course on source sections.','Flow-selective research methods are not routine MRI, and the static atlas provides no flow-direction measurement.','leftGastricMRUS'),
    ultrasound:fact('When visible, follow the lesser-curvature vein towards its portal-system junction and use spectral Doppler to assess actual flow direction.','Normal-calibre veins may not be visualised; nonvisualisation does not prove absent flow or exclude portal hypertension.','leftGastricMRUS'),
  }),
  'right-gastric-vein':group('FMA15400','right',{ct:fact('Follow lesser-curvature venous return from the pyloric region towards portal drainage, checking any unusual hepatic connection.','Aberrant gastric venous inflow may accompany focal hepatic enhancement or fat changes; do not diagnose a lesion from this atlas.','rightGastricCT')}),
  'right-hepatic-tributaries':group('FMA15791','right',{ct:hepaticTributaryCT,mri:hepaticTributaryMR,ultrasound:hepaticTributaryUS}),
  'left-hepatic-tributaries':group('FMA15794','left',{ct:hepaticTributaryCT,mri:hepaticTributaryMR,ultrasound:hepaticTributaryUS}),
  'left-inferior-epigastric-artery':group('FMA20689','left',{ct:epigastricArteryCT,mri:epigastricArteryMR,ultrasound:epigastricArteryUS}),
  'right-inferior-epigastric-artery':group('FMA20688','right',{ct:epigastricArteryCT,mri:epigastricArteryMR,ultrasound:epigastricArteryUS}),
  'left-inferior-epigastric-vein':group('FMA21164','left',{ct:epigastricVeinCT,mri:epigastricVeinMR,ultrasound:epigastricVeinUS}),
  'right-inferior-epigastric-vein':group('FMA21163','right',{ct:epigastricVeinCT,mri:epigastricVeinMR,ultrasound:epigastricVeinUS}),
};
