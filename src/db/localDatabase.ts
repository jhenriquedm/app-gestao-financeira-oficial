import Dexie, { Table } from 'dexie';
import { Transaction, DebtInstallment, Category, Budget, SavingsGoal } from '../types';
import { DEFAULT_CATEGORIES, getInitialData } from '../data/initialData';

export interface AppSettingRecord {
  key: string;
  value: any;
}

export class FinanceLocalDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  installments!: Table<DebtInstallment, string>;
  categories!: Table<Category, string>;
  budgets!: Table<Budget, string>;
  savingsGoals!: Table<SavingsGoal, string>;
  settings!: Table<AppSettingRecord, string>;

  constructor() {
    super('GestaoFinanceiraDB');
    
    this.version(1).stores({
      transactions: 'id, type, categoryId, date, status, isFixed, startMonthYear, createdAt',
      installments: 'id, category, competence, status, dueDay, createdAt',
      categories: 'id, name, type, target',
      budgets: 'id, categoryId',
      savingsGoals: 'id, title',
      settings: 'key',
    });
  }
}

export const localDb = new FinanceLocalDatabase();

/**
 * Initializes the database by migrating existing localStorage data if present,
 * or seeding with the initial database records.
 */
export async function initLocalDatabase(): Promise<{
  transactions: Transaction[];
  installments: DebtInstallment[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  settings: Record<string, any>;
}> {
  try {
    const txCount = await localDb.transactions.count();
    
    // Check if there is data in localStorage to migrate seamlessly
    const localTxRaw = localStorage.getItem('gfp_transactions');
    const localInstRaw = localStorage.getItem('gfp_installments');
    const localCatRaw = localStorage.getItem('gfp_categories');
    const localBudgetsRaw = localStorage.getItem('gfp_budgets');
    const localGoalsRaw = localStorage.getItem('gfp_savings_goals');
    const localDarkMode = localStorage.getItem('gfp_theme_dark');
    const localHiddenBalance = localStorage.getItem('gfp_hide_balance');
    const localCurrentMonth = localStorage.getItem('gfp_current_month');

    if (txCount === 0) {
      if (localTxRaw) {
        try {
          const parsedTx = JSON.parse(localTxRaw);
          const parsedInst = localInstRaw ? JSON.parse(localInstRaw) : [];
          const parsedCat = localCatRaw ? JSON.parse(localCatRaw) : DEFAULT_CATEGORIES;
          const parsedBudgets = localBudgetsRaw ? JSON.parse(localBudgetsRaw) : [];
          const parsedGoals = localGoalsRaw ? JSON.parse(localGoalsRaw) : [];

          await localDb.transaction('rw', [localDb.transactions, localDb.installments, localDb.categories, localDb.budgets, localDb.savingsGoals, localDb.settings], async () => {
            if (Array.isArray(parsedTx) && parsedTx.length > 0) await localDb.transactions.bulkPut(parsedTx);
            if (Array.isArray(parsedInst) && parsedInst.length > 0) await localDb.installments.bulkPut(parsedInst);
            if (Array.isArray(parsedCat) && parsedCat.length > 0) await localDb.categories.bulkPut(parsedCat);
            if (Array.isArray(parsedBudgets) && parsedBudgets.length > 0) await localDb.budgets.bulkPut(parsedBudgets);
            if (Array.isArray(parsedGoals) && parsedGoals.length > 0) await localDb.savingsGoals.bulkPut(parsedGoals);
            
            if (localDarkMode !== null) await localDb.settings.put({ key: 'isDarkMode', value: localDarkMode === 'true' });
            if (localHiddenBalance !== null) await localDb.settings.put({ key: 'isBalanceHidden', value: localHiddenBalance === 'true' });
            if (localCurrentMonth) await localDb.settings.put({ key: 'currentYearMonth', value: localCurrentMonth });
          });
        } catch (e) {
          console.error('Error during localStorage migration to Dexie:', e);
          await seedInitialData();
        }
      } else {
        await seedInitialData();
      }
    }

    // Load all data from local database
    const [transactions, installments, categories, budgets, savingsGoals, settingsList] = await Promise.all([
      localDb.transactions.toArray(),
      localDb.installments.toArray(),
      localDb.categories.toArray(),
      localDb.budgets.toArray(),
      localDb.savingsGoals.toArray(),
      localDb.settings.toArray(),
    ]);

    const settings: Record<string, any> = {};
    settingsList.forEach(item => {
      settings[item.key] = item.value;
    });

    return {
      transactions: transactions.sort((a, b) => b.createdAt - a.createdAt),
      installments: installments.sort((a, b) => b.createdAt - a.createdAt),
      categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES,
      budgets,
      savingsGoals,
      settings,
    };
  } catch (error) {
    console.error('Database initialization error:', error);
    const initial = getInitialData();
    return {
      transactions: initial.initialTransactions,
      installments: initial.initialInstallments,
      categories: DEFAULT_CATEGORIES,
      budgets: initial.initialBudgets,
      savingsGoals: initial.initialGoals,
      settings: {},
    };
  }
}

async function seedInitialData() {
  const initial = getInitialData();
  await localDb.transaction('rw', [localDb.transactions, localDb.installments, localDb.categories, localDb.budgets, localDb.savingsGoals, localDb.settings], async () => {
    await localDb.transactions.bulkPut(initial.initialTransactions);
    await localDb.installments.bulkPut(initial.initialInstallments);
    await localDb.categories.bulkPut(DEFAULT_CATEGORIES);
    await localDb.budgets.bulkPut(initial.initialBudgets);
    await localDb.savingsGoals.bulkPut(initial.initialGoals);
    await localDb.settings.put({ key: 'currentYearMonth', value: '2026-10' });
    await localDb.settings.put({ key: 'isDarkMode', value: false });
    await localDb.settings.put({ key: 'isBalanceHidden', value: false });
  });
}

// Database helper operations
export const dbOperations = {
  // Transactions
  async saveTransaction(transaction: Transaction): Promise<void> {
    await localDb.transactions.put(transaction);
  },
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    await localDb.transactions.bulkPut(transactions);
  },
  async deleteTransaction(id: string): Promise<void> {
    await localDb.transactions.delete(id);
  },

  // Installments
  async saveInstallment(installment: DebtInstallment): Promise<void> {
    await localDb.installments.put(installment);
  },
  async saveInstallments(installments: DebtInstallment[]): Promise<void> {
    await localDb.installments.bulkPut(installments);
  },
  async deleteInstallment(id: string): Promise<void> {
    await localDb.installments.delete(id);
  },

  // Categories
  async saveCategory(category: Category): Promise<void> {
    await localDb.categories.put(category);
  },
  async saveCategories(categories: Category[]): Promise<void> {
    await localDb.categories.bulkPut(categories);
  },
  async deleteCategory(id: string): Promise<void> {
    await localDb.categories.delete(id);
  },

  // Budgets
  async saveBudget(budget: Budget): Promise<void> {
    await localDb.budgets.put(budget);
  },
  async saveBudgets(budgets: Budget[]): Promise<void> {
    await localDb.budgets.bulkPut(budgets);
  },
  async deleteBudget(id: string): Promise<void> {
    await localDb.budgets.delete(id);
  },

  // Savings Goals
  async saveGoal(goal: SavingsGoal): Promise<void> {
    await localDb.savingsGoals.put(goal);
  },
  async saveGoals(goals: SavingsGoal[]): Promise<void> {
    await localDb.savingsGoals.bulkPut(goals);
  },
  async deleteGoal(id: string): Promise<void> {
    await localDb.savingsGoals.delete(id);
  },

  // Settings
  async setSetting(key: string, value: any): Promise<void> {
    await localDb.settings.put({ key, value });
  },
  async getSetting(key: string): Promise<any> {
    const record = await localDb.settings.get(key);
    return record?.value;
  },

  // Reset / Clear Database
  async resetAllData(): Promise<void> {
    await localDb.transaction('rw', [localDb.transactions, localDb.installments, localDb.categories, localDb.budgets, localDb.savingsGoals, localDb.settings], async () => {
      await localDb.transactions.clear();
      await localDb.installments.clear();
      await localDb.categories.clear();
      await localDb.budgets.clear();
      await localDb.savingsGoals.clear();
      await localDb.settings.clear();
    });
    await seedInitialData();
  }
};
