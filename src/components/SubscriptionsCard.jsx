import { useState } from 'react';
import { Plus, Trash2, CalendarClock } from 'lucide-react';
import { formatMoney } from '../lib/format';
import { daysUntil, monthlyEquivalent } from '../lib/subscriptions';
import { CYCLE_LABEL } from '../lib/constants';
import { cardStyle, labelStyle, inputStyle, dollarSignStyle } from '../styles';

export default function SubscriptionsCard({ subscriptions, onAdd, onRemove }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', cost: '', cycle: 'monthly', nextDueDate: '' });

  const sorted = [...subscriptions].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  const totalMonthly = subscriptions.reduce((sum, s) => sum + monthlyEquivalent(s), 0);

  function submit() {
    const name = form.name.trim();
    const cost = parseFloat(form.cost);
    if (!name || isNaN(cost) || cost <= 0 || !form.nextDueDate) return;
    onAdd({ name, cost, cycle: form.cycle, nextDueDate: form.nextDueDate });
    setForm({ name: '', cost: '', cycle: 'monthly', nextDueDate: '' });
    setShowAdd(false);
  }

  return (
    <div style={{ ...cardStyle, marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Subscriptions</label>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{ background: 'none', border: 'none', color: '#14361F', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Plus size={14} /> Subscription
        </button>
      </div>

      {subscriptions.length > 0 && (
        <div style={{ fontSize: 13, color: '#6b6f76', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F1F0EB' }}>
          {subscriptions.length} active · <strong style={{ color: '#1C1E21' }}>{formatMoney(totalMonthly)}/mo</strong> total
        </div>
      )}

      {showAdd && (
        <div style={{ background: '#F7F6F3', borderRadius: 10, padding: 12, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text" placeholder="e.g. Netflix" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD9D2', fontSize: 14 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ ...dollarSignStyle, left: 10, fontSize: 13 }}>$</span>
              <input
                type="number" inputMode="decimal" placeholder="Cost" value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                style={{ ...inputStyle, padding: '7px 10px 7px 22px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <select
              value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD9D2', fontSize: 14, background: '#fff' }}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <input
            type="date" value={form.nextDueDate}
            onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #DCD9D2', fontSize: 14 }}
          />
          <button onClick={submit} style={{ background: '#14361F', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
            Add subscription
          </button>
        </div>
      )}

      {subscriptions.length === 0 && !showAdd && (
        <p style={{ fontSize: 13, color: '#9A968C', margin: 0 }}>No subscriptions tracked yet. Add one to keep an eye on renewal dates.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {sorted.map((sub, i) => {
          const days = daysUntil(sub.nextDueDate);
          const dueLabel = days <= 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `Renews in ${days} days`;
          const dueColor = days <= 7 ? '#A23E1E' : '#6b6f76';
          const dateLabel = new Date(sub.nextDueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <div
              key={sub.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: i === 0 ? 0 : 12, paddingBottom: 12, borderBottom: i === sorted.length - 1 ? 'none' : '1px solid #F1F0EB' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#3A3D42' }}>{sub.name}</div>
                <div style={{ fontSize: 12, color: '#9A968C', marginTop: 2 }}>{formatMoney(sub.cost)}{CYCLE_LABEL[sub.cycle]}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: dueColor, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <CalendarClock size={12} /> {dueLabel}
                </div>
                <div style={{ fontSize: 11, color: '#9A968C', marginTop: 2 }}>{dateLabel}</div>
              </div>
              <button onClick={() => onRemove(sub.id)} style={{ background: 'none', border: 'none', color: '#B8B4AB', cursor: 'pointer', padding: 4, display: 'flex' }} title="Remove subscription">
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
