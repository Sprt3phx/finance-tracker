import { usePersistedState } from './usePersistedState';
import { CATEGORIES_KEY, DEFAULT_CATEGORIES } from '../lib/constants';
import { migrateCategories } from '../lib/expenses';

export function useCategories() {
  const [categories, persist, loaded, saveError] = usePersistedState(
    CATEGORIES_KEY,
    DEFAULT_CATEGORIES,
    migrateCategories
  );

  function addCategory(name, type) {
    const trimmed = name.trim();
    if (!trimmed || categories.some((c) => c.name === trimmed)) return;
    persist([...categories, { name: trimmed, type }]);
  }

  function removeCategory(name) {
    persist(categories.filter((c) => c.name !== name));
  }

  return { categories, addCategory, removeCategory, categoriesLoaded: loaded, categoriesSaveError: saveError };
}
