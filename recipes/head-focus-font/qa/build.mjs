import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';

const here=dirname(fileURLToPath(import.meta.url));
const baseline=process.env.REPO_ROOT??'G:/VisibleMedicine-temp/staging/20261031-review-continuity-ready/website';
const proposal=resolve(here,'../website/components/HeadAtlasInlineComparison.tsx');
const require=createRequire(resolve(baseline,'package.json'));
const {build}=require('esbuild');
await mkdir(resolve(here,'public'),{recursive:true});
for(const variant of ['baseline','proposal']){
  await build({entryPoints:[resolve(here,'client.tsx')],outfile:resolve(here,`public/${variant}.js`),bundle:true,platform:'browser',format:'esm',jsx:'automatic',target:'es2022',sourcemap:false,logLevel:'warning',plugins:[{
    name:'fixture-inputs',setup(plugin){
      plugin.onResolve({filter:/^vm:comparison$/},()=>({path:variant==='proposal'?proposal:resolve(baseline,'components/HeadAtlasInlineComparison.tsx')}));
      plugin.onResolve({filter:/^vm:links$/},()=>({path:resolve(baseline,'lib/head-atlas-links.ts')}));
      plugin.onResolve({filter:/^vm:inline$/},()=>({path:resolve(baseline,'lib/head-inline-comparison.ts')}));
      plugin.onResolve({filter:/^\.\.\/lib\//},args=>args.importer.replaceAll('\\','/')===proposal.replaceAll('\\','/')?{path:resolve(baseline,'lib',args.path.slice('../lib/'.length))}:undefined);
      plugin.onResolve({filter:/^(react|react-dom)(\/.*)?$/},args=>({path:require.resolve(args.path)}));
    }
  }]});
}
console.log('Built synthetic baseline and proposed React fixtures.');
