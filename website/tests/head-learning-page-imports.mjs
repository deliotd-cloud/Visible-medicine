// Isolated page test imports. Keep this list equal to the current page's named imports.
// The test supplies its own authorization and independently tested packet responses.
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const site=fileURLToPath(new URL('../',import.meta.url));
const page=new URL('../app/workspace/atlas-review/head-learning/page.tsx',import.meta.url);
const source=readFileSync(page,'utf8');
const parsed=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const bindings=new Map();
for(const node of parsed.statements)if(ts.isImportDeclaration(node)&&node.moduleSpecifier.text.startsWith('@/')){
  const specifier=node.moduleSpecifier.text;
  const names=node.importClause?.namedBindings;
  if(!names||!ts.isNamedImports(names))throw Error(`Unexpected page import form: ${specifier}`);
  bindings.set(specifier,[...new Set([...(bindings.get(specifier)??[]),...names.elements.map(element=>element.propertyName?.text??element.name.text)])]);
}

const noop=()=>null;
const unverified=async()=>null;
const sourceModules={
  '@/lib/head-atlas-learning':require(site+'/lib/head-atlas-learning.ts'),
  '@/lib/head-mri-learning':require(site+'/lib/head-mri-learning.ts'),
  '@/lib/head-insula-learning':require(site+'/lib/head-insula-learning.ts'),
  '@/lib/head-orbital-learning':require(site+'/lib/head-orbital-learning.ts'),
  '@/lib/head-ct-bone-learning':require(site+'/lib/head-ct-bone-learning.ts'),
  '@/lib/head-cerebellar-learning':require(site+'/lib/head-cerebellar-learning.ts'),
};
const pageModules={
  '@/lib/clinical-review-server':{authorizeClinicalReview:async()=>{throw Error('Authorization mock required');}},
  '@/components/HeadAtlasTeachingReview':{HeadAtlasTeachingReview:noop},
  '@/lib/head-atlas-import':{HEAD_MANIFEST_SHA256:null},
  '@/lib/head-teaching-review-contract':{headTeachingDraftContext:async()=>{throw Error('Draft context mock required');}},
  '@/components/HeadTeachingReviewNotes':{HeadTeachingReviewNotes:noop},
  '@/components/HeadMriComparisonReview':{HeadMriComparisonReview:noop},
  '@/lib/head-mri-comparison-review':{verifiedHeadMriComparisonPacket:unverified},
  '@/lib/head-mri-only-teaching':{verifiedHeadMriOnlyTeachingRevision:unverified},
  '@/lib/head-mri-learning':{headMriLearningSequences:sourceModules['@/lib/head-mri-learning'].headMriLearningSequences,verifiedHeadMriLearningRevision:unverified},
  '@/lib/head-atlas-learning':{headLearningSequences:sourceModules['@/lib/head-atlas-learning'].headLearningSequences,HEAD_LEARNING_REVISION:sourceModules['@/lib/head-atlas-learning'].HEAD_LEARNING_REVISION},
  '@/lib/head-mri-review-draft-contract':{headMriDraftContext:async()=>{throw Error('MRI draft context mock required');}},
  '@/components/HeadMriReviewNotes':{HeadMriReviewNotes:noop},
  '@/components/HeadInsulaComparisonReview':{HeadInsulaComparisonReview:noop},
  '@/lib/head-insula-comparison-review':{verifiedHeadInsulaComparisonPacket:unverified},
  '@/lib/head-insula-teaching':{verifiedHeadInsulaTeachingRevision:unverified},
  '@/lib/head-insula-learning':{headInsulaLearningSequences:sourceModules['@/lib/head-insula-learning'].headInsulaLearningSequences,verifiedHeadInsulaLearningRevision:unverified},
  '@/components/HeadOrbitalComparisonReview':{HeadOrbitalComparisonReview:noop},
  '@/lib/head-orbital-comparison-review':{verifiedHeadOrbitalComparisonPacket:unverified},
  '@/lib/head-orbital-teaching':{verifiedHeadOrbitalTeachingRevision:unverified},
  '@/lib/head-orbital-learning':{headOrbitalLearningSequences:sourceModules['@/lib/head-orbital-learning'].headOrbitalLearningSequences,verifiedHeadOrbitalLearningRevision:unverified},
  '@/components/HeadCtBoneComparisonReview':{HeadCtBoneComparisonReview:noop},
  '@/lib/head-ct-bone-comparison-review':{verifiedHeadCtBoneComparisonPacket:unverified},
  '@/lib/head-ct-bone-learning':{headCtBoneLearningSequences:sourceModules['@/lib/head-ct-bone-learning'].headCtBoneLearningSequences,verifiedHeadCtBoneLearningRevision:unverified},
  '@/components/HeadCtFacialComparisonReview':{HeadCtFacialComparisonReview:noop},
  '@/lib/head-ct-facial-comparison-review':{verifiedHeadCtFacialComparisonPacket:unverified},
  '@/components/HeadCtFacialLearningReview':{HeadCtFacialLearningReview:noop},
  '@/lib/head-ct-facial-learning':{verifiedHeadCtFacialLearningRevision:unverified},
  '@/lib/head-ct-bone-teaching':{verifiedHeadCtBoneTeachingRevision:unverified},
  '@/components/HeadCtFacialTeachingReview':{HeadCtFacialTeachingReview:noop},
  '@/lib/head-ct-facial-teaching.ts':{verifiedHeadCtFacialTeachingRevision:unverified},
  '@/lib/head-ct-facial-clinical.ts':{verifiedHeadCtFacialClinicalRevision:unverified},
  '@/components/HeadImageOnlyComparisonReview':{HeadImageOnlyComparisonReview:noop},
  '@/lib/head-image-only-comparison-review':{verifiedHeadImageOnlyComparisonPacket:unverified},
  '@/lib/head-image-only-links':{headImageConceptById:()=>{throw Error('Unexpected image concept lookup');}},
  '@/lib/head-cerebellar-teaching':{verifiedHeadCerebellarTeachingRevision:unverified},
  '@/lib/head-cerebellar-learning':{headCerebellarLearningSequences:sourceModules['@/lib/head-cerebellar-learning'].headCerebellarLearningSequences,verifiedHeadCerebellarLearningRevision:unverified},
  '@/lib/head-anatomy-checks':{verifiedHeadAnatomyCheckRevision:unverified},
  '@/components/HeadAnatomyChecksReview':{HeadAnatomyChecksReview:noop},
  '@/components/HeadMriAnatomyChecksReview':{HeadMriAnatomyChecksReview:noop},
  '@/lib/head-mri-anatomy-checks':{headMriAnatomyCheckContent:null,verifiedHeadMriAnatomyCheckRevision:unverified},
  '@/components/HeadCerebellarClinicalReview':{HeadCerebellarClinicalReview:noop},
  '@/lib/head-cerebellar-clinical':{verifiedCerebellarClinicalRevision:unverified},
  '@/components/HeadDeepGreyClinicalReview':{HeadDeepGreyClinicalReview:noop},
  '@/lib/head-deep-grey-clinical':{verifiedDeepGreyClinicalRevision:unverified},
  '@/components/HeadLobarClinicalReview':{HeadLobarClinicalReview:noop},
  '@/lib/head-lobar-clinical':{verifiedLobarClinicalRevision:unverified},
  '@/components/HeadHippocampalClinicalReview':{HeadHippocampalClinicalReview:noop},
  '@/lib/head-hippocampal-clinical':{verifiedHippocampalClinicalRevision:unverified},
  '@/components/HeadMriOnlyClinicalReview':{HeadMriOnlyClinicalReview:noop},
  '@/lib/head-mri-only-clinical':{mriOnlyClinicalContent:null,verifiedMriOnlyClinicalRevision:unverified},
};

for(const [specifier,names] of bindings){
  const module=pageModules[specifier];
  if(!module)throw Error(`Missing explicit page module: ${specifier}`);
  const found=Object.keys(module).sort(),expected=[...names].sort();
  if(JSON.stringify(found)!==JSON.stringify(expected))throw Error(`Page binding drift: ${specifier}`);
  const sourceFile=new URL('../'+specifier.slice(2)+(specifier.endsWith('.ts')?'':specifier.startsWith('@/components/')?'.tsx':'.ts'),import.meta.url);
  const actual=readFileSync(sourceFile,'utf8');
  for(const name of names)if(!new RegExp(`\\b(?:export\\s+(?:const|function|async function|class|type|interface)\\s+${name}|export\\s*\\{[^}]*\\b${name}\\b)`).test(actual))throw Error(`Source export missing: ${specifier}.${name}`);
}
if(Object.keys(pageModules).length!==bindings.size)throw Error('Page module set drift');
for(const [specifier,module] of Object.entries(sourceModules))for(const name of Object.keys(pageModules[specifier]).filter(name=>name.includes('Sequences'))){
  if(!Array.isArray(module[name]))throw Error(`Source array missing: ${specifier}.${name}`);
}

/** @returns {Record<string, unknown>} Named module exports consumed by the isolated page loader. */
export function headLearningPageImports(overrides){
  for(const [specifier,module] of Object.entries(overrides)){
    if(!pageModules[specifier])throw Error(`Unexpected page override: ${specifier}`);
    for(const name of Object.keys(module))if(!(name in pageModules[specifier]))throw Error(`Unexpected page export override: ${specifier}.${name}`);
  }
  return new Proxy({}, {get(_target,specifier){
    if(typeof specifier!=='string'||!specifier.startsWith('@/'))return undefined;
    if(!pageModules[specifier])throw Error(`Unexpected page import: ${specifier}`);
    return {...pageModules[specifier],...overrides[specifier]};
  }});
}
