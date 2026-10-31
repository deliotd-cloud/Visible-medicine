/**
 * Narrow local-image attributes for this website's public artwork.
 * Width selection and /_next/image URL format are adapted from Vinext's
 * MIT-licensed image shim (vinext/dist/shims/image.js). Its existing MIT
 * notice remains in LICENSES/THIRD_PARTY_NOTICES.md.
 */
const DEVICE_WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const IMAGE_WIDTHS = [32, 48, 64, 96, 128, 256, 384, ...DEVICE_WIDTHS];
const PUBLIC_PREFIXES = ["/brand/", "/media/atlas/", "/media/splash/"];

function validatePublicSource(src: string) {
  if (typeof src !== "string" || !PUBLIC_PREFIXES.some((prefix) => src.startsWith(prefix)) ||
      /[\\\u0000-\u001f\u007f#]/.test(src) || /%(?![0-9a-f]{2})/i.test(src) ||
      /%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(src)) {
    throw new Error("SiteImage requires a valid public artwork path");
  }
  const pathname = src.split("?", 1)[0];
  // Artwork filenames are literal; rejecting encoded path bytes also rejects
  // double-encoded separators and dot segments before any server normalization.
  if (pathname.includes("%") || pathname.includes("//") || pathname.split("/").some((part) => part === "." || part === "..") || pathname.endsWith("/")) {
    throw new Error("SiteImage requires a valid public artwork path");
  }
  try {
    if (/[\\\u0000-\u001f\u007f]/.test(decodeURIComponent(src))) throw new Error();
  } catch {
    throw new Error("SiteImage requires a valid public artwork path");
  }
}

function extractLocalDeploymentId(src: string) {
  let deploymentId = process.env.__VINEXT_DEPLOYMENT_ID || process.env.NEXT_DEPLOYMENT_ID;
  const queryIndex = src.indexOf("?");
  if (queryIndex === -1) return { src, deploymentId };
  const params = new URLSearchParams(src.slice(queryIndex + 1));
  const sourceDeploymentId = params.get("dpl");
  if (!sourceDeploymentId) return { src, deploymentId };
  deploymentId = sourceDeploymentId;
  params.delete("dpl");
  const remainingQuery = params.toString();
  return { src: src.slice(0, queryIndex) + (remainingQuery ? `?${remainingQuery}` : ""), deploymentId };
}

export type SiteImageInput = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
  unoptimized?: boolean;
};

export function siteImageAttributes(input: SiteImageInput) {
  const { src, width, height, alt, className, sizes, priority, unoptimized } = input;
  validatePublicSource(src);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("SiteImage requires positive image dimensions");
  }

  const loading = priority ? "eager" : input.loading ?? "lazy";
  const fetchPriority = priority ? "high" as const : undefined;
  const isSvg = new URL(src, "http://local.invalid").pathname.toLowerCase().endsWith(".svg");
  if (unoptimized === true) {
    return { src, alt, width, height, loading, fetchPriority, decoding: "async" as const, className, sizes, srcSet: undefined, "data-nimg": "1" as const };
  }
  if (isSvg) {
    const svgWidths = DEVICE_WIDTHS.filter((candidateWidth) => candidateWidth <= width * 2);
    const srcSet = svgWidths.map((candidateWidth) => `${src} ${candidateWidth}w`).join(", ") || `${src} ${width}w`;
    return { src, alt, width, height, loading, fetchPriority, decoding: "async" as const, className, sizes, srcSet, "data-nimg": "1" as const };
  }

  const source = extractLocalDeploymentId(src);
  const optimize = (candidateWidth: number) => `/_next/image?url=${encodeURIComponent(source.src)}&w=${candidateWidth}&q=75${source.deploymentId ? `&dpl=${encodeURIComponent(source.deploymentId)}` : ""}`;
  let candidates: number[];
  let srcSet: string;
  if (sizes) {
    const percentages = [...sizes.matchAll(/(^|\s)(1?\d?\d)vw/g)].map((match) => Number.parseInt(match[2], 10));
    const minimumWidth = percentages.length ? DEVICE_WIDTHS[0] * Math.min(...percentages) * 0.01 : 0;
    candidates = IMAGE_WIDTHS.filter((candidateWidth) => candidateWidth >= minimumWidth);
    srcSet = candidates.map((candidateWidth) => `${optimize(candidateWidth)} ${candidateWidth}w`).join(", ");
  } else {
    candidates = [...new Set([width, width * 2].map((target) => IMAGE_WIDTHS.find((candidateWidth) => candidateWidth >= target) ?? IMAGE_WIDTHS.at(-1)!))];
    srcSet = candidates.map((candidateWidth, index) => `${optimize(candidateWidth)} ${index + 1}x`).join(", ");
  }
  return { src: optimize(candidates.at(-1)!), alt, width, height, loading, fetchPriority, decoding: "async" as const, className, sizes, srcSet, "data-nimg": "1" as const };
}

export function siteImagePreloadOptions(input: SiteImageInput) {
  const attributes = siteImageAttributes(input);
  return {
    as: "image" as const,
    imageSrcSet: input.unoptimized ? undefined : attributes.srcSet,
    imageSizes: input.unoptimized ? undefined : attributes.sizes,
    fetchPriority: attributes.fetchPriority,
  };
}
