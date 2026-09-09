/** Pure policy helper, NOT authentication, billing or a client-side paywall.
 * Call in the trusted host using current server-owned rules, subject and grants.
 * Never accept these records from a browser, locator or imported content file.
 */
export type LearningAccessRule =
  | { kind: 'public' }
  | { kind: 'products'; anyOf: string[] };
export type LearningGrant = {
  subjectId: string;
  productId: string;
  status: 'active' | 'revoked';
  validFrom: number;
  validUntil: number | null;
};
const identifier = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9:_-]{1,220}$/.test(value);
const instant = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) >= 0;
function fields(
  value: unknown,
  keys: string[],
): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return (
    (prototype === Object.prototype || prototype === null) &&
    Reflect.ownKeys(value).length === keys.length &&
    keys.every((key) =>
      Object.hasOwn(Object.getOwnPropertyDescriptor(value, key) ?? {}, 'value'),
    )
  );
}

/** Exact product matching only. Bundles must be listed explicitly in each rule.
 * Grants are a current snapshot (one row per subject/product), not event history.
 * Unknown, duplicate, malformed or stale inputs fail closed. Time is server UTC
 * epoch milliseconds; start is inclusive, expiry exclusive. Nothing is cached.
 */
export function hasLearningEntitlement(
  rule: unknown,
  subjectId: string | null,
  grants: unknown,
  nowMs: number,
): boolean {
  try {
    if (!instant(nowMs)) return false;
    if (fields(rule, ['kind']) && rule.kind === 'public') return true;
    if (
      !fields(rule, ['kind', 'anyOf']) ||
      rule.kind !== 'products' ||
      !Array.isArray(rule.anyOf) ||
      rule.anyOf.length === 0 ||
      rule.anyOf.length > 100 ||
      !rule.anyOf.every(identifier) ||
      new Set(rule.anyOf).size !== rule.anyOf.length ||
      !identifier(subjectId) ||
      !Array.isArray(grants) ||
      grants.length > 1000
    )
      return false;
    const seen = new Set<string>();
    let allowed = false;
    for (const grant of grants) {
      if (
        !fields(grant, [
          'subjectId',
          'productId',
          'status',
          'validFrom',
          'validUntil',
        ]) ||
        !identifier(grant.subjectId) ||
        grant.subjectId !== subjectId ||
        !identifier(grant.productId) ||
        (grant.status !== 'active' && grant.status !== 'revoked') ||
        !instant(grant.validFrom) ||
        (grant.validUntil !== null &&
          (!instant(grant.validUntil) ||
            grant.validUntil <= grant.validFrom)) ||
        seen.has(grant.productId)
      )
        return false;
      seen.add(grant.productId);
      if (
        grant.status === 'active' &&
        rule.anyOf.includes(grant.productId) &&
        nowMs >= grant.validFrom &&
        (grant.validUntil === null || nowMs < grant.validUntil)
      )
        allowed = true;
    }
    return allowed;
  } catch {
    return false;
  }
}
