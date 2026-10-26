// Synchronous streaming SHA-256 with one reusable 64KiB buffer. Hashing never
// yields or recurses, so a later call cannot alter an earlier call's bytes.
// Keep the prior helper intact for reproducibility of historical checks.
import fs from 'node:fs';import {createHash} from 'node:crypto';
export {json} from './seal-simple-website-successor.mjs';
const buffer=Buffer.alloc(65536);
export function hash(file){const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,buffer,0,buffer.length,null)))h.update(buffer.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
