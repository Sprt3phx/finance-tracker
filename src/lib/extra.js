export const EXTRA_FIELDS = ['paycheck', 'sideCash', 'bonuses', 'overtime'];

export function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Added Money entries used to be plain numbers. Migrate each to
// {id, amount, allocations}, once, so entries can be individually
// addressed (to tag a specific paycheck as partly going to a goal).
function normalizeExtraField(arr) {
  if (!Array.isArray(arr)) return [];
  let changed = false;
  const next = arr.map((entry) => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry) && 'amount' in entry) return entry;
    changed = true;
    return { id: randomId(), amount: entry, allocations: [] };
  });
  return changed ? next : arr;
}

export function migrateMonths(parsed) {
  if (!parsed || typeof parsed !== 'object') return parsed;
  let changedAny = false;
  const next = {};
  for (const [key, month] of Object.entries(parsed)) {
    const extra = month.extra || {};
    const newExtra = {};
    let monthChanged = false;
    EXTRA_FIELDS.forEach((field) => {
      const normalized = normalizeExtraField(extra[field]);
      if (normalized !== extra[field]) monthChanged = true;
      newExtra[field] = normalized;
    });
    next[key] = monthChanged ? { ...month, extra: newExtra } : month;
    if (monthChanged) changedAny = true;
  }
  return changedAny ? next : parsed;
}

export function sumExtraAmounts(entries) {
  return entries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
}

export function sumAllocations(entries) {
  return entries.reduce((sum, e) => sum + e.allocations.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0), 0);
}

export function totalAllocatedFor(extra) {
  return EXTRA_FIELDS.reduce((sum, f) => sum + sumAllocations(extra[f] || []), 0);
}
