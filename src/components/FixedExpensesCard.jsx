import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatMoney } from '../lib/format';
import { cardStyle, labelStyle, inputStyle, dollarSignStyle } from '../styles';
import ReorderButtons from './ReorderButtons';

// One-time bills (rent, insurance premiums, etc.): a single estimated amount
// and a single actual amount paid - one consistent shape for every row here.
export default function FixedExpensesCard({ categories, currentExpenses, onAddCategory, onRemoveCategory, onMoveCategory, onUpdateFixed }) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');

  const totalEstimated = categories.reduce((sum, cat) => sum + (parseFloat(currentExpenses[cat.name].estimated) || 0), 0);
  const totalActualPaid = categories.reduce((sum, cat) => sum + (parseFloat(currentExpenses[cat.name].actual) || 0), 0);

  function submitAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddCategory(trimmed, 'fixed');
    setName('');
    setShowAdd(false);
  }

  return (
    <div style={{ ...cardStyle, marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Fixed expenses</label>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{ background: 'none', border: 'none', color: '#14361F', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Plus size={14} /> Bill
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b6f76', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F1F0EB' }}>
        <span>Estimated: <strong style={{ color: '#1C1E21' }}>{formatMoney(totalEstimated)}</strong></span>
        <span>Actual paid: <strong style={{ color: '#1C1E21' }}>{formatMoney(totalActualPaid)}</strong></span>
      </div>

      {showAdd && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            type="text"
            placeholder="e.g. Car insurance"
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
        <p style={{ fontSize: 13, color: '#9A968C', margin: 0 }}>No fixed bills yet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {categories.map((cat, i) => (
          <FixedRow
            key={cat.name}
            cat={cat}
            entry={currentExpenses[cat.name]}
            isFirst={i === 0}
            isLast={i === categories.length - 1}
            onRemoveCategory={onRemoveCategory}
            onMoveCategory={onMoveCategory}
            onUpdateFixed={onUpdateFixed}
          />
        ))}
      </div>
    </div>
  );
}

function FixedRow({ cat, entry, isFirst, isLast, onRemoveCategory, onMoveCategory, onUpdateFixed }) {
  const estNum = parseFloat(entry.estimated);
  const actNum = parseFloat(entry.actual);
  const hasBoth = !isNaN(estNum) && !isNaN(actNum);
  const diff = hasBoth ? actNum - estNum : 0;
  const rowStyle = { paddingBottom: 14, borderBottom: isLast ? 'none' : '1px solid #F1F0EB', marginBottom: isLast ? 0 : 14 };

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
