import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const require=createRequire(import.meta.url);
const importLine="import {loadLiveLearningComponent} from './learning-frame-loader-transition.mjs';\n";
const loadLine='const learningModule=await loadLiveLearningComponent(root);\n';
const mapLine="  './AtlasBodyLearning':learningModule,\n";

/** Real candidate component and its source-bound dependencies, never a stub. */
export async function loadLiveLearningComponent(root){
  const entry=fileURLToPath(new URL('components/AtlasBodyLearning.tsx',root));
  const result=await build({entryPoints:[entry],bundle:true,write:false,platform:'node',
    format:'cjs',packages:'external',jsx:'automatic',loader:{'.css':'empty'}});
  assert.equal(result.errors.length,0);
  assert.equal(result.outputFiles.length,1);
  const module={exports:{}};
  new Function('require','module','exports',result.outputFiles[0].text)(require,module,module.exports);
  assert.equal(typeof module.exports.AtlasBodyLearning,'function');
  return /** @type {{AtlasBodyLearning: typeof import('../components/AtlasBodyLearning').AtlasBodyLearning}} */ (module.exports);
}

/** Remove only the declared additive harness seam before the old exact proof. */
export function stripLiveLearningLoader(candidate){
  assert.equal(typeof candidate,'string');
  for(const seam of [importLine,loadLine,mapLine])
    assert.equal(candidate.split(seam).length,2,`Missing or duplicate live loader seam: ${seam.trim()}`);
  return candidate.replace(importLine,'').replace(loadLine,'').replace(mapLine,'');
}
