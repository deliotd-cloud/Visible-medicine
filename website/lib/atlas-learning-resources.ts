import { atlasModules, findAtlasModule, findCourse } from "./catalog";
import { atlasBodyRegions, type AtlasRegionLink } from "./atlas-navigation";

export type LearningResourceChoice = { resourceType: "atlas" | "course"; resourceId: string; label: string };
type SavedProgress = { resourceType: string; resourceSlug: string };
type EnrolledCourse = { slug: string; title: string };

/** Choices describe study destinations only; they do not create progress or claim review. */
export function atlasLearningResources(progress: readonly SavedProgress[], enrolments: readonly EnrolledCourse[]): LearningResourceChoice[] {
  const choices = new Map<string, LearningResourceChoice>();
  const add = (choice: LearningResourceChoice) => choices.set(`${choice.resourceType}:${choice.resourceId}`, choice);

  // Keep the established first/default selection for both portfolio forms.
  add({ resourceType: "atlas", resourceId: "ct-head", label: "Atlas · CT head" });
  for (const module of atlasModules) {
    if (module.status === "available") add({ resourceType: "atlas", resourceId: module.slug, label: `Atlas · ${module.title}` });
  }
  for (const region of atlasBodyRegions as readonly AtlasRegionLink[]) {
    if (region.planned) continue;
    const url = new URL(region.href, "https://visiblemedicine.invalid");
    if (url.origin !== "https://visiblemedicine.invalid" || url.hash || !/^\/atlas\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(url.pathname)) continue;
    const regionQuery = url.searchParams.get("region");
    if (url.search && (url.pathname !== "/atlas/3d" || regionQuery !== region.id || [...url.searchParams.keys()].join(',') !== 'region')) continue;
    const resourceId = regionQuery ? `3d:${region.id}` : url.pathname.slice("/atlas/".length);
    // Canonical slug routes share a choice with an available catalog module.
    if (!choices.has(`atlas:${resourceId}`)) add({ resourceType: "atlas", resourceId, label: `Atlas · ${region.label} 3D anatomy` });
  }
  // MRI head is an implemented native viewer route, outside atlasModules.
  add({ resourceType: "atlas", resourceId: "mri-head", label: "Atlas · MRI head" });

  for (const item of progress) {
    if (item.resourceType !== "atlas" && item.resourceType !== "course") continue;
    const resource = item.resourceType === "atlas" ? findAtlasModule(item.resourceSlug) : findCourse(item.resourceSlug);
    const key = `${item.resourceType}:${item.resourceSlug}`;
    if (!choices.has(key)) add({ resourceType: item.resourceType, resourceId: item.resourceSlug, label: `${item.resourceType === "atlas" ? "Atlas" : "Course"} · ${resource?.title ?? item.resourceSlug}` });
  }
  for (const course of enrolments) add({ resourceType: "course", resourceId: course.slug, label: `Course · ${course.title}` });
  return [...choices.values()];
}
