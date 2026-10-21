import path from 'node:path';
import {convertV4MiniflareOptions,Log,LogLevel} from 'miniflare';

// Miniflare 5 persists each resource below this root (including its r2 directory).
export function localCandidateMiniflareOptions(root){
 if(!path.isAbsolute(root))throw Error('Local website root must be absolute.');
 return convertV4MiniflareOptions({name:'vm-local-candidate-staging',modules:true,
  script:'export default {fetch(){return new Response("Local staging only",{status:404})}};',
  compatibilityDate:'2026-08-23',host:'127.0.0.1',port:0,r2Buckets:{FILES:'site-creator-r2'},
  resourcePersistencePath:path.join(root,'.wrangler','state','v3'),
  log:new Log(LogLevel.NONE)});
}
