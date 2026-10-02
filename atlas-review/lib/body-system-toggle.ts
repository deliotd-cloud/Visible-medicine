/** Availability affects the control only, never the stored visibility preference. */
export function bodySystemToggle(count: number, enabled: boolean, locked = false) {
  const available = count > 0;
  return { available, checked: available && enabled, disabled: locked || !available };
}
