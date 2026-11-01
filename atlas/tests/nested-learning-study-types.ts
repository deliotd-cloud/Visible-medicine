import type { NestedStudy } from '../lib/nested-anatomy';
import type { nestedLearningAnatomyRepresentations } from '../lib/nested-learning-anatomy';
import type { NestedLearningStudy } from '../lib/learning-resource-types';

type Assert<T extends true> = T;
type NativeRegistryStudy = ReturnType<
  typeof nestedLearningAnatomyRepresentations
>[number]['nested']['study'];

// The native resolver must accept every registry entry without accepting the
// separately modelled prostate schematic as a native source mesh.
type NativeRegistryIsNarrow = Assert<NativeRegistryStudy extends NestedStudy ? true : false>;
type AllNativeStudiesRemainSupported = Assert<NestedStudy extends NativeRegistryStudy ? true : false>;
type SchematicRemainsLinkable = Assert<'prostate-zones' extends NestedLearningStudy ? true : false>;
type SchematicStaysSeparate = Assert<'prostate-zones' extends NativeRegistryStudy ? false : true>;
