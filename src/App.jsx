import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import MonthSelector from './components/MonthSelector';
import SummaryCards from './components/SummaryCards';
import AddedMoney from './components/AddedMoney';
import FixedExpensesCard from './components/FixedExpensesCard';
import BudgetedExpensesCard from './components/BudgetedExpensesCard';
import SubscriptionsCard from './components/SubscriptionsCard';
import GoalsCard from './components/GoalsCard';
import TrendCharts from './components/TrendCharts';
import { useCategories } from './hooks/useCategories';
import { useMonthsData } from './hooks/useMonthsData';
import { useGoals } from './hooks/useGoals';
import { useSubscriptions } from './hooks/useSubscriptions';
import { useExtraOrder } from './hooks/useExtraOrder';

export default function FinanceTracker() {
  const { categories, addCategory, removeCategory, moveCategory, categoriesLoaded, categoriesSaveError } = useCategories();
  const monthsData = useMonthsData(categories);
  const { goals, addGoal, removeGoal, addDeposit, removeDeposit, moveGoal, goalsLoaded, goalsSaveError } = useGoals();
  const {
    subscriptions, addSubscription, removeSubscription, subscriptionsLoaded, subscriptionsSaveError,
  } = useSubscriptions();
  const { order: extraOrder, moveField: moveExtraField } = useExtraOrder();

  const fixedCategories = useMemo(() => categories.filter((c) => c.type === 'fixed'), [categories]);
  const variableCategories = useMemo(() => categories.filter((c) => c.type === 'variable'), [categories]);

  const loading = !categoriesLoaded || !monthsData.monthsLoaded || !goalsLoaded || !subscriptionsLoaded;
  const saveError = categoriesSaveError || monthsData.monthsSaveError || goalsSaveError || subscriptionsSaveError;

  // Tagging part of an income entry (e.g. one paycheck) as earmarked for a
  // goal needs both hooks: the label lives on the entry itself, the money
  // itself lands as a real deposit on the goal.
  function handleAllocate(field, entryId, goalId, amount) {
    const allocation = monthsData.addAllocation(field, entryId, goalId, amount);
    if (allocation) addDeposit(goalId, allocation.amount);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400, color: '#6b6f76', fontFamily: 'ui-sans-serif, system-ui' }}>
        Loading your data...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif", background: '#F7F6F3', minHeight: '100vh', color: '#1C1E21', padding: '24px 16px 60px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: '#14361F' }}>Monthly Ledger</h1>
          <p style={{ margin: '4px 0 0', color: '#6b6f76', fontSize: 14 }}>Track what comes in, what goes out, and watch the pattern.</p>
        </div>

        {saveError && (
          <div style={{ background: '#FEF3F0', border: '1px solid #F3C6B8', color: '#A23E1E', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertCircle size={16} />
            Data isn't saving right now — changes may not persist.
          </div>
        )}

        <MonthSelector
          activeMonth={monthsData.activeMonth}
          monthOptions={monthsData.monthOptions}
          onChange={monthsData.setActiveMonth}
          onStep={monthsData.goToMonth}
        />

        <SummaryCards totalIncome={monthsData.totalIncome} totalExpenses={monthsData.totalExpenses} leftover={monthsData.leftover} />

        <AddedMoney
          currentExtra={monthsData.currentExtra}
          order={extraOrder}
          goals={goals}
          totalAllocated={monthsData.totalAllocated}
          onMoveField={moveExtraField}
          onAdd={monthsData.addExtraEntry}
          onRemove={monthsData.removeExtraEntry}
          onAllocate={handleAllocate}
          onRemoveAllocation={monthsData.removeAllocation}
        />

        <FixedExpensesCard
          categories={fixedCategories}
          currentExpenses={monthsData.currentExpenses}
          onAddCategory={addCategory}
          onRemoveCategory={removeCategory}
          onMoveCategory={moveCategory}
          onUpdateFixed={monthsData.updateFixedField}
        />

        <BudgetedExpensesCard
          categories={variableCategories}
          currentExpenses={monthsData.currentExpenses}
          onAddCategory={addCategory}
          onRemoveCategory={removeCategory}
          onMoveCategory={moveCategory}
          onUpdateBudget={monthsData.updateVariableBudget}
          onAddSpend={monthsData.addVariableSpend}
          onRemoveSpend={monthsData.removeVariableSpend}
        />

        <SubscriptionsCard subscriptions={subscriptions} onAdd={addSubscription} onRemove={removeSubscription} />

        <GoalsCard goals={goals} onAdd={addGoal} onRemove={removeGoal} onMove={moveGoal} onDeposit={addDeposit} onRemoveDeposit={removeDeposit} />

        <TrendCharts chartData={monthsData.chartData} />
      </div>
    </div>
  );
}
