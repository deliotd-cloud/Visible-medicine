import { allBodySystems, type BodySystem } from '../app/body-types.ts';

export const bodySystemPresets: Array<{
  id: string;
  title: string;
  systems: BodySystem[];
}> = [
  {
    id: 'all',
    title: 'All anatomy',
    systems: Object.keys(allBodySystems) as BodySystem[],
  },
  {
    id: 'musculoskeletal',
    title: 'Bones & muscles',
    systems: ['skeleton', 'muscles'],
  },
  { id: 'skeleton', title: 'Bones', systems: ['skeleton'] },
  { id: 'muscles', title: 'Muscles', systems: ['muscles'] },
  { id: 'organs', title: 'Organs & teeth', systems: ['organs'] },
  {
    id: 'neurovascular',
    title: 'Nerves & vessels',
    systems: ['nerves', 'vessels'],
  },
  { id: 'nerves', title: 'Nervous', systems: ['nerves'] },
  { id: 'vessels', title: 'Vessels', systems: ['vessels'] },
  { id: 'connective', title: 'Connective', systems: ['connective'] },
];
export function bodyPresetSystems(
  id: string,
): Record<BodySystem, boolean> | null {
  const preset = bodySystemPresets.find((item) => item.id === id);
  return preset
    ? (Object.fromEntries(
        Object.keys(allBodySystems).map((system) => [
          system,
          preset.systems.includes(system as BodySystem),
        ]),
      ) as Record<BodySystem, boolean>)
    : null;
}
export function bodyPresetMatches(
  id: string,
  systems: Record<BodySystem, boolean>,
) {
  const preset = bodyPresetSystems(id);
  return (
    !!preset &&
    Object.keys(preset).every(
      (system) =>
        preset[system as BodySystem] === systems[system as BodySystem],
    )
  );
}
