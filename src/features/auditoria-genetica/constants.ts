export const TOTAL_STEPS = 9;

export function clampStep(step: number) {
  if (Number.isNaN(step)) return 0;
  return Math.min(Math.max(step, 0), TOTAL_STEPS - 1);
}
