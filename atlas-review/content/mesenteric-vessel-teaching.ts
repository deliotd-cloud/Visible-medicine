// Original short educational drafts. These describe named source identities, not
// verified vessel continuity, flow, territories, or patient-specific anatomy.
const arteries = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html';
const veins = 'https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html';

type Teaching = {
  anatomy: string;
  function: string;
  limit: string;
  question: string;
  choices: readonly [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  reference: string;
};

/** One concept for each of the fourteen retained mesenteric root selections. */
export const mesentericVesselTeaching: Readonly<Record<string, Teaching>> = {
  FMA14810: {
    anatomy: 'The middle colic artery is a superior mesenteric branch directed toward the transverse colon. Other colic selections in this set include the right and left colic arteries.',
    function: 'It contributes arterial supply to the transverse colon. Usual links with neighbouring colic arteries are anatomical context, not proven connections between these displayed surfaces.',
    limit: 'The single FJ3542 surface does not certify a patent marginal connection or a complete transverse-colon territory.',
    question: 'Which named artery in this selection is associated with the transverse colon and the superior mesenteric pathway?',
    choices: ['Left colic artery', 'Middle colic artery', 'Inferior mesenteric vein', 'Appendicular artery'],
    correctAnswer: 'Middle colic artery',
    explanation: 'The middle colic is an arterial branch associated with the transverse colon; the other choices differ in region or vessel type.',
    reference: arteries,
  },
  FMA14811: {
    anatomy: 'The right colic artery is a right-colon arterial selection. Its usual origin is the superior mesenteric artery or one of its branches, rather than the inferior mesenteric artery.',
    function: 'It contributes to ascending-colon supply and may participate in colic collateral pathways. The selected surface cannot show whether a particular patient has a separate right colic trunk.',
    limit: 'FJ3590 is one right-sided source identity; no mirrored left counterpart or guaranteed origin is inferred.',
    question: 'Which selected artery is associated with the ascending colon and has a variable superior mesenteric origin?',
    choices: ['Middle colic artery', 'Left colic artery', 'Right colic artery', 'Marginal colic artery'],
    correctAnswer: 'Right colic artery',
    explanation: 'The right colic label concerns the ascending-colon side; its origin varies, so the mesh is not a universal branching template.',
    reference: arteries,
  },
  FMA14815: {
    anatomy: 'The ileocolic artery is a superior mesenteric branch approaching the ileocaecal region. It is distinct from the smaller appendicular artery and the separately named ascending branch in this set.',
    function: 'Its usual branches contribute to the terminal ileum, caecum and appendix. This parent label does not assign each downstream source segment to an individually validated vessel junction.',
    limit: 'FJ3439 gives an ileocolic selection, not a complete caecal arcade or fixed crossing with the mesenteric vein.',
    question: 'Which selected artery is the parent pathway most closely associated with the terminal ileum and caecum?',
    choices: ['Appendicular artery', 'Ileocolic artery', 'Left colic artery', 'Middle colic artery'],
    correctAnswer: 'Ileocolic artery',
    explanation: 'The ileocolic artery approaches the ileocaecal region; the appendicular selection is a more specific downstream pathway.',
    reference: arteries,
  },
  FMA14818: {
    anatomy: 'The appendicular artery is the named arterial route toward the vermiform appendix, associated with the mesoappendix. Its origin may vary within the ileocolic and caecal branching region.',
    function: 'It contributes blood supply to the appendix. Its small displayed segment cannot establish all accessory supply or prove the vessel visible on a patient image.',
    limit: 'FJ3410 is not a map of mesoappendiceal tissue, appendiceal position or a safe operative plane.',
    question: 'Which source-labelled selection is most directly associated with the mesoappendix?',
    choices: ['Marginal colic artery', 'Middle colic vein', 'Right colic artery', 'Appendicular artery'],
    correctAnswer: 'Appendicular artery',
    explanation: 'The appendicular artery is the named arterial supply associated with the appendix and its mesentery.',
    reference: arteries,
  },
  FMA14820: {
    anatomy: 'The retained name is ascending branch of inferior branch of ileocolic artery. It identifies a supplied ileocolic branch segment, not a separately confirmed caecal artery.',
    function: 'As an arterial branch in the ileocolic region, it can be used to orient nearby bowel supply. Its exact downstream connections and perfusion territory have not been resolved from this mesh.',
    limit: 'Keep the full FMA14820 source wording for FJ3414; do not shorten it to a different named vessel or infer a mirror branch.',
    question: 'What does this long source label establish about the selected FJ3414 surface?',
    choices: ['It is a proven anterior caecal artery', 'It is a venous tributary of the SMV', 'It is a source-labelled ileocolic arterial branch', 'It is the entire marginal arterial arcade'],
    correctAnswer: 'It is a source-labelled ileocolic arterial branch',
    explanation: 'The FMA name supplies branch identity; it does not validate a more specific caecal label, continuity or territory.',
    reference: arteries,
  },
  FMA14824: {
    anatomy: 'The marginal colic artery is the named arterial pathway near the mesenteric border of the colon. In usual anatomy, colic branches may contribute to a marginal connection.',
    function: 'It is a potential collateral route along the colon. A displayed source line alone cannot demonstrate that its lumen is continuous or adequate for bowel perfusion.',
    limit: 'FJ2025 is one source surface, not a patient-specific arcade, measured flow route or guarantee against ischaemia.',
    question: 'Which selected label refers to a potential arterial connection along the colon rather than a single named colic feeder?',
    choices: ['Marginal colic artery', 'Right colic vein', 'Appendicular artery', 'Inferior mesenteric vein'],
    correctAnswer: 'Marginal colic artery',
    explanation: 'The marginal artery names the colonic arterial pathway; the displayed surface cannot prove a functional anastomosis.',
    reference: arteries,
  },
  FMA14826: {
    anatomy: 'The left colic artery is a branch of the inferior mesenteric artery associated with the descending colon. Its separately represented ascending and descending branches remain distinct selections.',
    function: 'It contributes arterial supply to left-colon pathways. The parent selection does not by itself prove where either displayed branch joins adjacent arteries.',
    limit: 'FJ3494 is left-labelled; the ascending and descending branch files are not interchangeable with this parent.',
    question: 'Which selected arterial parent belongs to the inferior mesenteric pathway and has separately labelled ascending and descending branches?',
    choices: ['Middle colic artery', 'Ileocolic artery', 'Right colic artery', 'Left colic artery'],
    correctAnswer: 'Left colic artery',
    explanation: 'The left colic artery is the represented IMA branch; its two named child selections have separate source identities.',
    reference: arteries,
  },
  FMA14828: {
    anatomy: 'The ascending branch of the left colic artery is the upward-directed branch from the left-colic pathway toward the upper left-colon and splenic-flexure region.',
    function: 'It may contribute to a meeting of left and middle colic arterial pathways. The source surface does not prove an actual patent junction with the middle colic selection.',
    limit: 'FJ3399 retains left laterality and upward branch identity; it is not the descending branch FJ3428.',
    question: 'Which left-colic branch is named for its course toward the upper left-colon region?',
    choices: ['Descending branch FMA14829', 'Ascending branch FMA14828', 'Ileocolic ascending branch FMA14820', 'Middle colic artery FMA14810'],
    correctAnswer: 'Ascending branch FMA14828',
    explanation: 'FMA14828 is the ascending left-colic branch; the similarly named ileocolic branch has a different parent.',
    reference: arteries,
  },
  FMA14829: {
    anatomy: 'The descending branch of the left colic artery proceeds toward the lower descending-colon and sigmoid-side arterial region. It is not the separately selected ascending branch.',
    function: 'It contributes to the inferior continuation of left-colon arterial supply. No complete link to sigmoid branches is verified by this surface.',
    limit: 'FJ3428 is a left-sided named branch, not a complete inferior mesenteric distribution or perfusion measurement.',
    question: 'Which selected branch is directed inferiorly from the left-colic pathway?',
    choices: ['Ascending left-colic branch FMA14828', 'Middle colic artery FMA14810', 'Descending left-colic branch FMA14829', 'Appendicular artery FMA14818'],
    correctAnswer: 'Descending left-colic branch FMA14829',
    explanation: 'FMA14829 is explicitly the descending left-colic branch; source labels do not certify distal arterial joining.',
    reference: arteries,
  },
  FMA14332: {
    anatomy: 'The superior mesenteric vein is the major named venous pathway collecting from small-bowel and right-colon tributaries toward the portal system. It is not the superior mesenteric artery.',
    function: 'It receives mesenteric venous return and usually joins the splenic vein in forming the portal vein. One surface cannot establish each tributary junction, portal pressure or flow direction in a patient.',
    limit: 'FJ3647 is an unspecified-side vein selection; do not mirror it, assign a side or infer a patent complete lumen.',
    question: 'Which selected vessel receives intestinal and right-colon venous return before the portal pathway?',
    choices: ['Inferior mesenteric vein', 'Superior mesenteric vein', 'Middle colic artery', 'Marginal colic artery'],
    correctAnswer: 'Superior mesenteric vein',
    explanation: 'The SMV is the main mesenteric venous route toward portal formation; arterial choices do not drain venous blood.',
    reference: veins,
  },
  FMA15391: {
    anatomy: 'The inferior mesenteric vein carries venous return from the left-colon and sigmoid-side region toward the splenic or mesenteric venous confluence. It is distinct from the inferior mesenteric artery.',
    function: 'It contributes hindgut venous drainage to the portal system. Its terminal pattern varies, so a drawn proximity to the SMV does not fix a single receiving vein.',
    limit: 'FJ3443 has unspecified laterality; neither a fixed junction nor all rectal drainage is represented.',
    question: 'Which selected vein may reach the splenic vein or the splenic–mesenteric confluence?',
    choices: ['Middle colic vein', 'Ileal vein', 'Right colic vein', 'Inferior mesenteric vein'],
    correctAnswer: 'Inferior mesenteric vein',
    explanation: 'The IMV drains the left-colon pathway and has variable termination near the splenic–mesenteric confluence.',
    reference: veins,
  },
  FMA15405: {
    anatomy: 'The ileal vein is a source-labelled intestinal venous segment associated with ileal drainage toward the superior mesenteric vein. It is not the ileocolic artery.',
    function: 'It conveys venous return from an ileal region into the mesenteric venous pathway. This one selection cannot represent every ileal tributary or define bowel-wall perfusion.',
    limit: 'FJ3438 is one unspecified-side vein; the atlas does not validate its complete route or a paired counterpart.',
    question: 'Which selected vessel is venous and associated with ileal return rather than arterial ileocaecal supply?',
    choices: ['Ileal vein', 'Ileocolic artery', 'Appendicular artery', 'Right colic artery'],
    correctAnswer: 'Ileal vein',
    explanation: 'The ileal vein is a venous segment; the other listed selections are arteries.',
    reference: veins,
  },
  FMA15406: {
    anatomy: 'The middle colic vein is a source-labelled venous route from the transverse-colon region toward mesenteric venous drainage. Its arterial neighbour is the middle colic artery, a different identity.',
    function: 'It is associated with transverse-colon venous return toward the superior mesenteric system, not an exclusive drainage territory. Its receiving junction and tributaries can vary; the mesh does not establish a fixed confluence.',
    limit: 'FJ3543 is the midline-labelled venous surface; no arterial branch pattern is copied into it.',
    question: 'Which selected vein corresponds by name to transverse-colon venous return?',
    choices: ['Right colic vein', 'Middle colic vein', 'Inferior mesenteric vein', 'Ileal vein'],
    correctAnswer: 'Middle colic vein',
    explanation: 'The middle colic vein is associated with transverse-colon drainage, but its course is not a mirror of the artery.',
    reference: veins,
  },
  FMA15407: {
    anatomy: 'The right colic vein is a right-colon venous selection directed toward the superior mesenteric venous region. It is separate from the right colic artery.',
    function: 'It contributes ascending-colon venous drainage. Variable receiving patterns prevent this one mesh from proving a particular gastrocolic or SMV junction.',
    limit: 'FJ3591 is right-labelled; do not infer a left counterpart or copy the right-colic arterial branching pattern.',
    question: 'Which selected vessel is a vein associated with the right colon?',
    choices: ['Right colic artery', 'Middle colic artery', 'Right colic vein', 'Left colic artery'],
    correctAnswer: 'Right colic vein',
    explanation: 'The right colic vein concerns venous return from the right colon; an artery with a similar name is not the same structure.',
    reference: veins,
  },
};
