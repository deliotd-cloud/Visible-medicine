export type PatientPoint = readonly [number, number, number];
export type ImagePlane = "axial" | "coronal" | "sagittal";

export type DicomFrameGeometry = {
  sopInstanceUid: string;
  frame: number;
  sliceIndex: number;
  imagePositionPatient: PatientPoint;
  imageOrientationPatient: readonly [number, number, number, number, number, number];
  pixelSpacing: readonly [number, number];
  rows: number;
  columns: number;
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
  sourceSeriesInstanceUid: string;
  sourcePlane: ImagePlane;
  mapped: LocalizerProjection[];
  skipped: Array<{ seriesInstanceUid: string; reason: string }>;
};

export class SpatialLinkError extends Error {
  readonly code = "SERIES_SPATIAL_LINK_UNAVAILABLE";
  constructor(readonly detail: string) {
    super(`Series cannot be spatially linked: ${detail}`);
  }
}

const EPSILON = 1e-6;

function finiteTuple(value: readonly number[], length: number, label: string): number[] {
  if (value.length !== length || value.some((item) => !Number.isFinite(item))) throw new SpatialLinkError(`${label} is incomplete`);
  return [...value];
}

function dot(a: readonly number[], b: readonly number[]) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function subtract(a: readonly number[], b: readonly number[]): PatientPoint { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function magnitude(value: readonly number[]) { return Math.sqrt(dot(value, value)); }
function normalize(value: readonly number[], label: string): PatientPoint {
  const size = magnitude(value);
  if (size < EPSILON) throw new SpatialLinkError(`${label} has no direction`);
  return [value[0] / size, value[1] / size, value[2] / size];
}
function cross(a: readonly number[], b: readonly number[]): PatientPoint {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function axes(frame: DicomFrameGeometry) {
  const orientation = finiteTuple(frame.imageOrientationPatient, 6, "ImageOrientationPatient");
  const row = normalize(orientation.slice(0, 3), "ImageOrientationPatient row direction");
  const column = normalize(orientation.slice(3, 6), "ImageOrientationPatient column direction");
  const normal = normalize(cross(row, column), "ImageOrientationPatient plane normal");
  const [rowSpacing, columnSpacing] = finiteTuple(frame.pixelSpacing, 2, "PixelSpacing");
  if (rowSpacing <= 0 || columnSpacing <= 0) throw new SpatialLinkError("PixelSpacing must be positive");
  finiteTuple(frame.imagePositionPatient, 3, "ImagePositionPatient");
  return { row, column, normal, rowSpacing, columnSpacing };
}

export function imagePointToPatientPoint(frame: DicomFrameGeometry, x: number, y: number): PatientPoint {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new SpatialLinkError("localizer image coordinates are invalid");
  if (x < 0 || y < 0 || x > frame.columns - 1 || y > frame.rows - 1) throw new SpatialLinkError("localizer is outside the source image");
  const { row, column, rowSpacing, columnSpacing } = axes(frame);
  const origin = frame.imagePositionPatient;
  return [
    origin[0] + row[0] * x * columnSpacing + column[0] * y * rowSpacing,
    origin[1] + row[1] * x * columnSpacing + column[1] * y * rowSpacing,
    origin[2] + row[2] * x * columnSpacing + column[2] * y * rowSpacing,
  ];
}

function applyRegistration(point: PatientPoint, registration: ValidatedRegistration): PatientPoint {
  const matrix = registration.matrix;
  if (matrix.some((item) => !Number.isFinite(item))) throw new SpatialLinkError("validated registration matrix is invalid");
  const [x, y, z] = point;
  const w = matrix[12] * x + matrix[13] * y + matrix[14] * z + matrix[15];
  if (Math.abs(w) < EPSILON) throw new SpatialLinkError("validated registration produced an invalid patient coordinate");
  return [
    (matrix[0] * x + matrix[1] * y + matrix[2] * z + matrix[3]) / w,
    (matrix[4] * x + matrix[5] * y + matrix[6] * z + matrix[7]) / w,
    (matrix[8] * x + matrix[9] * y + matrix[10] * z + matrix[11]) / w,
  ];
}

function linkPatientPoint(sourceFrameUid: string, targetFrameUid: string, point: PatientPoint, registrations: readonly ValidatedRegistration[]) {
  if (!sourceFrameUid || !targetFrameUid) throw new SpatialLinkError("FrameOfReferenceUID is missing");
  if (sourceFrameUid === targetFrameUid) return { point, spatialLink: "shared-frame-of-reference" as const, registrationId: null };
  const registration = registrations.find((item) => item.validated && item.sourceFrameOfReferenceUid === sourceFrameUid && item.targetFrameOfReferenceUid === targetFrameUid);
  if (!registration) throw new SpatialLinkError("FrameOfReferenceUID differs and no validated registration is available");
  return { point: applyRegistration(point, registration), spatialLink: "validated-registration" as const, registrationId: registration.id };
}

export function projectPatientPointToSeries(series: DicomSeriesGeometry, patientPoint: PatientPoint) {
  if (!series.frames.length) throw new SpatialLinkError("target series has no geometric frames");
  let best: { frame: DicomFrameGeometry; distance: number; x: number; y: number } | null = null;
  for (const frame of series.frames) {
    const { row, column, normal, rowSpacing, columnSpacing } = axes(frame);
    const delta = subtract(patientPoint, frame.imagePositionPatient);
    const distance = Math.abs(dot(delta, normal));
    const x = dot(delta, row) / columnSpacing;
    const y = dot(delta, column) / rowSpacing;
    if (!best || distance < best.distance) best = { frame, distance, x, y };
  }
  if (!best || best.x < -0.5 || best.y < -0.5 || best.x > best.frame.columns - 0.5 || best.y > best.frame.rows - 0.5) {
    throw new SpatialLinkError("patient coordinate lies outside the target series");
  }
  return best;
}

export function resolvePatientSpaceLocalizer(input: {
  sourceSeries: DicomSeriesGeometry;
  sourceSopInstanceUid?: string;
  sourceSliceIndex?: number;
  x: number;
  y: number;
  targetSeries: readonly DicomSeriesGeometry[];
  registrations?: readonly ValidatedRegistration[];
}): LocalizerMap {
  const sourceFrame = input.sourceSopInstanceUid
    ? input.sourceSeries.frames.find((frame) => frame.sopInstanceUid === input.sourceSopInstanceUid)
    : input.sourceSeries.frames.find((frame) => frame.sliceIndex === input.sourceSliceIndex);
  if (!sourceFrame) throw new SpatialLinkError("source SOP Instance or slice is unavailable");
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
  return { coordinateSystem: "DICOM patient LPS", patientPoint: input.patientPoint, sourceSeriesInstanceUid: input.targetSeries[0]?.seriesInstanceUid ?? "", sourcePlane: input.targetSeries[0]?.plane ?? "axial", mapped, skipped };
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
      imageOrientationPatient: orientation, pixelSpacing: [1, 1], rows: 256, columns: 256,
    })),
  });
  return [
    makeFrames("axial", 96, [1, 0, 0, 0, 1, 0], [-128, -128, -120], [0, 0, 2.5], 10),
    makeFrames("coronal", 96, [1, 0, 0, 0, 0, 1], [-128, -120, -128], [0, 2.5, 0], 20),
    makeFrames("sagittal", 96, [0, 1, 0, 0, 0, 1], [-120, -128, -128], [2.5, 0, 0], 30),
  ];
}
