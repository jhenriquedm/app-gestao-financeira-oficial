import Dexie, { Table } from 'dexie';
import {
  Transaction,
  DebtInstallment,
  Category,
  Budget,
  SavingsGoal,
  User,
  UserRecord,
} from '../types';
import { getCurrentYearMonth } from '../utils/formatters';

export class FinanceLocalDatabase extends Dexie {
  users!: Table<UserRecord, string>;
  transactions!: Table<Transaction, string>;
  installments!: Table<DebtInstallment, string>;
  categories!: Table<Category, string>;
  budgets!: Table<Budget, string>;
  savingsGoals!: Table<SavingsGoal, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('GestaoFinanceiraDB_v2');

    this.version(1).stores({
      transactions: 'id, type, categoryId, date, status, isFixed, startMonthYear',
      installments: 'id, category, competence, status, dueDay',
      categories: 'id, name, type, target',
      budgets: 'id, categoryId',
      savingsGoals: 'id, title',
      settings: 'key',
    });

    this.version(2).stores({
      users: 'id, &email, createdAt',
      transactions: 'id, userId, [userId+date], type, categoryId, date, status, isFixed, startMonthYear, createdAt',
      installments: 'id, userId, [userId+competence], category, competence, status, dueDay, createdAt',
      categories: 'id, userId, name, type, target',
      budgets: 'id, userId, categoryId',
      savingsGoals: 'id, userId, title',
      settings: 'key',
    });

    this.version(3).stores({
      users: 'id, &email, createdAt',
      transactions: 'id, userId, [userId+date], type, categoryId, date, status, isFixed, startMonthYear, createdAt',
      installments: 'id, userId, [userId+competence], category, competence, status, dueDay, createdAt',
      categories: 'id, userId, name, type, target',
      budgets: 'id, userId, categoryId',
      savingsGoals: 'id, userId, title',
      settings: 'key',
    }).upgrade(async (trans) => {
      // Purge all legacy mock data
      await trans.table('transactions').clear();
      await trans.table('installments').clear();
      await trans.table('categories').clear();
      await trans.table('budgets').clear();
      await trans.table('savingsGoals').clear();
    });
  }
}

export const localDb = new FinanceLocalDatabase();

/**
 * Native cryptographic SHA-256 password hasher with salt
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_gfp_secure_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Authentication operations
 */
export const authOperations = {
  async register(
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      if (!cleanName || cleanName.length < 2) {
        return { success: false, error: 'O nome deve ter pelo menos 2 caracteres.' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return { success: false, error: 'Informe um endereço de e-mail válido.' };
      }

      if (!password || password.length < 6) {
        return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
      }

      // Check if user already exists
      const existingUser = await localDb.users.where('email').equalsIgnoreCase(cleanEmail).first();
      if (existingUser) {
        return { success: false, error: 'Este e-mail já está cadastrado no aplicativo.' };
      }

      const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const passwordHash = await hashPassword(password);
      const createdAt = Date.now();

      const userRecord: UserRecord = {
        id: newUserId,
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        createdAt,
      };

      // Create user record cleanly with no mock data
      await localDb.transaction('rw', [localDb.users, localDb.settings], async () => {
        await localDb.users.put(userRecord);
        await localDb.settings.put({ key: `user_${newUserId}_currentMonth`, value: getCurrentYearMonth() });
        await localDb.settings.put({ key: `user_${newUserId}_isDarkMode`, value: false });
        await localDb.settings.put({ key: `user_${newUserId}_isBalanceHidden`, value: false });
      });

      return {
        success: true,
        user: {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          createdAt: userRecord.createdAt,
        },
      };
    } catch (err: any) {
      console.error('Registration error:', err);
      return { success: false, error: err?.message || 'Erro ao realizar cadastro.' };
    }
  },

  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail || !password) {
        return { success: false, error: 'Preencha o e-mail e a senha.' };
      }

      const userRecord = await localDb.users.where('email').equalsIgnoreCase(cleanEmail).first();
      if (!userRecord) {
        return { success: false, error: 'Credenciais inválidas, tente novamente!' };
      }

      const inputHash = await hashPassword(password);
      if (inputHash !== userRecord.passwordHash) {
        return { success: false, error: 'Credenciais inválidas, tente novamente!' };
      }

      // Save active session
      await localDb.settings.put({ key: 'active_session_user_id', value: userRecord.id });

      return {
        success: true,
        user: {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          createdAt: userRecord.createdAt,
        },
      };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: 'Erro ao autenticar usuário.' };
    }
  },

  async getActiveSessionUser(): Promise<User | null> {
    try {
      const sessionRecord = await localDb.settings.get('active_session_user_id');
      if (!sessionRecord?.value) return null;

      const userRecord = await localDb.users.get(sessionRecord.value);
      if (!userRecord) return null;

      return {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        createdAt: userRecord.createdAt,
      };
    } catch (e) {
      console.error('Session retrieval error:', e);
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await localDb.settings.delete('active_session_user_id');
    } catch (e) {
      console.error('Logout error:', e);
    }
  },
};

/**
 * Loads isolated data for the specified user
 */
export async function loadUserData(userId: string): Promise<{
  transactions: Transaction[];
  installments: DebtInstallment[];
  categories: Category[];
  parcelCategories: string[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  settings: Record<string, any>;
}> {
  try {
    const [allTx, allInst, allCat, allBudgets, allGoals, allSettings] = await Promise.all([
      localDb.transactions.where('userId').equals(userId).toArray().catch(() => localDb.transactions.toArray()),
      localDb.installments.where('userId').equals(userId).toArray().catch(() => localDb.installments.toArray()),
      localDb.categories.where('userId').equals(userId).toArray().catch(() => localDb.categories.toArray()),
      localDb.budgets.where('userId').equals(userId).toArray().catch(() => localDb.budgets.toArray()),
      localDb.savingsGoals.where('userId').equals(userId).toArray().catch(() => localDb.savingsGoals.toArray()),
      localDb.settings.toArray(),
    ]);

    // Strictly filter by current userId
    const userTx = allTx.filter((t) => t.userId === userId);
    const userInst = allInst.filter((i) => i.userId === userId);
    const userCat = allCat.filter((c) => c.userId === userId);
    const userBudgets = allBudgets.filter((b) => b.userId === userId);
    const userGoals = allGoals.filter((g) => g.userId === userId);

    const settings: Record<string, any> = {};
    const prefix = `user_${userId}_`;
    allSettings.forEach((item) => {
      if (item.key.startsWith(prefix)) {
        const shortKey = item.key.replace(prefix, '');
        settings[shortKey] = item.value;
      }
    });

    return {
      transactions: userTx.sort((a, b) => b.createdAt - a.createdAt),
      installments: userInst.sort((a, b) => b.createdAt - a.createdAt),
      categories: userCat,
      parcelCategories: (settings.parcelCategories as string[]) || [],
      budgets: userBudgets,
      savingsGoals: userGoals,
      settings,
    };
  } catch (error) {
    console.error('Error loading user data:', error);
    return {
      transactions: [],
      installments: [],
      categories: [],
      parcelCategories: [],
      budgets: [],
      savingsGoals: [],
      settings: {},
    };
  }
}

// Database helper operations with user isolation
export const dbOperations = {
  // Parcel Categories
  async saveParcelCategories(parcelCategories: string[], userId: string): Promise<void> {
    await localDb.settings.put({ key: `user_${userId}_parcelCategories`, value: parcelCategories });
  },

  // Transactions
  async saveTransaction(transaction: Transaction, userId: string): Promise<void> {
    await localDb.transactions.put({ ...transaction, userId });
  },
  async saveTransactions(transactions: Transaction[], userId: string): Promise<void> {
    const tagged = transactions.map((t) => ({ ...t, userId }));
    await localDb.transactions.bulkPut(tagged);
  },
  async deleteTransaction(id: string): Promise<void> {
    await localDb.transactions.delete(id);
  },

  // Installments
  async saveInstallment(installment: DebtInstallment, userId: string): Promise<void> {
    await localDb.installments.put({ ...installment, userId });
  },
  async saveInstallments(installments: DebtInstallment[], userId: string): Promise<void> {
    const tagged = installments.map((i) => ({ ...i, userId }));
    await localDb.installments.bulkPut(tagged);
  },
  async deleteInstallment(id: string): Promise<void> {
    await localDb.installments.delete(id);
  },

  // Categories
  async saveCategory(category: Category, userId: string): Promise<void> {
    await localDb.categories.put({ ...category, userId });
  },
  async saveCategories(categories: Category[], userId: string): Promise<void> {
    const tagged = categories.map((c) => ({ ...c, userId }));
    await localDb.categories.bulkPut(tagged);
  },
  async deleteCategory(id: string): Promise<void> {
    await localDb.categories.delete(id);
  },

  // Budgets
  async saveBudget(budget: Budget, userId: string): Promise<void> {
    await localDb.budgets.put({ ...budget, userId });
  },
  async saveBudgets(budgets: Budget[], userId: string): Promise<void> {
    const tagged = budgets.map((b) => ({ ...b, userId }));
    await localDb.budgets.bulkPut(tagged);
  },
  async deleteBudget(id: string): Promise<void> {
    await localDb.budgets.delete(id);
  },

  // Savings Goals
  async saveGoal(goal: SavingsGoal, userId: string): Promise<void> {
    await localDb.savingsGoals.put({ ...goal, userId });
  },
  async saveGoals(goals: SavingsGoal[], userId: string): Promise<void> {
    const tagged = goals.map((g) => ({ ...g, userId }));
    await localDb.savingsGoals.bulkPut(tagged);
  },
  async deleteGoal(id: string): Promise<void> {
    await localDb.savingsGoals.delete(id);
  },

  // Settings
  async setUserSetting(userId: string, key: string, value: any): Promise<void> {
    await localDb.settings.put({ key: `user_${userId}_${key}`, value });
  },
  async getUserSetting(userId: string, key: string): Promise<any> {
    const record = await localDb.settings.get(`user_${userId}_${key}`);
    return record?.value;
  },
};
