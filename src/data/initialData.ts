import { Category, Transaction, Budget, SavingsGoal, DebtInstallment } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [];

export const PARCELAS_CATEGORIES: string[] = [];

export const getInitialData = () => {
  const initialTransactions: Transaction[] = [];
  const initialInstallments: DebtInstallment[] = [];
  const initialBudgets: Budget[] = [];
  const initialGoals: SavingsGoal[] = [];

  return {
    initialTransactions,
    initialInstallments,
    initialBudgets,
    initialGoals,
  };
};
