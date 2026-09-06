import type { BodyStructure } from '../app/body-types';

/** Varied landmark practice from loaded surfaces only; not a validated assessment. */
export function practiceTargets(
  items: BodyStructure[],
  loaded: string[],
  count: number,
  random = Math.random,
) {
  const limit = Math.max(
    1,
    Math.min(20, Math.floor(Number.isFinite(count) ? count : 5)),
  );
  const volume = (s: BodyStructure) =>
    s.bounds.max.reduce(
      (value, n, i) => value * Math.max(0.01, n - s.bounds.min[i]),
      1,
    );
  const candidates = [
    ...new Map(
      items.filter((s) => loaded.includes(s.bundle)).map((s) => [s.id, s]),
    ).values(),
  ]
    .sort((a, b) => volume(b) - volume(a))
    .slice(0, limit * 3);
  for (let i = candidates.length - 1; i > 0; i--) {
    const value = random();
    const j = Math.floor(
      Math.max(0, Math.min(0.99999999, Number.isFinite(value) ? value : 0)) *
        (i + 1),
    );
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, limit);
}
