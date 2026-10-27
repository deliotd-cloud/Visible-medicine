import {beforeFilterScrollSource} from './review-filter-scroll-source-role.mjs';
import {priorPagerInboxSource} from './inbox-deferred-return-source-role.mjs';
// Exact reconstruction of the pre-pager-focus inbox for the older CSS theorem.
// Current focus behavior is exercised independently, not asserted unchanged.
import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function readInboxHistoricalSource(path,root,read=p=>readFileSync(root+'/'+p)){
 const raw=beforeFilterScrollSource(path,read(path));const bytes=path==='components/ClinicalReviewInbox.tsx'&&sha(raw)==='a20677113be61ffb8036c222f297b322ee5e2b4e00c1fe91b9f1308c9a7c267f'?Buffer.from(priorPagerInboxSource(raw.toString())):raw;if(path!=='components/ClinicalReviewInbox.tsx')return bytes;
 const digest=sha(bytes);if(digest==='daa77c9e5686865053aa8ce0c156860f807a75ec75905f71f7a13a7aa7b77bb0')return bytes;
 assert.equal(digest,'c80e693ec12ceae85f959563d1ee1746d4b543bc78ebf03c909bf6eb6e2a7897','Only the exact current three-seam inbox can reconstruct history');let text=bytes.toString();
 for(const[a,b]of [['  const resultsPager = useRef<HTMLElement | null>(null);\n',''],['origin && (resultsList.current?.contains(origin) || resultsPager.current?.contains(origin))','origin && resultsList.current?.contains(origin)'],['<nav ref={resultsPager} className="clinical-review-inbox-pages"','<nav className="clinical-review-inbox-pages"']]){assert.equal(text.split(a).length,2,'One exact historical seam');text=text.replace(a,b);}
 const inverse=Buffer.from(text);assert.equal(sha(inverse),'daa77c9e5686865053aa8ce0c156860f807a75ec75905f71f7a13a7aa7b77bb0');return inverse;
}
