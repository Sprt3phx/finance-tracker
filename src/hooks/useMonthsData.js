import { useState, useMemo } from 'react';
import { usePersistedState } from './usePersistedState';
import { MONTHS_KEY } from '../lib/constants';
import { monthKey, formatMonthLabel } from '../lib/format';
import { buildCurrentExpenses, actualAmountFor, sumActualExpenses } from '../lib/expenses';
import { EXTRA_FIELDS, randomId, migrateMonths, sumExtraAmounts, totalAllocatedFor } from '../lib/extra';

function normalizeExtra(raw) {
  const e = raw || {};
  const norm = (v) => (Array.isArray(v) ? v : []);
  return { paycheck: norm(e.paycheck), sideCash: norm(e.sideCash), bonuses: norm(e.bonuses), overtime: norm(e.overtime) };
}

export function useMonthsData(categories) {
  const [months, persistMonths, loaded, saveError] = usePersistedState(MONTHS_KEY, {}, migrateMonths);
  const [activeMonth, setActiveMonth] = useState(monthKey(new Date()));

  const currentData = months[activeMonth] || { expenses: {}, extra: {} };
  const currentExtra = normalizeExtra(currentData.extra);
  const currentExpenses = useMemo(
    () => buildCurrentExpenses(currentData.expenses, categories),
    [currentData, categories]
  );

  function updateMonth(patch) {
    persistMonths({ ...months, [activeMonth]: { ...currentData, ...patch } });
  }

  function addExtraEntry(field, value) {
    const amount = parseFloat(value);
    if (isNaN(amount)) return;
    const entry = { id: randomId(), amount, allocations: [] };
    updateMonth({ extra: { ...currentExtra, [field]: [...currentExtra[field], entry] } });
  }

  function removeExtraEntry(field, index) {
    updateMonth({ extra: { ...currentExtra, [field]: currentExtra[field].filter((_, i) => i !== index) } });
  }

  // Tags part of a specific income entry (e.g. one paycheck) as earmarked
  // for a goal. The full entry amount still counts as income; this just
  // reduces what shows as free/unclaimed Leftover. Recording the deposit on
  // the goal itself is the caller's job (needs the goals hook too).
  function addAllocation(field, entryId, goalId, value) {
    const amount = parseFloat(value);
    if (isNaN(amount) || amount <= 0) return null;
    const allocation = { id: randomId(), goalId, amount };
    const nextField = currentExtra[field].map((e) => (e.id === entryId ? { ...e, allocations: [...e.allocations, allocation] } : e));
    updateMonth({ extra: { ...currentExtra, [field]: nextField } });
    return allocation;
  }

  // Removes only the label on the income entry. Does not touch the goal's
  // own deposit - remove that separately from the goal's card if you also
  // want the money back out of the goal.
  function removeAllocation(field, entryId, allocationId) {
    const nextField = currentExtra[field].map((e) =>
      e.id === entryId ? { ...e, allocations: e.allocations.filter((a) => a.id !== allocationId) } : e
    );
    updateMonth({ extra: { ...currentExtra, [field]: nextField } });
  }

  function updateFixedField(category, field, value) {
    const existing = currentExpenses[category] || { estimated: '', actual: '' };
    updateMonth({ expenses: { ...currentData.expenses, [category]: { ...existing, [field]: value } } });
  }

  function updateVariableBudget(category, value) {
    const existing = currentExpenses[category] || { budget: '', spent: [] };
    updateMonth({ expenses: { ...currentData.expenses, [category]: { ...existing, budget: value } } });
  }

  function addVariableSpend(category, value) {
    const amount = parseFloat(value);
    if (isNaN(amount)) return;
    const existing = currentExpenses[category] || { budget: '', spent: [] };
    updateMonth({ expenses: { ...currentData.expenses, [category]: { ...existing, spent: [...existing.spent, amount] } } });
  }

  function removeVariableSpend(category, index) {
    const existing = currentExpenses[category] || { budget: '', spent: [] };
    updateMonth({
      expenses: { ...currentData.expenses, [category]: { ...existing, spent: existing.spent.filter((_, i) => i !== index) } },
    });
  }

  // Leftover reflects real cash flow: income minus what's actually been paid
  // or spent so far, minus whatever's already earmarked for a goal - not
  // what's budgeted/estimated, and not money that's already spoken for.
  const totalExpenses = useMemo(() => {
    return categories.reduce((sum, cat) => sum + actualAmountFor(cat, currentExpenses[cat.name]), 0);
  }, [categories, currentExpenses]);

  const extraTotal = EXTRA_FIELDS.reduce((sum, f) => sum + sumExtraAmounts(currentExtra[f]), 0);
  const totalAllocated = useMemo(() => totalAllocatedFor(currentExtra), [currentExtra]);
  const incomeNum = parseFloat(currentData.income) || 0; // legacy field, no longer editable in the UI
  const totalIncome = incomeNum + extraTotal;
  const leftover = totalIncome - totalExpenses - totalAllocated;

  const chartData = useMemo(() => {
    const keys = Object.keys(months).sort();
    return keys.map((key) => {
      const m = months[key];
      const ex = normalizeExtra(m.extra);
      const inc = (parseFloat(m.income) || 0) + EXTRA_FIELDS.reduce((sum, f) => sum + sumExtraAmounts(ex[f]), 0);
      const exp = sumActualExpenses(m.expenses, categories);
      const allocated = totalAllocatedFor(ex);
      return { month: formatMonthLabel(key), Income: inc, Expenses: exp, Leftover: inc - exp - allocated, rawKey: key };
    });
  }, [months, categories]);

  const monthOptions = useMemo(() => {
    const keys = new Set([...Object.keys(months), activeMonth]);
    return Array.from(keys).sort().reverse();
  }, [months, activeMonth]);

  function goToMonth(offset) {
    const [y, m] = activeMonth.split('-').map(Number);
    setActiveMonth(monthKey(new Date(y, m - 1 + offset, 1)));
  }

  return {
    activeMonth,
    setActiveMonth,
    goToMonth,
    monthOptions,
    currentExtra,
    currentExpenses,
    addExtraEntry,
    removeExtraEntry,
    addAllocation,
    removeAllocation,
    updateFixedField,
    updateVariableBudget,
    addVariableSpend,
    removeVariableSpend,
    totalIncome,
    totalExpenses,
    totalAllocated,
    leftover,
    chartData,
    monthsLoaded: loaded,
    monthsSaveError: saveError,
  };
}
