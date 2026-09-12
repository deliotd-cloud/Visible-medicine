import ShoulderExplorer from '../../shoulder-explorer';
import { structures } from '../../anatomy-data';
export const metadata = { title: 'Shoulder module preview | Visible Medicine' };
/** Private Sites preview, not an anonymous/public embed or main-website port. */
export default async function Page({ searchParams }: { searchParams: Promise<{structure?:string}> }) {
  const {structure} = await searchParams;
  const selected = structures.find(s => s.id === structure)?.id ?? structures[0].id;
  return <div className="atlas-shoulder-panel-preview"><ShoulderExplorer key={selected} initialSelectedId={selected} presentation="panel" /></div>;
}
