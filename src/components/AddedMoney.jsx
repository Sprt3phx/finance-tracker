import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { formatMoney, sumEntries } from '../lib/format';
import { cardStyle, labelStyle, inputStyle, dollarSignStyle } from '../styles';
import { EXTRA_FIELD_NAMES } from '../lib/constants';
import ReorderButtons from './ReorderButtons';

export default function AddedMoney({ currentExtra, order, onMoveField, onAdd, onRemove }) {
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
        {order.map((key, i) => {
          const entries = currentExtra[key];
          const subtotal = sumEntries(entries);
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
                        onClick={() => onRemove(key, i)}
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
