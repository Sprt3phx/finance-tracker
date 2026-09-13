import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatMoney } from '../lib/format';

// Suggests putting leftover money toward a goal, but never auto-applies the
// full amount - the input is pre-filled with the leftover as a convenience,
// fully editable, so a specific dollar amount is chosen deliberately instead
// of dumping everything into one goal.
export default function LeftoverSuggestion({ leftover, goals, activeMonth, dismissed, onDismiss, onAdd }) {
  const [goalId, setGoalId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    setAmount(leftover > 0 ? String(Math.round(leftover)) : '');
    setGoalId('');
  }, [activeMonth, leftover]);

  if (leftover <= 0 || goals.length === 0 || dismissed) return null;

  const amountNum = parseFloat(amount);
  const canAdd = goalId && !isNaN(amountNum) && amountNum > 0;

  return (
    <div style={{ background: '#FBF6EC', border: '1px solid #E8DBB5', borderRadius: 14, padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ fontSize: 14, color: '#5C4A1F', fontWeight: 600 }}>
          You've got {formatMoney(leftover)} left over this month — put some toward a goal?
        </div>
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B8A874', display: 'flex', flexShrink: 0 }}
        >
          <X size={16} />
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <select
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
          style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #E8DBB5', fontSize: 14, background: '#fff' }}
        >
          <option value="">Choose a goal</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <div style={{ position: 'relative', width: 100 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9A968C', fontSize: 13, fontWeight: 600 }}>$</span>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px 8px 20px', borderRadius: 8, border: '1px solid #E8DBB5', fontSize: 14 }}
          />
        </div>
        <button
          onClick={() => canAdd && onAdd(goalId, amountNum)}
          disabled={!canAdd}
          style={{
            background: canAdd ? '#5C4A1F' : '#D8CBA0', color: '#fff', border: 'none',
            borderRadius: 8, padding: '0 16px', fontSize: 13, fontWeight: 600,
            cursor: canAdd ? 'pointer' : 'not-allowed',
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
