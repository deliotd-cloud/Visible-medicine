import type { ContentTab } from '../app/anatomy-data';

export type NoteGroup = 'anatomy' | 'clinical' | 'imaging';
export type NoteNavigation = {
  group: NoteGroup;
  sections: Record<NoteGroup, ContentTab>;
};
export const noteGroups: Array<{
  id: NoteGroup;
  title: string;
  sections: Array<[ContentTab, string]>;
}> = [
  {id: 'anatomy', title: 'Anatomy', sections: [['anatomy', 'Overview'], ['function', 'Function']]},
  {id: 'clinical', title: 'Clinical', sections: [['clinical', 'Clinical notes'], ['pathology', 'Pathology']]},
  {id: 'imaging', title: 'Imaging', sections: [['ct', 'CT'], ['mri', 'MRI'], ['xray', 'X-ray'], ['ultrasound', 'Ultrasound']]},
];

/** Transient, per-workspace navigation only; never a saved study or exam answer. */
export function initialNoteNavigation(): NoteNavigation {
  return {group: 'anatomy', sections: {anatomy: 'anatomy', clinical: 'clinical', imaging: 'ct'}};
}
export function chooseNoteGroup(state: NoteNavigation, value: unknown, exam: boolean): NoteNavigation {
  const group = noteGroups.find(g => g.id === value);
  return exam || !group || state.group === group.id ? state : {...state, group: group.id};
}
export function chooseNoteSection(state: NoteNavigation, group: NoteGroup, value: unknown, exam: boolean): NoteNavigation {
  const section = noteGroups.find(g => g.id === group)?.sections.find(([id]) => id === value);
  return exam || !section || state.sections[group] === section[0]
    ? state
    : {...state, sections: {...state.sections, [group]: section[0]}};
}
