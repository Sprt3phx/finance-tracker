import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import { formatMoney } from '../lib/format';

export default function SummaryCards({ totalIncome, totalExpenses, leftover }) {
  const overBudget = leftover < 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
      <SummaryCard label="Income" value={formatMoney(totalIncome)} icon={<Wallet size={16} />} accent="#14361F" />
      <SummaryCard label="Expenses" value={formatMoney(totalExpenses)} icon={<TrendingDown size={16} />} accent="#A23E1E" />
      <SummaryCard
        label={overBudget ? 'Over by' : 'Leftover'}
        value={formatMoney(Math.abs(leftover))}
        icon={overBudget ? <AlertCircle size={16} /> : <TrendingUp size={16} />}
        accent={overBudget ? '#A23E1E' : '#14361F'}
        highlight
      />
    </div>
  );
}

function SummaryCard({ label, value, icon, accent, highlight }) {
  return (
    <div style={{ background: highlight ? '#14361F' : '#fff', border: highlight ? 'none' : '1px solid #E8E5DE', borderRadius: 14, padding: '14px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: highlight ? '#B8CDBB' : accent, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, color: highlight ? '#fff' : '#1C1E21', letterSpacing: '-0.01em' }}>
        {value}
      </div>
    </div>
  );
}
