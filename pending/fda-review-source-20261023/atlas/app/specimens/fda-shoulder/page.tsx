import {notFound} from 'next/navigation';
import FdaShoulderReference from '../../fda-shoulder-reference';
import {parseFdaReferenceSelection} from '../../../lib/fda-reference-links';
import {assertPinnedFdaCatalogue} from '../../../lib/fda-shoulder-reference';
import catalogue from '../../../public/models/fda-shoulder-draft/catalog.json';
export const dynamic='force-dynamic';
export const metadata={title:'Independent shoulder source draft | Visible Medicine',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 await assertPinnedFdaCatalogue(catalogue);
 const selection=parseFdaReferenceSelection(await searchParams);if(!selection)notFound();
 return <FdaShoulderReference {...selection}/>;
}
