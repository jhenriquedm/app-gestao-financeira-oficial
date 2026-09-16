import Dexie, { Table } from 'dexie';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../services/firebase';
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
import { unmaskCpf, validateCpf } from '../utils/cpfValidator';
import { FirestoreSyncService } from '../services/firestoreSyncService';

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

    this.version(4).stores({
      users: 'id, &email, cpf, createdAt',
      transactions: 'id, userId, [userId+date], type, categoryId, date, status, isFixed, startMonthYear, createdAt',
      installments: 'id, userId, [userId+competence], category, competence, status, dueDay, createdAt',
      categories: 'id, userId, name, type, target',
      budgets: 'id, userId, categoryId',
      savingsGoals: 'id, userId, title',
      settings: 'key',
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
    password: string,
    cpf: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();
      const cleanCpf = unmaskCpf(cpf);

      if (!cleanName || cleanName.length < 2) {
        return { success: false, error: 'O nome deve ter pelo menos 2 caracteres.' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return { success: false, error: 'Informe um endereço de e-mail válido.' };
      }

      if (!cleanCpf || cleanCpf.length !== 11) {
        return { success: false, error: 'O CPF é obrigatório e deve conter 11 dígitos.' };
      }

      if (!validateCpf(cleanCpf)) {
        return { success: false, error: 'O CPF informado não é válido. Verifique os dígitos digitados.' };
      }

      if (!password || password.length < 6) {
        return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
      }

      // Check if user with this email already exists
      const existingUser = await localDb.users.where('email').equalsIgnoreCase(cleanEmail).first();
      if (existingUser) {
        return { success: false, error: 'Este e-mail já está cadastrado no aplicativo.' };
      }

      // Check if user with this CPF already exists
      const existingCpf = await localDb.users.where('cpf').equals(cleanCpf).first();
      if (existingCpf) {
        return { success: false, error: 'Este CPF já está cadastrado no aplicativo.' };
      }

      const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const passwordHash = await hashPassword(password);
      const createdAt = Date.now();

      const userRecord: UserRecord = {
        id: newUserId,
        name: cleanName,
        email: cleanEmail,
        cpf: cleanCpf,
        passwordHash,
        createdAt,
      };

      // Create user record cleanly with isolated settings
      await localDb.transaction('rw', [localDb.users, localDb.settings], async () => {
        await localDb.users.put(userRecord);
        await localDb.settings.put({ key: `user_${newUserId}_currentMonth`, value: getCurrentYearMonth() });
        await localDb.settings.put({ key: `user_${newUserId}_isDarkMode`, value: false });
        await localDb.settings.put({ key: `user_${newUserId}_isBalanceHidden`, value: false });
      });

      // Persist user account to cloud
      FirestoreSyncService.saveUserAccount(userRecord).catch(console.warn);

      return {
        success: true,
        user: {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          cpf: userRecord.cpf,
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

      let userRecord = await localDb.users.where('email').equalsIgnoreCase(cleanEmail).first();
      // If not found locally, seamlessly check cloud
      if (!userRecord) {
        const cloudUser = await FirestoreSyncService.findUserInCloud({ email: cleanEmail });
        if (cloudUser) {
          await localDb.users.put(cloudUser);
          userRecord = cloudUser;
        }
      }

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
          cpf: userRecord.cpf,
          photoUrl: userRecord.photoUrl,
          authProvider: userRecord.authProvider || 'password',
          createdAt: userRecord.createdAt,
        },
      };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: 'Erro ao autenticar usuário.' };
    }
  },

  /**
   * Autenticação com a Conta Google (Popup seguro).
   * - Se o e-mail da conta Google já estiver cadastrado (local ou nuvem), reconhece e conecta
   *   mantendo intactos todos os dados, transações, categorias e comprovantes existentes do usuário!
   * - Se for um usuário novo, realiza o cadastro completo de forma transparente.
   */
  async loginWithGoogle(): Promise<{ success: boolean; user?: User; isNewUser?: boolean; error?: string }> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const authResult = await signInWithPopup(auth, provider);
      const fbUser = authResult.user;

      if (!fbUser || !fbUser.email) {
        return { success: false, error: 'Não foi possível obter o e-mail da sua conta Google.' };
      }

      const cleanEmail = fbUser.email.trim().toLowerCase();
      const cleanName = fbUser.displayName?.trim() || cleanEmail.split('@')[0] || 'Usuário Google';
      const photoUrl = fbUser.photoURL || undefined;

      // 1. Procurar usuário local existente por e-mail (reconhecimento de contas existentes)
      let userRecord = await localDb.users.where('email').equalsIgnoreCase(cleanEmail).first();

      // 2. Se não estiver no IndexedDB deste dispositivo, pesquisa na nuvem Firestore
      if (!userRecord) {
        const cloudUser = await FirestoreSyncService.findUserInCloud({ email: cleanEmail });
        if (cloudUser) {
          userRecord = cloudUser;
          await localDb.users.put(userRecord);
        }
      }

      // 3. Caso o usuário JÁ EXISTA:
      // Mantemos estritamente o id existente para preservar 100% de todas as transações,
      // parcelas, categorias, comprovantes e metas vinculadas a ele!
      if (userRecord) {
        let hasUpdates = false;
        if (photoUrl && !userRecord.photoUrl) {
          userRecord.photoUrl = photoUrl;
          hasUpdates = true;
        }
        if (!userRecord.authProvider) {
          userRecord.authProvider = 'google';
          hasUpdates = true;
        }

        if (hasUpdates) {
          await localDb.users.put(userRecord);
          FirestoreSyncService.saveUserAccount(userRecord).catch(console.warn);
        }

        // Salva a sessão ativa para este usuário
        await localDb.settings.put({ key: 'active_session_user_id', value: userRecord.id });

        return {
          success: true,
          user: {
            id: userRecord.id,
            name: userRecord.name,
            email: userRecord.email,
            cpf: userRecord.cpf,
            photoUrl: userRecord.photoUrl,
            authProvider: userRecord.authProvider || 'google',
            createdAt: userRecord.createdAt,
          },
          isNewUser: false,
        };
      }

      // 4. Caso seja um NOVO CADASTRO via Google:
      // Cria a conta com o ID seguro do Firebase
      const newUserId = fbUser.uid || ('user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
      const newUserRecord: UserRecord = {
        id: newUserId,
        name: cleanName,
        email: cleanEmail,
        cpf: '',
        passwordHash: '',
        photoUrl,
        authProvider: 'google',
        createdAt: Date.now(),
      };

      await localDb.transaction('rw', [localDb.users, localDb.settings], async () => {
        await localDb.users.put(newUserRecord);
        await localDb.settings.put({ key: `user_${newUserId}_currentMonth`, value: getCurrentYearMonth() });
        await localDb.settings.put({ key: `user_${newUserId}_isDarkMode`, value: false });
        await localDb.settings.put({ key: `user_${newUserId}_isBalanceHidden`, value: false });
        await localDb.settings.put({ key: 'active_session_user_id', value: newUserId });
      });

      // Salva imediatamente no Firestore
      FirestoreSyncService.saveUserAccount(newUserRecord).catch(console.warn);

      return {
        success: true,
        user: {
          id: newUserRecord.id,
          name: newUserRecord.name,
          email: newUserRecord.email,
          cpf: '',
          photoUrl: newUserRecord.photoUrl,
          authProvider: 'google',
          createdAt: newUserRecord.createdAt,
        },
        isNewUser: true,
      };
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'A janela de autenticação do Google foi fechada antes da conclusão.' };
      }
      if (err?.code === 'auth/popup-blocked') {
        return { success: false, error: 'O navegador bloqueou a janela pop-up do Google. Por favor, autorize pop-ups para continuar.' };
      }
      if (err?.code === 'auth/cancelled-popup-request') {
        return { success: false, error: 'Solicitação cancelada.' };
      }
      if (err?.code === 'auth/network-request-failed') {
        return { success: false, error: 'Falha de conexão com os servidores do Google. Verifique sua conexão e tente novamente.' };
      }
      if (err?.code === 'auth/unauthorized-domain') {
        return { success: false, error: 'Domínio da aplicação não autorizado no Firebase Authentication.' };
      }
      return { success: false, error: err?.message || 'Falha ao autenticar com a Conta Google.' };
    }
  },

  async verifyCpfForRecovery(cpf: string): Promise<{ exists: boolean; userName?: string; error?: string }> {
    try {
      const cleanCpf = unmaskCpf(cpf);
      if (!cleanCpf || cleanCpf.length !== 11) {
        return { exists: false, error: 'Digite os 11 dígitos do CPF.' };
      }
      if (!validateCpf(cleanCpf)) {
        return { exists: false, error: 'CPF com formato ou dígitos verificadores inválidos.' };
      }
      let user = await localDb.users.where('cpf').equals(cleanCpf).first();
      // Seamless cloud check without alerting user
      if (!user) {
        const cloudUser = await FirestoreSyncService.findUserInCloud({ cpf: cleanCpf });
        if (cloudUser) {
          await localDb.users.put(cloudUser);
          user = cloudUser;
        }
      }

      if (!user) {
        return { exists: false, error: 'CPF não encontrado no sistema.' };
      }
      return { exists: true, userName: user.name };
    } catch (err: any) {
      console.error('CPF verification error:', err);
      return { exists: false, error: 'Erro ao consultar banco de dados.' };
    }
  },

  async resetPasswordWithCpf(cpf: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanCpf = unmaskCpf(cpf);
      if (!cleanCpf || !validateCpf(cleanCpf)) {
        return { success: false, error: 'CPF inválido.' };
      }
      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
      }
      if (newPassword.length > 32) {
        return { success: false, error: 'A nova senha deve ter no máximo 32 caracteres.' };
      }

      let user = await localDb.users.where('cpf').equals(cleanCpf).first();
      if (!user) {
        const cloudUser = await FirestoreSyncService.findUserInCloud({ cpf: cleanCpf });
        if (cloudUser) {
          user = cloudUser;
        }
      }

      if (!user) {
        return { success: false, error: 'CPF não encontrado no banco de dados.' };
      }

      const passwordHash = await hashPassword(newPassword);
      user.passwordHash = passwordHash;
      await localDb.users.put(user);

      // Seamlessly update cloud
      FirestoreSyncService.updateUserPasswordInCloud(user.id, passwordHash).catch(console.warn);

      return { success: true };
    } catch (err: any) {
      console.error('Password reset error:', err);
      return { success: false, error: err?.message || 'Erro ao redefinir a senha.' };
    }
  },

  async updateProfile(
    userId: string,
    profileData: {
      name: string;
      email: string;
      cpf: string;
      photoUrl?: string | null;
      newPassword?: string;
    }
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const user = await localDb.users.get(userId);
      if (!user) {
        return { success: false, error: 'Usuário não encontrado.' };
      }

      const cleanName = profileData.name.trim();
      const cleanEmail = profileData.email.trim().toLowerCase();
      const cleanCpf = unmaskCpf(profileData.cpf);

      if (!cleanName || cleanName.length < 2) {
        return { success: false, error: 'O nome deve conter pelo menos 2 caracteres.' };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return { success: false, error: 'Informe um e-mail válido.' };
      }
      if (cleanCpf && (cleanCpf.length !== 11 || !validateCpf(cleanCpf))) {
        return { success: false, error: 'Informe um CPF válido com 11 dígitos.' };
      }

      // Check if email is used by another user
      const otherEmail = await localDb.users.where('email').equalsIgnoreCase(cleanEmail).first();
      if (otherEmail && otherEmail.id !== userId) {
        return { success: false, error: 'Este e-mail já pertence a outro usuário.' };
      }

      // Check if CPF is used by another user
      if (cleanCpf) {
        const otherCpf = await localDb.users.where('cpf').equals(cleanCpf).first();
        if (otherCpf && otherCpf.id !== userId) {
          return { success: false, error: 'Este CPF já pertence a outro usuário.' };
        }
      }

      user.name = cleanName;
      user.email = cleanEmail;
      user.cpf = cleanCpf;

      if (profileData.photoUrl !== undefined) {
        user.photoUrl = profileData.photoUrl === null ? undefined : profileData.photoUrl;
      }

      let newPasswordHash: string | undefined = undefined;
      if (profileData.newPassword && profileData.newPassword.trim().length > 0) {
        if (profileData.newPassword.trim().length < 6) {
          return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
        }
        newPasswordHash = await hashPassword(profileData.newPassword.trim());
        user.passwordHash = newPasswordHash;
      }

      await localDb.users.put(user);
      await localDb.settings.put({ key: 'active_session_user_id', value: user.id });

      // Sincronização imediata para a nuvem (SEM a foto, conforme solicitado: apenas local)
      try {
        await FirestoreSyncService.updateUserProfileInCloud(userId, {
          name: cleanName,
          email: cleanEmail,
          cpf: cleanCpf,
          passwordHash: newPasswordHash,
        });
      } catch (cloudErr) {
        console.warn('Could not immediately sync user profile to cloud:', cloudErr);
      }

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          cpf: user.cpf,
          photoUrl: user.photoUrl,
          createdAt: user.createdAt,
        },
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao atualizar perfil.' };
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
        cpf: userRecord.cpf,
        photoUrl: userRecord.photoUrl,
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
      try {
        await auth.signOut();
      } catch (_) {}
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

    // Load local deletion tombstones
    const tombstoneKey = `deleted_records_${userId}`;
    const tombstoneSetting = await localDb.settings.get(tombstoneKey);
    const tombstoneSet = new Set<string>(Array.isArray(tombstoneSetting?.value) ? tombstoneSetting.value : []);

    // Strictly filter by current userId and exclude deleted or tombstoned records
    const userTx = allTx.filter((t) => t.userId === userId && !t.isDeleted && t.syncStatus !== 'pendingDelete' && !tombstoneSet.has(t.id));
    const userInst = allInst.filter((i) => i.userId === userId && !i.isDeleted && i.syncStatus !== 'pendingDelete' && !tombstoneSet.has(i.id));
    const userCat = allCat.filter((c) => c.userId === userId && !c.isDeleted && c.syncStatus !== 'pendingDelete' && !tombstoneSet.has(c.id));
    const userBudgets = allBudgets.filter((b) => b.userId === userId && !b.isDeleted && b.syncStatus !== 'pendingDelete' && !tombstoneSet.has(b.id));
    const userGoals = allGoals.filter((g) => g.userId === userId && !g.isDeleted && g.syncStatus !== 'pendingDelete' && !tombstoneSet.has(g.id));

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
    const item: Transaction = {
      ...transaction,
      userId,
      syncStatus: 'pendingUpload',
      updatedAt: Date.now(),
      isDeleted: false,
    };
    await localDb.transactions.put(item);
    FirestoreSyncService.uploadPendingChanges(userId).catch(() => {});
  },
  async saveTransactions(transactions: Transaction[], userId: string): Promise<void> {
    const now = Date.now();
    const tagged = transactions.map((t) => ({
      ...t,
      userId,
      syncStatus: 'pendingUpload' as const,
      updatedAt: now,
      isDeleted: false,
    }));
    await localDb.transactions.bulkPut(tagged);
    FirestoreSyncService.uploadPendingChanges(userId).catch(() => {});
  },
  async deleteTransaction(id: string, userId?: string): Promise<void> {
    await localDb.transactions.delete(id);
    if (userId) {
      FirestoreSyncService.deleteCloudRecord(userId, 'transactions', id).catch(() => {});
    }
  },

  // Installments
  async saveInstallment(installment: DebtInstallment, userId: string): Promise<void> {
    const item: DebtInstallment = {
      ...installment,
      userId,
      syncStatus: 'pendingUpload',
      updatedAt: Date.now(),
      isDeleted: false,
    };
    await localDb.installments.put(item);
    FirestoreSyncService.uploadPendingChanges(userId).catch(() => {});
  },
  async saveInstallments(installments: DebtInstallment[], userId: string): Promise<void> {
    const now = Date.now();
    const tagged = installments.map((i) => ({
      ...i,
      userId,
      syncStatus: 'pendingUpload' as const,
      updatedAt: now,
      isDeleted: false,
    }));
    await localDb.installments.bulkPut(tagged);
    FirestoreSyncService.uploadPendingChanges(userId).catch(() => {});
  },
  async deleteInstallment(id: string, userId?: string): Promise<void> {
    await localDb.installments.delete(id);
    if (userId) {
      FirestoreSyncService.deleteCloudRecord(userId, 'installments', id).catch(() => {});
    }
  },

  // Categories
  async saveCategory(category: Category, userId: string): Promise<void> {
    const item: Category = {
      ...category,
      userId,
      syncStatus: 'pendingUpload',
      updatedAt: Date.now(),
      isDeleted: false,
    };
    await localDb.categories.put(item);
    FirestoreSyncService.uploadPendingChanges(userId).catch(() => {});
  },
  async saveCategories(categories: Category[], userId: string): Promise<void> {
    const now = Date.now();
    const tagged = categories.map((c) => ({
      ...c,
      userId,
      syncStatus: 'pendingUpload' as const,
      updatedAt: now,
      isDeleted: false,
    }));
    await localDb.categories.bulkPut(tagged);
    FirestoreSyncService.uploadPendingChanges(userId).catch(() => {});
  },
  async deleteCategory(id: string, userId?: string): Promise<void> {
    await localDb.categories.delete(id);
    if (userId) {
      FirestoreSyncService.deleteCloudRecord(userId, 'categories', id).catch(() => {});
    }
  },

  // Budgets
  async saveBudget(budget: Budget, userId: string): Promise<void> {
    const item: Budget = {
      ...budget,
      userId,
      syncStatus: 'pendingUpload',
      updatedAt: Date.now(),
      isDeleted: false,
    };
    await localDb.budgets.put(item);
    FirestoreSyncService.uploadPendingChanges(userId).catch(() => {});
  },
  async saveBudgets(budgets: Budget[], userId: string): Promise<void> {
    const now = Date.now();
    const tagged = budgets.map((b) => ({
      ...b,
      userId,
      syncStatus: 'pendingUpload' as const,
      updatedAt: now,
      isDeleted: false,
    }));
    await localDb.budgets.bulkPut(tagged);
    FirestoreSyncService.uploadPendingChanges(userId).catch(() => {});
  },
  async deleteBudget(id: string, userId?: string): Promise<void> {
    await localDb.budgets.delete(id);
    if (userId) {
      FirestoreSyncService.deleteCloudRecord(userId, 'budgets', id).catch(() => {});
    }
  },

  // Savings Goals
  async saveGoal(goal: SavingsGoal, userId: string): Promise<void> {
    const item: SavingsGoal = {
      ...goal,
      userId,
      syncStatus: 'pendingUpload',
      updatedAt: Date.now(),
      isDeleted: false,
    };
    await localDb.savingsGoals.put(item);
    FirestoreSyncService.uploadPendingChanges(userId).catch(() => {});
  },
  async saveGoals(goals: SavingsGoal[], userId: string): Promise<void> {
    const now = Date.now();
    const tagged = goals.map((g) => ({
      ...g,
      userId,
      syncStatus: 'pendingUpload' as const,
      updatedAt: now,
      isDeleted: false,
    }));
    await localDb.savingsGoals.bulkPut(tagged);
    FirestoreSyncService.uploadPendingChanges(userId).catch(() => {});
  },
  async deleteGoal(id: string, userId?: string): Promise<void> {
    await localDb.savingsGoals.delete(id);
    if (userId) {
      FirestoreSyncService.deleteCloudRecord(userId, 'savingsGoals', id).catch(() => {});
    }
  },

  // Settings
  async setUserSetting(userId: string, key: string, value: any): Promise<void> {
    await localDb.settings.put({ key: `user_${userId}_${key}`, value });
  },
  async getUserSetting(userId: string, key: string): Promise<any> {
    const record = await localDb.settings.get(`user_${userId}_${key}`);
    return record?.value;
  },

  // Complete JSON Backup & Restore
  async exportFullBackup(userId?: string): Promise<{
    version: string;
    appName: string;
    exportedAt: string;
    users: UserRecord[];
    transactions: Transaction[];
    installments: DebtInstallment[];
    categories: Category[];
    budgets: Budget[];
    savingsGoals: SavingsGoal[];
    settings: { key: string; value: any }[];
    parcelCategories: string[];
    userPreferences?: Record<string, any>;
  }> {
    const [allUsers, allTx, allInst, allCat, allBudgets, allGoals, allSettings] = await Promise.all([
      localDb.users.toArray(),
      userId ? localDb.transactions.where('userId').equals(userId).toArray().catch(() => localDb.transactions.toArray()) : localDb.transactions.toArray(),
      userId ? localDb.installments.where('userId').equals(userId).toArray().catch(() => localDb.installments.toArray()) : localDb.installments.toArray(),
      userId ? localDb.categories.where('userId').equals(userId).toArray().catch(() => localDb.categories.toArray()) : localDb.categories.toArray(),
      userId ? localDb.budgets.where('userId').equals(userId).toArray().catch(() => localDb.budgets.toArray()) : localDb.budgets.toArray(),
      userId ? localDb.savingsGoals.where('userId').equals(userId).toArray().catch(() => localDb.savingsGoals.toArray()) : localDb.savingsGoals.toArray(),
      localDb.settings.toArray(),
    ]);

    // Extract parcel categories from settings
    const parcelCategoriesRecord = allSettings.find((s) => s.key.includes('parcelCategories'));
    const parcelCategories = Array.isArray(parcelCategoriesRecord?.value) ? parcelCategoriesRecord.value : [];

    // Extract user preferences
    const userPrefs: Record<string, any> = {};
    if (userId) {
      const prefix = `user_${userId}_`;
      allSettings.forEach((s) => {
        if (s.key.startsWith(prefix)) {
          userPrefs[s.key.replace(prefix, '')] = s.value;
        }
      });
    }

    return {
      version: '2.0',
      appName: 'Gestão Financeira Pessoal',
      exportedAt: new Date().toISOString(),
      users: allUsers,
      transactions: allTx,
      installments: allInst,
      categories: allCat,
      budgets: allBudgets,
      savingsGoals: allGoals,
      settings: allSettings,
      parcelCategories,
      userPreferences: userPrefs,
    };
  },

  async restoreFullBackup(
    backupData: any,
    currentUserId?: string
  ): Promise<{
    success: boolean;
    counts: {
      transactions: number;
      installments: number;
      categories: number;
      budgets: number;
      goals: number;
      users: number;
    };
    error?: string;
  }> {
    try {
      const counts = {
        transactions: 0,
        installments: 0,
        categories: 0,
        budgets: 0,
        goals: 0,
        users: 0,
      };

      await localDb.transaction(
        'rw',
        [
          localDb.users,
          localDb.transactions,
          localDb.installments,
          localDb.categories,
          localDb.budgets,
          localDb.savingsGoals,
          localDb.settings,
        ],
        async () => {
          // Restore users
          if (Array.isArray(backupData.users) && backupData.users.length > 0) {
            await localDb.users.bulkPut(backupData.users);
            counts.users = backupData.users.length;
          }

          // Restore transactions (tag with currentUserId if missing)
          if (Array.isArray(backupData.transactions) && backupData.transactions.length > 0) {
            const taggedTx = backupData.transactions.map((t: any) => ({
              ...t,
              userId: t.userId || currentUserId,
            }));
            await localDb.transactions.bulkPut(taggedTx);
            counts.transactions = taggedTx.length;
          }

          // Restore installments
          if (Array.isArray(backupData.installments) && backupData.installments.length > 0) {
            const taggedInst = backupData.installments.map((i: any) => ({
              ...i,
              userId: i.userId || currentUserId,
            }));
            await localDb.installments.bulkPut(taggedInst);
            counts.installments = taggedInst.length;
          }

          // Restore categories
          if (Array.isArray(backupData.categories) && backupData.categories.length > 0) {
            const taggedCat = backupData.categories.map((c: any) => ({
              ...c,
              userId: c.userId || currentUserId,
            }));
            await localDb.categories.bulkPut(taggedCat);
            counts.categories = taggedCat.length;
          }

          // Restore budgets
          if (Array.isArray(backupData.budgets) && backupData.budgets.length > 0) {
            const taggedBudgets = backupData.budgets.map((b: any) => ({
              ...b,
              userId: b.userId || currentUserId,
            }));
            await localDb.budgets.bulkPut(taggedBudgets);
            counts.budgets = taggedBudgets.length;
          }

          // Restore savings goals
          if (Array.isArray(backupData.savingsGoals || backupData.goals) && (backupData.savingsGoals || backupData.goals).length > 0) {
            const goalsList = backupData.savingsGoals || backupData.goals;
            const taggedGoals = goalsList.map((g: any) => ({
              ...g,
              userId: g.userId || currentUserId,
            }));
            await localDb.savingsGoals.bulkPut(taggedGoals);
            counts.goals = taggedGoals.length;
          }

          // Restore settings
          if (Array.isArray(backupData.settings) && backupData.settings.length > 0) {
            await localDb.settings.bulkPut(backupData.settings);
          }

          // Restore parcelCategories if given separately
          if (Array.isArray(backupData.parcelCategories) && currentUserId) {
            await localDb.settings.put({
              key: `user_${currentUserId}_parcelCategories`,
              value: backupData.parcelCategories,
            });
          }

          // Restore userPreferences if present
          if (backupData.userPreferences && currentUserId) {
            for (const [k, v] of Object.entries(backupData.userPreferences)) {
              await localDb.settings.put({
                key: `user_${currentUserId}_${k}`,
                value: v,
              });
            }
          }
        }
      );

      return { success: true, counts };
    } catch (err: any) {
      console.error('Full restore error:', err);
      return {
        success: false,
        counts: { transactions: 0, installments: 0, categories: 0, budgets: 0, goals: 0, users: 0 },
        error: err?.message || 'Erro ao restaurar backup.',
      };
    }
  },
};
