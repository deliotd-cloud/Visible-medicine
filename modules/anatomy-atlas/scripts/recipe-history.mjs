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

export const acralBoneProfilesHash =
  '4168423334b664572cd0ee4ec437aad7dd7e1905c2318b60ec3a71ca9836623f';

export const spinalLevelProfilesHash =
  '14ae3dded68c96d62c9d7d578d1f1cbf4ff00272c745bf17610dfb11bc76769f';

export const kneeStudyProfilesHash =
  'dc6ea9198a24ac28e02df8729d9d06543eada6786a6ebd2d6b139f626043a4be';

/** Strip only the recorded knee additions for historical regression checks. */
export function preKneeStudyRecipeProfiles(profiles) {
  if ([preOrbitalMotorProfilesHash, orbitalMotorProfilesHash, renalProfilesHash,
    acralBoneProfilesHash, spinalLevelProfilesHash].includes(hash(profiles)))
    return structuredClone(profiles);
  assert.equal(hash(profiles), kneeStudyProfilesHash, 'Unrecorded knee recipe edit');
  const previous = structuredClone(profiles), leg = previous.leg;
  const ids = ['knee-bones', 'knee-patella-off', 'knee-popliteus'];
  assert.equal(hash({
    stages: leg.stages.filter((s) => ids.includes(s.id)),
    focuses: leg.focuses.filter((s) => ids.includes(s.id)),
    references: leg.references.slice(-1),
  }), '10956bcb2bcd0848469a6c7ea59b80b27f59e117271f7ca7bb92facf7a9cd778');
  leg.stages = leg.stages.filter((s) => !ids.includes(s.id));
  leg.focuses = leg.focuses.filter((s) => !ids.includes(s.id));
  leg.references = leg.references.slice(0, -1);
  assert.equal(hash(previous), spinalLevelProfilesHash, 'Every earlier recipe retained');
  return previous;
}

/** Preserve every earlier recipe; remove only the exact six spinal windows. */
export function preSpinalLevelRecipeProfiles(profiles) {
  profiles = preKneeStudyRecipeProfiles(profiles);
  if (
    [
      preOrbitalMotorProfilesHash,
      orbitalMotorProfilesHash,
      renalProfilesHash,
      acralBoneProfilesHash,
    ].includes(hash(profiles))
  )
    return structuredClone(profiles);
  assert.equal(
    hash(profiles),
    spinalLevelProfilesHash,
    'Unrecorded spinal recipe edit',
  );
  const previous = structuredClone(profiles),
    spine = previous.spine;
  const ids = [
    'spine-c1-c2',
    'spine-c5-c6',
    'spine-c7-t1',
    'spine-t12-l1',
    'spine-l4-l5',
    'spine-l5-s1',
  ];
  const addition = {
    stages: spine.stages.filter((s) => ids.includes(s.id)),
    focuses: spine.focuses.filter((s) => ids.includes(s.id)),
    references: spine.references.slice(-2),
  };
  assert.equal(
    hash(addition),
    '863eae6633066200c80fa355f773b68ff79a5eab45d6e00cca790d5fd00dd302',
    'Exact spinal addition',
  );
  spine.stages = spine.stages.filter((s) => !ids.includes(s.id));
  spine.focuses = spine.focuses.filter((s) => !ids.includes(s.id));
  spine.references = spine.references.slice(0, -2);
  assert.equal(
    hash(previous),
    acralBoneProfilesHash,
    'Every pre-spinal recipe is unchanged',
  );
  return previous;
}

/** Remove only the recorded four bone windows for older preservation tests. */
export function preAcralBoneRecipeProfiles(profiles) {
  profiles = preSpinalLevelRecipeProfiles(profiles);
  if (
    [
      preOrbitalMotorProfilesHash,
      orbitalMotorProfilesHash,
      renalProfilesHash,
    ].includes(hash(profiles))
  )
    return structuredClone(profiles);
  assert.equal(
    hash(profiles),
    acralBoneProfilesHash,
    'Unrecorded dissection profile edit',
  );
  const previous = structuredClone(profiles);
  const addedIds = [
    'carpal-proximal-row',
    'carpal-distal-row',
    'tarsal-hindfoot',
    'tarsal-midfoot',
  ];
  const regions = ['hand', 'foot'];
  const addition = Object.fromEntries(
    regions.map((region) => [
      region,
      {
        stages: previous[region].stages.filter((s) => addedIds.includes(s.id)),
        focuses: previous[region].focuses.filter((s) =>
          addedIds.includes(s.id),
        ),
        references: previous[region].references.slice(
          region === 'hand' ? -1 : -2,
        ),
      },
    ]),
  );
  assert.equal(
    hash(addition),
    '2c47520f5764b6e3f38f2de38fc5166ada34e9b579c0679187e9c5e6a59e53b8',
    'Exact acral bone addition',
  );
  for (const region of regions) {
    previous[region].stages = previous[region].stages.filter(
      (s) => !addedIds.includes(s.id),
    );
    previous[region].focuses = previous[region].focuses.filter(
      (s) => !addedIds.includes(s.id),
    );
    previous[region].references = previous[region].references.slice(
      0,
      region === 'hand' ? -1 : -2,
    );
  }
  assert.equal(
    hash(previous),
    renalProfilesHash,
    'Every earlier recipe is unchanged',
  );
  return previous;
}

/** Verify only the recorded renal addition before historical comparisons. */
export function preRenalRecipeProfiles(profiles) {
  profiles = preAcralBoneRecipeProfiles(profiles);
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
