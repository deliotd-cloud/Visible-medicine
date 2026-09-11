'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
const Specimen = dynamic(() => import('../../abdominal-wall-study'), { ssr: false, loading: () => <p role="status">Preparing the separate abdominal-wall specimen…</p> });
export default function AbdominalWallPage() {
  const router = useRouter();
  return <main className="specimen-linked-page"><h1>Visible Medicine · abdominal wall</h1><Link href="/regions/abdomen">Back to abdominal atlas</Link>
    <Specimen onClose={() => router.push('/regions/abdomen')} />
  </main>;
}
