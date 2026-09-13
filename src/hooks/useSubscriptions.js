import { usePersistedState } from './usePersistedState';
import { SUBSCRIPTIONS_KEY } from '../lib/constants';
import { migrateSubscriptions } from '../lib/subscriptions';

export function useSubscriptions() {
  const [subscriptions, persist, loaded, saveError] = usePersistedState(SUBSCRIPTIONS_KEY, [], migrateSubscriptions);

  function addSubscription(sub) {
    persist([...subscriptions, { id: Date.now().toString(), ...sub }]);
  }

  function removeSubscription(id) {
    persist(subscriptions.filter((s) => s.id !== id));
  }

  return {
    subscriptions,
    addSubscription,
    removeSubscription,
    subscriptionsLoaded: loaded,
    subscriptionsSaveError: saveError,
  };
}
