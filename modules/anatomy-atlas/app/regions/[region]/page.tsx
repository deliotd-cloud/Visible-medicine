import BodyExplorer from '../../body-explorer';
export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  return <BodyExplorer key={region} initialRegion={region} />;
}
