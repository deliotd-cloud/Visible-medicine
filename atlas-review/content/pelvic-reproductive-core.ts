// Original, introductory teaching for exact adult-male root identities only.
// These statements describe usual anatomy, not features verified inside a source mesh.
export const pelvicReproductiveCoreReferences = {
  glands: 'https://training.seer.cancer.gov/anatomy/reproductive/male/glands.html',
  prostateAnatomy: 'https://training.seer.cancer.gov/prostate/anatomy/',
  testes: 'https://training.seer.cancer.gov/anatomy/reproductive/male/testes.html',
  duct: 'https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html',
  urethra: 'https://training.seer.cancer.gov/anatomy/urinary/components/urethra.html',
} as const;

export const pelvicReproductiveCoreGroups = {
  prostate: ['FMA9600'],
  testis: ['FMA7211', 'FMA7212'],
  seminalVesicle: ['FMA19387', 'FMA19388'],
  epididymis: ['FMA18256', 'FMA18257'],
  urethra: ['FMA19667'],
} as const;

export const pelvicReproductiveCoreTopics = {
  prostate: {
    anatomy: {
      title: 'Position and duct relationship',
      body: 'The prostate lies below the bladder, in front of the rectum, and surrounds the first part of the male urethra. Its base faces upward toward the bladder and its apex downward. Small gland ducts open into the prostatic urethra.',
      bullets: [
        'Conceptual zones: peripheral posterior and lateral tissue; central tissue around the ejaculatory ducts; transition tissue around the proximal urethra; and supporting anterior fibromuscular stroma. These zones are not separately segmented.',
        'This gland is distinct from the seminal vesicles behind the bladder.',
      ],
    },
    function: {
      title: 'Secretory role',
      body: 'Prostatic fluid joins sperm and other gland secretions in semen. The prostate contributes fluid; sperm production occurs in the testes, while maturation occurs during passage through the epididymides.',
      bullets: [],
    },
    references: ['glands', 'prostateAnatomy', 'testes', 'duct'],
    limit: 'Adult-male reference root only; gland zones, short ducts and the urethral lumen are not separate validated layers.',
  },
  testis: {
    anatomy: {
      title: 'Scrotal gonad and internal pathway',
      body: 'Each testis lies in the scrotum, outside the pelvic cavity. Its tunica albuginea sends partitions inward, forming lobules with seminiferous tubules. The usual outlet sequence proceeds through straight tubules, rete testis and efferent ducts toward the epididymis.',
      bullets: ['Pelvis is the navigation group, not a claim that the testis is intrapelvic.'],
    },
    function: {
      title: 'Sperm and androgen production',
      body: 'Sperm develop within seminiferous tubules, where Sertoli cells support developing cells. Leydig cells between tubules produce androgens. Production in the testis differs from subsequent epididymal maturation and storage.',
      bullets: [],
    },
    references: ['testes', 'duct'],
    limit: 'Adult-male scrotal root only; capsule layers, lobules and microscopic duct connections are not independently segmented.',
  },
  seminalVesicle: {
    anatomy: {
      title: 'Posterior gland and duct junction',
      body: 'Each seminal vesicle lies behind the bladder. Its duct joins the same-side ductus deferens to form an ejaculatory duct that enters the prostatic urethra.',
      bullets: ['The paired glands are separate from the prostate.'],
    },
    function: {
      title: 'Contribution to semen',
      body: 'The seminal vesicles add fructose-containing fluid to semen, providing an energy source for sperm. They supply secretions rather than producing sperm. After testicular production and epididymal transit, sperm travel through the ductus deferens into the ejaculatory duct, not through the seminal vesicle.',
      bullets: [],
    },
    references: ['glands', 'duct'],
    limit: 'Adult-male whole-gland roots; internal folds, gland ducts, junctions and lumen continuity are not validated.',
  },
  epididymis: {
    anatomy: {
      title: 'Coiled duct beside the testis',
      body: 'The epididymis follows the upper and posterior side of its testis. Efferent ducts bring sperm into its coiled passage; its tail continues into the ductus deferens.',
      bullets: [],
    },
    function: {
      title: 'Maturation and storage',
      body: 'Sperm mature during transit through the epididymis and are stored chiefly in its tail before moving into the ductus deferens. This differs from sperm production within testicular tubules.',
      bullets: [],
    },
    references: ['duct', 'testes'],
    limit: 'Adult-male whole-duct roots; the coiled lumen, subregions and connections are not separately validated.',
  },
  urethra: {
    anatomy: {
      title: 'Adult-male outlet and named regions',
      body: 'The male urethra leads from the bladder to the external opening. Its usual regions are prostatic, membranous through the pelvic floor, and spongy through the penis. The ureters instead bring urine to the bladder.',
      bullets: ['The source represents an adult-male urethra, not female urethral anatomy.'],
    },
    function: {
      title: 'Adult-male urinary and reproductive passage',
      body: 'The urethra provides the final route for urine and, during ejaculation, semen. The prostatic segment receives ejaculatory and prostatic gland ducts; passage through it is distinct from sperm production or maturation.',
      bullets: [],
    },
    references: ['urethra', 'duct'],
    limit: 'Adult-male root only; named regions, wall layers, sphincters and a patent lumen are not separately validated.',
  },
} as const;
