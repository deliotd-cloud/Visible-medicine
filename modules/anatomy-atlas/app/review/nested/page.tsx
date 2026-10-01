import { Brand } from '../../brand';
import { nestedReviewRows, nestedReviewSelection } from '@/lib/nested-review-material';
import { nestedReviewKey } from '@/lib/nested-review-key';
import { nestedReviewQuery, nestedReviewNavigationTrack } from '@/lib/nested-review-queue';
import { NestedReviewWorkspace } from './workspace';
import '../body/body-review.css';
import './nested-review.css';
export const dynamic = 'force-dynamic';
export const metadata = {title:'Nested Anatomy Review | Visible Medicine'};
export default async function NestedReviewPage({searchParams}:{
  searchParams:Promise<{parent?:string;study?:string;structure?:string;source?:string;q?:string|string[];t?:string|string[]}>;
}) {
  const p=await searchParams;
  const packet=typeof p.parent==='string'&&typeof p.study==='string'&&typeof p.structure==='string'
    ?await nestedReviewSelection(nestedReviewKey(p.parent,p.study),p.structure,p.source):null;
  return <div className="body-review-app">
    <header className="body-review-header"><Brand/><span>Nested anatomy reviews</span>
      <a href="/review/overview">Clinical review home</a><a href="/">Atlas</a></header>
    <main className="body-review-shell"><h1>Review the selected internal structure</h1>
      <p>Private, account-specific records for an exact parent, dissection study and child. No automatic approval or transfer between scopes.</p>
      <NestedReviewWorkspace key={packet?.context.materialHash??'pick'} rows={nestedReviewRows} packet={packet} initialQuery={nestedReviewQuery(p.q)} initialTrack={nestedReviewNavigationTrack(p.t)} invalid={!!(p.parent||p.study||p.structure)&&!packet}/>
    </main></div>;
}
