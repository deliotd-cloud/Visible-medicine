import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface OrganLesson {
  fmaIds: readonly string[];
  region: 'head-neck' | 'thorax' | 'abdomen' | 'pelvis';
  anatomy: string;
  function: string;
  distinction: string;
  references: readonly string[];
}
const reproductive =
  'https://training.seer.cancer.gov/anatomy/reproductive/male/';
// Brief original factual teaching, not imported publication text or new geometry.
export const organLessons: readonly OrganLesson[] = [
  {
    fmaIds: ['FMA9600'],
    region: 'pelvis',
    anatomy:
      'A gland below the bladder surrounding the proximal male urethra. Its ducts discharge into the prostatic urethra.',
    function: 'Adds glandular fluid to semen; it does not produce sperm.',
    distinction:
      'Adult-male reference surface. Prostatic zones, capsule, ducts and neurovascular bundles are not separate validated layers here.',
    references: [reproductive + 'glands.html'],
  },
  {
    fmaIds: ['FMA7211', 'FMA7212'],
    region: 'pelvis',
    anatomy:
      'A paired gonad in the scrotum. Seminiferous tubules lie within lobules enclosed by the tunica albuginea; interstitial cells lie between the tubules.',
    function:
      'Seminiferous tubules support sperm production; interstitial Leydig cells produce androgens. These are distinct from epididymal maturation and storage.',
    distinction:
      'The pelvis navigation group includes this scrotal organ; it does not mean the testis lies inside the pelvic cavity. No microscopic tubules or cell populations are segmented.',
    references: [reproductive + 'testes.html'],
  },
  {
    fmaIds: ['FMA19387', 'FMA19388'],
    region: 'pelvis',
    anatomy:
      'A paired accessory gland behind the bladder. Its duct joins the ductus deferens to form an ejaculatory duct.',
    function:
      'Contributes fructose-containing secretions to semen. The seminal vesicle is a secretory gland, not the site of sperm production.',
    distinction:
      'A gland surface does not establish a patent ejaculatory duct, internal folds or complete connections to the remaining reproductive tract.',
    references: [reproductive + 'glands.html'],
  },
  {
    fmaIds: ['FMA18256', 'FMA18257'],
    region: 'pelvis',
    anatomy:
      'A coiled duct along the upper and posterior testis, connecting efferent ducts with the ductus deferens.',
    function:
      'Supports sperm maturation during transit and storage chiefly in its tail before onward transport.',
    distinction:
      'Selected adult-male organ surface, not an uncoiled duct or independently segmented head, body, tail and lumen. No fertility assessment is possible from it.',
    references: [reproductive + 'duct.html'],
  },
  {
    fmaIds: ['FMA15571', 'FMA15572'],
    region: 'abdomen',
    anatomy:
      'A muscular tube from the renal pelvis to the bladder, descending behind the peritoneum and continuing into the pelvis.',
    function:
      'Peristaltic contractions propel urine towards the bladder. Urine formation belongs to the kidney, not the ureter.',
    distinction:
      'Reference surface only: lumen calibre, wall layers, ureteric junctions and patency have not been validated. Explode distances are not physiological displacement.',
    references: [
      'https://training.seer.cancer.gov/anatomy/urinary/components/ureters.html',
    ],
  },
  {
    fmaIds: ['FMA19667'],
    region: 'pelvis',
    anatomy:
      'The represented male urethra leads from the bladder through the prostate and pelvic floor into the penis. This entry does not represent female urethral anatomy.',
    function:
      'Provides the outward route for urine and, during ejaculation, semen. It is distinct from the ureter linking kidney and bladder.',
    distinction:
      'Adult-male source only. No patent lumen, separate urethral segments, continence mechanism or catheter route is established by this surface.',
    references: [
      reproductive + 'duct.html',
      'https://training.seer.cancer.gov/anatomy/urinary/components/',
    ],
  },
  {
    fmaIds: ['FMA9607'],
    region: 'thorax',
    anatomy:
      'A two-lobed lymphoid organ behind the sternum, anterior to the great vessels. Its relative size decreases with age after childhood.',
    function:
      'Supports the maturation of T lymphocytes before their participation in immune responses elsewhere.',
    distinction:
      'Two source lobes are grouped into one selectable thymus. This fixed reference does not show age-related involution, cortical/medullary microanatomy or immune activity.',
    references: [
      'https://training.seer.cancer.gov/anatomy/lymphatic/components/thymus.html',
    ],
  },
  {
    fmaIds: ['FMA13889'],
    region: 'head-neck',
    anatomy:
      'An endocrine gland seated in the sphenoid sella turcica and connected to the hypothalamus. Anterior and posterior portions have different organisation.',
    function:
      'The anterior pituitary synthesises hormones regulating growth, reproduction and other endocrine glands. The posterior pituitary stores and releases hypothalamic vasopressin and oxytocin; it does not synthesise those two hormones.',
    distinction:
      'One source gland surface: lobes, stalk pathways and cellular populations are not independently segmented or clinically validated.',
    references: ['https://www.yourhormones.info/glands/pituitary-gland/'],
  },
  {
    fmaIds: ['FMA12514', 'FMA12515'],
    region: 'head-neck',
    anatomy:
      'The globe contains optical media and a light-sensitive retina within its coats. This selectable globe groups several source components rather than offering complete layer-by-layer ocular dissection.',
    function:
      'Cornea and lens focus light; retinal photoreceptors convert it into neural signals passed through the optic nerve for brain processing. These roles are teaching context, not simulated vision.',
    distinction:
      'The source sets differ: right globe has eight components, left has nine including FJ1282, labelled left anterior chamber in the ISA index. Neither set independently identifies a retinal component. Do not infer matched or complete internal layers.',
    references: [
      'https://www.nei.nih.gov/learn-about-eye-health/healthy-vision/how-eyes-work',
    ],
  },
  {
    fmaIds: ['FMA59102', 'FMA59103'],
    region: 'head-neck',
    anatomy:
      'A tear-producing gland above the eye. It is distinct from the drainage passages at the inner corner of the eye.',
    function:
      'Contributes the watery component of tears that keeps the ocular surface moist. Blinking spreads the tear film; other glands also contribute to it.',
    distinction:
      'Whole source gland only, without independently authored lobes, microscopic ducts or a complete tear-drainage apparatus.',
    references: [
      'https://www.nei.nih.gov/eye-health-information/healthy-vision/how-eyes-work/how-tears-work',
    ],
  },
  {
    fmaIds: ['FMA59802', 'FMA59803'],
    region: 'head-neck',
    anatomy:
      'A major salivary gland below the mandible with superficial and deep portions related to mylohyoid. Its main duct opens in the floor of the mouth beside the lingual frenulum.',
    function:
      'Produces mixed, predominantly serous saliva supporting oral lubrication and initial starch digestion. Its contribution varies with stimulation.',
    distinction:
      'This whole-organ surface does not independently separate lobes, acini, ducts or the lingual-nerve relationship. It is not the sublingual gland.',
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK542272/'],
  },
  {
    fmaIds: ['FMA59804', 'FMA59805'],
    region: 'head-neck',
    anatomy:
      'A major salivary gland below the floor-of-mouth mucosa, above mylohyoid and lateral to the tongue.',
    function:
      'Produces mixed saliva with a predominantly mucous contribution, helping lubricate the oral cavity for food handling and swallowing.',
    distinction:
      'Whole source organ only. Duct patterns vary and are not independently modelled; this is not a validated duct or gland-excision map.',
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK535426/'],
  },
  {
    fmaIds: ['FMA54640'],
    region: 'head-neck',
    anatomy:
      'A mucosa-covered muscular organ with oral and pharyngeal portions. Intrinsic muscles reshape it; extrinsic muscles move it relative to surrounding structures.',
    function:
      'Manipulates food for chewing and swallowing, shapes speech and supports taste and somatic sensation. Motor control and sensory pathways are distinct.',
    distinction:
      'A whole-tongue reference is not an independently dissected intrinsic-muscle set or taste map. CN XII is not the sole nerve for all tongue functions.',
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK507782/'],
  },
  {
    fmaIds: ['FMA14544'],
    region: 'pelvis',
    anatomy:
      'The terminal large-intestinal reservoir between the sigmoid colon and anal canal. It is represented separately from the large-intestine aggregate.',
    function:
      'Temporarily stores stool and participates in coordinated evacuation. Continence and defecation also depend on sphincters, pelvic-floor muscles and neural control.',
    distinction:
      'No independently authored rectal wall layers, mesorectum or complete anorectal continence complex. The displayed surface does not establish luminal continuity.',
    references: [
      'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works',
    ],
  },
  {
    fmaIds: ['FMA14542'],
    region: 'abdomen',
    anatomy:
      'A blind-ending appendage of the caecum. Its wall contains lymphoid tissue, which is generally more prominent earlier in life.',
    function:
      'Its gut-associated lymphoid tissue provides an immune role at the intestinal mucosa. This does not establish an essential digestive function or quantify a microbiome benefit.',
    distinction:
      'Reference surface only: variable position, wall layers, mesoappendix and luminal continuity are not reconstructed. Clipping cannot diagnose appendicitis.',
    references: [
      'https://histologyguide.com/slideview/MH-122-appendix/14-slide-1.html',
      'https://histologyguide.com/slidebox/10-lymphoid-system.html',
    ],
  },
];
const byFma = new Map(
  organLessons.flatMap((l) => l.fmaIds.map((id) => [id, l] as const)),
);
export function organLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    s.system !== 'organs' ||
    s.category !== 'organ' ||
    (tab !== 'anatomy' && tab !== 'function')
  )
    return undefined;
  const l = byFma.get(s.fmaId);
  if (!l || !s.regions.includes(l.region)) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Structure & relationships' : 'Role & limits'} · draft`,
    body: l[tab],
    bullets: [
      l.distinction,
      ...(tab === 'anatomy'
        ? [
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}. Boundaries and relationships require independent review.`,
          ]
        : []),
    ],
    note: [
      'Independent anatomical and clinical review pending. Explode/cut views are not tissue interiors, physiological simulations or acquired imaging.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
