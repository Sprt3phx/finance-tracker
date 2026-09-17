import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { formatMoney } from '../lib/format';
import { sumExtraAmounts } from '../lib/extra';
import { cardStyle, labelStyle, inputStyle, dollarSignStyle } from '../styles';
import { EXTRA_FIELD_NAMES } from '../lib/constants';
import ReorderButtons from './ReorderButtons';

export default function AddedMoney({ currentExtra, order, goals, totalAllocated, onMoveField, onAdd, onRemove, onAllocate, onRemoveAllocation }) {
  const [inputs, setInputs] = useState({ paycheck: '', sideCash: '', bonuses: '', overtime: '' });

  function submit(key) {
    if (inputs[key] === '') return;
    onAdd(key, inputs[key]);
    setInputs({ ...inputs, [key]: '' });
  }

  return (
    <div style={{ ...cardStyle, marginTop: 14 }}>
      <label style={labelStyle}>Added money this month</label>
      {totalAllocated > 0 && (
        <div style={{ fontSize: 13, color: '#6b6f76', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F1F0EB' }}>
          Earmarked for goals this month: <strong style={{ color: '#1C1E21' }}>{formatMoney(totalAllocated)}</strong>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {order.map((key, i) => {
          const entries = currentExtra[key];
          const subtotal = sumExtraAmounts(entries);
          return (
            <div key={key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <ReorderButtons
                  canMoveUp={i > 0} canMoveDown={i < order.length - 1}
                  onMoveUp={() => onMoveField(key, -1)} onMoveDown={() => onMoveField(key, 1)}
                />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#3A3D42' }}>{EXTRA_FIELD_NAMES[key]}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#14361F' }}>{formatMoney(subtotal)}</span>
              </div>

              {entries.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {entries.map((entry, idx) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      goals={goals}
                      onRemove={() => onRemove(key, idx)}
                      onAllocate={(goalId, amount) => onAllocate(key, entry.id, goalId, amount)}
                      onRemoveAllocation={(allocationId) => onRemoveAllocation(key, entry.id, allocationId)}
                    />
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
                    value={inputs[key]}
                    onChange={(e) => setInputs({ ...inputs, [key]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && submit(key)}
                    style={{ ...inputStyle, padding: '7px 10px 7px 22px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  onClick={() => submit(key)}
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
  );
}

function EntryRow({ entry, goals, onRemove, onAllocate, onRemoveAllocation }) {
  const [showAllocate, setShowAllocate] = useState(false);
  const [goalId, setGoalId] = useState('');
  const [amount, setAmount] = useState('');

  function submitAllocate() {
    if (!goalId || !amount) return;
    onAllocate(goalId, amount);
    setGoalId('');
    setAmount('');
    setShowAllocate(false);
  }

  return (
    <div style={{ background: '#F1F0EB', border: '1px solid #E8E5DE', borderRadius: 10, padding: '8px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#3A3D42' }}>{formatMoney(entry.amount)}</span>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A968C', display: 'flex', padding: 0 }} title="Remove entry">
          <Trash2 size={14} />
        </button>
      </div>

      {entry.allocations.map((a) => (
        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color: '#6b6f76' }}>
          <span style={{ flex: 1 }}>↳ {formatMoney(a.amount)} → {goals.find((g) => g.id === a.goalId)?.name || 'deleted goal'}</span>
          <button
            onClick={() => onRemoveAllocation(a.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A968C', display: 'flex', padding: 0 }}
            title="Remove label (doesn't undo the goal deposit)"
          >
            <Trash2 size={11} />
          </button>
        </div>
      ))}

      {goals.length > 0 && !showAllocate && (
        <button
          onClick={() => setShowAllocate(true)}
          style={{ background: 'none', border: 'none', color: '#14361F', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, marginTop: 6 }}
        >
          + Move some to a goal
        </button>
      )}

      {showAllocate && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
          <select
            value={goalId} onChange={(e) => setGoalId(e.target.value)}
            style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #DCD9D2', fontSize: 12, background: '#fff' }}
          >
            <option value="">Choose a goal</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <div style={{ position: 'relative', width: 76 }}>
            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9A968C', fontSize: 12 }}>$</span>
            <input
              type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '6px 6px 6px 16px', borderRadius: 6, border: '1px solid #DCD9D2', fontSize: 12 }}
            />
          </div>
          <button onClick={submitAllocate} style={{ background: '#14361F', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Add
          </button>
          <button onClick={() => setShowAllocate(false)} style={{ background: 'none', border: 'none', color: '#9A968C', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
