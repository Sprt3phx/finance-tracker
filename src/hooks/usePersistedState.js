import { useState, useEffect } from 'react';

// Loads a JSON value from localStorage once on mount (running an optional
// one-time migration over it), and exposes a setter that both updates state
// and writes back to storage.
export function usePersistedState(key, initialValue, migrate) {
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        let parsed = JSON.parse(raw);
        if (migrate) {
          const migrated = migrate(parsed);
          if (migrated !== parsed) {
            window.localStorage.setItem(key, JSON.stringify(migrated));
            parsed = migrated;
          }
        }
        setValue(parsed);
      }
    } catch (e) {
      // no existing data yet, that's fine
    } finally {
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function persist(next) {
    setValue(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
      setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
  }

  return [value, persist, loaded, saveError];
}
