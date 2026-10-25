import fs from 'node:fs';
const source=fs.readFileSync(new URL('./preview-ultrasound-polish-20261025.mjs',import.meta.url),'utf8');
fs.writeFileSync(new URL('./preview-ultrasound-polish-tty-20261025.mjs',import.meta.url),source.replace("stage+'/checks/browser-attempt-1'","stage+'/checks/browser-attempt-2'"),{flag:'wx'});
fs.writeFileSync('F:/VisibleMedicine/staging/20261025-ultrasound-polished-website-v2/checks/browser-attempt-1/NO_BROWSER_ACCEPTANCE.json',JSON.stringify({at:new Date().toISOString(),result:'Server stdin reached EOF before browser navigation; owned server closed cleanly. Browser ERR_CONNECTION_REFUSED is not application acceptance.',sourceChanged:false,retry:'Separate browser-attempt-2 with retained terminal input.'},null,2)+'\n',{flag:'wx'});
