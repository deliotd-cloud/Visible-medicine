export type PatientPoint = readonly [number, number, number];
export type ImagePlane = "axial" | "coronal" | "sagittal";

export type DicomFrameGeometry = {
  sopInstanceUid: string;
  /** Zero-based decoded frame index (convert DICOM one-based references at ingestion). */
  frame: number;
  /** Unique zero-based display index within this loaded stack, not DICOM InstanceNumber. */
  sliceIndex: number;
  imagePositionPatient: PatientPoint;
  imageOrientationPatient: readonly [number, number, number, number, number, number];
  pixelSpacing: readonly [number, number];
  rows: number;
  columns: number;
  /** Native/reviewed slice support; absence permits only an on-plane projection. */
  sliceThicknessMm?: number;
};

export type DicomSeriesGeometry = {
  studyInstanceUid: string;
  seriesInstanceUid: string;
  frameOfReferenceUid: string;
  plane: ImagePlane;
  frames: DicomFrameGeometry[];
};

export type ValidatedRegistration = {
  id: string;
  sourceFrameOfReferenceUid: string;
  targetFrameOfReferenceUid: string;
  validated: true;
  /** Row-major 4 × 4 affine mapping source DICOM patient LPS to target LPS. */
  matrix: readonly [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];
};

export type LocalizerProjection = {
  studyInstanceUid: string;
  seriesInstanceUid: string;
  sopInstanceUid: string;
  frameOfReferenceUid: string;
  frame: number;
  sliceIndex: number;
  plane: ImagePlane;
  x: number;
  y: number;
  distanceFromPlaneMm: number;
  spatialLink: "shared-frame-of-reference" | "validated-registration";
  registrationId: string | null;
};

export type LocalizerMap = {
  coordinateSystem: "DICOM patient LPS";
  patientPoint: PatientPoint;
  sourceSeriesInstanceUid: string | null;
  sourcePlane: ImagePlane | null;
  mapped: LocalizerProjection[];
  skipped: Array<{ seriesInstanceUid: string; reason: string }>;
};

export class SpatialLinkError extends Error {
  readonly code = "SERIES_SPATIAL_LINK_UNAVAILABLE";
  readonly detail: string;
  constructor(detail: string) {
    super(`Series cannot be spatially linked: ${detail}`);
    this.detail = detail;
  }
}

const EPSILON = 1e-6;
// Application rounding tolerances, not DICOM-defined acceptance thresholds.
const DIRECTION_TOLERANCE = 1e-4;
const PLANE_TOLERANCE_MM = 1e-4;

function finiteTuple(value: readonly number[], length: number, label: string): number[] {
  if (!Array.isArray(value) || value.length !== length || [...value].some((item) => !Number.isFinite(item))) throw new SpatialLinkError(`${label} is incomplete`);
  return [...value];
}

function dot(a: readonly number[], b: readonly number[]) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function subtract(a: readonly number[], b: readonly number[]): PatientPoint { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function magnitude(value: readonly number[]) { return Math.hypot(...value); }
function normalize(value: readonly number[], label: string): PatientPoint {
  const size = magnitude(value);
  if (!Number.isFinite(size) || size < EPSILON) throw new SpatialLinkError(`${label} has no direction`);
  return [value[0] / size, value[1] / size, value[2] / size];
}
function cross(a: readonly number[], b: readonly number[]): PatientPoint {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function axes(frame: DicomFrameGeometry) {
  if (!frame || !Number.isSafeInteger(frame.rows) || frame.rows < 1 || !Number.isSafeInteger(frame.columns) || frame.columns < 1) throw new SpatialLinkError("image dimensions must be positive integers");
  if (typeof frame.sopInstanceUid !== "string" || !frame.sopInstanceUid.trim() || !Number.isSafeInteger(frame.frame) || frame.frame < 0 || !Number.isSafeInteger(frame.sliceIndex) || frame.sliceIndex < 0) throw new SpatialLinkError("image frame identity is invalid");
  const orientation = finiteTuple(frame.imageOrientationPatient, 6, "ImageOrientationPatient");
  if (Math.abs(magnitude(orientation.slice(0, 3)) - 1) > DIRECTION_TOLERANCE || Math.abs(magnitude(orientation.slice(3, 6)) - 1) > DIRECTION_TOLERANCE) throw new SpatialLinkError("ImageOrientationPatient directions must be unit length");
  const row = normalize(orientation.slice(0, 3), "ImageOrientationPatient row direction");
  const suppliedColumn = normalize(orientation.slice(3, 6), "ImageOrientationPatient column direction");
  const overlap = dot(row, suppliedColumn);
  if (Math.abs(overlap) > DIRECTION_TOLERANCE) throw new SpatialLinkError("ImageOrientationPatient directions must be orthogonal");
  // Correct only bounded decimal round-off, not a malformed acquisition basis.
  const column = normalize(suppliedColumn.map((value, index) => value - overlap * row[index]), "ImageOrientationPatient column direction");
  const normal = normalize(cross(row, column), "ImageOrientationPatient plane normal");
  const [rowSpacing, columnSpacing] = finiteTuple(frame.pixelSpacing, 2, "PixelSpacing");
  if (rowSpacing <= 0 || columnSpacing <= 0) throw new SpatialLinkError("PixelSpacing must be positive");
  finiteTuple(frame.imagePositionPatient, 3, "ImagePositionPatient");
  if (frame.sliceThicknessMm !== undefined && (!Number.isFinite(frame.sliceThicknessMm) || frame.sliceThicknessMm <= 0)) throw new SpatialLinkError("slice thickness must be positive when supplied");
  return { row, column, normal, rowSpacing, columnSpacing };
}

function validateSeries(series: DicomSeriesGeometry) {
  if (!series || ![series.studyInstanceUid, series.seriesInstanceUid, series.frameOfReferenceUid].every(value => typeof value === "string" && value.trim().length > 0) || !["axial", "coronal", "sagittal"].includes(series.plane)) throw new SpatialLinkError("series identity or plane is incomplete");
  if (!Array.isArray(series.frames) || !series.frames.length) throw new SpatialLinkError("series has no geometric frames");
  const identities = new Set<string>(), indices = new Set<number>();
  for (const frame of series.frames) {
    axes(frame);
    const identity = JSON.stringify([frame.sopInstanceUid, frame.frame]);
    if (identities.has(identity) || indices.has(frame.sliceIndex)) throw new SpatialLinkError("series contains duplicate frame identities or display indices");
    identities.add(identity); indices.add(frame.sliceIndex);
  }
}

export function imagePointToPatientPoint(frame: DicomFrameGeometry, x: number, y: number): PatientPoint {
  const { row, column, rowSpacing, columnSpacing } = axes(frame);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new SpatialLinkError("localizer image coordinates are invalid");
  if (x < 0 || y < 0 || x > frame.columns - 1 || y > frame.rows - 1) throw new SpatialLinkError("localizer is outside the source image");
  const origin = frame.imagePositionPatient;
  const point: PatientPoint = [
    origin[0] + row[0] * x * columnSpacing + column[0] * y * rowSpacing,
    origin[1] + row[1] * x * columnSpacing + column[1] * y * rowSpacing,
    origin[2] + row[2] * x * columnSpacing + column[2] * y * rowSpacing,
  ];
  finiteTuple(point, 3, "computed patient coordinate");
  return point;
}

function applyRegistration(point: PatientPoint, registration: ValidatedRegistration): PatientPoint {
  const matrix = finiteTuple(registration.matrix, 16, "validated registration matrix");
  if (matrix[12] !== 0 || matrix[13] !== 0 || matrix[14] !== 0 || matrix[15] !== 1) throw new SpatialLinkError("registration must be affine with last row 0,0,0,1");
  const basis = [matrix.slice(0, 3), matrix.slice(4, 7), matrix.slice(8, 11)].map(row => {
    const length = magnitude(row);
    if (!Number.isFinite(length) || length === 0) throw new SpatialLinkError("registration matrix is singular");
    return row.map(value => value / length);
  });
  if (Math.abs(dot(basis[0], cross(basis[1], basis[2]))) < 1e-12) throw new SpatialLinkError("registration matrix is singular or ill-conditioned");
  const [x, y, z] = point;
  const mapped: PatientPoint = [
    matrix[0] * x + matrix[1] * y + matrix[2] * z + matrix[3],
    matrix[4] * x + matrix[5] * y + matrix[6] * z + matrix[7],
    matrix[8] * x + matrix[9] * y + matrix[10] * z + matrix[11],
  ];
  finiteTuple(mapped, 3, "registered patient coordinate");
  return mapped;
}

function linkPatientPoint(sourceFrameUid: string, targetFrameUid: string, point: PatientPoint, registrations: readonly ValidatedRegistration[]) {
  finiteTuple(point, 3, "patient coordinate");
  if (![sourceFrameUid, targetFrameUid].every(value => typeof value === "string" && value.trim().length > 0)) throw new SpatialLinkError("FrameOfReferenceUID is missing");
  if (sourceFrameUid === targetFrameUid) return { point, spatialLink: "shared-frame-of-reference" as const, registrationId: null };
  const matches = registrations.filter((item) => item?.validated === true && item.sourceFrameOfReferenceUid === sourceFrameUid && item.targetFrameOfReferenceUid === targetFrameUid);
  if (matches.length !== 1) throw new SpatialLinkError("FrameOfReferenceUID differs and a unique validated registration is unavailable");
  const registration = matches[0];
  if (typeof registration.id !== "string" || !registration.id.trim()) throw new SpatialLinkError("registration identity is missing");
  return { point: applyRegistration(point, registration), spatialLink: "validated-registration" as const, registrationId: registration.id };
}

export function projectPatientPointToSeries(series: DicomSeriesGeometry, patientPoint: PatientPoint) {
  validateSeries(series);
  finiteTuple(patientPoint, 3, "patient coordinate");
  const candidates: Array<{ frame: DicomFrameGeometry; distance: number; x: number; y: number; normal: PatientPoint }> = [];
  for (const frame of series.frames) {
    const { row, column, normal, rowSpacing, columnSpacing } = axes(frame);
    const delta = subtract(patientPoint, frame.imagePositionPatient);
    const distance = Math.abs(dot(delta, normal));
    const x = dot(delta, row) / columnSpacing;
    const y = dot(delta, column) / rowSpacing;
    if (![distance, x, y].every(Number.isFinite)) throw new SpatialLinkError("projected image coordinate is invalid");
    // Do not extrapolate past the slab or fill native acquisition gaps. Unknown
    // thickness is not permission to infer coverage from neighbouring planes.
    const withinSupport = distance <= (frame.sliceThicknessMm ?? 0) / 2 + PLANE_TOLERANCE_MM;
    if (withinSupport && x >= -0.5 && y >= -0.5 && x <= frame.columns - 0.5 && y <= frame.rows - 0.5) candidates.push({ frame, distance, x, y, normal });
  }
  candidates.sort((a, b) => a.distance - b.distance || a.frame.sliceIndex - b.frame.sliceIndex);
  const best = candidates[0];
  if (!best) throw new SpatialLinkError("patient coordinate lies outside acquired image coverage or slice thickness is unavailable");
  for (const other of candidates.slice(1)) {
    if (Math.abs(other.distance - best.distance) > EPSILON) break;
    const parallel = Math.abs(dot(best.normal, other.normal)) > 1 - DIRECTION_TOLERANCE;
    const separated = Math.abs(dot(subtract(best.frame.imagePositionPatient, other.frame.imagePositionPatient), best.normal)) > PLANE_TOLERANCE_MM;
    if (!parallel || !separated) throw new SpatialLinkError("target frames are spatially ambiguous; select a single time/echo/stack first");
  }
  return best;
}

export function resolvePatientSpaceLocalizer(input: {
  sourceSeries: DicomSeriesGeometry;
  sourceSopInstanceUid?: string;
  sourceFrame?: number;
  sourceSliceIndex?: number;
  x: number;
  y: number;
  targetSeries: readonly DicomSeriesGeometry[];
  registrations?: readonly ValidatedRegistration[];
}): LocalizerMap {
  validateSeries(input.sourceSeries);
  for (const index of [input.sourceFrame, input.sourceSliceIndex]) {
    if (index !== undefined && (!Number.isSafeInteger(index) || index < 0)) throw new SpatialLinkError("source frame and display indices must be nonnegative integers");
  }
  if (input.sourceSopInstanceUid !== undefined && (typeof input.sourceSopInstanceUid !== "string" || !input.sourceSopInstanceUid.trim())) throw new SpatialLinkError("source SOP identity is invalid");
  if (input.sourceSopInstanceUid === undefined && input.sourceSliceIndex === undefined) throw new SpatialLinkError("source SOP or display index is required");
  const matchingFrames = input.sourceSeries.frames.filter(frame =>
    (input.sourceSopInstanceUid === undefined || frame.sopInstanceUid === input.sourceSopInstanceUid) &&
    (input.sourceSliceIndex === undefined || frame.sliceIndex === input.sourceSliceIndex) &&
    (input.sourceFrame === undefined || frame.frame === input.sourceFrame));
  if (matchingFrames.length !== 1) throw new SpatialLinkError("source frame is unavailable, contradictory or ambiguous");
  const sourceFrame = matchingFrames[0];
  const patientPoint = imagePointToPatientPoint(sourceFrame, input.x, input.y);
  const mapped: LocalizerProjection[] = [];
  const skipped: Array<{ seriesInstanceUid: string; reason: string }> = [];
  for (const series of input.targetSeries) {
    try {
      const link = linkPatientPoint(input.sourceSeries.frameOfReferenceUid, series.frameOfReferenceUid, patientPoint, input.registrations ?? []);
      const projection = projectPatientPointToSeries(series, link.point);
      mapped.push({
        studyInstanceUid: series.studyInstanceUid,
        seriesInstanceUid: series.seriesInstanceUid,
        sopInstanceUid: projection.frame.sopInstanceUid,
        frameOfReferenceUid: series.frameOfReferenceUid,
        frame: projection.frame.frame,
        sliceIndex: projection.frame.sliceIndex,
        plane: series.plane,
        x: projection.x,
        y: projection.y,
        distanceFromPlaneMm: projection.distance,
        spatialLink: link.spatialLink,
        registrationId: link.registrationId,
      });
    } catch (error) {
      skipped.push({ seriesInstanceUid: series.seriesInstanceUid, reason: error instanceof Error ? error.message : "Series cannot be spatially linked" });
    }
  }
  if (skipped.length) throw new SpatialLinkError(skipped[0].reason.replace(/^Series cannot be spatially linked:\s*/i, ""));
  if (!mapped.length) throw new SpatialLinkError("no target series shares the FrameOfReferenceUID or a validated registration");
  return { coordinateSystem: "DICOM patient LPS", patientPoint, sourceSeriesInstanceUid: input.sourceSeries.seriesInstanceUid, sourcePlane: input.sourceSeries.plane, mapped, skipped };
}

export function resolveStoredPatientSpaceLocalizer(input: {
  sourceFrameOfReferenceUid: string;
  patientPoint: PatientPoint;
  targetSeries: readonly DicomSeriesGeometry[];
  registrations?: readonly ValidatedRegistration[];
}): LocalizerMap {
  finiteTuple(input.patientPoint, 3, "stored patient-space localizer");
  const mapped: LocalizerProjection[] = [];
  const skipped: Array<{ seriesInstanceUid: string; reason: string }> = [];
  for (const series of input.targetSeries) {
    try {
      const link = linkPatientPoint(input.sourceFrameOfReferenceUid, series.frameOfReferenceUid, input.patientPoint, input.registrations ?? []);
      const projection = projectPatientPointToSeries(series, link.point);
      mapped.push({ studyInstanceUid: series.studyInstanceUid, seriesInstanceUid: series.seriesInstanceUid, sopInstanceUid: projection.frame.sopInstanceUid, frameOfReferenceUid: series.frameOfReferenceUid, frame: projection.frame.frame, sliceIndex: projection.frame.sliceIndex, plane: series.plane, x: projection.x, y: projection.y, distanceFromPlaneMm: projection.distance, spatialLink: link.spatialLink, registrationId: link.registrationId });
    } catch (error) {
      skipped.push({ seriesInstanceUid: series.seriesInstanceUid, reason: error instanceof Error ? error.message : "Series cannot be spatially linked" });
    }
  }
  if (skipped.length) throw new SpatialLinkError(skipped[0].reason.replace(/^Series cannot be spatially linked:\s*/i, ""));
  if (!mapped.length) throw new SpatialLinkError("no target series shares the stored FrameOfReferenceUID or a validated registration");
  // A stored point has no known source series/plane; a target is not its source.
  return { coordinateSystem: "DICOM patient LPS", patientPoint: [...input.patientPoint], sourceSeriesInstanceUid: null, sourcePlane: null, mapped, skipped };
}

function uidFor(caseId: string, part: number) {
  const numericCase = Math.max(1, ["case-liver", "case-chest", "case-mixed"].indexOf(caseId) + 1);
  return `2.25.20260820.${numericCase}.${part}`;
}

export function educationWsiIdentifiersForCase(caseId: string) {
  const caseNumber = caseId === "case-mixed" ? 5 : 4;
  return { studyInstanceUid: `2.25.20260820.${caseNumber}.1`, seriesInstanceUid: `2.25.20260820.${caseNumber}.10`, frameOfReferenceUid: `2.25.20260820.${caseNumber}.2`, sopInstanceUid: `2.25.20260820.${caseNumber}.10001` };
}

export function educationGeometryForCase(caseId: string): DicomSeriesGeometry[] {
  const studyInstanceUid = uidFor(caseId, 1);
  const frameOfReferenceUid = uidFor(caseId, 2);
  const makeFrames = (plane: ImagePlane, count: number, orientation: DicomFrameGeometry["imageOrientationPatient"], origin: PatientPoint, step: PatientPoint, seriesPart: number): DicomSeriesGeometry => ({
    studyInstanceUid,
    seriesInstanceUid: uidFor(caseId, seriesPart),
    frameOfReferenceUid,
    plane,
    frames: Array.from({ length: count }, (_, sliceIndex) => ({
      sopInstanceUid: uidFor(caseId, seriesPart * 1000 + sliceIndex + 1), frame: 0, sliceIndex,
      imagePositionPatient: [origin[0] + step[0] * sliceIndex, origin[1] + step[1] * sliceIndex, origin[2] + step[2] * sliceIndex],
      imageOrientationPatient: orientation, pixelSpacing: [1, 1], rows: 256, columns: 256, sliceThicknessMm: 2.5,
    })),
  });
  return [
    makeFrames("axial", 96, [1, 0, 0, 0, 1, 0], [-128, -128, -120], [0, 0, 2.5], 10),
    makeFrames("coronal", 96, [1, 0, 0, 0, 0, 1], [-128, -120, -128], [0, 2.5, 0], 20),
    makeFrames("sagittal", 96, [0, 1, 0, 0, 0, 1], [-120, -128, -128], [2.5, 0, 0], 30),
  ];
}
