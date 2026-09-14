import { usePersistedState } from './usePersistedState';
import { EXTRA_ORDER_KEY, DEFAULT_EXTRA_ORDER } from '../lib/constants';

export function useExtraOrder() {
  const [order, persist] = usePersistedState(EXTRA_ORDER_KEY, DEFAULT_EXTRA_ORDER);

  function moveField(key, direction) {
    const idx = order.indexOf(key);
    const swapIdx = idx + direction;
    if (idx === -1 || swapIdx < 0 || swapIdx >= order.length) return;
    const next = [...order];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    persist(next);
  }

  return { order, moveField };
}
