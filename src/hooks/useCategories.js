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

  // Moves a category up/down relative to its same-type neighbors only, so
  // reordering within the Fixed card never disturbs Variable ordering (and
  // vice versa) even though both live in one underlying array.
  function moveCategory(name, direction) {
    const idx = categories.findIndex((c) => c.name === name);
    if (idx === -1) return;
    const type = categories[idx].type;
    let swapIdx = idx + direction;
    while (swapIdx >= 0 && swapIdx < categories.length && categories[swapIdx].type !== type) {
      swapIdx += direction;
    }
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const next = [...categories];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    persist(next);
  }

  return { categories, addCategory, removeCategory, moveCategory, categoriesLoaded: loaded, categoriesSaveError: saveError };
}
