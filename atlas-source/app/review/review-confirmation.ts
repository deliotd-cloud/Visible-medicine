/** A confirmation applies only to the criteria supplied by the current track. */
export function reviewConfirmation(
  checks: Record<string, boolean>,
  criteria: readonly { id: string }[],
  confirmed: boolean,
) {
  const next = { ...checks };
  for (const criterion of criteria) next[criterion.id] = confirmed;
  return { checks: next, attested: confirmed };
}

export function reviewIsConfirmed(
  checks: Record<string, boolean>,
  attested: boolean,
  criteria: readonly { id: string }[],
) {
  return attested && criteria.every((criterion) => checks[criterion.id] === true);
}
