import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ReorderButtons({ canMoveUp, canMoveDown, onMoveUp, onMoveDown }) {
  const btnStyle = (enabled) => ({
    background: 'none', border: 'none', padding: 0, display: 'flex',
    cursor: enabled ? 'pointer' : 'default', color: enabled ? '#9A968C' : '#E8E5DE',
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <button onClick={onMoveUp} disabled={!canMoveUp} style={btnStyle(canMoveUp)} title="Move up">
        <ChevronUp size={16} />
      </button>
      <button onClick={onMoveDown} disabled={!canMoveDown} style={btnStyle(canMoveDown)} title="Move down">
        <ChevronDown size={16} />
      </button>
    </div>
  );
}
