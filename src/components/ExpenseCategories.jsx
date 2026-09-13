import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatMoney, sumEntries } from '../lib/format';
import { cardStyle, labelStyle, inputStyle, dollarSignStyle } from '../styles';

export default function ExpenseCategories({
  categories, currentExpenses, onAddCategory, onRemoveCategory,
  onUpdateFixed, onUpdateBudget, onAddSpend, onRemoveSpend,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('variable');

  const totalEstimated = categories.reduce((sum, cat) => {
    const entry = currentExpenses[cat.name];
    return sum + (parseFloat(cat.type === 'fixed' ? entry.estimated : entry.budget) || 0);
  }, 0);
  const totalActualPaid = categories.reduce((sum, cat) => {
    const entry = currentExpenses[cat.name];
    return sum + (cat.type === 'fixed' ? (parseFloat(entry.actual) || 0) : sumEntries(entry.spent));
  }, 0);

  function submitAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddCategory(trimmed, type);
    setName('');
    setType('variable');
    setShowAdd(false);
  }

  return (
    <div style={{ ...cardStyle, marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Expenses by category</label>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{ background: 'none', border: 'none', color: '#14361F', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Plus size={14} /> Category
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b6f76', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F1F0EB' }}>
        <span>Estimated: <strong style={{ color: '#1C1E21' }}>{formatMoney(totalEstimated)}</strong></span>
        <span>Actual paid: <strong style={{ color: '#1C1E21' }}>{formatMoney(totalActualPaid)}</strong></span>
      </div>

      {showAdd && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <input
            type="text"
            placeholder="e.g. Pet care"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD9D2', fontSize: 14 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD9D2', fontSize: 14, background: '#fff' }}
            >
              <option value="variable">Weekly budget (like groceries)</option>
              <option value="fixed">One-time bill (like rent)</option>
            </select>
            <button onClick={submitAdd} style={{ background: '#14361F', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Add
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {categories.map((cat, i) => (
          <CategoryRow
            key={cat.name}
            cat={cat}
            entry={currentExpenses[cat.name]}
            isLast={i === categories.length - 1}
            onRemoveCategory={onRemoveCategory}
            onUpdateFixed={onUpdateFixed}
            onUpdateBudget={onUpdateBudget}
            onAddSpend={onAddSpend}
            onRemoveSpend={onRemoveSpend}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({ cat, entry, isLast, onRemoveCategory, onUpdateFixed, onUpdateBudget, onAddSpend, onRemoveSpend }) {
  const [spendInput, setSpendInput] = useState('');
  const rowStyle = { paddingBottom: 14, borderBottom: isLast ? 'none' : '1px solid #F1F0EB', marginBottom: isLast ? 0 : 14 };

  function submitSpend() {
    if (spendInput === '') return;
    onAddSpend(cat.name, spendInput);
    setSpendInput('');
  }

  return (
    <div style={rowStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#3A3D42' }}>{cat.name}</span>
        <button
          onClick={() => onRemoveCategory(cat.name)}
          style={{ background: 'none', border: 'none', color: '#B8B4AB', cursor: 'pointer', padding: 4, display: 'flex' }}
          title="Remove category"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {cat.type === 'fixed' ? (
        <FixedRow cat={cat} entry={entry} onUpdateFixed={onUpdateFixed} />
      ) : (
        <VariableRow
          cat={cat} entry={entry} spendInput={spendInput} setSpendInput={setSpendInput}
          submitSpend={submitSpend} onUpdateBudget={onUpdateBudget} onRemoveSpend={onRemoveSpend}
        />
      )}
    </div>
  );
}

function FixedRow({ cat, entry, onUpdateFixed }) {
  const estNum = parseFloat(entry.estimated);
  const actNum = parseFloat(entry.actual);
  const hasBoth = !isNaN(estNum) && !isNaN(actNum);
  const diff = hasBoth ? actNum - estNum : 0;
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#9A968C' }}>ESTIMATED</span>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#9A968C' }}>ACTUAL PAID</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <MoneyInput value={entry.estimated} onChange={(v) => onUpdateFixed(cat.name, 'estimated', v)} />
        <MoneyInput value={entry.actual} onChange={(v) => onUpdateFixed(cat.name, 'actual', v)} />
      </div>
      {hasBoth && (
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: diff > 0 ? '#A23E1E' : diff < 0 ? '#14361F' : '#6b6f76' }}>
          {diff > 0 ? `${formatMoney(diff)} over estimate` : diff < 0 ? `${formatMoney(Math.abs(diff))} under estimate` : 'Right on estimate'}
        </div>
      )}
    </>
  );
}

function VariableRow({ cat, entry, spendInput, setSpendInput, submitSpend, onUpdateBudget, onRemoveSpend }) {
  const budgetNum = parseFloat(entry.budget) || 0;
  const remaining = budgetNum - sumEntries(entry.spent);
  return (
    <>
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
    </>
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
