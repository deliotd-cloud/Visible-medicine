import ShoulderExplorer from '../shoulder-explorer';
import { structures } from '../anatomy-data';
export const metadata = { title: 'Shoulder Dissection | Visible Medicine' };
export default async function ShoulderPage({
  searchParams,
}: {
  searchParams: Promise<{ structure?: string }>;
}) {
  const { structure } = await searchParams;
  const id = structures.find((s) => s.id === structure)?.id ?? structures[0].id;
  return <ShoulderExplorer key={id} initialSelectedId={id} />;
}
