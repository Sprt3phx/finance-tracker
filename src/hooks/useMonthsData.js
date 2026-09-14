import { useState, useMemo } from 'react';
import { usePersistedState } from './usePersistedState';
import { MONTHS_KEY } from '../lib/constants';
import { monthKey, formatMonthLabel, sumEntries } from '../lib/format';
import { buildCurrentExpenses, actualAmountFor, sumActualExpenses } from '../lib/expenses';

function normalizeExtra(raw) {
  const e = raw || {};
  const norm = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  return { paycheck: norm(e.paycheck), sideCash: norm(e.sideCash), bonuses: norm(e.bonuses), overtime: norm(e.overtime) };
}

export function useMonthsData(categories) {
  const [months, persistMonths, loaded, saveError] = usePersistedState(MONTHS_KEY, {});
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
    updateMonth({ extra: { ...currentExtra, [field]: [...currentExtra[field], amount] } });
  }

  function removeExtraEntry(field, index) {
    updateMonth({ extra: { ...currentExtra, [field]: currentExtra[field].filter((_, i) => i !== index) } });
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
  // or spent so far, not what's budgeted/estimated.
  const totalExpenses = useMemo(() => {
    return categories.reduce((sum, cat) => sum + actualAmountFor(cat, currentExpenses[cat.name]), 0);
  }, [categories, currentExpenses]);

  const extraTotal =
    sumEntries(currentExtra.paycheck) +
    sumEntries(currentExtra.sideCash) +
    sumEntries(currentExtra.bonuses) +
    sumEntries(currentExtra.overtime);
  const incomeNum = parseFloat(currentData.income) || 0; // legacy field, no longer editable in the UI
  const totalIncome = incomeNum + extraTotal;
  const leftover = totalIncome - totalExpenses;

  const chartData = useMemo(() => {
    const keys = Object.keys(months).sort();
    return keys.map((key) => {
      const m = months[key];
      const ex = normalizeExtra(m.extra);
      const inc =
        (parseFloat(m.income) || 0) +
        sumEntries(ex.paycheck) +
        sumEntries(ex.sideCash) +
        sumEntries(ex.bonuses) +
        sumEntries(ex.overtime);
      const exp = sumActualExpenses(m.expenses, categories);
      return { month: formatMonthLabel(key), Income: inc, Expenses: exp, Leftover: inc - exp, rawKey: key };
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
    updateFixedField,
    updateVariableBudget,
    addVariableSpend,
    removeVariableSpend,
    totalIncome,
    totalExpenses,
    leftover,
    chartData,
    monthsLoaded: loaded,
    monthsSaveError: saveError,
  };
}
