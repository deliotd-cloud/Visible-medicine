// Import-only, conservative default-build input audit. Never runs package scripts or a build.
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {constants} from 'node:fs';
import {lstat, open, realpath} from 'node:fs/promises';
import {isAbsolute, resolve, posix} from 'node:path';
import ts from 'typescript';
import {createGitObjectReader} from './git-object-reader.mjs';
import {collectObservedSnapshot} from './source-snapshot-collect.mjs';
import {SnapshotValidationError, validateSnapshotPathWithReview, validateReviewedPolicySource,
  validateReviewedSnapshotIdentity} from './source-snapshot-manifest.mjs';
import {reviewedPathRecord} from './source-snapshot-reviewed-paths.mjs';
import {analyzeLiteralUrls} from './source-snapshot-literal-urls.mjs';
import {auditRendererInputs} from './source-snapshot-renderer-inputs.mjs';

const COMMIT = /^[0-9a-f]{40}$/;
const CODE = /\.(?:[cm]?[jt]sx?|css|scss|json|html|txt|toml|ya?ml)$/i;
const PARSE = /\.(?:[cm]?[jt]sx?)$/i;
const MAX_CODE_FILES = 10000;
const MAX_BLOB = 16 * 1024 * 1024;
const MAX_TOTAL_CODE_BYTES = 512 * 1024 * 1024;
const RECOVERY = 'public/models/bodyparts3d-v3/abdominal-wall/original-source.zip';
const RECOVERY_GUARD = 'scripts/exclude-source-recovery.mjs';
// These are inspected immutable programs, not a general path/data-flow solver.
// Any byte, path or recognized build-invocation change loses these semantics.
const RECOVERY_GUARD_SHA256 = 'b4d1eb161942dea1b8561fe3dcba41bcd77cc703aa5a6c206f47338c6816c20a';
const PACKAGING_GUARD_SHA256 = 'e35c3c9db0fb857468fe13af12c368da272c3daac6f25be54d819ebd20f40828';
const MODEL_DELIVERY = 'scripts/compress-model-delivery.mjs';
const MODEL_DELIVERY_COMMAND = `node ${MODEL_DELIVERY}`;
const MODEL_DELIVERY_SHA256 = 'b18e1c9b00891f31190f8f3ccc02287500673fab48d9e74f0490cc68e9fbddf4';
const NESTED_GENERATOR = 'scripts/generate-nested-review-bindings.mjs';
const NESTED_GENERATOR_COMMAND = `node ${NESTED_GENERATOR} --check`;
const NESTED_GENERATOR_SHA256 = '814066ef06e7af0e131215724b8419eb4ed64b8782e8f31228ec818cc3c5b9f5';
const WORKSPACE_BUILDER = 'scripts/workspace-test-build.mjs';
const WORKSPACE_BUILDER_SHA256 = 'c30102bdcfa2d33ae997ef749b8077f6c182e297fed0d312dafa210f73e10412';
const NESTED_BUNDLE_ENTRY = 'lib/nested-review-material.ts';
const NESTED_IMPORT_EXPRESSION = "import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'))";
const FIXED = ['package.json', 'package-lock.json', 'tsconfig.json'];
const OPTIONAL_CONFIG = ['postcss.config.js','postcss.config.cjs','postcss.config.mjs',
  'tailwind.config.js','tailwind.config.ts','components.json','worker-configuration.d.ts',
  'next-env.d.ts','.openai/hosting.json'];
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const equalPath = (a,b) => process.platform==='win32'
  ? a.replaceAll('/','\\').toLowerCase()===b.replaceAll('/','\\').toLowerCase() : a===b;
const fingerprint = stat => [stat.dev,stat.ino,stat.mode,stat.nlink,stat.size,
  stat.mtimeNs,stat.ctimeNs,stat.birthtimeNs].map(String).join('|');
const issue = (code, path, line) => ({code, ...(path === undefined ? {} : {path}),
  ...(line === undefined ? {} : {line})});
const safeError = code => new SnapshotValidationError(code, 'audit could not establish a safe input set');

async function git(cwd, args, maxOutput = 32 * 1024 * 1024) {
  return new Promise((fulfill, reject) => {
    const child = spawn('git', ['--no-lazy-fetch',...args], {cwd, windowsHide:true, stdio:['ignore','pipe','ignore'],
      env:{...process.env, GIT_NO_REPLACE_OBJECTS:'1', GIT_OPTIONAL_LOCKS:'0'}});
    const chunks=[]; let length=0, settled=false;
    const fail=()=>{if(!settled){settled=true; child.kill(); reject(safeError('GIT_READ'));}};
    child.stdout.on('data', bytes=>{
      length+=bytes.length;
      if(length>maxOutput) fail(); else chunks.push(bytes);
    });
    child.on('error',fail);
    child.on('close',code=>{
      if(settled)return;
      settled=true;
      if(code!==0)reject(safeError('GIT_READ'));
      else fulfill(Buffer.concat(chunks));
    });
  });
}

function treeRows(bytes) {
  const rows=new Map(); let folded=new Set();
  for(const record of bytes.toString('utf8').split('\0')) {
    if(!record)continue;
    const match=/^(100644|100755|120000|160000) (blob|commit) ([0-9a-f]{40}) +(\d+|-)\t([\s\S]+)$/.exec(record);
    if(!match)throw safeError('TREE_FORMAT');
    const [,mode,type,gitBlob,size,path]=match;
    if(folded.has(path.toLowerCase()))throw safeError('CASE_COLLISION');
    folded.add(path.toLowerCase());
    rows.set(path,{path,mode,type,gitBlob,bytes:Number(size)});
  }
  return rows;
}

function literal(node) {
  return node && (ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
}
function scriptCommands(name, scripts, entries, unresolved, stack=[], lifecycle=true) {
  if(stack.includes(name)){unresolved.push(issue('BUILD_SCRIPT_CYCLE')); return;}
  const command=scripts[name];
  if(typeof command!=='string'){unresolved.push(issue('BUILD_SCRIPT_MISSING')); return;}
  const nested=[...stack,name];
  // npm run invokes existing pre/post hooks, but automatic hooks do not themselves
  // receive pre/post hooks. An explicit npm run inside a hook is a new invocation.
  if(lifecycle&&Object.hasOwn(scripts,`pre${name}`))
    scriptCommands(`pre${name}`,scripts,entries,unresolved,nested,false);
  // Only a small literal command grammar is interpreted. Anything else stays unresolved.
  for(const part of command.split(/\s*&&\s*/)) {
    if(/^npm run [a-z0-9:_-]+$/i.test(part)) {
      scriptCommands(part.slice(8),scripts,entries,unresolved,nested);
    } else if(/^node (?:--[a-z0-9-]+(?: [a-z0-9._/-]+)? )*scripts\/[a-z0-9._/-]+\.mjs(?: (?:--[a-z0-9-]+|[a-z0-9._/-]+))*$/i.test(part)) {
      const match=/\bscripts\/[a-z0-9._/-]+\.mjs\b/i.exec(part);
      if(match)entries.push({path:match[0],reason:'default build script',invocation:part});
      else unresolved.push(issue('BUILD_COMMAND_UNKNOWN'));
    } else if(part==='vinext build') {
      // Vite/vinext plugin discovery and environment reads cannot be closed statically.
      unresolved.push(issue('PLUGIN_OR_ENV_DISCOVERY'));
    } else unresolved.push(issue('BUILD_COMMAND_UNKNOWN'));
  }
  if(lifecycle&&Object.hasOwn(scripts,`post${name}`))
    scriptCommands(`post${name}`,scripts,entries,unresolved,nested,false);
}

function resolveLiteral(from, specifier, rows) {
  let base;
  if(specifier.startsWith('@/'))base=specifier.slice(2);
  else if(specifier.startsWith('./')||specifier.startsWith('../'))base=posix.normalize(posix.join(posix.dirname(from),specifier));
  else return {external:true};
  if(base.startsWith('../')||base.startsWith('/')||base==='.')return {};
  const options=[base, ...['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.css','.scss',
    '/index.ts','/index.tsx','/index.js','/index.jsx'].map(s=>base+s)];
  for(const path of options)if(rows.has(path))return {path};
  return {};
}

function knownGuardReads(path, sha256, buildEntries) {
  if(path!==RECOVERY_GUARD||!buildEntries.has(path))return new Map();
  if(sha256===PACKAGING_GUARD_SHA256)return new Map([
    [46,{code:'GENERATED_OUTPUT_CHECK',target:'dist/client/models/bodyparts3d-v3/abdominal-wall/original-source.zip',expression:'readFile(target)'}],
    [56,{code:'GENERATED_OUTPUT_CHECK',target:'dist/client/models/recovery-policy.json',expression:"readFile(metadata, 'utf8')"}]
  ]);
  if(sha256!==RECOVERY_GUARD_SHA256)return new Map();
  return new Map([
    [14,{code:'BLOCKED_BUILD_INPUT_READ',target:RECOVERY,expression:'readFile(source)'}],
    [23,{code:'GENERATED_OUTPUT_CHECK',target:'dist/client/models/bodyparts3d-v3/abdominal-wall/original-source.zip',expression:'readFile(target)'}],
    [26,{code:'BLOCKED_BUILD_INPUT_READ',target:RECOVERY,expression:'readFile(source)'}],
    [28,{code:'GENERATED_OUTPUT_CHECK',target:'dist/client/models/recovery-policy.json',expression:"readFile(metadata, 'utf8')"}]
  ]);
}

function knownModelEnumeration(path, sha256, invocations, rows, required, policyConflicts) {
  if(path!==MODEL_DELIVERY||sha256!==MODEL_DELIVERY_SHA256||
     invocations.length!==1||invocations[0]!==MODEL_DELIVERY_COMMAND)return null;
  const models=[...rows.values()].filter(row=>row.path.startsWith('public/models/')&&row.path.endsWith('.glb'))
    .sort((a,b)=>cmp(a.path,b.path)).map(row=>({
      path:row.path,gitBlob:row.gitBlob,bytes:row.bytes,
      disposition:required.has(row.path)?'policy-allowed':
        policyConflicts.some(conflict=>conflict.path===row.path)?'policy-held':'unaccounted'
    }));
  if(models.some(row=>row.disposition==='unaccounted'||!Number.isSafeInteger(row.bytes)||row.bytes<0||
      rows.get(row.path).mode!=='100644'&&rows.get(row.path).mode!=='100755'||
      rows.get(row.path).type!=='blob'))return null;
  const identitySha256=createHash('sha256').update(JSON.stringify(models)).digest('hex');
  return {sourceProgramSha256:sha256,identitySha256,models,
    reads:new Map([
      [12,{code:'MODEL_SET_ENUMERATION',target:'public/models/**/*.glb and generated dist/client/models mirror',expression:'readdir(dir, { withFileTypes: true })'}],
      [29,{code:'MODEL_SOURCE_READ',target:'public/models/**/*.glb',expression:'readFile(path)'}],
      [31,{code:'GENERATED_MODEL_CHECK',target:'dist/client/models/**/*.glb',expression:'readFile(target)'}],
      [35,{code:'MODEL_SOURCE_REREAD',target:'public/models/**/*.glb',expression:'readFile(path)'}],
      [42,{code:'GENERATED_MODEL_MANIFEST_CHECK',target:'dist/client/models/transport-manifest.json',expression:"readFile(path, 'utf8')"}]
    ])};
}

function imports(source, path, rows, enqueue, addUrlFile, unresolved, classifiedReads, classifiedUrls, knownReads, modelEnumeration, classifiedImports, knownImport) {
  const kind=/\.tsx$/i.test(path)?ts.ScriptKind.TSX:/\.jsx$/i.test(path)?ts.ScriptKind.JSX:
    /\.[cm]?ts$/i.test(path)?ts.ScriptKind.TS:ts.ScriptKind.JS;
  const ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,kind);
  if(ast.parseDiagnostics.length)unresolved.push(issue('SOURCE_PARSE',path));
  const literalUrls=ast.parseDiagnostics.length?new Map():analyzeLiteralUrls(ast,path,rows);
  function line(node){return ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1;}
  function localRead(node){
    const at=line(node),known=knownReads.get(at)??modelEnumeration?.reads.get(at);
    if(known&&node.getText(ast)===known.expression){
      classifiedReads.push({code:known.code,path,line:at,target:known.target,
        basis:modelEnumeration?.reads.get(at)===known?'exact-program-model-set':'exact-audited-build-guard',
        ...(modelEnumeration?.reads.get(at)===known?{modelSetIdentitySha256:modelEnumeration.identitySha256}:{})});
    } else unresolved.push(issue('DYNAMIC_LOCAL_READ',path,at));
  }
  function visit(node){
    let spec;
    if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node))spec=literal(node.moduleSpecifier);
    if(ts.isImportEqualsDeclaration(node)&&ts.isExternalModuleReference(node.moduleReference)) {
      spec=literal(node.moduleReference.expression);
      if(spec===undefined)unresolved.push(issue('COMPUTED_IMPORT',path,line(node)));
    }
    if(ts.isCallExpression(node)) {
      if(node.expression.kind===ts.SyntaxKind.ImportKeyword ||
         (ts.isIdentifier(node.expression)&&node.expression.text==='require')) {
        spec=literal(node.arguments[0]);
        if(spec===undefined){
          if(knownImport&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&
             line(node)===5&&node.getText(ast)===NESTED_IMPORT_EXPRESSION){
            classifiedImports.push({...knownImport,line:5});
            // Syntax-level provenance is not a verified emitted payload. Keep a
            // specific unresolved obligation instead of deleting the uncertainty.
            unresolved.push(issue('GENERATED_BUNDLE_PAYLOAD_UNVERIFIED',path,5));
          }else unresolved.push(issue('COMPUTED_IMPORT',path,line(node)));
        }
      }
      if(ts.isPropertyAccessExpression(node.expression)) {
        const object=node.expression.expression.getText(ast);
        if(['fs','fsPromises','path','url','process'].includes(object) &&
           /^(?:readFile|readFileSync|createReadStream|open|readdir|glob|resolve|join|fileURLToPath|cwd)$/.test(node.expression.name.text))
          localRead(node);
      } else if(ts.isIdentifier(node.expression) &&
        /^(?:readFile|readFileSync|createReadStream|readdir|glob|fileURLToPath)$/.test(node.expression.text)) {
        localRead(node);
      }
    }
    if(ts.isNewExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='URL'){
      const found=literalUrls.get(node.getStart(ast));
      if(found?.kind==='file'){
        if(addUrlFile(found.target,`literal URL reference from ${path}`))
          classifiedUrls.push({code:'TRACKED_FILE_URL_REFERENCE',path,line:line(node),target:found.target,
            basis:'safe-literal-import-meta-url'});
        else unresolved.push(issue('URL_RESOLUTION',path,line(node)));
      }else if(found?.kind==='root-directory'){
        classifiedUrls.push({code:'TRACKED_ROOT_URL_REFERENCE',path,line:line(node),target:'.',
          basis:'safe-literal-import-meta-url-no-contents-admitted'});
      }else unresolved.push(issue('URL_RESOLUTION',path,line(node)));
    }
    if(spec==='node:fs'||spec==='node:fs/promises'||spec==='fs'||spec==='fs/promises') {
      if(modelEnumeration&&line(node)===3&&spec==='node:fs/promises'&&
         node.getText(ast).includes("from 'node:fs/promises'"))
        classifiedReads.push({code:'MODEL_FILESYSTEM_API',path,line:3,target:'exact audited model source and generated output set',
          basis:'exact-program-model-set',modelSetIdentitySha256:modelEnumeration.identitySha256});
      else unresolved.push(issue('FILESYSTEM_INPUT_DISCOVERY',path,line(node)));
    }
    if(spec!==undefined)enqueue(spec,path,line(node));
    ts.forEachChild(node,visit);
  }
  visit(ast);
}

async function stageBlobIdentity(stageRoot,row) {
  // The collector already rejected aliases, symlinks and hardlinks. Recheck at open.
  const full=resolve(stageRoot,...row.path.split('/'));
  const before=await lstat(full,{bigint:true});
  if(!before.isFile()||before.isSymbolicLink()||before.nlink!==1n||before.size!==BigInt(row.bytes))
    throw safeError('STAGE_CHANGED');
  if(!equalPath(await realpath(full),full))throw safeError('STAGE_CHANGED');
  const handle=await open(full,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
  try {
    const opened=await handle.stat({bigint:true});
    if(fingerprint(opened)!==fingerprint(before)||!opened.isFile()||opened.nlink!==1n)
      throw safeError('STAGE_CHANGED');
    const hash=createHash('sha1').update(`blob ${row.bytes}\0`);
    const sha256=createHash('sha256');
    let read=0;
    for await(const chunk of handle.createReadStream({autoClose:false})) {
      read+=chunk.length;
      if(read>row.bytes)throw safeError('STAGE_CHANGED');
      hash.update(chunk);
      sha256.update(chunk);
    }
    const after=await handle.stat({bigint:true});
    const afterPath=await lstat(full,{bigint:true});
    if(read!==row.bytes||fingerprint(after)!==fingerprint(before)||
       fingerprint(afterPath)!==fingerprint(before)||!equalPath(await realpath(full),full))
      throw safeError('STAGE_CHANGED');
    return {gitBlob:hash.digest('hex'),sha256:sha256.digest('hex')};
  } finally {await handle.close();}
}

export async function auditDefaultBuildInputs(options={}) {
  if(!options||typeof options!=='object'||Array.isArray(options)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(options))||
     Reflect.ownKeys(options).some(key=>!['sourceRoot','sourceCommit','stageRoot','reviewedPathPolicy'].includes(key)||
       !Object.hasOwn(Object.getOwnPropertyDescriptor(options,key),'value')))
    throw safeError('AUDIT_OPTIONS');
  const {sourceRoot,sourceCommit,stageRoot,reviewedPathPolicy}=options;
  if(typeof sourceRoot!=='string'||!isAbsolute(sourceRoot)||!equalPath(resolve(sourceRoot),sourceRoot))
    throw safeError('SOURCE_ROOT');
  if(typeof sourceCommit!=='string'||!COMMIT.test(sourceCommit))throw safeError('SOURCE_COMMIT');
  if(Object.hasOwn(options,'reviewedPathPolicy')&&reviewedPathPolicy===undefined)
    throw safeError('REVIEWED_POLICY_SOURCE');
  validateReviewedPolicySource(reviewedPathPolicy,sourceCommit);
  let root;
  try {
    const stat=await lstat(sourceRoot);
    if(!stat.isDirectory()||stat.isSymbolicLink())throw safeError('SOURCE_ROOT');
    root=await realpath(sourceRoot);
  } catch {throw safeError('SOURCE_ROOT');}
  if(!equalPath(root,sourceRoot))throw safeError('SOURCE_ROOT_ALIAS');
  const top=(await git(root,['rev-parse','--show-toplevel'],4096)).toString('utf8').trim();
  if(!equalPath(resolve(top),root))throw safeError('SOURCE_ROOT');
  const exactCommit=(await git(root,['rev-parse',`${sourceCommit}^{commit}`],64)).toString('ascii').trim();
  if(exactCommit!==sourceCommit)throw safeError('SOURCE_COMMIT');
  const sourceTree=(await git(root,['rev-parse',`${sourceCommit}^{tree}`],64)).toString('ascii').trim();
  if(!COMMIT.test(sourceTree))throw safeError('SOURCE_TREE');
  const rows=treeRows(await git(root,['ls-tree','-r','-z','-l','--full-tree',sourceCommit]));
  const unresolved=[],policyConflicts=[],classifiedReads=[],classifiedUrls=[],classifiedImports=[],buildEntries=new Set(),buildInvocations=new Map(),externalAssumptions=[
    'Installed dependency contents and build-tool plugin resolution are outside this Git-tree audit.',
    'Build-time environment variables and dynamic file discovery are not statically proven.',
    'Literal URL classifications are static references under standard URL/import.meta semantics, not proof against imported-code or dependency side effects or actual build-time reads.',
    'Generated data-import classifications describe exact source expressions only; emitted bytes, output cardinality, runtime imports, resolved transitive inputs and installed build-tool identities remain unverified.',
    'Renderer dependency tracing reproduces the exact pinned source program over the immutable Git tree only. Installed TypeScript identity, filesystem resolution, source execution and isolated-build equivalence remain unverified.'
  ];
  const required=new Map(),queue=[];
  let codeFileCount=0, countLimitReported=false;
  const add=(path,reason)=>{
    try{validateSnapshotPathWithReview(path,reviewedPathPolicy);}catch(error){
      if(path===RECOVERY)policyConflicts.push(issue('DEFAULT_BUILD_ARCHIVE_CONFLICT',path));
      else policyConflicts.push(issue(error.code??'POLICY_REFUSED_PATH',path));
      return false;
    }
    const row=rows.get(path);
    if(!row){unresolved.push(issue('MISSING_TRACKED_INPUT',path));return false;}
    if(row.mode!=='100644'&&row.mode!=='100755'||row.type!=='blob'){
      unresolved.push(issue('NONREGULAR_GIT_INPUT',path));return false;
    }
    if(!Number.isSafeInteger(row.bytes)||row.bytes<0){unresolved.push(issue('INVALID_GIT_SIZE',path));return false;}
    if(CODE.test(path)&&row.bytes>MAX_BLOB){unresolved.push(issue('CODE_SIZE_LIMIT',path));return false;}
    let item=required.get(path);
    if(!item){
      if(CODE.test(path)&&codeFileCount>=MAX_CODE_FILES){
        if(!countLimitReported){unresolved.push(issue('CODE_FILE_COUNT_LIMIT'));countLimitReported=true;}
        return false;
      }
      if(CODE.test(path))codeFileCount++;
      item={...row,reasons:new Set()}; required.set(path,item);
      if(PARSE.test(path)||/\.s?css$/i.test(path))queue.push(path);}
    item.reasons.add(reason);
    return true;
  };
  for(const path of FIXED)add(path,'fixed build/configuration or renderer seed');
  for(const path of OPTIONAL_CONFIG)if(rows.has(path))add(path,'tracked build configuration seed');
  for(const path of rows.keys()) {
    if(path===RECOVERY){policyConflicts.push(issue('DEFAULT_BUILD_ARCHIVE_CONFLICT',path));continue;}
    if(path.startsWith('app/')&&(PARSE.test(path)||/\.s?css$/i.test(path)))add(path,'tracked app route/source seed');
    if(/^(?:vite|next|postcss|tailwind)\.config\.[cm]?[jt]sx?$/.test(path))add(path,'tracked build configuration seed');
    if(path.startsWith('public/'))add(path,'tracked public asset seed');
  }
  const reader=createGitObjectReader({cwd:root,maxBytes:MAX_BLOB,
    spawnProcess:(command,args,options)=>spawn(command,['--no-lazy-fetch',...args],options)});
  const sha=new Map(),visited=new Set();
  let modelEnumeration=null,rendererInputs=null;
  let totalReadBytes=0;
  const readCode=async(path,row)=>{
    if(totalReadBytes+row.bytes>MAX_TOTAL_CODE_BYTES){unresolved.push(issue('CODE_TOTAL_BYTES_LIMIT',path));return;}
    const bytes=await reader.readBlob(row.gitBlob);totalReadBytes+=bytes.length;return bytes;
  };
  try {
    // A reviewed name is usable only when its immutable Git blob has the exact
    // reviewed content identity. The reader also checks the Git blob object ID.
    if(reviewedPathPolicy!==undefined)for(const row of required.values()) {
      if(!reviewedPathRecord(reviewedPathPolicy,row.path))continue;
      const bytes=await reader.readBlob(row.gitBlob);
      if(bytes.length!==row.bytes)throw safeError('REVIEWED_IDENTITY_MISMATCH');
      const digest=createHash('sha256').update(bytes).digest('hex');
      validateReviewedSnapshotIdentity(reviewedPathPolicy,
        {path:row.path,sha256:digest,gitBlob:row.gitBlob,bytes:bytes.length});
      sha.set(row.path,digest);
    }
    if(required.has('package.json')) {
      const row=rows.get('package.json');
      if(row.bytes>MAX_BLOB)unresolved.push(issue('CODE_SIZE_LIMIT','package.json'));
      else {
        const bytes=await readCode('package.json',row); sha.set('package.json',createHash('sha256').update(bytes).digest('hex'));
        try {
          const pkg=JSON.parse(bytes.toString('utf8'));
          const commands=[];scriptCommands('build',pkg.scripts??{},commands,unresolved);
          for(const command of commands){
            buildEntries.add(command.path);
            if(!buildInvocations.has(command.path))buildInvocations.set(command.path,[]);
            buildInvocations.get(command.path).push(command.invocation);
            add(command.path,command.reason);
          }
        } catch {unresolved.push(issue('BUILD_SCRIPT_PARSE'));}
      }
    }
    while(queue.length) {
      const path=queue.shift();if(visited.has(path))continue;visited.add(path);
      if(visited.size>MAX_CODE_FILES){unresolved.push(issue('CODE_FILE_COUNT_LIMIT'));break;}
      const row=required.get(path);if(!row||row.bytes>MAX_BLOB)continue;
      const bytes=await readCode(path,row);if(!bytes)continue;
      const codeSha256=createHash('sha256').update(bytes).digest('hex');
      sha.set(path,codeSha256);
      const enqueue=(specifier,from,line)=>{
        const found=resolveLiteral(from,specifier,rows);
        if(found.path)add(found.path,`literal import from ${from}`);
        else if(!found.external)unresolved.push(issue('UNRESOLVED_LOCAL_IMPORT',from,line));
      };
      if(/\.s?css$/i.test(path)) {
        // CSS imports are not parsed by the TS AST.
        for(const match of bytes.toString('utf8').matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g))
          enqueue(match[1],path,bytes.toString('utf8').slice(0,match.index).split('\n').length);
      } else {
        let knownImport=null;
        const invocations=buildInvocations.get(path)??[];
        const renderer=await auditRendererInputs({path,sha256:codeSha256,invocations,rows,readCode,add});
        if(renderer)rendererInputs=renderer;
        if(path===NESTED_GENERATOR&&codeSha256===NESTED_GENERATOR_SHA256&&
           invocations.length===1&&invocations[0]===NESTED_GENERATOR_COMMAND&&
           add(WORKSPACE_BUILDER,`exact nested bundle builder from ${path}`)){
          const builder=required.get(WORKSPACE_BUILDER);
          const builderBytes=await readCode(WORKSPACE_BUILDER,builder);
          if(builderBytes){
            const builderSha256=createHash('sha256').update(builderBytes).digest('hex');
            sha.set(WORKSPACE_BUILDER,builderSha256);
            if(builderSha256===WORKSPACE_BUILDER_SHA256&&
               add(NESTED_BUNDLE_ENTRY,`exact nested bundle stdin entry from ${path}`)){
              const entry=required.get(NESTED_BUNDLE_ENTRY);
              knownImport={code:'GENERATED_BUNDLE_DATA_IMPORT',path,
                basis:'exact-program-data-url-construction',sourceProgramSha256:codeSha256,
                buildInvocation:NESTED_GENERATOR_COMMAND,
                builder:{path:builder.path,gitBlob:builder.gitBlob,bytes:builder.bytes,sha256:builderSha256},
                entry:{path:entry.path,gitBlob:entry.gitBlob,bytes:entry.bytes},
                payloadBytesVerified:false,outputCardinalityVerified:false,
                transitiveBuildInputsVerified:false,installedToolIdentityVerified:false,
                runtimeImportClosureVerified:false,sourceExecutionObserved:false};
            }
          }
        }
        const knownReads=knownGuardReads(path,codeSha256,buildEntries);
        const knownModels=knownModelEnumeration(path,codeSha256,buildInvocations.get(path)??[],rows,required,policyConflicts);
        if(knownModels)modelEnumeration={sourceProgramSha256:knownModels.sourceProgramSha256,
          identitySha256:knownModels.identitySha256,models:knownModels.models};
        if([...knownReads.values()].some(read=>read.code==='BLOCKED_BUILD_INPUT_READ')){
          // Describing a read never admits its bytes. Even an absent required
          // archive is a policy conflict and an unresolved missing build input.
          add(RECOVERY,'audited default-build source read');
          if(!rows.has(RECOVERY))unresolved.push(issue('MISSING_TRACKED_INPUT',RECOVERY));
        }
        imports(bytes.toString('utf8'),path,rows,enqueue,add,unresolved,classifiedReads,classifiedUrls,knownReads,knownModels,classifiedImports,knownImport);
      }
    }
    for(const row of required.values())if(CODE.test(row.path)&&!sha.has(row.path)&&row.bytes<=MAX_BLOB) {
      const bytes=await readCode(row.path,row);if(!bytes)continue;
      sha.set(row.path,createHash('sha256').update(bytes).digest('hex'));
    }
  } finally {await reader.close();}
  const inputs=[...required.values()].sort((a,b)=>cmp(a.path,b.path)).map(row=>({
    path:row.path,gitBlob:row.gitBlob,bytes:row.bytes,
    ...(sha.has(row.path)?{sha256:sha.get(row.path)}:{}),
    reasons:[...row.reasons].sort(cmp)
  }));
  let stageComparison=null;
  if(stageRoot!==undefined) {
    if(typeof stageRoot!=='string'||!isAbsolute(stageRoot)||!equalPath(resolve(stageRoot),stageRoot))
      throw safeError('STAGE_ROOT');
    try {
      const stageStat=await lstat(stageRoot);
      if(!stageStat.isDirectory()||stageStat.isSymbolicLink()||
         !equalPath(await realpath(stageRoot),stageRoot))throw safeError('STAGE_ROOT');
    } catch {throw safeError('STAGE_ROOT');}
    const stageIssues=[];
    try {
      const observed=await collectObservedSnapshot(stageRoot,reviewedPathPolicy===undefined?{}
        :{sourceCommit,reviewedPathPolicy});
      const byPath=new Map(observed.map(row=>[row.path,row]));
      for(const row of inputs) {
        const actual=byPath.get(row.path);
        if(!actual){stageIssues.push(issue('STAGE_MISSING',row.path));continue;}
        if(actual.bytes!==row.bytes){stageIssues.push(issue('STAGE_SIZE_MISMATCH',row.path));continue;}
        if(row.sha256) {
          if(actual.sha256!==row.sha256)stageIssues.push(issue('STAGE_HASH_MISMATCH',row.path));
        } else {
          try {
            const identity=await stageBlobIdentity(stageRoot,row);
            if(identity.gitBlob!==row.gitBlob)stageIssues.push(issue('STAGE_BLOB_MISMATCH',row.path));
            if(identity.sha256!==actual.sha256)stageIssues.push(issue('STAGE_CHANGED',row.path));
          }
          catch {stageIssues.push(issue('STAGE_BINARY_UNVERIFIED',row.path));}
        }
      }
      for(const row of observed)if(!required.has(row.path))stageIssues.push(issue('STAGE_EXTRA',row.path));
    } catch {stageIssues.push(issue('STAGE_COLLECTION_REFUSED'));}
    stageComparison={scope:'discovered-policy-allowed-inputs-only',matches:stageIssues.length===0,
      blockedSourceInputs:policyConflicts.length,
      issues:stageIssues.sort((a,b)=>cmp(a.path??'',b.path??'')||cmp(a.code,b.code))};
  }
  const distinct=values=>[...new Map(values.map(row=>[JSON.stringify(row),row])).values()];
  return {sourceCommit,sourceTree,inputs,
    classifiedReads:distinct(classifiedReads).sort((a,b)=>cmp(a.path,b.path)||(a.line-b.line)),
    modelEnumeration,rendererInputs,
    classifiedUrls:distinct(classifiedUrls).sort((a,b)=>cmp(a.path,b.path)||(a.line-b.line)),
    classifiedImports:distinct(classifiedImports).sort((a,b)=>cmp(a.path,b.path)||(a.line-b.line)),
    unresolved:distinct(unresolved).sort((a,b)=>cmp(a.path??'',b.path??'')||cmp(a.code,b.code)||((a.line??0)-(b.line??0))),
    policyConflicts:distinct(policyConflicts).sort((a,b)=>cmp(a.path??'',b.path??'')),externalAssumptions,
    limits:{codeFiles:MAX_CODE_FILES,codeBlobBytes:MAX_BLOB,totalCodeBytes:MAX_TOTAL_CODE_BYTES},
    stageComparison,staticTraversalComplete:false,closureProven:false,isolatedBuildVerified:false,
    rightsOrPrivacyGranted:false,sourceBackupAdmitted:false};
}
