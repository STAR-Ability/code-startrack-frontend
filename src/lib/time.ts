// Inputs are UTC timestamps validated by instantSchema. Preserve its arbitrary
// fractional precision instead of rounding API revisions to Date milliseconds.
export function compareInstants(left: string, right: string): -1 | 0 | 1 {
  const leftSecond = left.slice(0, 19);
  const rightSecond = right.slice(0, 19);
  if (leftSecond !== rightSecond) return leftSecond < rightSecond ? -1 : 1;

  const leftFraction = left.slice(20, -1).replace(/0+$/, "");
  const rightFraction = right.slice(20, -1).replace(/0+$/, "");
  if (leftFraction === rightFraction) return 0;
  return leftFraction < rightFraction ? -1 : 1;
}
