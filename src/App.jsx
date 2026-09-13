import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';

const DEFAULT_CATEGORIES = ['Rent/Mortgage', 'Utilities', 'Groceries', 'Transportation', 'Insurance', 'Subscriptions', 'Debt Payments', 'Personal', 'Other'];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const MONTHS_KEY = 'finance-months';
const CATEGORIES_KEY = 'finance-categories';

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

export default function FinanceTracker() {
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [months, setMonths] = useState({}); // { "2026-09": { income, expenses: {cat: amt} } }
  const [activeMonth, setActiveMonth] = useState(monthKey(new Date()));
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = useState('');
  const [extraInputs, setExtraInputs] = useState({ sideCash: '', bonuses: '', overtime: '' });
  const [showAddCategory, setShowAddCategory] = useState(false);

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

  const currentData = months[activeMonth] || { income: '', expenses: {}, extra: { sideCash: [], bonuses: [], overtime: [] } };
  const rawExtra = currentData.extra || { sideCash: [], bonuses: [], overtime: [] };
  // normalize in case any category is still an old single-value string from before this was a list
  const currentExtra = {
    sideCash: Array.isArray(rawExtra.sideCash) ? rawExtra.sideCash : (rawExtra.sideCash ? [rawExtra.sideCash] : []),
    bonuses: Array.isArray(rawExtra.bonuses) ? rawExtra.bonuses : (rawExtra.bonuses ? [rawExtra.bonuses] : []),
    overtime: Array.isArray(rawExtra.overtime) ? rawExtra.overtime : (rawExtra.overtime ? [rawExtra.overtime] : []),
  };

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

  function updateExpense(category, value) {
    const next = {
      ...months,
      [activeMonth]: {
        ...currentData,
        expenses: {
          ...currentData.expenses,
          [category]: value,
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
    return Object.values(currentData.expenses || {}).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  }, [currentData]);

  const incomeNum = parseFloat(currentData.income) || 0;
  const sumEntries = (arr) => arr.reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const extraTotal = sumEntries(currentExtra.sideCash) + sumEntries(currentExtra.bonuses) + sumEntries(currentExtra.overtime);
  const totalIncome = incomeNum + extraTotal;
  const leftover = totalIncome - totalExpenses;

  // Build chronological chart data from all saved months
  const chartData = useMemo(() => {
    const keys = Object.keys(months).sort();
    return keys.map((key) => {
      const m = months[key];
      const ex = m.extra || {};
      const sumArr = (v) => Array.isArray(v) ? v.reduce((s, n) => s + (parseFloat(n) || 0), 0) : (parseFloat(v) || 0);
      const inc = (parseFloat(m.income) || 0) + sumArr(ex.sideCash) + sumArr(ex.bonuses) + sumArr(ex.overtime);
      const exp = Object.values(m.expenses || {}).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
      return {
        month: formatMonthLabel(key),
        Income: inc,
        Expenses: exp,
        Leftover: inc - exp,
        rawKey: key,
      };
    });
  }, [months]);

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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {categories.map((cat) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: 1, fontSize: 14, color: '#3A3D42' }}>{cat}</span>
                <div style={{ position: 'relative', width: 130 }}>
                  <span style={{ ...dollarSignStyle, left: 10, fontSize: 13 }}>$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={currentData.expenses?.[cat] || ''}
                    onChange={(e) => updateExpense(cat, e.target.value)}
                    style={{ ...inputStyle, padding: '7px 10px 7px 22px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  onClick={() => removeCategory(cat)}
                  style={{ background: 'none', border: 'none', color: '#B8B4AB', cursor: 'pointer', padding: 4, display: 'flex' }}
                  title="Remove category"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
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
