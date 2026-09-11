// Original orientation teaching; references are reading links, not image assets.
export const spineImagingGroups = {
  atlas: ['FMA12519'],
  axis: ['FMA12520'],
  cervical: ['FMA12521', 'FMA12522', 'FMA12523', 'FMA12524', 'FMA12525'],
  thoracic: [
    'FMA9165',
    'FMA9187',
    'FMA9209',
    'FMA9248',
    'FMA9922',
    'FMA9945',
    'FMA9968',
    'FMA9991',
    'FMA10014',
    'FMA10037',
    'FMA10059',
    'FMA10081',
  ],
  lumbar: ['FMA13072', 'FMA13073', 'FMA13074', 'FMA13075', 'FMA13076'],
  sacrum: ['FMA16202'],
  cervicalDisc: [
    'FMA25058',
    'FMA13896',
    'FMA13897',
    'FMA13898',
    'FMA13899',
    'FMA13900',
  ],
  thoracicDisc: [
    'FMA10458',
    'FMA13495',
    'FMA13500',
    'FMA13501',
    'FMA13502',
    'FMA13503',
    'FMA13504',
    'FMA13505',
    'FMA13506',
    'FMA13507',
    'FMA13508',
  ],
  lumbarDisc: ['FMA16033', 'FMA16034', 'FMA16035', 'FMA16036', 'FMA16037'],
} as const;
export type SpineImagingGroup = keyof typeof spineImagingGroups;
export const spineImagingReferences = {
  upper:
    'https://surgeryreference.aofoundation.org/spine/trauma/occipitocervical/further-reading/patient-examination-radiological-evaluation-xr-ct-mri',
  lower:
    'https://surgeryreference.aofoundation.org/spine/trauma/thoracolumbar/further-reading/patient-examination-radiological-evaluation-xr-ct-mri',
  ct: 'https://www.radiologyinfo.org/en/info/spinect',
  mri: 'https://www.radiologyinfo.org/en/info/spinemr',
  trauma: 'https://acsearch.acr.org/docs/69359/Narrative/',
  mrAnatomy: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7571515/',
  sacralStudy: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9456416/',
  disc: 'https://orthoinfo.aaos.org/globalassets/pdfs/herniated-disk.pdf',
} as const;
type Reference = keyof typeof spineImagingReferences;
type Topic = {
  body: string;
  bullets: readonly string[];
  references: readonly Reference[];
};
export type SpineImagingModality = 'ct' | 'mri' | 'xray';
const topic = (
  body: string,
  bullets: readonly string[],
  ...references: Reference[]
): Topic => ({ body, bullets, references });
export const spineImagingTopics: Record<
  SpineImagingGroup,
  Record<SpineImagingModality, Topic>
> = {
  atlas: {
    ct: topic(
      'Identify the C1 ring, its anterior/posterior arches and lateral masses around the separate C2 dens. C1 has no vertebral body to match to the body of a typical vertebra.',
      [
        'Compare axial and coronal CT reconstructions; the full ring cannot be judged from one section.',
        'The atlas surface contains neither a fracture line nor a transverse-ligament assessment.',
      ],
      'upper',
    ),
    mri: topic(
      'Use C1 as the bony landmark for the craniocervical soft tissues. MRI examines tissues that the ring mesh alone cannot represent.',
      [
        'Ligaments, spinal cord and adjacent fluid spaces require direct assessment on actual MR images.',
        'There is no C1–C2 intervertebral disc. Missing ligament meshes must not be confused with normal absence.',
      ],
      'mri',
      'upper',
    ),
    xray: topic(
      'On an upper-cervical projection, relate the C1 lateral masses and arches to the dens. Superimposed teeth, skull and positioning can obscure the region.',
      [
        'A rotatable atlas is not an open-mouth radiograph; it does not reproduce projection overlap.',
        'Do not calculate injury thresholds or infer ligament stability from the displayed source spacing.',
      ],
      'upper',
    ),
  },
  axis: {
    ct: topic(
      'Follow the dens into the C2 body, then inspect the posterior elements. These remain one selected source bone, although CT can show their internal structure.',
      [
        'Use multiplanar images to distinguish a dens injury from a posterior-element injury.',
        'Setting C1 aside helps orientation but does not reconstruct fracture displacement or the C2–C3 disc.',
      ],
      'upper',
    ),
    mri: topic(
      'The C2 outline orients assessment around the dens and upper cervical canal. A normal-looking bone surface does not establish intact ligaments or spinal cord.',
      [
        'Check the actual sequence before interpreting marrow or surrounding soft-tissue signal.',
        'The atlas has no cord-injury signal, oedema map or dynamic stability test.',
      ],
      'mri',
    ),
    xray: topic(
      'Distinguish the dens and body of C2 on the available projections. A structure hidden by superimposed anatomy is not necessarily absent.',
      [
        'Upper cervical and C2–C3 relationships are different landmarks; confirm both on the actual examination.',
        'Clinical imaging selection follows trauma criteria, not whichever atlas view looks clearest.',
      ],
      'upper',
      'trauma',
    ),
  },
  cervical: {
    ct: topic(
      'Orient from the vertebral body anteriorly to the posterior arch, pedicles, articular processes and transverse foramina. Follow the same source bone across more than one CT plane.',
      [
        'Bone-window CT can clarify cortical breaks and osseous alignment; a surface-only cutaway does not contain CT attenuation.',
        'A transverse foramen is a bony opening, not proof of a particular artery course or intact vessel.',
      ],
      'ct',
      'mrAnatomy',
    ),
    mri: topic(
      'Use the vertebral body and posterior elements to orient the intervening disc, canal and neural foramina on MRI. Those soft-tissue contents are not represented by the bone selection.',
      [
        'Review marrow, discs and neural structures on their acquired sequences rather than treating atlas colour as MR signal.',
        'Bony shape alone cannot establish cord compression, foraminal nerve injury or ligament integrity.',
      ],
      'mri',
      'mrAnatomy',
    ),
    xray: topic(
      'A lateral cervical radiograph shows projected body/endplate profiles and alignment; a frontal view supplies different information. Image coverage and positioning matter.',
      [
        'Confirm that the cervicothoracic junction is adequately shown; hiding the shoulders in 3D cannot improve an acquired film.',
        'For adult trauma meeting imaging criteria, CT may be the appropriate initial examination; these notes are not a routine X-ray prescription.',
      ],
      'upper',
      'trauma',
    ),
  },
  thoracic: {
    ct: topic(
      'Relate the thoracic vertebral body and posterior arch to the ribs. Follow the costal articulations across acquired planes; one rib contact is not a universal pattern for every thoracic level.',
      [
        'CT can characterize bony fracture morphology and the posterior vertebral wall.',
        'The source mesh contains no fracture fragments, canal compromise measurement or independently segmented joint cartilage.',
      ],
      'lower',
      'ct',
    ),
    mri: topic(
      'Orient the thoracic body, adjacent discs and canal before examining the marrow and soft tissues. The spinal cord is a different structure from the surrounding bony canal.',
      [
        'MRI can assess suspected cord or ligament injury when clinically indicated; it is not required for every thoracic bone finding.',
        'No validated thoracic cord, root or ligament mesh is supplied by this selection.',
      ],
      'lower',
      'mri',
    ),
    xray: topic(
      'Relate body height and endplates to adjacent levels on a lateral view, and identify the rib-bearing region on the frontal projection.',
      [
        'Overlap and rotation can limit interpretation. A single atlas projection cannot reproduce a complete radiographic examination.',
        'In high-risk or unexaminable adult thoracolumbar trauma, ACR favours CT over plain radiographs for initial assessment.',
      ],
      'lower',
      'trauma',
    ),
  },
  lumbar: {
    ct: topic(
      'Locate the lumbar body anteriorly and the pedicles, laminae and articular processes posteriorly. Review the canal boundary separately from the structures inside it.',
      [
        'CT depicts bony detail; reconstructed planes can clarify a fracture or posterior-element defect.',
        'A clipped source surface does not expose trabecular bone or prove an intact pars, endplate or cortex in a patient.',
      ],
      'ct',
      'lower',
    ),
    mri: topic(
      'Use the body and pedicles as landmarks for lumbar discs and neural foramina. The neural tissues must be identified on the real MRI, not inferred from an empty space in this model.',
      [
        'Distinguish vertebral marrow assessment from disc and nerve assessment; their appearances depend on the acquired sequences.',
        'Neither pain origin nor a compressed root can be diagnosed from the selected bone’s external contour.',
      ],
      'mri',
      'mrAnatomy',
    ),
    xray: topic(
      'Compare lumbar body/endplate profiles and overall alignment on the available projections. Disc spaces are indirect intervals between bones, not pictures of the discs themselves.',
      [
        'A static reference cannot measure weight-bearing alignment or dynamic translation.',
        'Normal radiographs do not exclude a herniated disc or nerve abnormality.',
      ],
      'lower',
      'disc',
    ),
  },
  sacrum: {
    ct: topic(
      'Identify the whole sacrum between the pelvic bones, distinguishing the central sacral body from the paired alae and foraminal regions.',
      [
        'CT can define a sacral fracture pattern, but a subtle insufficiency injury may need further assessment despite an inconclusive study.',
        'S1 is not a separate source mesh; dividing the display or matching a single screenshot does not identify a patient fracture zone.',
      ],
      'sacralStudy',
    ),
    mri: topic(
      'Marrow changes can make a sacral insufficiency fracture more apparent on MRI than on a plain film. Confirm that the examination actually covers the symptomatic sacral region.',
      [
        'Interpret fluid-sensitive and other sequences together; the reference mesh has no marrow oedema or fracture signal.',
        'Published study detection rates are not guarantees for a particular patient or this atlas.',
      ],
      'sacralStudy',
    ),
    xray: topic(
      'The sacrum is a projected part of the pelvic ring, not an isolated floating bone on a radiograph. Overlying anatomy can conceal a fracture.',
      [
        'An unremarkable radiograph does not rule out sacral insufficiency injury.',
        'Atlas separation does not simulate a pelvic inlet/outlet projection or establish sacroiliac stability.',
      ],
      'sacralStudy',
    ),
  },
  cervicalDisc: {
    ct: topic(
      'Locate this whole-disc source between its neighbouring vertebral bodies. CT can show the surrounding bony margins, while detailed disc and neural assessment may require MRI.',
      [
        'Compare the disc region and adjacent bone rather than mistaking an osteophyte for a separately supplied disc fragment.',
        'The model has one external disc surface, without an independently segmented annulus or nucleus.',
      ],
      'ct',
      'disc',
    ),
    mri: topic(
      'On real MRI, follow the cervical disc across sagittal and axial sections and relate its posterior margin to the canal and foramina.',
      [
        'Disc signal and contour require sequence-specific assessment; this surface cannot establish degeneration, extrusion or cord involvement.',
        'Use the retained source name and independently confirm the patient level; a nearby landmark is not a registration.',
      ],
      'mrAnatomy',
      'mri',
    ),
    xray: topic(
      'Radiographs depict the interval between adjacent vertebral endplates rather than the disc’s internal tissues. A reduced interval is not a complete diagnosis of the disc.',
      [
        'A herniated disc is not directly demonstrated on a routine plain film.',
        'Explode widens the display for teaching; it does not restore disc height or reproduce a clinical measurement.',
      ],
      'disc',
    ),
  },
  thoracicDisc: {
    ct: topic(
      'Use the neighbouring thoracic bodies and endplates to locate the supplied disc. CT and the atlas answer different questions: acquired cross-sections versus external source geometry.',
      [
        'Inspect accompanying bone on real CT; do not infer normal disc or neural contents from its visible outline.',
        'The T12–L1 disc is unresolved in this source catalogue. Its missing mesh is not normal absence or collapse.',
      ],
      'ct',
    ),
    mri: topic(
      'Trace a thoracic disc relative to the vertebral endplates and spinal canal. Evaluate its signal and any relation to neural structures on actual MR images.',
      [
        'A bright or dark atlas material does not reproduce T1, T2 or fluid-sensitive disc appearance.',
        'There are no separate annular tears, nucleus surfaces or validated thoracic nerve roots in this source selection.',
      ],
      'mri',
      'mrAnatomy',
    ),
    xray: topic(
      'The radiographic disc space is an indirect interval framed by vertebral endplates. It should not be confused with the rendered disc surface.',
      [
        'A normal-looking space does not establish that the disc and adjacent neural tissues are normal.',
        'Source omission at T12–L1 and artificial model separation must never be interpreted as patient disease.',
      ],
      'disc',
    ),
  },
  lumbarDisc: {
    ct: topic(
      'Relate the lumbar disc to the adjacent endplates and posterior bony canal. CT supplies real cross-sectional data that cannot be obtained by slicing this surface mesh.',
      [
        'Disc and nerve questions often require MRI correlation; CT depiction of the surrounding bone is not a nerve-function test.',
        'No calcified fragment, annular fissure or patient attenuation is encoded in this normal reference surface.',
      ],
      'ct',
      'disc',
    ),
    mri: topic(
      'Follow the lumbar disc in more than one plane and relate its posterior margin to the canal and foramina. Disc shape and nerve involvement are separate observations.',
      [
        'MRI can show disc and neural abnormalities; an imaging finding does not by itself establish the source of symptoms.',
        'Whole-disc geometry has no segmented nucleus, annulus, cauda equina or exiting/traversing root to diagnose or simulate.',
      ],
      'mri',
      'disc',
    ),
    xray: topic(
      'Compare the indirect endplate-to-endplate interval, not an imagined visible nucleus. Lumbar radiographs cannot directly diagnose a herniated disc.',
      [
        'Confirm the clinical level independently, especially at the lumbosacral junction; source names are not a patient numbering service.',
        'Display spacing and source pose are not weight-bearing disc-height or instability measurements.',
      ],
      'disc',
    ),
  },
};
