export function addCycle(dateStr, cycle) {
  const d = new Date(dateStr + 'T00:00:00');
  if (cycle === 'weekly') d.setDate(d.getDate() + 7);
  else if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

// Self-healing renewal date: if a subscription's due date has already passed
// (e.g. a yearly one from last year), roll it forward to the next real
// occurrence so it keeps warning ahead of each renewal, not just once.
export function rollForwardDueDate(dateStr, cycle) {
  const todayStr = new Date().toISOString().slice(0, 10);
  let next = dateStr;
  let guard = 0;
  while (next < todayStr && guard < 1000) {
    next = addCycle(next, cycle);
    guard += 1;
  }
  return next;
}

export function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

export function monthlyEquivalent(sub) {
  if (sub.cycle === 'yearly') return sub.cost / 12;
  if (sub.cycle === 'weekly') return (sub.cost * 52) / 12;
  return sub.cost;
}

export function migrateSubscriptions(parsed) {
  if (!Array.isArray(parsed)) return parsed;
  const corrected = parsed.map((s) => ({ ...s, nextDueDate: rollForwardDueDate(s.nextDueDate, s.cycle) }));
  const changed = corrected.some((s, i) => s.nextDueDate !== parsed[i].nextDueDate);
  return changed ? corrected : parsed;
}
