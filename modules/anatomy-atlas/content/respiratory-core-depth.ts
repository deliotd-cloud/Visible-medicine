// Original teaching drafts for exact admitted thoracic roots. Described anatomy is
// conceptual; a source surface does not verify its internal layers or boundaries.
export const respiratoryCoreDepthReferences = {
  lung: 'https://training.seer.cancer.gov/lung/anatomy/',
  passages: 'https://training.seer.cancer.gov/anatomy/respiratory/passages/bronchi.html',
  trachea: 'https://training.seer.cancer.gov/anatomy/respiratory/passages/larynx.html',
  physiology: 'https://www.nhlbi.nih.gov/health/lungs/respiratory-system',
  thorax: 'https://anatomy.ttuhscep.edu/anatomytables/viscera_alpha.html',
  pleura: 'https://anatomy.ttuhscep.edu/schemes/thorax_wall_tables.html',
  hilum: 'https://anatomy.ttuhscep.edu/schemes/lungs_tables.html',
} as const;

export const respiratoryCoreDepthGroups = {
  rightLung: ['FMA7309'],
  leftLung: ['FMA7310'],
  trachea: ['FMA7394'],
  rightBronchus: ['FMA7395'],
  leftBronchus: ['FMA7396'],
} as const;

export const respiratoryCoreDepthTopics = {
  rightLung: {
    anatomy: {
      title: 'Apex, base, hilum and lobes',
      body: 'The right lung rises to an apex above its broad diaphragmatic base. At its medial hilum, the main bronchus and pulmonary vessels enter or leave. Its upper, middle and lower lobes are arranged around horizontal and oblique fissures.',
      bullets: [
        'Visceral pleura covers the lung; parietal pleura lines the surrounding cavity. These conceptual layers and the intervening pleural space are distinct from lung tissue.',
        'The nested lobe branch groups identify supplied airway and vessel components, not complete lobar tissue envelopes or fissure surfaces.',
      ],
    },
    references: ['lung', 'hilum', 'pleura'],
    limit: 'Grouped right-lung source surfaces do not resolve the apex, base, hilum, pleural layers, fissures or bronchopulmonary segments as validated selectable boundaries.',
  },
  leftLung: {
    anatomy: {
      title: 'Apex, base, hilum and two lobes',
      body: 'The left lung has an apex above its diaphragmatic base and a medial hilum for the main bronchus and pulmonary vessels. Its oblique fissure separates upper and lower lobes. The cardiac notch leaves space for the heart; the lingula belongs to the upper lobe.',
      bullets: [
        'There is no left middle lobe. Visceral pleura covers the lung and parietal pleura lines the surrounding cavity; neither layer is interchangeable with a lobe.',
        'The nested upper and lower branch groups are airway and vessel selections, not a complete map of lung tissue or its fissure.',
      ],
    },
    references: ['lung', 'hilum', 'pleura'],
    limit: 'Grouped left-lung source surfaces do not establish pleural layers, a complete lingular boundary, fissure completeness or segmental anatomy.',
  },
  trachea: {
    anatomy: {
      title: 'Supported airway and bifurcation',
      body: 'The trachea continues downward from the larynx, anterior to the oesophagus, and divides at the carina into right and left main bronchi. Its cartilage supports the airway while a softer posterior wall faces the oesophagus.',
      bullets: [
        'Its course includes the neck as well as the thorax; the Atlas thorax category is a navigation assignment.',
        'Cartilage, mucosal lining, posterior wall, carina and an open lumen are anatomical concepts here, not separately verified mesh layers.',
      ],
    },
    function: {
      title: 'Air conduction and mucociliary clearance',
      body: 'The trachea conducts air between the larynx and main bronchi. Cartilage helps resist collapse, while the posterior wall can accommodate the neighbouring oesophagus. Mucus traps inhaled particles; cilia move it toward the throat for removal.',
      bullets: [
        'Air conduction and airway clearance differ from breathing mechanics and oxygen–carbon dioxide exchange at distal alveoli.',
        'This static surface does not show airflow, mucus movement, airway calibre, cartilage mechanics or gas transfer.',
      ],
    },
    references: ['trachea', 'physiology', 'thorax'],
    limit: 'Single tracheal source surface; cartilage rings, posterior wall, cilia, carina and lumen continuity are not independently segmented or validated.',
  },
  rightBronchus: {
    anatomy: {
      title: 'Right main-airway route',
      body: 'The right main bronchus runs from the tracheal division toward the right lung hilum. In usual anatomy it is shorter, wider and more vertical than the left. Its downstream lobar routes serve upper, middle and lower lobes.',
      bullets: [
        'The proximal selected segment does not independently show all three lobar bronchi or their junctions.',
      ],
    },
    function: {
      title: 'Conduction toward three lobes',
      body: 'The right main bronchus carries air toward branches serving the three right-lung lobes. Supported conducting airways move air inward and outward; distal alveoli, rather than this bronchial segment, are where oxygen and carbon dioxide cross between air and blood.',
      bullets: ['The source does not demonstrate airflow, airway patency, mucociliary motion or an intact lobar branching tree.'],
    },
    references: ['passages', 'physiology', 'thorax'],
    limit: 'One proximal source segment; relative calibre and angle are general anatomy, not measured or boundary-validated properties of this mesh.',
  },
  leftBronchus: {
    anatomy: {
      title: 'Left main-airway route',
      body: 'The left main bronchus passes from the carina toward the left lung hilum. It is usually longer and less vertical than the right. Its downstream upper and lower lobar routes serve the two left-lung lobes; the lingula is part of the upper lobe.',
      bullets: [
        'The proximal selected segment does not establish the two lobar junctions, lingular branches or a complete distal tree.',
      ],
    },
    function: {
      title: 'Conduction toward two lobes',
      body: 'The left main bronchus conducts air toward branches serving the left upper and lower lobes. The lingula receives branches within the upper-lobe route. Conducting bronchi move air; gas exchange occurs farther downstream at alveolar surfaces.',
      bullets: ['This static proximal source does not show actual airflow, airway patency, mucus clearance or measured gas exchange.'],
    },
    references: ['passages', 'physiology', 'thorax'],
    limit: 'One proximal source segment; usual side differences and branch patterns are teaching concepts, not verified dimensions or junctions of this mesh.',
  },
} as const;
