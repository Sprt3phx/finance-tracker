import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatMoney, sumEntries } from '../lib/format';
import { cardStyle, labelStyle, inputStyle, dollarSignStyle } from '../styles';
import ReorderButtons from './ReorderButtons';

// Weekly/running-spend categories (groceries, gas, etc.): a monthly budget
// plus a log of individual spend entries - one consistent shape for every
// row here, same pattern as the Added Money tallies.
export default function BudgetedExpensesCard({ categories, currentExpenses, onAddCategory, onRemoveCategory, onMoveCategory, onUpdateBudget, onAddSpend, onRemoveSpend }) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');

  const totalBudgeted = categories.reduce((sum, cat) => sum + (parseFloat(currentExpenses[cat.name].budget) || 0), 0);
  const totalSpent = categories.reduce((sum, cat) => sum + sumEntries(currentExpenses[cat.name].spent), 0);

  function submitAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddCategory(trimmed, 'variable');
    setName('');
    setShowAdd(false);
  }

  return (
    <div style={{ ...cardStyle, marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Budgeted spending</label>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{ background: 'none', border: 'none', color: '#14361F', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Plus size={14} /> Budget
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b6f76', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F1F0EB' }}>
        <span>Budgeted: <strong style={{ color: '#1C1E21' }}>{formatMoney(totalBudgeted)}</strong></span>
        <span>Spent so far: <strong style={{ color: '#1C1E21' }}>{formatMoney(totalSpent)}</strong></span>
      </div>

      {showAdd && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            type="text"
            placeholder="e.g. Gas"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD9D2', fontSize: 14 }}
          />
          <button onClick={submitAdd} style={{ background: '#14361F', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Add
          </button>
        </div>
      )}

      {categories.length === 0 && !showAdd && (
        <p style={{ fontSize: 13, color: '#9A968C', margin: 0 }}>No budgets yet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {categories.map((cat, i) => (
          <VariableRow
            key={cat.name}
            cat={cat}
            entry={currentExpenses[cat.name]}
            isFirst={i === 0}
            isLast={i === categories.length - 1}
            onRemoveCategory={onRemoveCategory}
            onMoveCategory={onMoveCategory}
            onUpdateBudget={onUpdateBudget}
            onAddSpend={onAddSpend}
            onRemoveSpend={onRemoveSpend}
          />
        ))}
      </div>
    </div>
  );
}

function VariableRow({ cat, entry, isFirst, isLast, onRemoveCategory, onMoveCategory, onUpdateBudget, onAddSpend, onRemoveSpend }) {
  const [spendInput, setSpendInput] = useState('');
  const budgetNum = parseFloat(entry.budget) || 0;
  const remaining = budgetNum - sumEntries(entry.spent);
  const rowStyle = { paddingBottom: 14, borderBottom: isLast ? 'none' : '1px solid #F1F0EB', marginBottom: isLast ? 0 : 14 };

  function submitSpend() {
    if (spendInput === '') return;
    onAddSpend(cat.name, spendInput);
    setSpendInput('');
  }

  return (
    <div style={rowStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <ReorderButtons
          canMoveUp={!isFirst} canMoveDown={!isLast}
          onMoveUp={() => onMoveCategory(cat.name, -1)} onMoveDown={() => onMoveCategory(cat.name, 1)}
        />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#3A3D42' }}>{cat.name}</span>
        <button
          onClick={() => onRemoveCategory(cat.name)}
          style={{ background: 'none', border: 'none', color: '#B8B4AB', cursor: 'pointer', padding: 4, display: 'flex' }}
          title="Remove"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: '#9A968C', marginBottom: 4 }}>MONTHLY BUDGET</div>
      <MoneyInput value={entry.budget} onChange={(v) => onUpdateBudget(cat.name, v)} />
      {budgetNum > 0 && (
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: remaining < 0 ? '#A23E1E' : '#14361F' }}>
          {remaining < 0 ? `${formatMoney(Math.abs(remaining))} over budget` : `${formatMoney(remaining)} left of ${formatMoney(budgetNum)}`}
        </div>
      )}
      {entry.spent.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {entry.spent.map((val, i) => (
            <span
              key={i}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F1F0EB', border: '1px solid #E8E5DE', borderRadius: 20, padding: '4px 8px 4px 10px', fontSize: 13, color: '#3A3D42' }}
            >
              {formatMoney(val)}
              <button onClick={() => onRemoveSpend(cat.name, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A968C', display: 'flex', padding: 0 }} title="Remove entry">
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ ...dollarSignStyle, left: 10, fontSize: 13 }}>$</span>
          <input
            type="number" inputMode="decimal" placeholder="Add what you spent"
            value={spendInput} onChange={(e) => setSpendInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitSpend()}
            style={{ ...inputStyle, padding: '7px 10px 7px 22px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <button onClick={submitSpend} style={{ background: '#14361F', color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Add
        </button>
      </div>
    </div>
  );
}

function MoneyInput({ value, onChange }) {
  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <span style={{ ...dollarSignStyle, left: 10, fontSize: 13 }}>$</span>
      <input
        type="number" inputMode="decimal" placeholder="0"
        value={value} onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, padding: '7px 10px 7px 22px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
      />
    </div>
  );
}
