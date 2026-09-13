import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { formatMoney, sumEntries } from '../lib/format';
import { cardStyle, labelStyle, inputStyle, dollarSignStyle } from '../styles';

const FIELDS = [
  { key: 'paycheck', name: 'Paycheck' },
  { key: 'sideCash', name: 'Side cash' },
  { key: 'bonuses', name: 'Bonuses' },
  { key: 'overtime', name: 'Overtime' },
];

export default function AddedMoney({ currentExtra, onAdd, onRemove }) {
  const [inputs, setInputs] = useState({ paycheck: '', sideCash: '', bonuses: '', overtime: '' });

  function submit(key) {
    if (inputs[key] === '') return;
    onAdd(key, inputs[key]);
    setInputs({ ...inputs, [key]: '' });
  }

  return (
    <div style={{ ...cardStyle, marginTop: 14 }}>
      <label style={labelStyle}>Added money this month</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {FIELDS.map((item) => {
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
                        onClick={() => onRemove(item.key, i)}
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
                    value={inputs[item.key]}
                    onChange={(e) => setInputs({ ...inputs, [item.key]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && submit(item.key)}
                    style={{ ...inputStyle, padding: '7px 10px 7px 22px', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  onClick={() => submit(item.key)}
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
