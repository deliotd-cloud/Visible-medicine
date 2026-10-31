import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const historicalRoot='F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate';
const historicalFont='public/fonts/geist-mono-latin.woff2';
export function readPresentationFontBeforeProvenance(){
 const bytes=readFileSync(historicalRoot+'/SOURCE_V2.json');
 assert.equal(sha(bytes),'d388db43518ff7ccd443a8e7977e7ac67b2f49a696eb294529992ba64fc4132d');
 const receipt=JSON.parse(bytes),rows=receipt.sourceRows.filter(row=>row.path===historicalFont);
 assert.equal(rows.length,1);assert.equal(rows[0].sha256,'5f3d6ad60f29d6cb708414ec6887163d63bf197377ef5417d2483ff31ace6c3b');
 const font=readFileSync(historicalRoot+'/website/'+historicalFont);
 assert.equal(font.length,rows[0].bytes);assert.equal(sha(font),rows[0].sha256);return font;
}
export function assertPresentationFontProvenance({read}){
 const bytes=read('LICENSES/native-website/geist-mono-provenance.json');
 assert.equal(sha(bytes),'c5dbe1816967c2025525b0235df72d0bfb7b3aae4f1dc9250a4b6712f5defdcc','Exact recorded official font transition');
 const record=JSON.parse(bytes);assert.equal(record.localFontPath,historicalFont);
 assert.equal(record.previousLocalFont.sha256,'5f3d6ad60f29d6cb708414ec6887163d63bf197377ef5417d2483ff31ace6c3b');
 assert.equal(record.previousLocalFont.originalDownloadUrlRetained,false);
 assert.equal(record.sourceFontUrl,'https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFrcdmg.woff2');
 assert.equal(record.sourceSubset,'latin');assert.equal(record.license,'SIL Open Font License 1.1');
 const font=read(record.localFontPath);assert.equal(font.length,record.fontBytes);assert.equal(sha(font),record.fontSha256);
 assert.equal(font.subarray(0,4).toString(),'wOF2');
 for(const path of ['LICENSES/geist-mono-OFL.txt','public/licenses/geist-mono-OFL.txt'])assert.equal(sha(read(path)),record.licenseSha256);
 const notice=read('LICENSES/THIRD_PARTY_NOTICES.md').toString();
 for(const value of [record.sourceFontUrl,record.fontSha256,record.licenseSha256])assert(notice.includes(value));
}
export function restorePresentationBeforeFontProvenance(bytes){
 let text=bytes.toString();
 const changes=[
  ["import {readPresentationFontBeforeProvenance,assertPresentationFontProvenance} from './partition10-font-history.mjs';\n",''],
  ["sha(readPresentationFontBeforeProvenance())","sha(read('public/fonts/geist-mono-latin.woff2'))"],
  [' assertPresentationFontProvenance({read});\n',''],
 ];
 for(const [after,before]of changes){assert.equal(text.split(after).length,2,'One declared font transition: '+after);text=text.replace(after,before);}
 const result=Buffer.from(text);assert.equal(sha(result),'b8759b92109408ad937727b029b667e3d698d17dcefb8d0194995a5ec81dc5e2','All original imaging presentation assertions retained');return result;
}
