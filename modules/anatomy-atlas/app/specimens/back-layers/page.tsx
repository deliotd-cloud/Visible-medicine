'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
const Specimen = dynamic(() => import('../../back-layers-study'), {
  ssr: false,
  loading: () => (
    <p role="status">Preparing the separate back-layer specimen…</p>
  ),
});
export default function BackLayersPage() {
  const router = useRouter();
  return (
    <main className="specimen-linked-page">
      <h1>Visible Medicine · back layers</h1>
      <Link href="/regions/spine">Back to spine atlas</Link>
      <Specimen onClose={() => router.push('/regions/spine')} />
    </main>
  );
}
