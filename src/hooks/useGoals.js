import { usePersistedState } from './usePersistedState';
import { GOALS_KEY } from '../lib/constants';

export function useGoals() {
  const [goals, persist, loaded, saveError] = usePersistedState(GOALS_KEY, []);

  function addGoal({ name, type, target }) {
    persist([...goals, { id: Date.now().toString(), name, type, target, deposits: [] }]);
  }

  function removeGoal(id) {
    persist(goals.filter((g) => g.id !== id));
  }

  function addDeposit(id, value) {
    const amount = parseFloat(value);
    if (isNaN(amount)) return;
    persist(goals.map((g) => (g.id === id ? { ...g, deposits: [...g.deposits, amount] } : g)));
  }

  function removeDeposit(id, index) {
    persist(goals.map((g) => (g.id === id ? { ...g, deposits: g.deposits.filter((_, i) => i !== index) } : g)));
  }

  function moveGoal(id, direction) {
    const idx = goals.findIndex((g) => g.id === id);
    const swapIdx = idx + direction;
    if (idx === -1 || swapIdx < 0 || swapIdx >= goals.length) return;
    const next = [...goals];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    persist(next);
  }

  return { goals, addGoal, removeGoal, addDeposit, removeDeposit, moveGoal, goalsLoaded: loaded, goalsSaveError: saveError };
}
