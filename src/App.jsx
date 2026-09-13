import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, AlertCircle, GraduationCap, Landmark, X, CalendarClock } from 'lucide-react';

const DEFAULT_CATEGORIES = ['Rent/Mortgage', 'Utilities', 'Groceries', 'Transportation', 'Insurance', 'Subscriptions', 'Debt Payments', 'Personal', 'Other'];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const MONTHS_KEY = 'finance-months';
const CATEGORIES_KEY = 'finance-categories';
const GOALS_KEY = 'finance-goals';
const SUBSCRIPTIONS_KEY = 'finance-subscriptions';

const CYCLE_LABEL = { weekly: '/wk', monthly: '/mo', yearly: '/yr' };

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMoney(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function formatMonthLabel(key) {
  const [y, m] = key.split('-');
  return `${MONTH_NAMES[parseInt(m, 10) - 1].slice(0, 3)} '${y.slice(2)}`;
}

// Expense entries used to be a single "amount spent" value. Now each category
// tracks an estimate and an actual paid amount, so old single-value data gets
// treated as both (no retroactive "over estimate" noise on existing months).
function normalizeExpenseEntry(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { estimated: raw.estimated ?? '', actual: raw.actual ?? '' };
  }
  if (raw === undefined || raw === null || raw === '') {
    return { estimated: '', actual: '' };
  }
  return { estimated: raw, actual: raw };
}

// What a category actually commits from your money: the real paid amount once
// known, otherwise the estimate. This keeps "Leftover" from overstating what's
// free to spend before a planned bill has actually gone out.
function committedAmount(entry) {
  const act = parseFloat(entry.actual);
  if (!isNaN(act)) return act;
  const est = parseFloat(entry.estimated);
  if (!isNaN(est)) return est;
  return 0;
}

function sumCommittedExpenses(expensesObj) {
  return Object.values(expensesObj || {}).reduce((sum, raw) => sum + committedAmount(normalizeExpenseEntry(raw)), 0);
}

// Advance a due date forward by one billing cycle.
function addCycle(dateStr, cycle) {
  const d = new Date(dateStr + 'T00:00:00');
  if (cycle === 'weekly') d.setDate(d.getDate() + 7);
  else if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

// Self-healing renewal date: if a subscription's due date has already passed
// (e.g. a yearly one from last year), roll it forward to the next real
// occurrence so it keeps warning you ahead of each renewal, not just once.
function rollForwardDueDate(dateStr, cycle) {
  const todayStr = new Date().toISOString().slice(0, 10);
  let next = dateStr;
  let guard = 0;
  while (next < todayStr && guard < 1000) {
    next = addCycle(next, cycle);
    guard += 1;
  }
  return next;
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

function monthlyEquivalent(sub) {
  if (sub.cycle === 'yearly') return sub.cost / 12;
  if (sub.cycle === 'weekly') return (sub.cost * 52) / 12;
  return sub.cost;
}

export default function FinanceTracker() {
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [months, setMonths] = useState({}); // { "2026-09": { income, expenses: {cat: {estimated, actual}} } }
  const [activeMonth, setActiveMonth] = useState(monthKey(new Date()));
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = useState('');
  const [extraInputs, setExtraInputs] = useState({ paycheck: '', sideCash: '', bonuses: '', overtime: '' });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [goals, setGoals] = useState([]); // [{id, name, type: 'semester'|'loan', target, deposits: [amounts]}]
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', type: 'semester', target: '' });
  const [goalDepositInputs, setGoalDepositInputs] = useState({});
  const [dismissedSuggestion, setDismissedSuggestion] = useState({}); // { "2026-09": true }
  const [suggestionGoalId, setSuggestionGoalId] = useState('');
  const [subscriptions, setSubscriptions] = useState([]); // [{id, name, cost, cycle: 'weekly'|'monthly'|'yearly', nextDueDate}]
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [newSubscription, setNewSubscription] = useState({ name: '', cost: '', cycle: 'monthly', nextDueDate: '' });

  // Load data on mount
  useEffect(() => {
    try {
      const rawMonths = window.localStorage.getItem(MONTHS_KEY);
      if (rawMonths) {
        setMonths(JSON.parse(rawMonths));
      }
      const rawCategories = window.localStorage.getItem(CATEGORIES_KEY);
      if (rawCategories) {
        setCategories(JSON.parse(rawCategories));
      }
      const rawGoals = window.localStorage.getItem(GOALS_KEY);
      if (rawGoals) {
        setGoals(JSON.parse(rawGoals));
      }
      const rawSubs = window.localStorage.getItem(SUBSCRIPTIONS_KEY);
      if (rawSubs) {
        const parsedSubs = JSON.parse(rawSubs);
        const correctedSubs = parsedSubs.map((s) => ({ ...s, nextDueDate: rollForwardDueDate(s.nextDueDate, s.cycle) }));
        setSubscriptions(correctedSubs);
        if (correctedSubs.some((s, i) => s.nextDueDate !== parsedSubs[i].nextDueDate)) {
          window.localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(correctedSubs));
        }
      }
    } catch (e) {
      // no existing data yet, that's fine
    } finally {
      setLoading(false);
    }
  }, []);

  function persistMonths(next) {
    setMonths(next);
    try {
      window.localStorage.setItem(MONTHS_KEY, JSON.stringify(next));
      setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
  }

  function persistCategories(next) {
    setCategories(next);
    try {
      window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify(next));
    } catch (e) {
      // non-critical
    }
  }

  function persistGoals(next) {
    setGoals(next);
    try {
      window.localStorage.setItem(GOALS_KEY, JSON.stringify(next));
    } catch (e) {
      // non-critical
    }
  }

  function addGoal() {
    const name = newGoal.name.trim();
    const target = parseFloat(newGoal.target);
    if (!name || isNaN(target) || target <= 0) return;
    const goal = { id: Date.now().toString(), name, type: newGoal.type, target, deposits: [] };
    persistGoals([...goals, goal]);
    setNewGoal({ name: '', type: 'semester', target: '' });
    setShowAddGoal(false);
  }

  function removeGoal(id) {
    persistGoals(goals.filter((g) => g.id !== id));
  }

  function addGoalDeposit(id, value) {
    const amount = parseFloat(value);
    if (isNaN(amount)) return;
    persistGoals(goals.map((g) => (g.id === id ? { ...g, deposits: [...g.deposits, amount] } : g)));
  }

  function removeGoalDeposit(id, index) {
    persistGoals(goals.map((g) => (g.id === id ? { ...g, deposits: g.deposits.filter((_, i) => i !== index) } : g)));
  }

  function persistSubscriptions(next) {
    setSubscriptions(next);
    try {
      window.localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(next));
    } catch (e) {
      // non-critical
    }
  }

  function addSubscription() {
    const name = newSubscription.name.trim();
    const cost = parseFloat(newSubscription.cost);
    if (!name || isNaN(cost) || cost <= 0 || !newSubscription.nextDueDate) return;
    const sub = {
      id: Date.now().toString(),
      name,
      cost,
      cycle: newSubscription.cycle,
      nextDueDate: newSubscription.nextDueDate,
    };
    persistSubscriptions([...subscriptions, sub]);
    setNewSubscription({ name: '', cost: '', cycle: 'monthly', nextDueDate: '' });
    setShowAddSubscription(false);
  }

  function removeSubscription(id) {
    persistSubscriptions(subscriptions.filter((s) => s.id !== id));
  }

  const currentData = months[activeMonth] || { income: '', expenses: {}, extra: { sideCash: [], bonuses: [], overtime: [] } };
  const rawExtra = currentData.extra || { sideCash: [], bonuses: [], overtime: [] };
  // normalize in case any category is still an old single-value string from before this was a list
  const currentExtra = {
    paycheck: Array.isArray(rawExtra.paycheck) ? rawExtra.paycheck : (rawExtra.paycheck ? [rawExtra.paycheck] : []),
    sideCash: Array.isArray(rawExtra.sideCash) ? rawExtra.sideCash : (rawExtra.sideCash ? [rawExtra.sideCash] : []),
    bonuses: Array.isArray(rawExtra.bonuses) ? rawExtra.bonuses : (rawExtra.bonuses ? [rawExtra.bonuses] : []),
    overtime: Array.isArray(rawExtra.overtime) ? rawExtra.overtime : (rawExtra.overtime ? [rawExtra.overtime] : []),
  };

  const currentExpenses = useMemo(() => {
    const out = {};
    categories.forEach((cat) => {
      out[cat] = normalizeExpenseEntry(currentData.expenses?.[cat]);
    });
    return out;
  }, [currentData, categories]);

  function updateIncome(value) {
    const next = {
      ...months,
      [activeMonth]: {
        ...currentData,
        income: value,
      },
    };
    persistMonths(next);
  }

  function addExtraEntry(field, value) {
    const amount = parseFloat(value);
    if (isNaN(amount)) return;
    const next = {
      ...months,
      [activeMonth]: {
        ...currentData,
        extra: {
          ...currentExtra,
          [field]: [...currentExtra[field], amount],
        },
      },
    };
    persistMonths(next);
  }

  function removeExtraEntry(field, index) {
    const next = {
      ...months,
      [activeMonth]: {
        ...currentData,
        extra: {
          ...currentExtra,
          [field]: currentExtra[field].filter((_, i) => i !== index),
        },
      },
    };
    persistMonths(next);
  }

  function updateExpenseField(category, field, value) {
    const existing = normalizeExpenseEntry(currentData.expenses?.[category]);
    const next = {
      ...months,
      [activeMonth]: {
        ...currentData,
        expenses: {
          ...currentData.expenses,
          [category]: { ...existing, [field]: value },
        },
      },
    };
    persistMonths(next);
  }

  function addCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    persistCategories([...categories, trimmed]);
    setNewCategory('');
    setShowAddCategory(false);
  }

  function removeCategory(cat) {
    persistCategories(categories.filter((c) => c !== cat));
  }

  const totalExpenses = useMemo(() => {
    return Object.values(currentExpenses).reduce((sum, entry) => sum + committedAmount(entry), 0);
  }, [currentExpenses]);

  const totalEstimated = useMemo(() => {
    return Object.values(currentExpenses).reduce((sum, entry) => sum + (parseFloat(entry.estimated) || 0), 0);
  }, [currentExpenses]);

  const totalActualPaid = useMemo(() => {
    return Object.values(currentExpenses).reduce((sum, entry) => sum + (parseFloat(entry.actual) || 0), 0);
  }, [currentExpenses]);

  const incomeNum = parseFloat(currentData.income) || 0;
  const sumEntries = (arr) => arr.reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const extraTotal = sumEntries(currentExtra.paycheck) + sumEntries(currentExtra.sideCash) + sumEntries(currentExtra.bonuses) + sumEntries(currentExtra.overtime);
  const totalIncome = incomeNum + extraTotal;
  const leftover = totalIncome - totalExpenses;
  const showSuggestion = leftover > 0 && goals.length > 0 && !dismissedSuggestion[activeMonth];

  // Build chronological chart data from all saved months
  const chartData = useMemo(() => {
    const keys = Object.keys(months).sort();
    return keys.map((key) => {
      const m = months[key];
      const ex = m.extra || {};
      const sumArr = (v) => Array.isArray(v) ? v.reduce((s, n) => s + (parseFloat(n) || 0), 0) : (parseFloat(v) || 0);
      const inc = (parseFloat(m.income) || 0) + sumArr(ex.paycheck) + sumArr(ex.sideCash) + sumArr(ex.bonuses) + sumArr(ex.overtime);
      const exp = sumCommittedExpenses(m.expenses);
      return {
        month: formatMonthLabel(key),
        Income: inc,
        Expenses: exp,
        Leftover: inc - exp,
        rawKey: key,
      };
    });
  }, [months]);

  const sortedSubscriptions = useMemo(() => {
    return [...subscriptions].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  }, [subscriptions]);

  const totalMonthlySubscriptionCost = useMemo(() => {
    return subscriptions.reduce((sum, s) => sum + monthlyEquivalent(s), 0);
  }, [subscriptions]);

  const monthOptions = useMemo(() => {
    const existing = Object.keys(months);
    const keys = new Set([...existing, activeMonth]);
    return Array.from(keys).sort().reverse();
  }, [months, activeMonth]);

  function goToMonth(offset) {
    const [y, m] = activeMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + offset, 1);
    setActiveMonth(monthKey(d));
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400, color: '#6b6f76', fontFamily: 'ui-sans-serif, system-ui' }}>
        Loading your data...
      </div>
    );
  }

  const overBudget = leftover < 0;

  return (
    <div style={{
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
      background: '#F7F6F3',
      minHeight: '100vh',
      color: '#1C1E21',
      padding: '24px 16px 60px',
    }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: '#14361F' }}>
            Monthly Ledger
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b6f76', fontSize: 14 }}>
            Track what comes in, what goes out, and watch the pattern.
          </p>
        </div>

        {saveError && (
          <div style={{ background: '#FEF3F0', border: '1px solid #F3C6B8', color: '#A23E1E', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertCircle size={16} />
            Data isn't saving right now — changes may not persist.
          </div>
        )}

        {/* Month selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={() => goToMonth(-1)} style={navBtnStyle}>←</button>
          <select
            value={activeMonth}
            onChange={(e) => setActiveMonth(e.target.value)}
            style={{
              fontSize: 17, fontWeight: 600, padding: '8px 12px', borderRadius: 10,
              border: '1px solid #DCD9D2', background: '#fff', color: '#14361F',
              cursor: 'pointer', minWidth: 180, textAlign: 'center',
            }}
          >
            {monthOptions.map((key) => (
              <option key={key} value={key}>
                {MONTH_NAMES[parseInt(key.split('-')[1], 10) - 1]} {key.split('-')[0]}
              </option>
            ))}
          </select>
          <button onClick={() => goToMonth(1)} style={navBtnStyle}>→</button>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          <SummaryCard label="Income" value={formatMoney(totalIncome)} icon={<Wallet size={16} />} accent="#14361F" />
          <SummaryCard label="Expenses" value={formatMoney(totalExpenses)} icon={<TrendingDown size={16} />} accent="#A23E1E" />
          <SummaryCard
            label={overBudget ? 'Over by' : 'Leftover'}
            value={formatMoney(Math.abs(leftover))}
            icon={overBudget ? <AlertCircle size={16} /> : <TrendingUp size={16} />}
            accent={overBudget ? '#A23E1E' : '#14361F'}
            highlight
          />
        </div>

        {/* Leftover-to-goal suggestion */}
        {showSuggestion && (
          <div style={{
            background: '#FBF6EC', border: '1px solid #E8DBB5', borderRadius: 14,
            padding: 16, marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ fontSize: 14, color: '#5C4A1F', fontWeight: 600 }}>
                You've got {formatMoney(leftover)} left over this month — add it to a goal?
              </div>
              <button
                onClick={() => setDismissedSuggestion({ ...dismissedSuggestion, [activeMonth]: true })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B8A874', display: 'flex', flexShrink: 0 }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <select
                value={suggestionGoalId}
                onChange={(e) => setSuggestionGoalId(e.target.value)}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #E8DBB5', fontSize: 14, background: '#fff' }}
              >
                <option value="">Choose a goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (!suggestionGoalId) return;
                  addGoalDeposit(suggestionGoalId, leftover);
                  setDismissedSuggestion({ ...dismissedSuggestion, [activeMonth]: true });
                  setSuggestionGoalId('');
                }}
                disabled={!suggestionGoalId}
                style={{
                  background: suggestionGoalId ? '#5C4A1F' : '#D8CBA0', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '0 16px', fontSize: 13, fontWeight: 600,
                  cursor: suggestionGoalId ? 'pointer' : 'not-allowed',
                }}
              >
                Add {formatMoney(leftover)}
              </button>
            </div>
          </div>
        )}

        {/* Income input */}
        <div style={cardStyle}>
          <label style={labelStyle}>Income this month</label>
          <div style={{ position: 'relative' }}>
            <span style={dollarSignStyle}>$</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={currentData.income}
              onChange={(e) => updateIncome(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Added money */}
        <div style={{ ...cardStyle, marginTop: 14 }}>
          <label style={labelStyle}>Added money this month</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { key: 'paycheck', name: 'Paycheck' },
              { key: 'sideCash', name: 'Side cash' },
              { key: 'bonuses', name: 'Bonuses' },
              { key: 'overtime', name: 'Overtime' },
            ].map((item) => {
              const entries = currentExtra[item.key];
              const subtotal = sumEntries(entries);
              return (
                <div key={item.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#3A3D42' }}>{item.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#14361F' }}>{formatMoney(subtotal)}</span>
                  </div>

                  {entries.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {entries.map((val, i) => (
                        <span
                          key={i}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: '#F1F0EB', border: '1px solid #E8E5DE', borderRadius: 20,
                            padding: '4px 8px 4px 10px', fontSize: 13, color: '#3A3D42',
                          }}
                        >
                          {formatMoney(val)}
                          <button
                            onClick={() => removeExtraEntry(item.key, i)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A968C', display: 'flex', padding: 0 }}
                            title="Remove entry"
                          >
                            <Trash2 size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ ...dollarSignStyle, left: 10, fontSize: 13 }}>$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="Add an amount"
                        value={extraInputs[item.key]}
                        onChange={(e) => setExtraInputs({ ...extraInputs, [item.key]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && extraInputs[item.key] !== '') {
                            addExtraEntry(item.key, extraInputs[item.key]);
                            setExtraInputs({ ...extraInputs, [item.key]: '' });
                          }
                        }}
                        style={{ ...inputStyle, padding: '7px 10px 7px 22px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (extraInputs[item.key] !== '') {
                          addExtraEntry(item.key, extraInputs[item.key]);
                          setExtraInputs({ ...extraInputs, [item.key]: '' });
                        }
                      }}
                      style={{ background: '#14361F', color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense categories */}
        <div style={{ ...cardStyle, marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Expenses by category</label>
            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              style={{ background: 'none', border: 'none', color: '#14361F', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={14} /> Category
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b6f76', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F1F0EB' }}>
            <span>Estimated: <strong style={{ color: '#1C1E21' }}>{formatMoney(totalEstimated)}</strong></span>
            <span>Actual paid: <strong style={{ color: '#1C1E21' }}>{formatMoney(totalActualPaid)}</strong></span>
          </div>

          {showAddCategory && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input
                type="text"
                placeholder="e.g. Pet care"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD9D2', fontSize: 14 }}
              />
              <button onClick={addCategory} style={{ background: '#14361F', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Add
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {categories.map((cat, i) => {
              const entry = currentExpenses[cat];
              const estNum = parseFloat(entry.estimated);
              const actNum = parseFloat(entry.actual);
              const hasBoth = !isNaN(estNum) && !isNaN(actNum);
              const diff = hasBoth ? actNum - estNum : 0;
              return (
                <div key={cat} style={{ paddingTop: i === 0 ? 0 : 14, paddingBottom: 14, borderBottom: i === categories.length - 1 ? 'none' : '1px solid #F1F0EB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#3A3D42' }}>{cat}</span>
                    <button
                      onClick={() => removeCategory(cat)}
                      style={{ background: 'none', border: 'none', color: '#B8B4AB', cursor: 'pointer', padding: 4, display: 'flex' }}
                      title="Remove category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#9A968C' }}>ESTIMATED</span>
                    <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#9A968C' }}>ACTUAL PAID</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ ...dollarSignStyle, left: 10, fontSize: 13 }}>$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={entry.estimated}
                        onChange={(e) => updateExpenseField(cat, 'estimated', e.target.value)}
                        style={{ ...inputStyle, padding: '7px 10px 7px 22px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ ...dollarSignStyle, left: 10, fontSize: 13 }}>$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={entry.actual}
                        onChange={(e) => updateExpenseField(cat, 'actual', e.target.value)}
                        style={{ ...inputStyle, padding: '7px 10px 7px 22px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  {hasBoth && (
                    <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: diff > 0 ? '#A23E1E' : diff < 0 ? '#14361F' : '#6b6f76' }}>
                      {diff > 0 ? `${formatMoney(diff)} over estimate` : diff < 0 ? `${formatMoney(Math.abs(diff))} under estimate` : 'Right on estimate'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscriptions */}
        <div style={{ ...cardStyle, marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Subscriptions</label>
            <button
              onClick={() => setShowAddSubscription(!showAddSubscription)}
              style={{ background: 'none', border: 'none', color: '#14361F', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={14} /> Subscription
            </button>
          </div>

          {subscriptions.length > 0 && (
            <div style={{ fontSize: 13, color: '#6b6f76', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F1F0EB' }}>
              {subscriptions.length} active · <strong style={{ color: '#1C1E21' }}>{formatMoney(totalMonthlySubscriptionCost)}/mo</strong> total
            </div>
          )}

          {showAddSubscription && (
            <div style={{ background: '#F7F6F3', borderRadius: 10, padding: 12, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text"
                placeholder="e.g. Netflix"
                value={newSubscription.name}
                onChange={(e) => setNewSubscription({ ...newSubscription, name: e.target.value })}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD9D2', fontSize: 14 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ ...dollarSignStyle, left: 10, fontSize: 13 }}>$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Cost"
                    value={newSubscription.cost}
                    onChange={(e) => setNewSubscription({ ...newSubscription, cost: e.target.value })}
                    style={{ ...inputStyle, padding: '7px 10px 7px 22px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <select
                  value={newSubscription.cycle}
                  onChange={(e) => setNewSubscription({ ...newSubscription, cycle: e.target.value })}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD9D2', fontSize: 14, background: '#fff' }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <input
                type="date"
                value={newSubscription.nextDueDate}
                onChange={(e) => setNewSubscription({ ...newSubscription, nextDueDate: e.target.value })}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD9D2', fontSize: 14 }}
              />
              <button onClick={addSubscription} style={{ background: '#14361F', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                Add subscription
              </button>
            </div>
          )}

          {subscriptions.length === 0 && !showAddSubscription && (
            <p style={{ fontSize: 13, color: '#9A968C', margin: 0 }}>
              No subscriptions tracked yet. Add one to keep an eye on renewal dates.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sortedSubscriptions.map((sub, i) => {
              const days = daysUntil(sub.nextDueDate);
              const dueLabel = days <= 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Renews in ${days} days`;
              const dueColor = days <= 7 ? '#A23E1E' : '#6b6f76';
              const dateLabel = new Date(sub.nextDueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <div
                  key={sub.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    paddingTop: i === 0 ? 0 : 12, paddingBottom: 12,
                    borderBottom: i === sortedSubscriptions.length - 1 ? 'none' : '1px solid #F1F0EB',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#3A3D42' }}>{sub.name}</div>
                    <div style={{ fontSize: 12, color: '#9A968C', marginTop: 2 }}>
                      {formatMoney(sub.cost)}{CYCLE_LABEL[sub.cycle]}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: dueColor, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                      <CalendarClock size={12} /> {dueLabel}
                    </div>
                    <div style={{ fontSize: 11, color: '#9A968C', marginTop: 2 }}>{dateLabel}</div>
                  </div>
                  <button
                    onClick={() => removeSubscription(sub.id)}
                    style={{ background: 'none', border: 'none', color: '#B8B4AB', cursor: 'pointer', padding: 4, display: 'flex' }}
                    title="Remove subscription"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Goals: tuition per semester + loan payoff */}
        <div style={{ ...cardStyle, marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Tuition &amp; loan goals</label>
            <button
              onClick={() => setShowAddGoal(!showAddGoal)}
              style={{ background: 'none', border: 'none', color: '#14361F', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={14} /> Goal
            </button>
          </div>

          {showAddGoal && (
            <div style={{ background: '#F7F6F3', borderRadius: 10, padding: 12, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text"
                placeholder="e.g. Spring 2027 tuition"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD9D2', fontSize: 14 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={newGoal.type}
                  onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD9D2', fontSize: 14, background: '#fff' }}
                >
                  <option value="semester">Semester tuition</option>
                  <option value="loan">Subsidized loan</option>
                </select>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ ...dollarSignStyle, left: 10, fontSize: 13 }}>$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Estimated total"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                    style={{ ...inputStyle, padding: '7px 10px 7px 22px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <button onClick={addGoal} style={{ background: '#14361F', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                Add goal
              </button>
            </div>
          )}

          {goals.length === 0 && !showAddGoal && (
            <p style={{ fontSize: 13, color: '#9A968C', margin: 0 }}>
              No goals yet. Add a semester's tuition or a loan you're paying down.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {goals.map((goal) => {
              const saved = sumEntries(goal.deposits);
              const remaining = Math.max(goal.target - saved, 0);
              const pct = Math.min((saved / goal.target) * 100, 100);
              const met = saved >= goal.target;
              return (
                <div key={goal.id} style={{ borderTop: '1px solid #EFEDE7', paddingTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {goal.type === 'loan' ? <Landmark size={15} color="#6b6f76" /> : <GraduationCap size={15} color="#6b6f76" />}
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1C1E21' }}>{goal.name}</span>
                    </div>
                    <button
                      onClick={() => removeGoal(goal.id)}
                      style={{ background: 'none', border: 'none', color: '#B8B4AB', cursor: 'pointer', padding: 2, display: 'flex' }}
                      title="Remove goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ height: 8, background: '#EFEDE7', borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: met ? '#14361F' : '#3E7C4A', transition: 'width 0.3s' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b6f76', marginBottom: 10 }}>
                    <span>{formatMoney(saved)} saved of {formatMoney(goal.target)}</span>
                    <span style={{ fontWeight: 700, color: met ? '#14361F' : '#A23E1E' }}>
                      {met ? 'Fully funded' : `${formatMoney(remaining)} short`}
                    </span>
                  </div>

                  {goal.deposits.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {goal.deposits.map((val, i) => (
                        <span
                          key={i}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: '#F1F0EB', border: '1px solid #E8E5DE', borderRadius: 20,
                            padding: '4px 8px 4px 10px', fontSize: 13, color: '#3A3D42',
                          }}
                        >
                          {formatMoney(val)}
                          <button
                            onClick={() => removeGoalDeposit(goal.id, i)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A968C', display: 'flex', padding: 0 }}
                            title="Remove deposit"
                          >
                            <Trash2 size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ ...dollarSignStyle, left: 10, fontSize: 13 }}>$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="Add a deposit"
                        value={goalDepositInputs[goal.id] || ''}
                        onChange={(e) => setGoalDepositInputs({ ...goalDepositInputs, [goal.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && goalDepositInputs[goal.id]) {
                            addGoalDeposit(goal.id, goalDepositInputs[goal.id]);
                            setGoalDepositInputs({ ...goalDepositInputs, [goal.id]: '' });
                          }
                        }}
                        style={{ ...inputStyle, padding: '7px 10px 7px 22px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (goalDepositInputs[goal.id]) {
                          addGoalDeposit(goal.id, goalDepositInputs[goal.id]);
                          setGoalDepositInputs({ ...goalDepositInputs, [goal.id]: '' });
                        }
                      }}
                      style={{ background: '#14361F', color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trend chart */}
        {chartData.length > 0 && (
          <div style={{ ...cardStyle, marginTop: 14 }}>
            <label style={labelStyle}>Income vs. expenses over time</label>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E5DE" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b6f76' }} axisLine={{ stroke: '#DCD9D2' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b6f76' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value) => formatMoney(value)}
                  contentStyle={{ borderRadius: 10, border: '1px solid #DCD9D2', fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Line type="monotone" dataKey="Income" stroke="#14361F" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Expenses" stroke="#A23E1E" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartData.length > 1 && (
          <div style={{ ...cardStyle, marginTop: 14 }}>
            <label style={labelStyle}>Monthly leftover (saved vs. over)</label>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E5DE" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b6f76' }} axisLine={{ stroke: '#DCD9D2' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b6f76' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ borderRadius: 10, border: '1px solid #DCD9D2', fontSize: 13 }} />
                <Bar dataKey="Leftover" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.Leftover < 0 ? '#A23E1E' : '#14361F'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </div>
  );
}

const cardStyle = {
  background: '#fff',
  border: '1px solid #E8E5DE',
  borderRadius: 14,
  padding: 18,
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#6b6f76',
  textTransform: 'none',
  marginBottom: 10,
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px 10px 26px',
  borderRadius: 10,
  border: '1px solid #DCD9D2',
  fontSize: 18,
  fontWeight: 600,
  color: '#1C1E21',
};

const dollarSignStyle = {
  position: 'absolute',
  left: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#9A968C',
  fontSize: 16,
  fontWeight: 600,
  pointerEvents: 'none',
};

const navBtnStyle = {
  background: '#fff',
  border: '1px solid #DCD9D2',
  borderRadius: 10,
  width: 36,
  height: 36,
  fontSize: 16,
  color: '#14361F',
  cursor: 'pointer',
};

function SummaryCard({ label, value, icon, accent, highlight }) {
  return (
    <div style={{
      background: highlight ? '#14361F' : '#fff',
      border: highlight ? 'none' : '1px solid #E8E5DE',
      borderRadius: 14,
      padding: '14px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: highlight ? '#B8CDBB' : accent, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, color: highlight ? '#fff' : '#1C1E21', letterSpacing: '-0.01em' }}>
        {value}
      </div>
    </div>
  );
}
