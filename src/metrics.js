// Temporary display values requested by the site owner; not verified live totals.
export const PLACEHOLDER_METRICS = Object.freeze({
  achievements: 20,
  students: 30,
  instructors: 10,
});

export function formatTotal(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value.toLocaleString('en-NG') : '—';
}
