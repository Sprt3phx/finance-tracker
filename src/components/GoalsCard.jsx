import { useState } from 'react';
import { Plus, Trash2, GraduationCap, Landmark } from 'lucide-react';
import { formatMoney, sumEntries } from '../lib/format';
import { cardStyle, labelStyle, inputStyle, dollarSignStyle } from '../styles';

export default function GoalsCard({ goals, onAdd, onRemove, onDeposit, onRemoveDeposit }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'semester', target: '' });
  const [depositInputs, setDepositInputs] = useState({});

  function submit() {
    const name = form.name.trim();
    const target = parseFloat(form.target);
    if (!name || isNaN(target) || target <= 0) return;
    onAdd({ name, type: form.type, target });
    setForm({ name: '', type: 'semester', target: '' });
    setShowAdd(false);
  }

  function submitDeposit(id) {
    if (!depositInputs[id]) return;
    onDeposit(id, depositInputs[id]);
    setDepositInputs({ ...depositInputs, [id]: '' });
  }

  return (
    <div style={{ ...cardStyle, marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Tuition &amp; loan goals</label>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{ background: 'none', border: 'none', color: '#14361F', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Plus size={14} /> Goal
        </button>
      </div>

      {showAdd && (
        <div style={{ background: '#F7F6F3', borderRadius: 10, padding: 12, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text" placeholder="e.g. Spring 2027 tuition" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD9D2', fontSize: 14 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD9D2', fontSize: 14, background: '#fff' }}
            >
              <option value="semester">Semester tuition</option>
              <option value="loan">Subsidized loan</option>
            </select>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ ...dollarSignStyle, left: 10, fontSize: 13 }}>$</span>
              <input
                type="number" inputMode="decimal" placeholder="Estimated total" value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                style={{ ...inputStyle, padding: '7px 10px 7px 22px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <button onClick={submit} style={{ background: '#14361F', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
            Add goal
          </button>
        </div>
      )}

      {goals.length === 0 && !showAdd && (
        <p style={{ fontSize: 13, color: '#9A968C', margin: 0 }}>No goals yet. Add a semester's tuition or a loan you're paying down.</p>
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
                <button onClick={() => onRemove(goal.id)} style={{ background: 'none', border: 'none', color: '#B8B4AB', cursor: 'pointer', padding: 2, display: 'flex' }} title="Remove goal">
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ height: 8, background: '#EFEDE7', borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: met ? '#14361F' : '#3E7C4A', transition: 'width 0.3s' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b6f76', marginBottom: 10 }}>
                <span>{formatMoney(saved)} saved of {formatMoney(goal.target)}</span>
                <span style={{ fontWeight: 700, color: met ? '#14361F' : '#A23E1E' }}>{met ? 'Fully funded' : `${formatMoney(remaining)} short`}</span>
              </div>

              {goal.deposits.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {goal.deposits.map((val, i) => (
                    <span
                      key={i}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F1F0EB', border: '1px solid #E8E5DE', borderRadius: 20, padding: '4px 8px 4px 10px', fontSize: 13, color: '#3A3D42' }}
                    >
                      {formatMoney(val)}
                      <button onClick={() => onRemoveDeposit(goal.id, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A968C', display: 'flex', padding: 0 }} title="Remove deposit">
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
                    type="number" inputMode="decimal" placeholder="Add a deposit"
                    value={depositInputs[goal.id] || ''}
                    onChange={(e) => setDepositInputs({ ...depositInputs, [goal.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && submitDeposit(goal.id)}
                    style={{ ...inputStyle, padding: '7px 10px 7px 22px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <button onClick={() => submitDeposit(goal.id)} style={{ background: '#14361F', color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
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
