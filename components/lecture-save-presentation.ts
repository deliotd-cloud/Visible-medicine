export type SavePresentationInput = {
  busy: boolean;
  contextReason: 'changed' | 'unavailable' | null;
  uncertain: boolean;
  dirty: boolean;
  readOnly: boolean;
  validDraft: boolean;
  savedVersion: number;
};

export type SavePresentation = {
  label: string;
  detail: string;
  state: 'uncertain' | 'context' | 'working' | 'unsaved' | 'saved';
};

export function lectureSavePresentation(input: SavePresentationInput): SavePresentation {
  if (input.uncertain) return {
    state: 'uncertain',
    label: 'Save not confirmed',
    detail: 'The previous action may have completed. Check the saved lecture in Studio before another submission.',
  };
  if (input.contextReason) return {
    state: 'context',
    label: input.contextReason === 'changed' ? 'Studio context changed' : 'Studio context unavailable',
    detail: 'Local edits are kept. Confirm Studio context before saving.',
  };
  if (input.busy) return {
    state: 'working',
    label: 'Working…',
    detail: 'The request has not been confirmed yet.',
  };
  if (input.dirty) return {
    state: 'unsaved',
    label: 'Unsaved changes',
    detail: input.readOnly
      ? 'This version is read only; local changes cannot be saved here.'
      : input.validDraft
        ? 'Local edits are not saved. Select Save to keep this draft.'
        : 'Local edits are not saved. Fix the title or invalid fields before saving.',
  };
  return {
    state: 'saved',
    label: `Saved version ${input.savedVersion}`,
    detail: input.readOnly
      ? 'This version is saved and read only.'
      : 'This draft version is saved. Publishing is a separate action.',
  };
}
