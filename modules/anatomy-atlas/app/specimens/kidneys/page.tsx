'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
const Kidneys = dynamic(() => import('../../hra-renal-study'), { ssr: false, loading: () => <p role="status">Loading kidney study…</p> });
export default function KidneyStudyPage() {
  const router = useRouter();
  return <main className="specimen-linked-page"><h1>Kidney reference study</h1>
    <Link href="/regions/abdomen">Back to the abdomen atlas</Link>
    <Kidneys onClose={() => router.push('/regions/abdomen')} />
  </main>;
}
