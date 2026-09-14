const FIXED_DEFAULTS = ['Rent/Mortgage', 'Utilities'];

// Categories used to be plain strings, and "Subscriptions" used to be one of
// them before it got its own dedicated card. Migrate old string-array data
// to {name, type} objects and drop Subscriptions, once, on load.
export function migrateCategories(parsed) {
  if (!Array.isArray(parsed)) return parsed;
  const needsMigration = parsed.some((c) => typeof c === 'string') || parsed.some((c) => c && c.name === 'Subscriptions');
  if (!needsMigration) return parsed;
  return parsed
    .map((c) => (typeof c === 'string' ? { name: c, type: FIXED_DEFAULTS.includes(c) ? 'fixed' : 'variable' } : c))
    .filter((c) => c.name !== 'Subscriptions');
}

// Fixed (one-time) categories: a single estimated amount and a single actual
// amount paid, e.g. rent.
export function normalizeFixedEntry(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { estimated: raw.estimated ?? '', actual: raw.actual ?? '' };
  }
  if (raw === undefined || raw === null || raw === '') return { estimated: '', actual: '' };
  return { estimated: raw, actual: raw }; // legacy single-value data
}

// Variable (budget) categories: a monthly budget plus a running list of
// individual spend entries, e.g. groceries bought week by week.
export function normalizeVariableEntry(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if ('spent' in raw || 'budget' in raw) {
      return { budget: raw.budget ?? '', spent: Array.isArray(raw.spent) ? raw.spent : [] };
    }
    if ('estimated' in raw || 'actual' in raw) {
      // migrating from the previous estimated/actual shape
      const act = parseFloat(raw.actual);
      return { budget: raw.estimated ?? '', spent: isNaN(act) ? [] : [act] };
    }
  }
  if (raw === undefined || raw === null || raw === '') return { budget: '', spent: [] };
  return { budget: raw, spent: [] }; // legacy single-value data
}

export function normalizeEntryFor(cat, raw) {
  return cat.type === 'fixed' ? normalizeFixedEntry(raw) : normalizeVariableEntry(raw);
}

export function buildCurrentExpenses(expensesObj, categories) {
  const out = {};
  categories.forEach((cat) => {
    out[cat.name] = normalizeEntryFor(cat, expensesObj?.[cat.name]);
  });
  return out;
}

// Real money actually spent so far - the fixed "actual" once paid, or the
// running total of a variable category's logged spend entries. Unlike a
// budget/estimate, this never counts money that hasn't gone out yet.
export function actualAmountFor(cat, entry) {
  if (cat.type === 'fixed') return parseFloat(entry.actual) || 0;
  return entry.spent.reduce((s, v) => s + (parseFloat(v) || 0), 0);
}

export function sumActualExpenses(expensesObj, categories) {
  return categories.reduce((sum, cat) => {
    const entry = normalizeEntryFor(cat, expensesObj?.[cat.name]);
    return sum + actualAmountFor(cat, entry);
  }, 0);
}
