import { sourceCanonical } from './body-source-additions';

export const bodyReviewDisplayPinSchema = 'vm-body-review-display-pins-1';
export const bodyReviewDisplayFields = [
  'source',
  'topics',
  'reasoning',
  'guidedTours',
  'checklist',
  'atlasLink',
  'limits',
] as const;

/** Same display evidence in generation and transport, without shipping teaching. */
export function bodyReviewDisplayPreimage(
  value: unknown,
  structureId: string,
): string {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid review display evidence');
  const record = value as Record<string, unknown>;
  const evidence = Object.fromEntries(
    bodyReviewDisplayFields.map((key) => [key, record[key]]),
  );
  return sourceCanonical(
    JSON.parse(
      JSON.stringify({
        schema: bodyReviewDisplayPinSchema,
        kind: 'body-display-catalog',
        structureId,
        evidence,
      }),
    ),
  );
}
