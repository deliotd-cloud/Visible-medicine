import type { LocalStudy, LocalReviewMark } from './local-imaging-study';
import type { LocalComparison } from './local-mask-comparison';

/** Candidate feedback is a separate contract; never pass it to baseline review import. */
export function localCandidateReviewExport(
  study: LocalStudy,
  comparison: LocalComparison,
  marks: readonly LocalReviewMark[],
) {
  const fail = (): never => {
    throw new Error(
      'Candidate feedback does not match this verified comparison',
    );
  };
  const source = study.structures.find((s) => s.id === comparison.structureId);
  if (
    !source ||
    source.sourceSha256 !== comparison.baselineMaskSha256 ||
    study.sourceAnnotationSha256 !== comparison.sourceAnnotationSha256 ||
    study.sourceCtSha256 !== comparison.sourceCtSha256
  )
    fail();
  for (const hash of [
    comparison.baselineMaskSha256,
    comparison.candidateMaskSha256,
    comparison.comparisonManifestSha256,
    comparison.requestSha256,
    comparison.sourceCtSha256,
    comparison.sourceAnnotationSha256,
  ]) {
    if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) fail();
  }
  if (!Array.isArray(marks) || marks.length < 1 || marks.length > 500) fail();
  for (const mark of marks) {
    if (
      !mark ||
      mark.structureId !== comparison.structureId ||
      mark.maskSha256 !== comparison.candidateMaskSha256 ||
      !['include', 'exclude'].includes(mark.action) ||
      !Array.isArray(mark.lps) ||
      mark.lps.length !== 3 ||
      !mark.lps.every(Number.isFinite)
    )
      fail();
    const index = study.volume.lpsToIndex(mark.lps);
    if (
      index.some(
        (n, i) =>
          !Number.isFinite(n) ||
          n < -0.5 ||
          n >= study.volume.dimensions[i] - 0.5,
      )
    )
      fail();
  }
  return {
    schema: 'vm-local-candidate-review/1',
    release: 'NOT_FOR_PUBLICATION',
    approval: false,
    coordinateSystem: 'LPS-mm',
    sourceAnnotationSha256: comparison.sourceAnnotationSha256,
    sourceCtSha256: comparison.sourceCtSha256,
    structureId: comparison.structureId,
    baselineMaskSha256: comparison.baselineMaskSha256,
    candidateMaskSha256: comparison.candidateMaskSha256,
    comparisonManifestSha256: comparison.comparisonManifestSha256,
    requestSha256: comparison.requestSha256,
    marks: marks.map((mark) => ({ action: mark.action, lps: [...mark.lps] })),
  };
}
