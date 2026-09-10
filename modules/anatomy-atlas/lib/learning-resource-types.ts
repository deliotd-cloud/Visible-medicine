/** Educational locators only. No patient metadata, pixels or spatial transforms. */
export const learningResourceKinds = [
  'ct',
  'mri',
  'xray',
  'ultrasound',
  'lecture',
  'quiz',
] as const;
export type ResourceKind = (typeof learningResourceKinds)[number];
export type RepresentationScope = 'body' | 'shoulder-pilot' | 'nested';
export type NestedLearningStudy =
  | 'eye'
  | 'ventricles'
  | 'brainstem'
  | 'cerebral'
  | 'cardiac'
  | 'pulmonary'
  | 'hepatic'
  | 'renal'
  | 'visual-pathway';
export type LearningAge = 'adult' | 'paediatric' | 'mixed' | 'unspecified';
export type LearningSide =
  'left' | 'right' | 'bilateral' | 'midline' | 'unspecified';
export type RootAnatomyRepresentation = {
  scope: 'body' | 'shoulder-pilot';
  structureId: string;
  sources: { file: string; sha256: string }[];
};
export type NestedAnatomyRepresentation = {
  scope: 'nested';
  structureId: string;
  sources: RootAnatomyRepresentation['sources'];
  nested: {
    study: NestedLearningStudy;
    parentId: string;
    parentSources: RootAnatomyRepresentation['sources'];
    parentBundleSha256: string;
    bundleSha256: string;
  };
};
export type AnatomyRepresentation =
  RootAnatomyRepresentation | NestedAnatomyRepresentation;
export type LearningAnchor =
  | {
      type: 'volume';
      id: string;
      seriesId: string;
      frameId: string;
      annotationId: string;
      geometry: 'mask' | 'partial-mask' | 'curve' | 'point' | 'region';
    }
  | {
      type: 'projection';
      id: string;
      imageId: string;
      annotationId: string;
      projectionId: string;
    }
  | {
      type: 'ultrasound';
      id: string;
      clipId: string;
      annotationId: string;
      viewId: string;
      frameIndex: number | null;
      timeMs: number | null;
    }
  | {
      type: 'slide';
      id: string;
      courseId: string;
      lessonId: string;
      slideId: string;
      buildId: string | null;
    }
  | { type: 'question'; id: string; questionId: string; objectiveId: string };
export type LearningResource = {
  id: string;
  revision: number;
  kind: ResourceKind;
  title: string;
  ageGroup: LearningAge;
  laterality: LearningSide;
  regionIds: string[];
  material: { sha256: string; origin: 'acquired' | 'synthetic' | 'authored' };
  anchors: LearningAnchor[];
};
export type LearningCorrespondence = {
  id: string;
  revision: number;
  anatomy: AnatomyRepresentation;
  resourceId: string;
  resourceRevision: number;
  materialSha256: string;
  anchorId: string;
  /** Direction is from the resource annotation/topic to the selected anatomy. */
  relation: 'exact' | 'component' | 'broader' | 'related';
};
export type LearningDocument = {
  /** v1 preserves root representations only; v2 also admits explicit nested bindings. */
  schemaVersion: 1 | 2;
  resources: LearningResource[];
  links: LearningCorrespondence[];
};
export type LearningLocator = {
  version: 1;
  linkId: string;
  linkRevision: number;
  resourceId: string;
  resourceRevision: number;
  anchorId: string;
};
/** Host-owned, current decisions; never deserialize these callbacks from a document.
 * These are integration gates, not an authentication or clinical-review system.
 */
export type LearningPolicy = {
  canNavigate: () => boolean;
  canAccessAnatomy: (anatomy: AnatomyRepresentation) => boolean;
  canAccess: (resource: LearningResource) => boolean;
  resourceCleared: (resource: LearningResource) => boolean;
  correspondenceCleared: (link: LearningCorrespondence) => boolean;
};
export type LearningMatch = {
  resource: LearningResource;
  anchor: LearningAnchor;
  link: LearningCorrespondence;
  locator: LearningLocator;
};
