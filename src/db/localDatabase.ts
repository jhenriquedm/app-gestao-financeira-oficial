import Dexie, { Table } from 'dexie';
import { Transaction, DebtInstallment, Category, Budget, SavingsGoal, User } from '../types';
import { DEFAULT_CATEGORIES, getInitialData } from '../data/initialData';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: number;
}

export interface AppSettingRecord {
  key: string;
  value: any;
}

export class FinanceLocalDatabase extends Dexie {
  users!: Table<UserRecord, string>;
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

    this.version(2).stores({
      users: 'id, &email, createdAt',
      transactions: 'id, userId, [userId+date], type, categoryId, date, status, isFixed, startMonthYear, createdAt',
      installments: 'id, userId, [userId+competence], category, competence, status, dueDay, createdAt',
      categories: 'id, userId, name, type, target',
      budgets: 'id, userId, categoryId',
      savingsGoals: 'id, userId, title',
      settings: 'key',
    }).upgrade(async (trans) => {
      // Create a default admin/initial user for existing data if any exists
      const initialUserId = 'default_user_1';
      const existingTx = await trans.table('transactions').toCollection().toArray();
      if (existingTx.length > 0) {
        const hash = await hashPassword('123456');
        await trans.table('users').put({
          id: initialUserId,
          name: 'Usuário Padrão',
          email: 'usuario@gestaofinanceira.com',
          passwordHash: hash,
          createdAt: Date.now(),
        });

        // Tag previous untagged data with this initial user
        await trans.table('transactions').toCollection().modify((t: Transaction) => {
          if (!t.userId) t.userId = initialUserId;
        });
        await trans.table('installments').toCollection().modify((i: DebtInstallment) => {
          if (!i.userId) i.userId = initialUserId;
        });
        await trans.table('categories').toCollection().modify((c: Category) => {
          if (!c.userId) c.userId = initialUserId;
        });
        await trans.table('budgets').toCollection().modify((b: Budget) => {
          if (!b.userId) b.userId = initialUserId;
        });
        await trans.table('savingsGoals').toCollection().modify((g: SavingsGoal) => {
          if (!g.userId) g.userId = initialUserId;
        });
      }
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

      // Create user and initialize their isolated default categories & starter state
      await localDb.transaction('rw', [localDb.users, localDb.categories, localDb.transactions, localDb.installments, localDb.budgets, localDb.savingsGoals, localDb.settings], async () => {
        await localDb.users.put(userRecord);

        // Seed user-isolated default categories
        const userCategories: Category[] = DEFAULT_CATEGORIES.map((cat) => ({
          ...cat,
          id: `${cat.id}_${newUserId}`,
          userId: newUserId,
        }));
        await localDb.categories.bulkPut(userCategories);

        // Initialize user defaults
        const initial = getInitialData();
        const userTransactions = initial.initialTransactions.map(t => ({
          ...t,
          id: `${t.id}_${newUserId}`,
          userId: newUserId,
        }));
        const userInstallments = initial.initialInstallments.map(i => ({
          ...i,
          id: `${i.id}_${newUserId}`,
          userId: newUserId,
        }));
        const userBudgets = initial.initialBudgets.map(b => ({
          ...b,
          id: `${b.id}_${newUserId}`,
          userId: newUserId,
        }));
        const userGoals = initial.initialGoals.map(g => ({
          ...g,
          id: `${g.id}_${newUserId}`,
          userId: newUserId,
        }));

        await localDb.transactions.bulkPut(userTransactions);
        await localDb.installments.bulkPut(userInstallments);
        await localDb.budgets.bulkPut(userBudgets);
        await localDb.savingsGoals.bulkPut(userGoals);

        // Save active session
        await localDb.settings.put({ key: 'active_session_user_id', value: newUserId });
        await localDb.settings.put({ key: `user_${newUserId}_currentMonth`, value: '2026-10' });
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
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  settings: Record<string, any>;
}> {
  try {
    const [allTx, allInst, allCat, allBudgets, allGoals, allSettings] = await Promise.all([
      localDb.transactions.toArray(),
      localDb.installments.toArray(),
      localDb.categories.toArray(),
      localDb.budgets.toArray(),
      localDb.savingsGoals.toArray(),
      localDb.settings.toArray(),
    ]);

    // Strictly filter by current userId or fallback for legacy untagged records
    const userTx = allTx.filter((t) => t.userId === userId || (!t.userId && userId === 'default_user_1'));
    const userInst = allInst.filter((i) => i.userId === userId || (!i.userId && userId === 'default_user_1'));
    const userCat = allCat.filter((c) => c.userId === userId || (!c.userId && userId === 'default_user_1'));
    const userBudgets = allBudgets.filter((b) => b.userId === userId || (!b.userId && userId === 'default_user_1'));
    const userGoals = allGoals.filter((g) => g.userId === userId || (!g.userId && userId === 'default_user_1'));

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
      categories: userCat.length > 0 ? userCat : DEFAULT_CATEGORIES.map(c => ({ ...c, userId })),
      budgets: userBudgets,
      savingsGoals: userGoals,
      settings,
    };
  } catch (error) {
    console.error('Error loading user data:', error);
    return {
      transactions: [],
      installments: [],
      categories: DEFAULT_CATEGORIES.map(c => ({ ...c, userId })),
      budgets: [],
      savingsGoals: [],
      settings: {},
    };
  }
}

// Database helper operations with user isolation
export const dbOperations = {
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
