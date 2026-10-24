// Run only after Main's live regression diagnostic is terminal.
import {createRequire} from 'node:module';
import {readFile, writeFile, mkdir, realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const source=path.resolve(here,'../../20261024-pancreatic-us-website/website');
const receipt=path.resolve(source,'../SOURCE_BOUND.json');
const installed=path.resolve('F:/VisibleMedicine/website');
const modules=await realpath(path.join(installed,'node_modules'));
const requireSite=createRequire(path.join(installed,'package.json'));
const esbuild=requireSite('esbuild');
const sha=buffer=>createHash('sha256').update(buffer).digest('hex');
const receiptHash='cf587b88877f0a51b082e1ac039792938ccd6f0a6272a958669651a651b22a8e';
const receiptBytes=await readFile(receipt);
if(sha(receiptBytes)!==receiptHash)throw Error('Source receipt drift');
const rows=new Map(JSON.parse(receiptBytes).sourceRows.map(row=>[row.path,row]));
const slash=value=>value.split(path.sep).join('/');
const inside=(file,root)=>{const relative=path.relative(root,file);return relative!==''&&!relative.startsWith(`..${path.sep}`)&&relative!=='..'&&!path.isAbsolute(relative);};
const own=new Map([
  ['entry.mjs','d1111f5328613be074c54a6825aada391d6509cd93d6e8234cc994d8e02b10f0'],
  ['router.mjs','29f0cda0bedf75f164ed14e1a293395aaa37f13279d15769e9cf542d978e7cdf'],
  ['fixture.css','619008a274d6c1d29d6669289a643318cb1318f97a480d3290cd8fd45848da1b'],
]);
const required=['components/StudioCourseEditor.tsx','components/StudioForms.tsx','lib/studio-session-drafts.ts','lib/studio-draft-scope.ts','lib/studio-mutation-context.ts','lib/studio-navigation-guard.ts','lib/studio-release-order.ts','lib/studio-release-note-recovery.ts','lib/studio-templates.ts','package.json','package-lock.json','tsconfig.json'];
function classify(file){
  if(inside(file,source)){
    const relative=slash(path.relative(source,file));
    if(!rows.has(relative))throw Error(`Unbound frozen application input: ${relative}`);
    return {kind:'source',relative};
  }
  if(inside(file,here)){
    const relative=slash(path.relative(here,file));
    if(!own.has(relative))throw Error(`Unapproved fixture input: ${relative}`);
    return {kind:'fixture',relative};
  }
  if(inside(file,modules))return {kind:'node_modules',relative:slash(path.relative(modules,file))};
  throw Error(`Unexpected application/dependency input outside bound roots: ${file}`);
}
function loader(file){
  const extension=path.extname(file).toLowerCase();
  if(extension==='.ts')return 'ts';
  if(extension==='.tsx')return 'tsx';
  if(extension==='.jsx')return 'jsx';
  if(['.js','.mjs','.cjs'].includes(extension))return 'js';
  if(extension==='.json')return 'json';
  if(extension==='.css')return 'css';
  throw Error(`Unreviewed input loader: ${file}`);
}
async function checkSource(relative){
  const row=rows.get(relative);
  if(!row)throw Error(`Missing bound source row: ${relative}`);
  const bytes=await readFile(path.join(source,relative));
  if(bytes.length!==row.bytes||sha(bytes)!==row.sha256)throw Error(`Frozen source drift: ${relative}`);
  return bytes;
}
for(const relative of required)await checkSource(relative);
for(const relative of ['package.json','package-lock.json']){
  const expected=rows.get(relative).sha256;
  if(sha(await readFile(path.join(installed,relative)))!==expected)throw Error(`Installed dependency ${relative} differs from bound lock`);
}
const seen=new Map();
const key=file=>path.normalize(file).toLowerCase();
const outputDirectory=path.join(here,'.bundle');
const expectedOutputs=new Map([
  [key(path.join(outputDirectory,'fixture.js')),'javascript'],
  [key(path.join(outputDirectory,'fixture.css')),'stylesheet'],
]);
const result=await esbuild.build({
  absWorkingDir:here,entryPoints:[path.join(here,'entry.mjs')],outfile:path.join(outputDirectory,'fixture.js'),write:false,
  bundle:true,format:'iife',platform:'browser',target:'es2022',jsx:'automatic',
  // Explicit compiler settings prevent ancestor tsconfig discovery.
  tsconfigRaw:{compilerOptions:{jsx:'react-jsx',target:'ES2022'}},
  nodePaths:[modules],alias:{
    'next/link':path.join(here,'router.mjs'),
    'next/navigation':path.join(here,'router.mjs'),
    '@/lib/studio-templates':path.join(source,'lib/studio-templates.ts'),
  },metafile:true,logLevel:'warning',plugins:[{name:'exact-bound-inputs',setup(build){
    build.onLoad({filter:/.*/},async args=>{
      const identity=classify(args.path);
      const bytes=identity.kind==='source'?await checkSource(identity.relative):await readFile(args.path);
      const digest=sha(bytes);
      if(identity.kind==='fixture'&&digest!==own.get(identity.relative))throw Error(`Fixture input drift: ${identity.relative}`);
      seen.set(key(args.path),{path:args.path,...identity,bytes:bytes.length,sha256:digest});
      return {contents:bytes,loader:loader(args.path)};
    });
  }}],
});
const inputs=[];
for(const name of Object.keys(result.metafile.inputs)){
  const file=path.isAbsolute(name)?name:path.resolve(here,name);
  const identity=classify(file),before=seen.get(key(file));
  if(!before||before.kind!==identity.kind||before.relative!==identity.relative)throw Error(`Input was not exact-read: ${file}`);
  const after=await readFile(file);
  if(after.length!==before.bytes||sha(after)!==before.sha256)throw Error(`Input changed during bundle: ${file}`);
  if(identity.kind==='source')await checkSource(identity.relative);
  inputs.push(before);
}
if(sha(await readFile(receipt))!==receiptHash)throw Error('Source receipt changed during bundle');
for(const relative of ['package.json','package-lock.json']){
  const expected=rows.get(relative).sha256;
  if(sha(await readFile(path.join(installed,relative)))!==expected)throw Error(`Dependency ${relative} changed during bundle`);
}
if(result.outputFiles.length!==expectedOutputs.size)throw Error('Unexpected bundle output count');
const outputs=[];
for(const output of result.outputFiles){
  const identity=expectedOutputs.get(key(output.path));
  if(!identity)throw Error(`Unexpected bundle output: ${output.path}`);
  outputs.push({path:output.path,kind:identity,bytes:output.contents.length,sha256:sha(output.contents)});
}
if(new Set(outputs.map(row=>key(row.path))).size!==expectedOutputs.size)throw Error('Duplicate bundle outputs');
await mkdir(outputDirectory,{recursive:true});
for(const output of result.outputFiles)await writeFile(output.path,output.contents,{flag:'wx'});
const bound={receipt,receiptSha256:receiptHash,source,installedPackageLockSha256:rows.get('package-lock.json').sha256,
  inputs,outputs,sourceFixtureFilesNotOverwritten:true,synthetic:true,tsconfigDiscovery:false};
await writeFile(path.join(here,'BUNDLE_BOUND.json'),JSON.stringify(bound,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({outputs,inputCount:inputs.length}));
