import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../public/fracture-review/',import.meta.url);
const hash=value=>createHash('sha256').update(value).digest('base64');
const [template,css,validator,viewer]=await Promise.all(['index.html','review.css','package.js','review.js'].map(f=>readFile(new URL(f,root),'utf8').then(text=>text.replaceAll('\r\n','\n'))));
if(/<\/script/i.test(validator+viewer)||/<\/style/i.test(css))throw Error('Unsafe embedded source');
const html=template.replace("script-src 'self'; style-src 'self'",`script-src 'sha256-${hash(validator)}' 'sha256-${hash(viewer)}'; style-src 'sha256-${hash(css)}'`)
  .replace('<link rel="stylesheet" href="/fracture-review/review.css">',`<style>${css}</style>`)
  .replace('<script defer src="/fracture-review/package.js"></script>','')
  .replace('<script defer src="/fracture-review/review.js"></script>','')
  .replace('</body>',`<script>${validator}</script><script>${viewer}</script></body>`);
await writeFile(new URL('reader.html',root),html);
console.log('Built self-contained network-isolated fracture reader.');
