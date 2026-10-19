/** Original factual synthesis; citations are not permissions to reuse article media. */
export const connectiveProjectionXrayGroups = {
  wrist: ['FMA40120', 'FMA40121'],
  longPlantar: ['FMA44249', 'FMA44250'],
} as const;

export const connectiveProjectionXrayTopics = {
  wrist: {
    body: 'Use the carpal bones to orient the volar wrist: scaphoid and trapezium on the radial side, pisiform and hamate on the ulnar side. Anatomical research places a deeper transverse fibrous lamina between these bones. Relating that anatomy to projected bony landmarks is an educational inference, not a validated X-ray outline of the retinaculum.',
    bullets: [
      'Bone profiles depend on projection and overlap. A projected bone edge does not specify a ligament insertion footprint or the full source-mesh boundary.',
      'A dissection/histology study with MRI correlation distinguished superficial fascial reinforcement from the deeper transverse carpal ligament. The broad source label “flexor retinaculum” does not prove that this mesh is only that deeper lamina.',
      'One published left-wrist case had no hook-of-hamate abnormality on a dedicated radiograph, yet a partial retinacular attachment tear was described on MRI. This exceptional case illustrates why a normal-looking bony landmark cannot certify soft-tissue integrity; it supplies no prevalence or sensitivity estimate.',
    ],
    citations: [
      'https://pubmed.ncbi.nlm.nih.gov/20346594/',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC7911075/',
    ],
  },
  longPlantar: {
    body: 'Locate the calcaneus–cuboid joint in the lateral column of the foot, then the cuboid and metatarsal bases. These bones orient the plantar neighborhood of the long plantar ligament. Transferring a dissection relationship to a radiograph is an anatomical inference, not direct depiction of the ligament or its attachment margins.',
    bullets: [
      'In an 18-cadaver-foot experiment with a radiopaque-painted cuboid surface, an oblique projection reduced overlap at the calcaneocuboid joint. This studied bony joint-line visualization, not long-plantar-ligament visibility or diagnostic performance in patients.',
      'A separate 50-leg dissection series found different long-plantar shapes and fibers blending with the fibularis (peroneus) longus canal before reaching metatarsal bases. Do not impose one fixed distal footprint on a plain film.',
      'Long and short plantar ligaments are distinct components of the plantar calcaneocuboid complex; the shorter component lies deep to the long plantar ligament. Naming their shared bony neighborhood does not separate their fibers on X-ray.',
      'This is a bony orientation exercise. Joint alignment alone cannot establish this particular ligament’s continuity, tear status or the accuracy of its recovered 3D boundary.',
    ],
    citations: [
      'https://journals.sagepub.com/doi/10.1177/107110079902000307',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC7792160/',
    ],
  },
} as const;

export const connectiveProjectionXrayNote = 'Original source-bound educational draft; revision-bound radiologist review pending. Bony orientation is not validated ligament visibility. Existing recovered CC-BY-4.0 source boundaries remain unvalidated. No scan, figure, patient example, acquisition instruction, diagnosis or spatial registration is imported or implied. Atlas, imaging-case and paid-lecture access remain independent.';
