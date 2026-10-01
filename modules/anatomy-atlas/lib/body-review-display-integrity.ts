import pins from '../content/body-review-display-pins.json';
import {
  bodyReviewDisplayFields,
  bodyReviewDisplayPinSchema,
  bodyReviewDisplayPreimage,
} from './body-review-display-evidence';

// These hashes come from this build's trusted catalogue/resolver, not a response.
// Neither teaching text nor mutable caller-owned evidence is cached in the client.
const trustedPins = new Map(
  pins.pins.map((pin) => [pin.structureId, pin.sha256]),
);
const validPins =
  pins.schema === bodyReviewDisplayPinSchema &&
  pins.algorithm === 'SHA-256' &&
  pins.scope === 'body-display-catalog' &&
  JSON.stringify(pins.evidenceFields) ===
    JSON.stringify(bodyReviewDisplayFields) &&
  trustedPins.size === pins.pins.length &&
  pins.pins.every(
    (pin) =>
      typeof pin.structureId === 'string' &&
      pin.structureId.length <= 256 &&
      /^[a-f0-9]{64}$/.test(pin.sha256),
  );

export async function bodyReviewDisplayMatches(
  value: unknown,
  expectedId: string,
): Promise<boolean> {
  try {
    if (
      !validPins ||
      typeof expectedId !== 'string' ||
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    )
      return false;
    const record = value as Record<string, unknown>;
    if (
      record.structureId !== expectedId ||
      record.kind !== 'body-display-catalog'
    )
      return false;
    const expected = trustedPins.get(expectedId);
    if (!expected || !globalThis.crypto?.subtle) return false;
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(bodyReviewDisplayPreimage(value, expectedId)),
    );
    const actual = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    return actual === expected;
  } catch {
    return false;
  }
}
