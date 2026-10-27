import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=source=>createHash('sha256').update(source).digest('hex');
const changes={
  'app/atlas/3d/page.tsx':['f3457e3f60f41b5d3724cab554fd010e8a3cd8eb790b3e6062d42ba6cd0e1153','45a51cd67e831aaf813aad34f3b3f1a4c34a97779f6093629f3c23b4c521cc35',[
    ["import {AtlasRegionalNavigation} from '../../../components/AtlasRegionalNavigation';","import {AtlasWorkspaceNavigation} from '../../../components/AtlasWorkspaceNavigation';"],
    ['<AtlasRegionalNavigation regionId={region.id}/>','<AtlasWorkspaceNavigation modality="3d" regionId={region.id}/>'],
  ]],
  'atlas-nonhead-comparison-ui.test.mjs':[[
    ['ab342f2fada090f8af81a1b3b427200a1685725be43c287da6af7491ac394d83','046a423e3a8dc10a850ddaeea5f16cc7ff0353253d6b5305eb4ef9d6a55d7b2b'],
    ['f7a7e38d77bf75e13b712e93bd9d1dd6b2560ad6bc01057607545ca45574974f','87d87358be8081b130091792922c7b247af7ca8d5a9a19d42563b9b2ef0c7245'],
  ],null,[
    ["'../../../components/AtlasRegionalNavigation':{AtlasRegionalNavigation:","'../../../components/AtlasWorkspaceNavigation':{AtlasWorkspaceNavigation:"],
  ]],
  'atlas-study-transport.test.ts':['dcc3d14e6b250f14ab428ec6e8f786b0d9b17d6b95588c0feb90c16c0ca69bb1','ef776c163f294d089013e994d96a041377714d907619108fb51a6d01307d9065',[
    ["'../../../components/AtlasRegionalNavigation':{AtlasRegionalNavigation:","'../../../components/AtlasWorkspaceNavigation':{AtlasWorkspaceNavigation:"],
  ]],
  'structure-learning-ui.test.ts':['91bd3e69a0e5cfbf25bb49d921f21e90c133fde6196b677930e2ab329c4a1a6b','117fa2fa55024682e2029a457eacbc5495a5d5f20fca45aa8efe2914f54c4d50',[
    ["if(id==='../../../components/AtlasRegionalNavigation')return{AtlasRegionalNavigation:","if(id==='../../../components/AtlasWorkspaceNavigation')return{AtlasWorkspaceNavigation:"],
  ]],
};

// Project only the declared navigation rename into earlier complete-source proofs.
export function restoreJointNavigationLegacy(name,source){
  const role=changes[name];
  assert(role,`Unknown joint-navigation source: ${name}`);
  const hashes=Array.isArray(role[0])?role[0]:[[role[0],role[1]]];
  const pair=hashes.find(([current])=>current===sha(source));
  assert(pair,`${name}: exact current source`);
  for(const [current,prior] of role[2]){
    assert.equal(source.split(current).length,2,`${name}: unique navigation seam`);
    source=source.replace(current,prior);
  }
  assert.equal(sha(source),pair[1],`${name}: complete preceding source`);
  return source;
}
