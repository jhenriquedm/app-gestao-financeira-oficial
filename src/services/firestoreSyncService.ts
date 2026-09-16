import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { FirebaseStorageService } from './firebaseStorageService';
import {
  Transaction,
  DebtInstallment,
  Category,
  Budget,
  SavingsGoal,
  UserRecord,
} from '../types';
import { localDb } from '../db/localDatabase';

export interface UserCloudSyncPayload {
  transactions: Transaction[];
  installments: DebtInstallment[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  parcelCategories?: string[];
  settings?: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  uploadedCount: number;
  downloadedCount: number;
  error?: string;
}

/**
 * Deeply strips `undefined` fields from objects/arrays because Firestore's setDoc
 * rejects `undefined` values with: "Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Firestore synchronization service following the feira-mensal-app architecture:
 * - Each user has isolated collections under /users/{userId}/...
 * - Bidirectional sync: uploads locally pending items and downloads remote items
 * - Handles soft-deletes and conflict resolution based on timestamps
 */
export class FirestoreSyncService {
  static lastSyncError: string | null = null;
  static hasRealSyncFailure: boolean = false;

  private static userDocRef(userId: string) {
    return doc(firestore, 'users', userId);
  }

  private static collectionRef(userId: string, collectionName: string) {
    return collection(firestore, 'users', userId, collectionName);
  }

  private static isInvalidUser(userId: string): boolean {
    return !userId || userId.trim() === '' || userId === 'no_user';
  }

  /**
   * Saves or updates a user account record in Firestore under /users/{userId}
   */
  static async saveUserAccount(userRecord: UserRecord): Promise<void> {
    try {
      const userRef = this.userDocRef(userRecord.id);
      await setDoc(
        userRef,
        sanitizeForFirestore({
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          cpf: userRecord.cpf,
          passwordHash: userRecord.passwordHash,
          createdAt: userRecord.createdAt,
          updatedAt: Date.now(),
        }),
        { merge: true }
      );
    } catch (e) {
      console.warn('Failed to save user account to cloud:', e);
    }
  }

  /**
   * Search for a user in Firestore by CPF or Email (for recovery or cross-device login)
   */
  static async findUserInCloud(filter: { cpf?: string; email?: string }): Promise<UserRecord | null> {
    try {
      const usersCol = collection(firestore, 'users');
      if (filter.cpf) {
        const q = query(usersCol, where('cpf', '==', filter.cpf));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          return {
            id: snap.docs[0].id,
            name: docData.name || 'Usuário',
            email: docData.email || '',
            cpf: docData.cpf || filter.cpf,
            passwordHash: docData.passwordHash || '',
            createdAt: docData.createdAt || Date.now(),
          };
        }
      }

      if (filter.email) {
        const q = query(usersCol, where('email', '==', filter.email.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          return {
            id: snap.docs[0].id,
            name: docData.name || 'Usuário',
            email: docData.email || filter.email,
            cpf: docData.cpf || '',
            passwordHash: docData.passwordHash || '',
            createdAt: docData.createdAt || Date.now(),
          };
        }
      }

      // Fallback: scan users collection if indexed query is not yet available
      const allUsersSnap = await getDocs(usersCol);
      for (const d of allUsersSnap.docs) {
        const data = d.data();
        if (filter.cpf && data.cpf === filter.cpf) {
          return {
            id: d.id,
            name: data.name || 'Usuário',
            email: data.email || '',
            cpf: data.cpf,
            passwordHash: data.passwordHash || '',
            createdAt: data.createdAt || Date.now(),
          };
        }
        if (filter.email && data.email && data.email.toLowerCase() === filter.email.toLowerCase()) {
          return {
            id: d.id,
            name: data.name || 'Usuário',
            email: data.email,
            cpf: data.cpf || '',
            passwordHash: data.passwordHash || '',
            createdAt: data.createdAt || Date.now(),
          };
        }
      }
      return null;
    } catch (e) {
      console.warn('Cloud user lookup failed:', e);
      return null;
    }
  }

  /**
   * Updates user password in cloud
   */
  static async updateUserPasswordInCloud(userId: string, newHash: string): Promise<void> {
    try {
      const userRef = this.userDocRef(userId);
      await setDoc(userRef, sanitizeForFirestore({ passwordHash: newHash, updatedAt: Date.now() }), { merge: true });
    } catch (e) {
      console.warn('Failed to update password in cloud:', e);
    }
  }

  /**
   * Updates user profile in cloud
   */
  static async updateUserProfileInCloud(
    userId: string,
    profile: { name: string; email: string; cpf: string; passwordHash?: string }
  ): Promise<void> {
    try {
      const userRef = this.userDocRef(userId);
      const updateData: Record<string, any> = {
        name: profile.name,
        email: profile.email,
        cpf: profile.cpf,
        updatedAt: Date.now(),
      };
      if (profile.passwordHash) {
        updateData.passwordHash = profile.passwordHash;
      }
      await setDoc(userRef, sanitizeForFirestore(updateData), { merge: true });
    } catch (e) {
      console.warn('Failed to update user profile in cloud:', e);
    }
  }

  /**
   * Permanently deletes a record from Firestore.
   * If direct deletion fails (e.g. offline), marks the record as inactive/deleted in cloud
   * and records a local tombstone so it is NEVER downloaded or resurrected.
   */
  static async deleteCloudRecord(
    userId: string,
    collectionName: 'transactions' | 'installments' | 'categories' | 'budgets' | 'savingsGoals',
    recordId: string
  ): Promise<void> {
    if (this.isInvalidUser(userId) || !recordId) return;

    // 1. Record local tombstone immediately so it is never re-downloaded
    try {
      const tombstoneKey = `deleted_records_${userId}`;
      const existing = await localDb.settings.get(tombstoneKey);
      const list: string[] = Array.isArray(existing?.value) ? existing.value : [];
      if (!list.includes(recordId)) {
        list.push(recordId);
        await localDb.settings.put({ key: tombstoneKey, value: list });
      }
    } catch (e) {
      console.warn('Failed to record local deletion tombstone:', e);
    }

    // 2. Delete from Firestore or mark inactive as fallback
    const docRef = doc(firestore, 'users', userId, collectionName, recordId);
    try {
      await deleteDoc(docRef);
    } catch (err) {
      console.warn(`Direct cloud deletion failed for ${collectionName}/${recordId}, marking as inactive in cloud:`, err);
      try {
        await setDoc(
          docRef,
          {
            isDeleted: true,
            status: 'inactive',
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      } catch (softErr) {
        console.warn(`Fallback soft-delete in cloud also failed:`, softErr);
      }
    }
  }

  /**
   * Checks whether there are unsynced items or actual sync errors
   */
  static async getSyncStatus(userId: string): Promise<{
    hasPending: boolean;
    pendingCount: number;
    lastError: string | null;
  }> {
    if (this.isInvalidUser(userId)) {
      return { hasPending: false, pendingCount: 0, lastError: null };
    }

    try {
      const tx = await localDb.transactions.where('userId').equals(userId).toArray();
      const inst = await localDb.installments.where('userId').equals(userId).toArray();
      const cat = await localDb.categories.where('userId').equals(userId).toArray();
      const bud = await localDb.budgets.where('userId').equals(userId).toArray();
      const goals = await localDb.savingsGoals.where('userId').equals(userId).toArray();

      const pendingTx = tx.filter((t) => t.syncStatus === 'pendingUpload' || t.syncStatus === 'pendingDelete').length;
      const pendingInst = inst.filter((i) => i.syncStatus === 'pendingUpload' || i.syncStatus === 'pendingDelete').length;
      const pendingCat = cat.filter((c) => c.syncStatus === 'pendingUpload' || c.syncStatus === 'pendingDelete').length;
      const pendingBud = bud.filter((b) => b.syncStatus === 'pendingUpload' || b.syncStatus === 'pendingDelete').length;
      const pendingGoals = goals.filter((g) => g.syncStatus === 'pendingUpload' || g.syncStatus === 'pendingDelete').length;

      const totalPending = pendingTx + pendingInst + pendingCat + pendingBud + pendingGoals;
      const isActuallyFailing = this.hasRealSyncFailure && (totalPending > 0 || !navigator.onLine);

      return {
        hasPending: isActuallyFailing,
        pendingCount: totalPending,
        lastError: isActuallyFailing ? this.lastSyncError || 'Falha de comunicação com o servidor de dados na nuvem.' : null,
      };
    } catch {
      return { hasPending: false, pendingCount: 0, lastError: null };
    }
  }

  /**
   * Uploads all pending local changes for a user to Firestore
   */
  static async uploadPendingChanges(userId: string): Promise<number> {
    if (this.isInvalidUser(userId)) return 0;

    let totalUploaded = 0;
    const now = Date.now();

    // 1. Transactions
    const localTx = await localDb.transactions.where('userId').equals(userId).toArray();
    const pendingTx = localTx.filter(
      (t) => t.syncStatus === 'pendingUpload' || t.syncStatus === 'pendingDelete' || !t.syncStatus
    );

    for (const tx of pendingTx) {
      try {
        const docRef = doc(firestore, 'users', userId, 'transactions', tx.id);
        if (tx.syncStatus === 'pendingDelete' || tx.isDeleted) {
          await deleteDoc(docRef).catch(() => {});
          await localDb.transactions.delete(tx.id);
        } else {
          let syncedTx: Transaction = {
            ...tx,
            syncStatus: 'synced',
            updatedAt: now,
            isDeleted: false,
          };

          // 1. Envia comprovantes para o Firebase Storage (5 GB gratuitos)
          if (syncedTx.attachments && syncedTx.attachments.length > 0) {
            const uploadedAtts = await Promise.all(
              syncedTx.attachments.map((att) => FirebaseStorageService.uploadAttachment(userId, att))
            );
            syncedTx.attachments = uploadedAtts;
            if (uploadedAtts[0]) {
              syncedTx.attachment = uploadedAtts[0];
            }
          } else if (syncedTx.attachment) {
            const uploadedAtt = await FirebaseStorageService.uploadAttachment(userId, syncedTx.attachment);
            syncedTx.attachment = uploadedAtt;
          }

          // 2. Prepara payload do Firestore: se já subiu para o Storage (possui fileUrl),
          // limpamos o dataUrl para manter o documento leve e rápido.
          const firestorePayload = { ...syncedTx };
          if (firestorePayload.attachments && Array.isArray(firestorePayload.attachments)) {
            firestorePayload.attachments = firestorePayload.attachments.map((a) => {
              if (a.fileUrl || (a.dataUrl && a.dataUrl.length > 300000)) {
                return { ...a, dataUrl: '' };
              }
              return a;
            });
          }
          if (firestorePayload.attachment && (firestorePayload.attachment.fileUrl || (firestorePayload.attachment.dataUrl && firestorePayload.attachment.dataUrl.length > 300000))) {
            firestorePayload.attachment = {
              ...firestorePayload.attachment,
              dataUrl: '',
            };
          }

          await setDoc(docRef, sanitizeForFirestore(firestorePayload), { merge: true });
          // Mantém no IndexedDB com cache de dados e URLs da nuvem
          await localDb.transactions.put(syncedTx);
        }
        totalUploaded++;
      } catch (err) {
        console.warn(`Error syncing transaction ${tx.id}:`, err);
      }
    }

    // 2. Installments
    const localInst = await localDb.installments.where('userId').equals(userId).toArray();
    const pendingInst = localInst.filter(
      (i) => i.syncStatus === 'pendingUpload' || i.syncStatus === 'pendingDelete' || !i.syncStatus
    );

    for (const inst of pendingInst) {
      try {
        const docRef = doc(firestore, 'users', userId, 'installments', inst.id);
        if (inst.syncStatus === 'pendingDelete' || inst.isDeleted) {
          await deleteDoc(docRef).catch(() => {});
          await localDb.installments.delete(inst.id);
        } else {
          let syncedInst: DebtInstallment = {
            ...inst,
            syncStatus: 'synced',
            updatedAt: now,
            isDeleted: false,
          };

          // 1. Envia comprovantes do parcelamento para o Firebase Storage
          if (syncedInst.attachments && syncedInst.attachments.length > 0) {
            const uploadedAtts = await Promise.all(
              syncedInst.attachments.map((att) => FirebaseStorageService.uploadAttachment(userId, att))
            );
            syncedInst.attachments = uploadedAtts;
            if (uploadedAtts[0]) {
              syncedInst.attachment = uploadedAtts[0];
            }
          } else if (syncedInst.attachment) {
            const uploadedAtt = await FirebaseStorageService.uploadAttachment(userId, syncedInst.attachment);
            syncedInst.attachment = uploadedAtt;
          }

          // 2. Prepara payload do Firestore
          const firestorePayload = { ...syncedInst };
          if (firestorePayload.attachments && Array.isArray(firestorePayload.attachments)) {
            firestorePayload.attachments = firestorePayload.attachments.map((a) => {
              if (a.fileUrl || (a.dataUrl && a.dataUrl.length > 300000)) {
                return { ...a, dataUrl: '' };
              }
              return a;
            });
          }
          if (firestorePayload.attachment && (firestorePayload.attachment.fileUrl || (firestorePayload.attachment.dataUrl && firestorePayload.attachment.dataUrl.length > 300000))) {
            firestorePayload.attachment = {
              ...firestorePayload.attachment,
              dataUrl: '',
            };
          }

          await setDoc(docRef, sanitizeForFirestore(firestorePayload), { merge: true });
          await localDb.installments.put(syncedInst);
        }
        totalUploaded++;
      } catch (err) {
        console.warn(`Error syncing installment ${inst.id}:`, err);
      }
    }

    // 3. Categories
    const localCat = await localDb.categories.where('userId').equals(userId).toArray();
    const pendingCat = localCat.filter(
      (c) => c.syncStatus === 'pendingUpload' || c.syncStatus === 'pendingDelete' || !c.syncStatus
    );

    for (const cat of pendingCat) {
      try {
        const docRef = doc(firestore, 'users', userId, 'categories', cat.id);
        if (cat.syncStatus === 'pendingDelete' || cat.isDeleted) {
          await deleteDoc(docRef).catch(() => {});
          await localDb.categories.delete(cat.id);
        } else {
          const syncedCat: Category = {
            ...cat,
            syncStatus: 'synced',
            updatedAt: now,
            isDeleted: false,
          };
          await setDoc(docRef, sanitizeForFirestore(syncedCat), { merge: true });
          await localDb.categories.put(syncedCat);
        }
        totalUploaded++;
      } catch (err) {
        console.warn(`Error syncing category ${cat.id}:`, err);
      }
    }

    // 4. Budgets
    const localBudgets = await localDb.budgets.where('userId').equals(userId).toArray();
    const pendingBudgets = localBudgets.filter(
      (b) => b.syncStatus === 'pendingUpload' || b.syncStatus === 'pendingDelete' || !b.syncStatus
    );

    for (const b of pendingBudgets) {
      try {
        const docRef = doc(firestore, 'users', userId, 'budgets', b.id);
        if (b.syncStatus === 'pendingDelete' || b.isDeleted) {
          await deleteDoc(docRef).catch(() => {});
          await localDb.budgets.delete(b.id);
        } else {
          const syncedBudget: Budget = {
            ...b,
            syncStatus: 'synced',
            updatedAt: now,
            isDeleted: false,
          };
          await setDoc(docRef, sanitizeForFirestore(syncedBudget), { merge: true });
          await localDb.budgets.put(syncedBudget);
        }
        totalUploaded++;
      } catch (err) {
        console.warn(`Error syncing budget ${b.id}:`, err);
      }
    }

    // 5. Savings Goals
    const localGoals = await localDb.savingsGoals.where('userId').equals(userId).toArray();
    const pendingGoals = localGoals.filter(
      (g) => g.syncStatus === 'pendingUpload' || g.syncStatus === 'pendingDelete' || !g.syncStatus
    );

    for (const g of pendingGoals) {
      try {
        const docRef = doc(firestore, 'users', userId, 'savingsGoals', g.id);
        if (g.syncStatus === 'pendingDelete' || g.isDeleted) {
          await deleteDoc(docRef).catch(() => {});
          await localDb.savingsGoals.delete(g.id);
        } else {
          const syncedGoal: SavingsGoal = {
            ...g,
            syncStatus: 'synced',
            updatedAt: now,
            isDeleted: false,
          };
          await setDoc(docRef, sanitizeForFirestore(syncedGoal), { merge: true });
          await localDb.savingsGoals.put(syncedGoal);
        }
        totalUploaded++;
      } catch (err) {
        console.warn(`Error syncing savings goal ${g.id}:`, err);
      }
    }

    // 6. User root document (parcelCategories, preferences & sync metadata)
    try {
      const parcelCategoriesSetting = await localDb.settings.get(`user_${userId}_parcelCategories`);
      const isDarkModeSetting = await localDb.settings.get(`user_${userId}_isDarkMode`);
      const isBalanceHiddenSetting = await localDb.settings.get(`user_${userId}_isBalanceHidden`);

      const userRootDoc = this.userDocRef(userId);
      await setDoc(
        userRootDoc,
        sanitizeForFirestore({
          userId,
          lastSyncedAt: now,
          parcelCategories: parcelCategoriesSetting?.value || [],
          settings: {
            isDarkMode: isDarkModeSetting?.value ?? false,
            isBalanceHidden: isBalanceHiddenSetting?.value ?? false,
          },
        }),
        { merge: true }
      );
    } catch (rootErr) {
      console.warn('Error syncing user root preferences:', rootErr);
    }

    return totalUploaded;
  }

  /**
   * Downloads all cloud records from Firestore and updates IndexedDB
   */
  static async downloadCloudData(userId: string): Promise<{
    downloadedCount: number;
    categories: Category[];
    transactions: Transaction[];
    installments: DebtInstallment[];
    budgets: Budget[];
    savingsGoals: SavingsGoal[];
    parcelCategories?: string[];
  }> {
    if (this.isInvalidUser(userId)) {
      return {
        downloadedCount: 0,
        categories: [],
        transactions: [],
        installments: [],
        budgets: [],
        savingsGoals: [],
      };
    }

    let downloadedCount = 0;

    // Load local deletion tombstones so deleted items are NEVER restored
    const tombstoneKey = `deleted_records_${userId}`;
    const tombstoneSetting = await localDb.settings.get(tombstoneKey);
    const tombstoneSet = new Set<string>(Array.isArray(tombstoneSetting?.value) ? tombstoneSetting.value : []);

    // 1. Download categories
    const catSnapshot = await getDocs(this.collectionRef(userId, 'categories'));
    const remoteCategories: Category[] = [];
    catSnapshot.forEach((d) => {
      const item = d.data() as Category;
      const isDeletedRecord = item.isDeleted || (item as any).status === 'inactive' || tombstoneSet.has(d.id);
      if (!isDeletedRecord) {
        remoteCategories.push({ ...item, id: d.id, userId, syncStatus: 'synced' });
        downloadedCount++;
      } else {
        localDb.categories.delete(d.id).catch(() => {});
        deleteDoc(d.ref).catch(() => {});
      }
    });

    // 2. Download transactions
    const localTxExisting = await localDb.transactions.where('userId').equals(userId).toArray().catch(() => []);
    const localTxAttachmentMap = new Map<string, any>();
    const localTxAttachmentsMap = new Map<string, any[]>();
    localTxExisting.forEach((t) => {
      if (t.attachment?.dataUrl) localTxAttachmentMap.set(t.id, t.attachment);
      if (t.attachments && t.attachments.length > 0) localTxAttachmentsMap.set(t.id, t.attachments);
    });

    const txSnapshot = await getDocs(this.collectionRef(userId, 'transactions'));
    const remoteTx: Transaction[] = [];
    txSnapshot.forEach((d) => {
      const item = d.data() as Transaction;
      const isDeletedRecord = item.isDeleted || (item as any).status === 'inactive' || tombstoneSet.has(d.id);
      if (!isDeletedRecord) {
        // Preserva dataUrl local se o remoto veio apenas com metadados
        if (item.attachments && Array.isArray(item.attachments)) {
          const localList = localTxAttachmentsMap.get(d.id) || [];
          item.attachments = item.attachments.map((att, idx) => {
            if (!att.dataUrl || att.dataUrl === '') {
              const matchingLocal = localList.find((l) => l.id === att.id) || localList[idx];
              if (matchingLocal?.dataUrl) {
                return { ...att, dataUrl: matchingLocal.dataUrl };
              }
            }
            return att;
          });
        }
        if (item.attachment && (!item.attachment.dataUrl || item.attachment.dataUrl === '')) {
          const localAtt = localTxAttachmentMap.get(d.id);
          if (localAtt?.dataUrl) {
            item.attachment.dataUrl = localAtt.dataUrl;
          }
        }
        remoteTx.push({ ...item, id: d.id, userId, syncStatus: 'synced' });
        downloadedCount++;
      } else {
        localDb.transactions.delete(d.id).catch(() => {});
        deleteDoc(d.ref).catch(() => {});
      }
    });

    // 3. Download installments
    const localInstExisting = await localDb.installments.where('userId').equals(userId).toArray().catch(() => []);
    const localInstAttachmentMap = new Map<string, any>();
    const localInstAttachmentsMap = new Map<string, any[]>();
    localInstExisting.forEach((i) => {
      if (i.attachment?.dataUrl) localInstAttachmentMap.set(i.id, i.attachment);
      if (i.attachments && i.attachments.length > 0) localInstAttachmentsMap.set(i.id, i.attachments);
    });

    const instSnapshot = await getDocs(this.collectionRef(userId, 'installments'));
    const remoteInst: DebtInstallment[] = [];
    instSnapshot.forEach((d) => {
      const item = d.data() as DebtInstallment;
      const isDeletedRecord = item.isDeleted || (item as any).status === 'inactive' || tombstoneSet.has(d.id);
      if (!isDeletedRecord) {
        if (item.attachments && Array.isArray(item.attachments)) {
          const localList = localInstAttachmentsMap.get(d.id) || [];
          item.attachments = item.attachments.map((att, idx) => {
            if (!att.dataUrl || att.dataUrl === '') {
              const matchingLocal = localList.find((l) => l.id === att.id) || localList[idx];
              if (matchingLocal?.dataUrl) {
                return { ...att, dataUrl: matchingLocal.dataUrl };
              }
            }
            return att;
          });
        }
        if (item.attachment && (!item.attachment.dataUrl || item.attachment.dataUrl === '')) {
          const localAtt = localInstAttachmentMap.get(d.id);
          if (localAtt?.dataUrl) {
            item.attachment.dataUrl = localAtt.dataUrl;
          }
        }
        remoteInst.push({ ...item, id: d.id, userId, syncStatus: 'synced' });
        downloadedCount++;
      } else {
        localDb.installments.delete(d.id).catch(() => {});
        deleteDoc(d.ref).catch(() => {});
      }
    });

    // 4. Download budgets
    const budgetSnapshot = await getDocs(this.collectionRef(userId, 'budgets'));
    const remoteBudgets: Budget[] = [];
    budgetSnapshot.forEach((d) => {
      const item = d.data() as Budget;
      const isDeletedRecord = item.isDeleted || (item as any).status === 'inactive' || tombstoneSet.has(d.id);
      if (!isDeletedRecord) {
        remoteBudgets.push({ ...item, id: d.id, userId, syncStatus: 'synced' });
        downloadedCount++;
      } else {
        localDb.budgets.delete(d.id).catch(() => {});
        deleteDoc(d.ref).catch(() => {});
      }
    });

    // 5. Download savings goals
    const goalsSnapshot = await getDocs(this.collectionRef(userId, 'savingsGoals'));
    const remoteGoals: SavingsGoal[] = [];
    goalsSnapshot.forEach((d) => {
      const item = d.data() as SavingsGoal;
      const isDeletedRecord = item.isDeleted || (item as any).status === 'inactive' || tombstoneSet.has(d.id);
      if (!isDeletedRecord) {
        remoteGoals.push({ ...item, id: d.id, userId, syncStatus: 'synced' });
        downloadedCount++;
      } else {
        localDb.savingsGoals.delete(d.id).catch(() => {});
        deleteDoc(d.ref).catch(() => {});
      }
    });

    // Save to local IndexedDB (merging gracefully)
    if (remoteCategories.length > 0) {
      await localDb.categories.bulkPut(remoteCategories);
    }
    if (remoteTx.length > 0) {
      await localDb.transactions.bulkPut(remoteTx);
    }
    if (remoteInst.length > 0) {
      await localDb.installments.bulkPut(remoteInst);
    }
    if (remoteBudgets.length > 0) {
      await localDb.budgets.bulkPut(remoteBudgets);
    }
    if (remoteGoals.length > 0) {
      await localDb.savingsGoals.bulkPut(remoteGoals);
    }

    return {
      downloadedCount,
      categories: remoteCategories,
      transactions: remoteTx,
      installments: remoteInst,
      budgets: remoteBudgets,
      savingsGoals: remoteGoals,
    };
  }

  /**
   * Complete 2-way synchronization cycle (similar to FirestoreSyncService in feira-mensal-app)
   */
  static async fullSync(userId: string): Promise<SyncResult> {
    if (this.isInvalidUser(userId)) {
      return { success: false, uploadedCount: 0, downloadedCount: 0, error: 'Usuário não autenticado.' };
    }

    try {
      // Step 1: Upload all pending items
      const uploadedCount = await this.uploadPendingChanges(userId);

      // Step 2: Download cloud data
      const { downloadedCount } = await this.downloadCloudData(userId);

      // Step 3: Record last successful sync timestamp
      await localDb.settings.put({
        key: `user_${userId}_lastSyncTimestamp`,
        value: Date.now(),
      });

      this.hasRealSyncFailure = false;
      this.lastSyncError = null;

      return {
        success: true,
        uploadedCount,
        downloadedCount,
      };
    } catch (err: any) {
      console.warn('Firestore sync error (operating in offline fallback mode):', err);
      this.hasRealSyncFailure = true;
      this.lastSyncError = err?.message || 'Falha ao sincronizar com a nuvem.';
      return {
        success: false,
        uploadedCount: 0,
        downloadedCount: 0,
        error: err?.message || 'Erro ao sincronizar com o Firebase.',
      };
    }
  }
}
