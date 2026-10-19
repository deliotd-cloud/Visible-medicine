/** A local, review-only raster preview. Parsing does not attest to rights or clinical accuracy. */
export interface PreviewLocalFile {
  name: string;
  webkitRelativePath?: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface SlidePreviewImage {
  path: string;
  sha256: string;
  bytes: number;
  width: number;
  height: number;
}

export interface SlidePreviewManifest {
  schema: 'vm-lecture-slide-preview-v1';
  state: 'review-only';
  source: { label: string; sha256: string; bytes: number };
  intakeSha256: string;
  renderer: { name: string; version: string };
  sourceSlideCount: number;
  slides: Array<{
    position: number;
    part: string;
    partSha256: string;
    title: string;
    notes: string;
    image: SlidePreviewImage;
  }>;
}

const MIB = 1024 * 1024;
const MAX_MANIFEST = 8 * MIB;
const MAX_IMAGE = 16 * MIB;
const MAX_IMAGES_TOTAL = 512 * MIB;
const MAX_SOURCE = 256 * MIB;
const HEX = /^[0-9a-f]{64}$/;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

function fail(message: string): never { throw new Error(`Invalid slide preview: ${message}`); }

function record(value: unknown, fields: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`);
  const found = Object.keys(value);
  if (found.length !== fields.length || found.some(key => !fields.includes(key))) {
    fail(`${label} has missing or unsupported fields`);
  }
  return value as Record<string, unknown>;
}

function integer(value: unknown, min: number, max: number, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) {
    fail(`${label} is out of range`);
  }
  return value as number;
}

function hash(value: unknown, label: string): string {
  if (typeof value !== 'string' || !HEX.test(value)) fail(`${label} must be a lowercase SHA-256 digest`);
  return value;
}

function plainText(value: unknown, max: number, label: string, empty = false): string {
  if (typeof value !== 'string' || (!empty && !value.trim()) || value.length > max || CONTROL.test(value)) {
    fail(`${label} must be valid plain text of at most ${max} characters`);
  }
  return value;
}

export function parseSlidePreviewManifest(text: string): SlidePreviewManifest {
  if (typeof text !== 'string' || new TextEncoder().encode(text).byteLength > MAX_MANIFEST) {
    fail('preview.json exceeds the 8 MiB limit');
  }
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { fail('preview.json is not valid JSON'); }
  const root = record(parsed, ['schema', 'state', 'source', 'intakeSha256', 'renderer', 'sourceSlideCount', 'slides'], 'manifest');
  if (root.schema !== 'vm-lecture-slide-preview-v1' || root.state !== 'review-only') {
    fail('schema or review-only state is unsupported');
  }
  const source = record(root.source, ['label', 'sha256', 'bytes'], 'source');
  plainText(source.label, 500, 'source label');
  hash(source.sha256, 'source hash');
  integer(source.bytes, 1, MAX_SOURCE, 'source bytes');
  hash(root.intakeSha256, 'intake hash');
  const renderer = record(root.renderer, ['name', 'version'], 'renderer');
  plainText(renderer.name, 500, 'renderer name');
  plainText(renderer.version, 500, 'renderer version');
  const count = integer(root.sourceSlideCount, 1, 500, 'source slide count');
  if (!Array.isArray(root.slides) || root.slides.length !== count) fail('slide count does not match the source');
  const parts = new Set<string>();
  let imageBytes = 0;
  for (let i = 0; i < count; i++) {
    const slide = record(root.slides[i], ['position', 'part', 'partSha256', 'title', 'notes', 'image'], `slide ${i + 1}`);
    if (slide.position !== i + 1) fail(`slide ${i + 1} has an incorrect position`);
    if (typeof slide.part !== 'string' || !/^ppt\/slides\/slide[1-9][0-9]*\.xml$/.test(slide.part) || parts.has(slide.part)) {
      fail(`slide ${i + 1} has an invalid or duplicate source part`);
    }
    parts.add(slide.part);
    hash(slide.partSha256, `slide ${i + 1} part hash`);
    plainText(slide.title, 500, `slide ${i + 1} title`, true);
    plainText(slide.notes, 32000, `slide ${i + 1} notes`, true);
    const image = record(slide.image, ['path', 'sha256', 'bytes', 'width', 'height'], `slide ${i + 1} image`);
    if (image.path !== `slides/slide-${String(i + 1).padStart(4, '0')}.png`) {
      fail(`slide ${i + 1} image path is invalid`);
    }
    hash(image.sha256, `slide ${i + 1} image hash`);
    imageBytes += integer(image.bytes, 33, MAX_IMAGE, `slide ${i + 1} image bytes`);
    const width = integer(image.width, 1, 4096, `slide ${i + 1} image width`);
    const height = integer(image.height, 1, 4096, `slide ${i + 1} image height`);
    if (width * height > 16_000_000) fail(`slide ${i + 1} image has too many pixels`);
  }
  if (imageBytes > MAX_IMAGES_TOTAL) fail('declared images exceed the 512 MiB total limit');
  return parsed as SlidePreviewManifest;
}

function localPath(file: PreviewLocalFile): {root: string; path: string} {
  const relative = file.webkitRelativePath;
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.startsWith('/') ||
      /[\u0000-\u001f\u007f]/.test(relative)) fail('select a single local preview folder');
  const segments = relative.split('/');
  if (segments.length < 2 || segments.some(segment => !segment || segment === '.' || segment === '..' || segment.includes(':')) ||
      file.name !== segments.at(-1)) fail('preview folder contains an unsafe file path');
  return {root: segments[0], path: segments.slice(1).join('/')};
}

export async function readSlidePreviewPackage(files: readonly PreviewLocalFile[]): Promise<{
  manifest: SlidePreviewManifest; images: Map<string, PreviewLocalFile>;
}> {
  if (!Array.isArray(files) || files.length < 2 || files.length > 501) fail('select a preview folder with 1 to 500 images');
  const found = new Map<string, PreviewLocalFile>();
  const casePaths = new Set<string>();
  let root: string | undefined;
  let totalBytes = 0;
  for (const file of files) {
    if (!file || typeof file.name !== 'string' || typeof file.arrayBuffer !== 'function') fail('folder contains an invalid file');
    const path = localPath(file);
    if (root === undefined) root = path.root;
    if (root !== path.root) fail('select exactly one preview folder');
    if (casePaths.has(path.path.toLowerCase())) fail('folder contains duplicate or case-ambiguous paths');
    casePaths.add(path.path.toLowerCase());
    if (path.path !== 'preview.json' && !/^slides\/slide-[0-9]{4}\.png$/.test(path.path)) {
      fail('folder contains an unexpected file');
    }
    integer(file.size, path.path === 'preview.json' ? 1 : 33,
      path.path === 'preview.json' ? MAX_MANIFEST : MAX_IMAGE, `file ${path.path} size`);
    totalBytes += file.size;
    if (totalBytes > MAX_IMAGES_TOTAL + MAX_MANIFEST) fail('preview folder exceeds the total size limit');
    found.set(path.path, file);
  }
  const manifestFile = found.get('preview.json');
  if (!manifestFile) fail('preview.json is missing');
  const manifestBytes = new Uint8Array(await manifestFile.arrayBuffer());
  if (manifestBytes.byteLength !== manifestFile.size || manifestBytes.byteLength > MAX_MANIFEST) {
    fail('preview.json size changed while reading');
  }
  let manifestText: string;
  try { manifestText = new TextDecoder('utf-8', {fatal: true}).decode(manifestBytes); }
  catch { fail('preview.json must be UTF-8'); }
  const manifest = parseSlidePreviewManifest(manifestText);
  if (found.size !== manifest.slides.length + 1) fail('folder has missing or extra images');
  const images = new Map<string, PreviewLocalFile>();
  for (const slide of manifest.slides) {
    const file = found.get(slide.image.path);
    if (!file) fail(`image for slide ${slide.position} is missing`);
    if (file.size !== slide.image.bytes) fail(`image for slide ${slide.position} has a different size`);
    images.set(slide.image.path, file);
  }
  return {manifest, images};
}

export async function readSlidePreviewImage(file: PreviewLocalFile, image: SlidePreviewImage): Promise<Uint8Array> {
  if (!file || typeof file.arrayBuffer !== 'function' || file.size !== image.bytes ||
      !Number.isSafeInteger(file.size) || file.size < 33 || file.size > MAX_IMAGE) {
    fail('selected image size does not match the manifest');
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength !== file.size || bytes.byteLength !== image.bytes) fail('selected image size changed while reading');
  if (PNG_SIGNATURE.some((byte, i) => bytes[i] !== byte)) fail('selected image is not a PNG');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const colorType = bytes[25];
  const validDepths: Record<number, readonly number[]> = {
    0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16],
  };
  if (view.getUint32(8) !== 13 || bytes[12] !== 73 || bytes[13] !== 72 || bytes[14] !== 68 || bytes[15] !== 82 ||
      view.getUint32(16) !== image.width || view.getUint32(20) !== image.height ||
      !validDepths[colorType]?.includes(bytes[24]) || bytes[26] !== 0 || bytes[27] !== 0 || bytes[28] > 1) {
    fail('selected PNG IHDR or dimensions do not match the manifest');
  }
  let crc = 0xffffffff;
  for (let i = 12; i < 29; i++) {
    crc ^= bytes[i];
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  if (((crc ^ 0xffffffff) >>> 0) !== view.getUint32(29)) {
    fail('selected PNG IHDR checksum is invalid');
  }
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const hex = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
  if (hex !== image.sha256) fail('selected image SHA-256 does not match the manifest');
  return bytes;
}
