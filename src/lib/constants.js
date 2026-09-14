export const DEFAULT_CATEGORIES = [
  { name: 'Rent/Mortgage', type: 'fixed' },
  { name: 'Utilities', type: 'fixed' },
  { name: 'Groceries', type: 'variable' },
  { name: 'Transportation', type: 'variable' },
  { name: 'Insurance', type: 'variable' },
  { name: 'Debt Payments', type: 'variable' },
  { name: 'Personal', type: 'variable' },
  { name: 'Other', type: 'variable' },
];

export const MONTHS_KEY = 'finance-months';
export const CATEGORIES_KEY = 'finance-categories';
export const GOALS_KEY = 'finance-goals';
export const SUBSCRIPTIONS_KEY = 'finance-subscriptions';
export const EXTRA_ORDER_KEY = 'finance-extra-order';

export const EXTRA_FIELD_NAMES = { paycheck: 'Paycheck', sideCash: 'Side cash', bonuses: 'Bonuses', overtime: 'Overtime' };
export const DEFAULT_EXTRA_ORDER = ['paycheck', 'sideCash', 'bonuses', 'overtime'];

export const CYCLE_LABEL = { weekly: '/wk', monthly: '/mo', yearly: '/yr' };
