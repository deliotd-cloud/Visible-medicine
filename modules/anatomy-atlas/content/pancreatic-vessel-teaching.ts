// Original, brief educational drafts for the eleven retained pancreatic-vessel
// identities. Reference links support usual anatomy, not validation of these meshes.
const arteries='https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html';
const veins='https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html';

type Teaching={
  anatomy:string;function:string;limit:string;question:string;
  choices:readonly [string,string,string,string];correctAnswer:string;
  explanation:string;reference:string;support?:string;
};

const arcadeStudy='https://pubmed.ncbi.nlm.nih.gov/33392701/';
const dorsalStudy='https://pubmed.ncbi.nlm.nih.gov/37574438/';
const distalStudy='https://pmc.ncbi.nlm.nih.gov/articles/PMC6446113/';

export const pancreaticVesselTeaching:Readonly<Record<string,Teaching>>={
  FMA14782:{
    anatomy:'The anterior superior pancreaticoduodenal artery is the superior, front-side branch associated with the gastroduodenal pathway around the pancreatic head and upper duodenum. It is distinct from the posterior superior branch.',
    function:'It contributes arterial supply around the anterior pancreatic head and duodenum. A usual anterior arcade is teaching context; this source piece does not prove a junction with the anterior inferior branch.',
    limit:'FJ3409 is one unspecified-side arterial segment, without validated lumen, complete branches or patient-specific position.',
    question:'Which upstream artery usually gives rise to the anterior superior pancreaticoduodenal branch?',
    choices:['Superior mesenteric artery','Gastroduodenal artery','Splenic artery','Dorsal pancreatic artery'],
    correctAnswer:'Gastroduodenal artery',
    explanation:'The usual anterior superior route comes from the gastroduodenal pathway. This donor mesh does not prove that junction.',reference:arteries,support:arcadeStudy,
  },
  FMA14784:{
    anatomy:'The posterior superior pancreaticoduodenal artery is the back-side superior branch associated with the gastroduodenal pathway. Its orientation differs from the anterior superior selection.',
    function:'It contributes to the posterior pancreatic-head and proximal-duodenal arterial network. Usual connection with a posterior inferior branch must not be inferred from a projected overlap.',
    limit:'FJ3557 does not validate a retropancreatic junction, lumen patency or fixed origin in a patient.',
    question:'Which inferior branch is the usual posterior arcade counterpart of the posterior superior pancreaticoduodenal artery?',
    choices:['Anterior inferior pancreaticoduodenal artery','Great pancreatic artery','Posterior inferior pancreaticoduodenal artery','Inferior pancreatic artery'],
    correctAnswer:'Posterior inferior pancreaticoduodenal artery',
    explanation:'Usual posterior pathways relate the posterior superior and posterior inferior branches; the displayed donor segments are not a proven join.',reference:arteries,support:arcadeStudy,
  },
  FMA14787:{
    anatomy:'The dorsal pancreatic artery is a pancreatic-neck arterial selection. The splenic artery is a usual source, but its origin varies; it is not the same vessel as the inferior pancreatic artery.',
    function:'It contributes to pancreatic arterial supply near the neck and may give branches toward the body. The selected mesh does not identify every branch or prove a connection to the pancreaticoduodenal vessels.',
    limit:'FJ3430 is one source-labelled surface. Do not turn a nearby line into a confirmed arcade or assign a fixed variant origin.',
    question:'Why is a splenic-artery origin insufficient by itself to identify every dorsal pancreatic artery?',
    choices:['Its origin varies among splenic, coeliac and mesenteric pathways','It is a venous tributary rather than an artery','It always arises from the gastroduodenal trunk','It exists only in the pancreatic tail'],
    correctAnswer:'Its origin varies among splenic, coeliac and mesenteric pathways',
    explanation:'An original CT study found several dorsal-pancreatic origins. This atlas selection cannot certify an origin in a patient.',reference:arteries,support:dorsalStudy,
  },
  FMA14790:{
    anatomy:'The inferior pancreatic artery is associated with the lower aspect of the pancreatic body and with the leftward dorsal-pancreatic pathway in usual descriptions. It is not the inferior pancreaticoduodenal artery near the head.',
    function:'It contributes to body-region arterial supply. A projected contact with another pancreatic vessel does not demonstrate a functioning anastomosis or territory.',
    limit:'FJ3444 preserves an unspecified-side source name; no intrapancreatic branch tree is resolved.',
    question:'In usual descriptions, the inferior pancreatic artery follows a leftward branch of which pancreatic vessel?',
    choices:['Gastroduodenal artery','Anterior inferior pancreaticoduodenal artery','Caudal pancreatic artery','Dorsal pancreatic artery'],
    correctAnswer:'Dorsal pancreatic artery',
    explanation:'The lower-body pathway is commonly described from the dorsal pancreatic left branch; this source does not validate that junction.',reference:arteries,support:distalStudy,
  },
  FMA14792:{
    anatomy:'The great pancreatic artery, also called pancreatica magna, is a named branch usually associated with the splenic-artery course into the pancreatic body. It differs from the caudal pancreatic branch toward the tail.',
    function:'It contributes arterial supply within the body of the pancreas. Its name and apparent calibre do not provide a patient-specific measurement or complete internal territory.',
    limit:'FJ3433 is retained as one source segment. Its near-contact with the caudal segment is not repaired into a proven join.',
    question:'Which parent arterial pathway is usually associated with the great pancreatic branch entering the pancreatic body?',
    choices:['Common hepatic artery','Superior mesenteric artery','Splenic artery','Gastroduodenal artery'],
    correctAnswer:'Splenic artery',
    explanation:'Great pancreatic arterial supply is commonly described along the splenic pathway toward the body; FJ3433 does not prove its origin or territory.',reference:arteries,support:distalStudy,
  },
  FMA14793:{
    anatomy:'The caudal pancreatic artery is associated with the pancreatic tail near the splenic region. A splenic origin is usual, while other origins can occur.',
    function:'It contributes to tail-region arterial supply. The selected line does not establish a complete tail plexus or a connection to the great pancreatic artery.',
    limit:'FJ3419 is not a perfusion map or a validated anastomosis where it approaches FJ3433.',
    question:'Which pancreatic region is associated with the caudal pancreatic branch near the splenic end of the organ?',
    choices:['Upper duodenum','Pancreatic tail','Pancreatic neck','Ascending colon'],
    correctAnswer:'Pancreatic tail',
    explanation:'The caudal pancreatic label concerns the tail near the spleen; the source surface cannot certify a complete tail network.',reference:arteries,support:distalStudy,
  },
  FMA14805:{
    anatomy:'The inferior pancreaticoduodenal artery is usually a superior mesenteric branch approaching the lower pancreatic head and duodenum. The anterior and posterior inferior selections have their own identities.',
    function:'It contributes arterial inflow to lower head/duodenal pathways. This parent selection does not prove that both named inferior branches share one origin in a patient.',
    limit:'FJ3446 is the retained parent segment, not the full anterior and posterior arcades.',
    question:'Which major arterial pathway usually supplies the inferior pancreaticoduodenal artery?',
    choices:['Superior mesenteric artery','Splenic artery','Inferior mesenteric artery','Common hepatic artery'],
    correctAnswer:'Superior mesenteric artery',
    explanation:'The inferior pancreaticoduodenal route is usually mesenteric-side inflow from the SMA; FJ3446 does not prove its actual origin.',reference:arteries,support:arcadeStudy,
  },
  FMA15398:{
    anatomy:'The pancreaticoduodenal vein selection groups three original files under one venous identity beside the pancreatic-head/duodenal region. They are not three separately validated named veins.',
    function:'Pancreaticoduodenal venous pathways contribute drainage toward mesenteric or portal routes in usual anatomy. This grouped source cannot assign a recipient or flow direction to each component.',
    limit:'Keep FJ3545, FJ3646 and FJ3655 together and ordered; no tributary names, continuous lumen or fixed confluence are inferred.',
    question:'What does the three-file pancreaticoduodenal vein selection establish?',
    choices:['Three proven named tributaries','A complete portal venous tree','One artery and two veins','One source-labelled venous identity with three supplied files'],
    correctAnswer:'One source-labelled venous identity with three supplied files',
    explanation:'The grouped source identity is singular. File count cannot be converted into independently named vessels.',reference:veins,
  },
  FMA70479:{
    anatomy:'The anterior inferior pancreaticoduodenal artery is the lower, front-side branch associated with the inferior pancreaticoduodenal pathway around the pancreatic head.',
    function:'It contributes to anterior lower head/duodenal arterial supply. A usual meeting with the anterior superior branch is context, not a verified join between these donor surfaces.',
    limit:'FJ3401 has unspecified laterality and no validated connection to FJ3409.',
    question:'Which superior branch is the usual anterior arcade counterpart of the anterior inferior pancreaticoduodenal artery?',
    choices:['Posterior superior pancreaticoduodenal artery','Anterior superior pancreaticoduodenal artery','Posterior inferior pancreaticoduodenal artery','Great pancreatic artery'],
    correctAnswer:'Anterior superior pancreaticoduodenal artery',
    explanation:'Usual anterior pathways relate the anterior inferior and anterior superior branches; these donor meshes do not verify a continuous arcade.',reference:arteries,support:arcadeStudy,
  },
  FMA70480:{
    anatomy:'The posterior inferior pancreaticoduodenal artery is the lower, back-side branch associated with the inferior pancreaticoduodenal pathway. It is distinct from the anterior inferior vessel.',
    function:'It contributes to posterior lower head/duodenal supply. The model does not demonstrate a patent posterior arcade with the posterior superior artery.',
    limit:'FJ3546 does not establish a complete retropancreatic course or patient-specific variant origin.',
    question:'Which superior branch is the usual posterior arcade counterpart of the posterior inferior pancreaticoduodenal artery?',
    choices:['Anterior superior pancreaticoduodenal artery','Anterior inferior pancreaticoduodenal artery','Posterior superior pancreaticoduodenal artery','Dorsal pancreatic artery'],
    correctAnswer:'Posterior superior pancreaticoduodenal artery',
    explanation:'Usual posterior pathways relate posterior inferior to posterior superior branches; the atlas does not prove this joining.',reference:arteries,support:arcadeStudy,
  },
  FMA76574:{
    anatomy:'The retained selection is the trunk of the gastroduodenal artery, normally arising from the common hepatic pathway toward the proximal duodenum and pancreatic head. The trunk label does not include all distal named branches.',
    function:'The gastroduodenal pathway contributes arterial inflow to upper duodenal and pancreatic-head branches. This source trunk cannot prove individual branch origins, calibre or collateral flow.',
    limit:'FJ3432 is trunk-only, unspecified-side source geometry; do not expand it into complete gastro-omental or pancreaticoduodenal arteries.',
    question:'From which artery does the gastroduodenal trunk usually arise before giving upper pancreaticoduodenal branches?',
    choices:['Common hepatic artery','Superior mesenteric artery','Splenic artery','Inferior mesenteric artery'],
    correctAnswer:'Common hepatic artery',
    explanation:'The usual gastroduodenal parent is the common hepatic pathway; FJ3432 remains a trunk-only selection and does not prove distal branches.',reference:arteries,support:arcadeStudy,
  },
};
