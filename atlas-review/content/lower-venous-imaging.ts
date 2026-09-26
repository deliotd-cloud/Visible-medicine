export type LowerVenousModality = 'ct' | 'mri' | 'ultrasound';
export type LowerVenousGroup = 'thigh' | 'knee' | 'superficial' | 'calf';
export const lowerVenousReferences = {
  anatomy: 'https://anatomy.ttuhscep.edu/anatomytables/veins_lowerlimb.html',
  variation: 'https://www.kjronline.org/DOIx.php?id=10.3348/kjr.2011.12.3.327',
  ctv: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9668790/',
  mrv: 'https://pubmed.ncbi.nlm.nih.gov/25824323/',
  calfMrv: 'https://pubmed.ncbi.nlm.nih.gov/12655580/',
  venousUs: 'https://www.radiologyinfo.org/en/info/venousus',
  acrUs: 'https://accreditationsupport.acr.org/support/solutions/articles/11000084118-exam-requirements-vascular-ultrasound',
  venousAnatomy: 'https://pubs.rsna.org/radiographics/doi/10.1148/rg.220057',
};
type Ref = keyof typeof lowerVenousReferences;
type Topic = { body: string; bullets: string[]; references: Ref[] };
export const lowerVenousSelections: {fmas: string[]; group: LowerVenousGroup; landmark: string; limit: string; references: Ref[]}[] = [
  {fmas:['FMA21188','FMA21189'],group:'thigh',landmark:'The femoral vein belongs to the deep venous system. Avoid the misleading term “superficial femoral vein”.',limit:'One source selection is not separately validated common-femoral and femoral segments or a complete junction map.',references:['venousAnatomy']},
  {fmas:['FMA51042','FMA51043'],group:'thigh',landmark:'The deep femoral (profunda femoris) vein joins the femoral vein proximally. It is distinct from the great saphenous vein.',limit:'The supplied surface does not establish the complete profunda tributaries or a patient-specific confluence.',references:['venousAnatomy']},
  {fmas:['FMA44328','FMA44329'],group:'knee',landmark:'The popliteal vein continues as the femoral vein at the adductor hiatus. Its relationship to the artery can vary.',limit:'The atlas is one source arrangement, not proof that every patient has a single channel or the same venous course.',references:['variation']},
  {fmas:['FMA21379','FMA21380'],group:'superficial',landmark:'The great saphenous vein follows the medial superficial lower limb and drains into the femoral venous system.',limit:'The source surface does not supply validated valve leaflets, every perforator, or a separate saphenofemoral-junction segment.',references:['anatomy']},
  {fmas:['FMA44334','FMA44335'],group:'superficial',landmark:'The small saphenous vein usually reaches the popliteal vein; its proximal termination is variable.',limit:'A source endpoint must not be used to assign a patient’s saphenopopliteal junction or an intersaphenous connection.',references:['venousAnatomy']},
  {fmas:['FMA44336','FMA44337'],group:'calf',landmark:'Anterior tibial veins accompany the anterior tibial artery. Deep calf veins are usually paired.',limit:'This selection groups two archived source files. File count is not clinical confirmation of two continuous patent channels.',references:['venousAnatomy']},
  {fmas:['FMA44338','FMA44339'],group:'calf',landmark:'Posterior tibial veins are part of the deep calf system and accompany the corresponding artery.',limit:'One archived file is not proof of a solitary vein. The full paired-vein, muscular-vein and perforator network is not established.',references:['venousAnatomy']},
];
// Original short teaching drafts. No publisher images, tables or copied passages.
export const lowerVenousTopics: Record<LowerVenousGroup,Record<LowerVenousModality,Topic>> = {
  thigh: {
    ct:{body:'CT venography can show femoral venous channels and their relationship to the accompanying artery. Duplication and variant courses occur; a single atlas surface is not a universal pattern.',bullets:['Venous enhancement depends on acquisition timing. A poorly opacified channel is not equivalent to an absent mesh.'],references:['variation','ctv']},
    mri:{body:'MR venography uses a venous acquisition rather than simply any thigh MRI. Research has demonstrated noncontrast peripheral MRV with sequence-specific suppression of background signal.',bullets:['The model is an orientation aid only: its colour and outline contain no MR signal, clot characterization or evidence of patency.'],references:['mrv']},
    ultrasound:{body:'Venous ultrasound combines anatomical imaging with acquired compression and Doppler information. The femoral vein, proximal profunda and saphenofemoral junction are distinct landmarks in the examination.',bullets:['A visible vein in this atlas has no measured compression response or spectral waveform. Removing overlying tissue is not an ultrasound examination.'],references:['acrUs']},
  },
  knee: {
    ct:{body:'Around the knee, CT venography can demonstrate the popliteal venous course relative to the artery and reveal more than one channel.',bullets:['Contrast timing matters. The model supplies neither a contrast-filled lumen nor a validated classification of an acquired filling defect.'],references:['variation','ctv']},
    mri:{body:'Dedicated peripheral MRV can depict deep veins. A routine knee MR series is not interchangeable with a venographic acquisition.',bullets:['Use the popliteal surface for location, not to infer flow or exclude thrombus from a smooth outline. No scan is registered to this source.'],references:['mrv']},
    ultrasound:{body:'The popliteal vein is assessed behind the knee using acquired grey-scale, compression and Doppler observations. Vein identification remains separate from interpreting flow.',bullets:['The atlas does not simulate probe pressure, patient position or a waveform. A mesh gap cannot be classified as venous obstruction.'],references:['acrUs','venousUs']},
  },
  superficial: {
    ct:{body:'CT venography may depict superficial as well as deep venous routes. Anatomical position helps distinguish a saphenous vein from the deeper venous system.',bullets:['Static source geometry does not demonstrate reflux, valve competence or a complete connection to the deep veins. Acquisition-dependent enhancement is not reproduced here.'],references:['variation','ctv']},
    mri:{body:'Venous visibility depends on the MR acquisition and its contrast mechanism. Published noncontrast peripheral MRV results do not establish equivalent visibility on every routine leg MR series.',bullets:['Trace the named superficial route as an anatomical reference only. There is no sequence simulation or encoded valve function in this surface.'],references:['mrv']},
    ultrasound:{body:'Ultrasound can map superficial veins and assess acquired blood-flow behaviour. Venous-insufficiency assessment distinguishes the great and small saphenous routes and their junctions.',bullets:['A coloured saphenous surface is not evidence of reflux. Proximal termination and communications need assessment in the actual patient.'],references:['acrUs','venousUs']},
  },
  calf: {
    ct:{body:'CTV appearance depends on venous opacification, not just whether a vessel is present anatomically. A source-file endpoint cannot establish a patient’s calf-vein confluence.',bullets:['The atlas lacks validated lumina, enhancement and complete calf-vein coverage. Do not interpret missing source detail as an acquired filling defect.'],references:['ctv']},
    mri:{body:'A dedicated flow-independent calf MRV technique has been studied for venous mapping. This feasibility evidence is sequence-specific, not a promise that all calf veins are visible on routine MRI.',bullets:['The grouped source surfaces contain no MR signal or diagnostic-performance measurement. Paired anatomy and acquired patency require separate evaluation.'],references:['calfMrv']},
    ultrasound:{body:'Small deep calf veins can be difficult to see with ultrasound. Failure to identify a vessel in a particular view is not itself evidence that it is anatomically absent.',bullets:['The anterior/posterior tibial selection is an orientation aid, not a complete calf examination. This model supplies neither an acoustic window nor compression or Doppler findings.'],references:['venousUs']},
  },
};
