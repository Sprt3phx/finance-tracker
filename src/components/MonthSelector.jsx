import { MONTH_NAMES } from '../lib/format';
import { navBtnStyle } from '../styles';

export default function MonthSelector({ activeMonth, monthOptions, onChange, onStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <button onClick={() => onStep(-1)} style={navBtnStyle}>←</button>
      <select
        value={activeMonth}
        onChange={(e) => onChange(e.target.value)}
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
      <button onClick={() => onStep(1)} style={navBtnStyle}>→</button>
    </div>
  );
}
