import type { BodyStructure, BodySystem } from '../app/body-types';
import {
  matchesRule,
  stageStructures,
  type DissectionProfile,
  type DissectionState,
} from '../app/dissection-data.ts';
import { dissectionSections } from './dissection-workbench.ts';

export type StudyRecipe = {
  key: string;
  id: string;
  kind: 'window' | 'focus';
  title: string;
  description: string;
  inspect: string;
  view: string;
  visible: BodyStructure[];
  targets: BodyStructure[] | null;
  available: boolean;
};
export type StudyLibraryCard = {
  key: string;
  title: string;
  order: number;
  recipes: StudyRecipe[];
};
export type StudyLibrarySort =
  | 'authored'
  | 'small-first'
  | 'large-first'
  | 'name';

/** Catalogue membership is not rendered visibility or a clinical relationship.
 * Only equivalent authored rules with matching ID/title/view can share a card;
 * accidental equality on one side or empty scope must never merge two recipes.
 */
export function studyLibrary(
  scope: BodyStructure[],
  profile: DissectionProfile,
): StudyLibraryCard[] {
  const { windows } = dissectionSections(profile);
  const cards: StudyLibraryCard[] = windows.map((stage, order) => {
    const visible = stageStructures(scope, profile, stage.id);
    const key = `window:${stage.id}`;
    return {
      key,
      title: stage.title,
      order,
      recipes: [
        {
          key,
          id: stage.id,
          kind: 'window',
          title: stage.title,
          description: stage.description,
          inspect: stage.inspect,
          view: stage.view,
          visible,
          targets: null,
          available: visible.length > 0,
        },
      ],
    };
  });
  for (const focus of profile.focuses) {
    const visible = stageStructures(scope, profile, 'free', focus.id);
    const targets = scope.filter((item) => matchesRule(item, focus.rule));
    const recipe: StudyRecipe = {
      key: `focus:${focus.id}`,
      id: focus.id,
      kind: 'focus',
      title: focus.title,
      description:
        focus.description ??
        'Study the supplied target group with its available context.',
      inspect:
        focus.inspect ??
        'Compare the targets and context in the unchanged source frame.',
      view: focus.view,
      visible,
      targets,
      available: targets.length > 0 && visible.length > 0,
    };
    const twin = windows.find(
      (stage) =>
        stage.id === focus.id &&
        stage.title === focus.title &&
        stage.view === focus.view &&
        focus.includeSkeleton === false &&
        !stage.hide?.length &&
        JSON.stringify(stage.only) ===
          JSON.stringify([focus.rule, ...(focus.context ?? [])]),
    );
    const card = twin
      ? cards.find((card) => card.key === `window:${twin.id}`)
      : undefined;
    if (card) card.recipes.push(recipe);
    else
      cards.push({
        key: recipe.key,
        title: recipe.title,
        order: cards.length,
        recipes: [recipe],
      });
  }
  return cards;
}

export function filterStudyLibrary(
  cards: StudyLibraryCard[],
  query: string,
  system: BodySystem | 'all' = 'all',
  kind: StudyRecipe['kind'] | 'all' = 'all',
  sort: StudyLibrarySort = 'authored',
) {
  const words = query
    .slice(0, 256)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return cards
    .flatMap((card) => {
      const recipes = card.recipes.filter((recipe) => {
        if (kind !== 'all' && recipe.kind !== kind) return false;
        if (
          system !== 'all' &&
          !recipe.visible.some((item) => item.system === system)
        )
          return false;
        const text = [
          recipe.title,
          recipe.id,
          recipe.description,
          ...recipe.visible.flatMap((item) => [
            item.id,
            item.name,
            item.sourceName,
            item.fmaId,
            item.laterality,
          ]),
        ]
          .join(' ')
          .toLowerCase();
        return words.every((word) => text.includes(word));
      });
      return recipes.length ? [{ ...card, recipes }] : [];
    })
    .sort((a, b) => {
      const size = a.recipes[0].visible.length - b.recipes[0].visible.length;
      return (
        (sort === 'small-first'
          ? size
          : sort === 'large-first'
            ? -size
            : sort === 'name'
              ? a.title.localeCompare(b.title, 'en')
              : 0) || a.order - b.order
      );
    });
}

export function studyRecipePreview(
  recipe: StudyRecipe,
  scope: BodyStructure[],
  visibleIds: string[],
  loaded: string[],
  failed: string[],
) {
  const before = new Set(visibleIds),
    after = new Set(recipe.visible.map((item) => item.id));
  const ready = new Set(loaded),
    errors = new Set(failed);
  return {
    hide: scope.filter((item) => before.has(item.id) && !after.has(item.id)),
    restore: recipe.visible.filter((item) => !before.has(item.id)),
    keep: recipe.visible.filter((item) => before.has(item.id)),
    loaded: recipe.visible.filter(
      (item) => ready.has(item.bundle) && !errors.has(item.bundle),
    ),
    failed: recipe.visible.filter((item) => errors.has(item.bundle)),
    waiting: recipe.visible.filter(
      (item) => !ready.has(item.bundle) && !errors.has(item.bundle),
    ),
  };
}

export function studyRecipeActive(recipe: StudyRecipe, state: DissectionState) {
  return state.focusId
    ? recipe.kind === 'focus' && recipe.id === state.focusId
    : recipe.kind === 'window' && recipe.id === state.stageId;
}

/** Resolve the current scope again before applying; never trust a stale preview. */
export function studyLibraryAction(
  scope: BodyStructure[],
  profile: DissectionProfile,
  key: string,
  disabled: boolean,
) {
  if (disabled) return null;
  const recipe = studyLibrary(scope, profile)
    .flatMap((card) => card.recipes)
    .find((recipe) => recipe.key === key);
  return recipe?.available ? { kind: recipe.kind, id: recipe.id } : null;
}
