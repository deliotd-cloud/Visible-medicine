import fs from'node:fs';import assert from'node:assert/strict';import{spawn}from'node:child_process';
const results=[];
for(const phase of['import','inventory','lecture']){
 const child=spawn(process.execPath,['--expose-gc','--max-old-space-size=256','import-quadriceps-website-stock-20261028.mjs',phase],{windowsHide:true,stdio:'inherit'});
 const result=await new Promise(resolve=>{child.once('error',error=>resolve({error:String(error)}));child.once('close',(code,signal)=>resolve({code,signal}));});results.push({phase,...result});assert(result.code===0&&!result.signal&&!result.error,JSON.stringify(result));
}
fs.writeFileSync('F:/VisibleMedicine/staging/20261028-quadriceps-website/STOCK_IMPORT_RESULT.json',JSON.stringify({at:new Date().toISOString(),passing:true,results},null,2)+'\n',{flag:'wx'});
