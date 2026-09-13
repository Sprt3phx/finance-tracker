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

export function committedFixed(entry) {
  const act = parseFloat(entry.actual);
  if (!isNaN(act)) return act;
  const est = parseFloat(entry.estimated);
  if (!isNaN(est)) return est;
  return 0;
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

export function committedVariable(entry) {
  const budget = parseFloat(entry.budget) || 0;
  const spentSum = entry.spent.reduce((s, v) => s + (parseFloat(v) || 0), 0);
  return Math.max(budget, spentSum);
}

export function normalizeEntryFor(cat, raw) {
  return cat.type === 'fixed' ? normalizeFixedEntry(raw) : normalizeVariableEntry(raw);
}

export function committedAmountFor(cat, entry) {
  return cat.type === 'fixed' ? committedFixed(entry) : committedVariable(entry);
}

export function buildCurrentExpenses(expensesObj, categories) {
  const out = {};
  categories.forEach((cat) => {
    out[cat.name] = normalizeEntryFor(cat, expensesObj?.[cat.name]);
  });
  return out;
}

export function sumCommittedExpenses(expensesObj, categories) {
  return categories.reduce((sum, cat) => {
    const entry = normalizeEntryFor(cat, expensesObj?.[cat.name]);
    return sum + committedAmountFor(cat, entry);
  }, 0);
}
