'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
const Study = dynamic(() => import('../../hra-pelvis-study'), {
  ssr: false,
  loading: () => (
    <p role="status">Preparing the separate female pelvic reference…</p>
  ),
});
export default function FemalePelvisPage() {
  const router = useRouter();
  return (
    <main className="specimen-linked-page">
      <h1>Visible Medicine · female pelvis</h1>
      <Link href="/regions/pelvis">Back to pelvic atlas</Link>
      <Study onClose={() => router.push('/regions/pelvis')} />
    </main>
  );
}
