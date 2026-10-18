import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface CranialBoneLesson {
  // Single midline identity, or right/left pair in that order. Includes hyoid,
  // which is a neck bone, not part of the skull proper.
  fmaIds: readonly [string] | readonly [string, string];
  anatomy: string;
  function: string;
  distinction: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const skull = books + 'NBK499834/';
const nasal = books + 'NBK544232/';
const boneLimit =
  'Reference bone surface: named landmarks, sutures, internal canals, marrow and cortical thickness are not independently segmented or validated. A cut surface is not an acquired CT section.';

// Brief original factual teaching, not imported publisher prose or illustrations.
export const cranialBoneLessons: readonly CranialBoneLesson[] = [
  {
    fmaIds: ['FMA52734'],
    anatomy:
      'The frontal bone forms the forehead and much of the orbital roofs, meeting the parietal bones at the coronal suture.',
    function:
      'Supports the anterior cranial enclosure and the upper orbital framework.',
    distinction:
      'The frontal sinus and its drainage are not established by this exterior selection; no sinus volume or developmental stage is inferred.',
    references: [skull],
  },
  {
    fmaIds: ['FMA52788', 'FMA52789'],
    anatomy:
      'A parietal bone forms the upper side of the cranial vault. The pair meets along the sagittal suture.',
    function:
      'Contributes a protective bony roof and side wall around the brain.',
    distinction:
      'Source separation at a bone boundary does not simulate suture flexibility, childhood growth, or a safe cranial opening.',
    references: [skull],
  },
  {
    fmaIds: ['FMA52735'],
    anatomy:
      'The occipital bone forms the back and part of the skull base around the foramen magnum. Its condyles articulate with C1.',
    function:
      'Protects posterior cranial contents and transfers head load to the upper cervical spine.',
    distinction:
      'The opening, condyles and adjacent neural/vascular structures are not independently validated substructures or measured clearances.',
    references: [books + 'NBK541093/'],
  },
  {
    fmaIds: ['FMA52738', 'FMA52739'],
    anatomy:
      'The temporal bone contributes to the lateral skull and its base. The petrous region houses the inner ear; its mandibular fossa participates in the jaw joint.',
    function:
      'Provides protection and a bony base for the ear and temporomandibular articulation.',
    distinction:
      'This selection is not a separately resolved labyrinth, ossicular chain, facial canal, mastoid air-cell system or TMJ disc.',
    references: [skull, books + 'NBK532292/'],
  },
  {
    fmaIds: ['FMA52736'],
    anatomy:
      'The sphenoid has a central body, greater and lesser wings, and pterygoid processes. The sella turcica lies on its body beneath the pituitary.',
    function:
      'Links multiple skull-base bones and provides support, muscle attachments and neurovascular passageways.',
    distinction:
      'Its foramina, sphenoid sinus and pituitary relationships are context, not individually validated channels or a surgical access route.',
    references: [books + 'NBK544308/'],
  },
  {
    fmaIds: ['FMA52740'],
    anatomy:
      'The ethmoid contributes the cribriform plate and perpendicular septal plate. Its superior and middle conchae project into the nasal cavity.',
    function:
      'Supports the upper nasal framework and the boundary between the nose and anterior cranial region.',
    distinction:
      'The inferior nasal concha is a separate bone. Olfactory nerve perforations and individual ethmoid air cells are not certified by this mesh.',
    references: [nasal, skull],
  },
  {
    fmaIds: ['FMA53647', 'FMA53648'],
    anatomy:
      'The paired nasal bones form the bony bridge of the nose above its cartilaginous portion.',
    function: 'Support the upper external nasal framework.',
    distinction:
      'These small bones are not the entire nasal septum, nasal valves or cartilaginous nose; airflow and patency are not simulated.',
    references: [skull, nasal],
  },
  {
    fmaIds: ['FMA9710'],
    anatomy:
      'The vomer forms an inferior-posterior part of the bony nasal septum, below the ethmoid perpendicular plate.',
    function:
      'Contributes structural support to the partition between the nasal cavities.',
    distinction:
      'It is not the whole septum. The bone label does not diagnose septal deviation or establish airway obstruction.',
    references: [nasal],
  },
  {
    fmaIds: ['FMA54737', 'FMA54738'],
    anatomy:
      'An independent curved bone on the lateral nasal wall, below the ethmoid conchae; the inferior meatus lies beneath it.',
    function:
      'Provides a scaffold for the mucosa that helps condition inspired air. Bone itself does not secrete mucus.',
    distinction:
      'The bone is not the complete mucosa-covered turbinate. Nasal-cycle congestion, ciliary transport and airflow cannot be read from this fixed surface.',
    references: [nasal],
  },
  {
    fmaIds: ['FMA53645', 'FMA53646'],
    anatomy:
      'The lacrimal bone lies at the anterior medial orbit. With the maxilla, it contributes to the bony fossa for the lacrimal sac.',
    function:
      'Supports the bony surroundings of part of the tear-drainage pathway.',
    distinction:
      'Lacrimal bone, sac and tear-producing gland are different structures. This surface does not establish duct patency or tear-pump function.',
    references: [books + 'NBK531487/'],
  },
  {
    fmaIds: ['FMA53649', 'FMA53650'],
    anatomy:
      'A maxilla contributes the upper jaw, anterior hard palate, orbital floor and lateral nasal wall. Its alveolar process supports the upper teeth.',
    function:
      'Transmits chewing forces through the midface and separates the oral and nasal spaces as part of the hard palate.',
    distinction:
      'Dental roots, periodontal tissues, maxillary sinus walls and infraorbital canal are not independently resolved by this bone selection.',
    references: [books + 'NBK538527/', nasal],
  },
  {
    fmaIds: ['FMA53655', 'FMA53656'],
    anatomy:
      'The palatine bone has a horizontal plate in the posterior hard palate and a perpendicular plate in the lateral nasal wall.',
    function:
      'Helps separate the nasal and oral cavities and supports their posterior bony framework.',
    distinction:
      'Palatine bone is not the soft palate or its muscles. Palatal canals, mucosa and swallowing closure are not separately validated here.',
    references: [nasal],
  },
  {
    fmaIds: ['FMA52892', 'FMA52893'],
    anatomy:
      'The zygomatic bone forms the cheek prominence and part of the lateral orbit and orbital floor. It joins the temporal bone to complete the zygomatic arch.',
    function:
      'Supports the midface and orbital rim and transfers forces associated with mastication.',
    distinction:
      'The whole arch is not contained in this bone alone. Sutural interfaces, foramina and orbital contents remain unvalidated relationships.',
    references: [books + 'NBK544257/'],
  },
  {
    fmaIds: ['FMA52748'],
    anatomy:
      'The mandible has a curved body and two rami, with coronoid and condylar processes. The condyles participate in the paired temporomandibular joints.',
    function:
      'Supports the lower teeth and serves as the mobile bony lever for muscle-driven jaw movement.',
    distinction:
      'One adult bone selection, not independently moving left/right halves. The TMJ disc, bite contact and mandibular canal are not validated movement or procedural guides.',
    references: [books + 'NBK532292/'],
  },
  {
    fmaIds: ['FMA52749'],
    anatomy:
      'The hyoid lies in the anterior neck above the thyroid cartilage, with a body and greater/lesser horns. It has no direct bony articulation with another bone.',
    function:
      'Anchors muscles and ligaments involved in tongue, laryngeal and swallowing coordination.',
    distinction:
      'FJ2772 and FJ3201 are grouped under one hyoid identity; their union and extent require review. They are not certified body-versus-horn segments or evidence of a particular fusion age. The hyoid is not part of the skull proper.',
    references: [books + 'NBK539726/'],
  },
];
const byFma = new Map(
  cranialBoneLessons.flatMap((l) =>
    l.fmaIds.map(
      (id, i) =>
        [
          id,
          {
            lesson: l,
            side:
              l.fmaIds.length === 1 ? 'midline' : i === 0 ? 'right' : 'left',
          },
        ] as const,
    ),
  ),
);
export function cranialBoneLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    s.system !== 'skeleton' ||
    s.category !== 'bone' ||
    s.region !== 'head-neck' ||
    !s.regions.includes('head-neck') ||
    (tab !== 'anatomy' && tab !== 'function')
  )
    return undefined;
  const match = byFma.get(s.fmaId);
  if (!match || s.laterality !== match.side) return undefined;
  const l = match.lesson;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Structure & relationships' : 'Role & limits'} · draft`,
    body: l[tab],
    bullets: [
      l.distinction,
      ...(tab === 'anatomy'
        ? [
            boneLimit,
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}. Boundaries and attachments require independent review.`,
          ]
        : []),
    ],
    note: [
      'Independent anatomical and clinical review pending. Explode/cut views are not tissue interiors, operative cleavage planes, physiological jaw/swallowing motion or acquired imaging.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
