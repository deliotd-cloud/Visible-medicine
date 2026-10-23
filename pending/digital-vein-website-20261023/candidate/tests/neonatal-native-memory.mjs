// Optional local-only resource evidence for an explicitly budgeted native run.
import fs from 'node:fs';
import {resolve} from 'node:path';
import {getHeapStatistics} from 'node:v8';
const dir=process.env.VM_NEONATAL_MEMORY_DIR;
if(dir){
  const target=resolve(dir).replaceAll('\\','/');
  if(!target.startsWith('F:/VisibleMedicine/staging/20261023-neonatal-current-epoch/checks/')||!target.endsWith('/memory'))throw Error('Unexpected memory evidence target');
  process.once('exit',()=>fs.writeFileSync(target+'/'+process.pid+'.json',JSON.stringify({at:new Date().toISOString(),pid:process.pid,argv:process.argv,heapLimitBytes:getHeapStatistics().heap_size_limit,usage:process.resourceUsage(),memoryAtExit:process.memoryUsage(),productionPerformance:false},null,2)+'\n',{flag:'wx'}));
}
