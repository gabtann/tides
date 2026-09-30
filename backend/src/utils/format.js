// backend/src/utils/format.js
/**
 * Convert a decimal number to a percentage value rounded to two decimals.
 * Example: 0.062 => 6.2
 * Returns null if input is not a number.
 * @param {number|null|undefined} decimal
 * @returns {number|null}
 */
export function toPercent(decimal) {
  if (typeof decimal !== 'number' || isNaN(decimal)) return null;
  return Number((decimal * 100).toFixed(2));
}
