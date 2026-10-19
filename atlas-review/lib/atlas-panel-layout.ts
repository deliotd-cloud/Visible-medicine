/** Layout only: the host's available area, never an access or exam policy. */
export function atlasPanelLayout(width: number, height: number) {
  if (![width,height].every(n => Number.isFinite(n) && n > 0))
    return { tools: true, info: true, short: true };
  return { tools: width <= 1100, info: width <= 700, short: height < 700 };
}
