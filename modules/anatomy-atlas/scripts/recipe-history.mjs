import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const preOrbitalMotorProfilesHash =
  'd127268c45678a49ff8eeae4c5622172d4549497aca33d5b3b19507557d83e9c';
export const orbitalMotorProfilesHash =
  '646198113536b582de64366f719bd54fb88e228205f45597f89e1cbd501f4701';
export const renalProfilesHash =
  'd25343bee51c7e2708ef96790f7a8ab0913b735d4d35d648ac4a81145acded45';
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const ids = [
  'orbital-motor-iii-superior',
  'orbital-motor-iii-inferior',
  'orbital-motor-iv',
];

/** Verify only the recorded renal addition before historical comparisons. */
export function preRenalRecipeProfiles(profiles) {
  if (
    [preOrbitalMotorProfilesHash, orbitalMotorProfilesHash].includes(
      hash(profiles),
    )
  )
    return structuredClone(profiles);
  assert.equal(
    hash(profiles),
    renalProfilesHash,
    'Unrecorded dissection profile edit',
  );
  const previous = structuredClone(profiles);
  const renalIds = [
    'renal-right-relationships',
    'renal-left-relationships',
    'renal-arterial-relationships',
    'renal-ureter-relationships',
  ];
  const regions = ['abdomen', 'whole-body'];
  const addition = Object.fromEntries(
    regions.map((region) => [
      region,
      {
        focuses: previous[region].focuses.filter((s) =>
          renalIds.includes(s.id),
        ),
        references: previous[region].references.slice(-2),
      },
    ]),
  );
  assert.equal(
    hash(addition),
    '933d843610e54e812c06eacd1086db0ef21f5acf9d165488d8418e85028af2bb',
    'Exact eight-focus/four-reference renal addition',
  );
  for (const region of regions) {
    previous[region].focuses = previous[region].focuses.filter(
      (s) => !renalIds.includes(s.id),
    );
    previous[region].references = previous[region].references.slice(0, -2);
  }
  assert.equal(
    hash(previous),
    orbitalMotorProfilesHash,
    'Every pre-renal recipe is unchanged',
  );
  return previous;
}

/** Historical copy comparisons only. Runtime profiles are never substituted.
 * Verify the entire current profile and exact six-recipe/two-reference addition
 * before returning the older snapshot. Old snapshots are already canonical.
 * No broad prefix exclusion, baseline repinning or silent future-edit allowance.
 */
export function historicalRecipeProfiles(profiles) {
  profiles = preRenalRecipeProfiles(profiles);
  if (hash(profiles) === preOrbitalMotorProfilesHash)
    return structuredClone(profiles);
  assert.equal(
    hash(profiles),
    orbitalMotorProfilesHash,
    'Unrecorded dissection profile edit',
  );
  const previous = structuredClone(profiles);
  const head = previous['head-neck'];
  const added = {
    stages: head.stages.filter((s) => ids.includes(s.id)),
    focuses: head.focuses.filter((s) => ids.includes(s.id)),
    references: head.references.slice(-2),
  };
  assert.equal(
    hash(added),
    '64d55f6accc64005a310b35a9059a3b0dfe6ef340a689c9493512d67de73c5d9',
    'Exact authored orbital-motor addition',
  );
  head.stages = head.stages.filter((s) => !ids.includes(s.id));
  head.focuses = head.focuses.filter((s) => !ids.includes(s.id));
  head.references = head.references.slice(0, -2);
  assert.equal(
    hash(previous),
    preOrbitalMotorProfilesHash,
    'Every earlier recipe is unchanged',
  );
  return previous;
}
