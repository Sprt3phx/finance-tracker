import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { formatMoney } from '../lib/format';
import { cardStyle, labelStyle } from '../styles';

export default function TrendCharts({ chartData }) {
  return (
    <>
      {chartData.length > 0 && (
        <div style={{ ...cardStyle, marginTop: 14 }}>
          <label style={labelStyle}>Income vs. expenses over time</label>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E5DE" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b6f76' }} axisLine={{ stroke: '#DCD9D2' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b6f76' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ borderRadius: 10, border: '1px solid #DCD9D2', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Line type="monotone" dataKey="Income" stroke="#14361F" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Expenses" stroke="#A23E1E" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length > 1 && (
        <div style={{ ...cardStyle, marginTop: 14 }}>
          <label style={labelStyle}>Monthly leftover (saved vs. over)</label>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E5DE" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b6f76' }} axisLine={{ stroke: '#DCD9D2' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b6f76' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ borderRadius: 10, border: '1px solid #DCD9D2', fontSize: 13 }} />
              <Bar dataKey="Leftover" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.Leftover < 0 ? '#A23E1E' : '#14361F'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}
