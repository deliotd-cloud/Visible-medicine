import type {Metadata} from 'next';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {legacyModalityHref} from '../../lib/atlas-navigation';
import {AtlasModalityCards,AtlasImageNotes} from '../../components/AtlasModalityCards';
export const metadata:Metadata={title:'Anatomy atlas',description:'Explore Visible Medicine anatomy in 3D, CT, MRI, ultrasound and X-ray.'};
export default async function AtlasCatalogue({searchParams}:{searchParams:Promise<{modality?:string|string[]}>}){
  const destination=legacyModalityHref((await searchParams).modality);
  if(destination)redirect(destination);
  return <main className="atlas-hub">
    <header className="atlas-hub-heading"><p className="eyebrow">Visible Medicine Atlas</p><h1>Explore anatomy.</h1><p>Choose a modality, then a body region.</p><p><Link href="/atlas/guided-learning" prefetch={false}>Guided learning →</Link> · Find linked head sequences and regional 3D tours.</p></header>
    <AtlasModalityCards layout="list"/>
    <AtlasImageNotes/>
  </main>;
}
