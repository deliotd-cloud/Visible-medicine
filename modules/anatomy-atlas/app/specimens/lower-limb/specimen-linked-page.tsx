'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { specimenReturnPath, type ParsedSpecimenLink } from '../../../lib/specimen-links';
const Specimen = dynamic(() => import('../../um-limb-study'), { ssr: false, loading: () => <p role="status">Preparing the independent specimen…</p> });

export default function SpecimenLinkedPage({ link }: { link: ParsedSpecimenLink }) {
  const router = useRouter(), back = specimenReturnPath(link.status === 'requested' ? link.request.scope : 'knee');
  return <main className="specimen-linked-page"><h1>Visible Medicine · lower-limb specimen</h1><Link href={back}>Back to regional atlas</Link>
    <Specimen initialRegion="leg" initialLink={link} onClose={() => router.push(back)} />
  </main>;
}
