import { lstat, statfs } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";

const MANIFEST_ALLOWANCE_BYTES = 1024n * 1024n;
const RESERVE_BYTES = 128n * 1024n * 1024n;

function nonnegativeBigint(value, name) {
  if (typeof value !== "bigint" || value < 0n) {
    throw new Error(`Export space preflight: invalid ${name}; expected a nonnegative bigint.`);
  }
  return value;
}

// This read-only estimate is not a reservation: concurrent writers and source
// changes can still exhaust storage after a successful preflight.
// The optional dependency argument exists for deterministic tests, not an env bypass.
export async function assertExportSpace(target, copies, dependencies = {}) {
  const readSource = dependencies.lstat ?? lstat;
  const readSpace = dependencies.statfs ?? statfs;
  if (typeof target !== "string" || !target || !Array.isArray(copies)) {
    throw new Error("Export space preflight requires a target path and copy pairs.");
  }
  const destination = resolve(target);
  const sizes = [];
  for (const copy of copies) {
    if (!Array.isArray(copy) || copy.length !== 2 || typeof copy[0] !== "string" ||
        !isAbsolute(copy[0]) || typeof copy[1] !== "string" || !copy[1]) {
      throw new Error("Export space preflight requires [absolute source path, relative destination path] pairs.");
    }
    const info = await readSource(copy[0], { bigint: true });
    if (info.isSymbolicLink() || !info.isFile()) {
      throw new Error(`Export space preflight rejects nonregular source: ${copy[0]}`);
    }
    sizes.push(nonnegativeBigint(info.size, `source size for ${copy[0]}`));
  }
  let ancestor = destination;
  let space;
  for (;;) {
    try {
      space = await readSpace(ancestor, { bigint: true });
      break;
    } catch (error) {
      if (error.code !== "ENOENT" || dirname(ancestor) === ancestor) {
        throw new Error(`Export space preflight could not inspect storage at ${ancestor}: ${error.message}`, { cause: error });
      }
      ancestor = dirname(ancestor);
    }
  }
  const blockSize = nonnegativeBigint(space.bsize, "filesystem block size");
  const blocks = nonnegativeBigint(space.blocks, "filesystem total blocks");
  const free = nonnegativeBigint(space.bfree, "filesystem free blocks");
  const available = nonnegativeBigint(space.bavail, "filesystem available blocks");
  if (blockSize === 0n || available > free || free > blocks) {
    throw new Error("Export space preflight: inconsistent filesystem block statistics.");
  }
  const sourceBytes = sizes.reduce((sum, size) => sum + size, 0n);
  const allocatedBytes = sizes.reduce((sum, size) => sum + ((size + blockSize - 1n) / blockSize) * blockSize, 0n);
  const requiredBytes = allocatedBytes + MANIFEST_ALLOWANCE_BYTES + RESERVE_BYTES;
  const availableBytes = available * blockSize;
  const budget = {
    target: destination,
    filesystemAncestor: ancestor,
    fileCount: copies.length,
    blockSizeBytes: blockSize.toString(),
    sourceBytes: sourceBytes.toString(),
    allocatedBytes: allocatedBytes.toString(),
    manifestAllowanceBytes: MANIFEST_ALLOWANCE_BYTES.toString(),
    reserveBytes: RESERVE_BYTES.toString(),
    requiredBytes: requiredBytes.toString(),
    availableBytes: availableBytes.toString(),
  };
  if (availableBytes < requiredBytes) {
    const error = new Error(`Insufficient export space at ${ancestor}: need ${requiredBytes} bytes including manifest allowance and reserve, have ${availableBytes} bytes; short by ${requiredBytes - availableBytes} bytes. Free storage or choose another destination before retrying. No export files were written by this preflight.`);
    error.code = "EXPORT_INSUFFICIENT_SPACE";
    error.budget = budget;
    throw error;
  }
  return budget;
}
