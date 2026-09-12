'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IndependentStudyLink } from '@/lib/independent-study-links';
const loading = () => (
  <p role="status">Preparing the separate source specimen…</p>
);
const viewers = {
  kidneys: dynamic(() => import('../hra-renal-study'), { ssr: false, loading }),
  'female-pelvis': dynamic(() => import('../hra-pelvis-study'), {
    ssr: false,
    loading,
  }),
  'abdominal-wall': dynamic(() => import('../abdominal-wall-study'), {
    ssr: false,
    loading,
  }),
  'back-layers': dynamic(() => import('../back-layers-study'), {
    ssr: false,
    loading,
  }),
};
const titles = {
  kidneys: 'Kidneys',
  'female-pelvis': 'Female pelvis',
  'abdominal-wall': 'Abdominal wall',
  'back-layers': 'Back layers',
};
const regions = {
  kidneys: 'abdomen',
  'female-pelvis': 'pelvis',
  'abdominal-wall': 'abdomen',
  'back-layers': 'spine',
};
export default function IndependentLinkedPage({
  kind,
  link,
}: {
  kind: keyof typeof viewers;
  link: IndependentStudyLink;
}) {
  const router = useRouter(),
    Viewer = viewers[kind],
    back = '/regions/' + regions[kind];
  return (
    <main className="specimen-linked-page">
      <h1>Visible Medicine · {titles[kind]}</h1>
      <Link href={back}>Back to regional atlas</Link>
      <Viewer initialLink={link} onClose={() => router.push(back)} />
    </main>
  );
}
