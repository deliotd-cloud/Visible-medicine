// Only these documented transient D1 failures may hide an optional learning read.
// https://developers.cloudflare.com/d1/observability/debug-d1/
const transientD1Messages = new Set([
  'D1_ERROR: Network connection lost.',
  'D1_ERROR: Replica disconnected from primary.',
  'D1_ERROR: D1 DB is overloaded. Requests queued for too long.',
  'D1_ERROR: D1 DB is overloaded. Too many requests queued.',
  'D1_ERROR: Cannot resolve D1 DB due to transient issue on remote node.',
  'D1_ERROR: D1 DB reset because its code was updated.',
]);

export async function optionalLearningRead<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    if (
      error instanceof Error &&
      Object.getPrototypeOf(error) === Error.prototype &&
      error.name === 'Error' &&
      !('cause' in error) &&
      !('digest' in error) &&
      !('status' in error) &&
      !('statusCode' in error) &&
      !('code' in error) &&
      transientD1Messages.has(error.message)
    ) {
      return null;
    }
    throw error;
  }
}
