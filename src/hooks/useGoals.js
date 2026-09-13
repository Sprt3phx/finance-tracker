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

  return { goals, addGoal, removeGoal, addDeposit, removeDeposit, goalsLoaded: loaded, goalsSaveError: saveError };
}
