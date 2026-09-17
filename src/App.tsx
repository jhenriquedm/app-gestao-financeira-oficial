import React, { useState, useEffect, useMemo } from 'react';
import { 
  Transaction, 
  Category, 
  Budget, 
  SavingsGoal, 
  DebtInstallment,
  MonthlySummary,
  FinancialHealthStatus,
  User 
} from './types';
import { authOperations, loadUserData, dbOperations } from './db/localDatabase';
import { FirestoreSyncService } from './services/firestoreSyncService';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { AuthScreen } from './components/AuthScreen';
import { SplashScreen } from './components/SplashScreen';
import { MobileFrame } from './components/MobileFrame';
import { MobileHeader } from './components/MobileHeader';
import { MobileBottomNav, AppNavTab } from './components/MobileBottomNav';
import { SummaryCards } from './components/SummaryCards';
import { FinancialCharts } from './components/FinancialCharts';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { BudgetsSection } from './components/BudgetsSection';
import { SavingsGoalsSection } from './components/SavingsGoalsSection';
import { ExportImportModal } from './components/ExportImportModal';
import { FixedExpensesSection } from './components/FixedExpensesSection';
import { InstallmentsSection } from './components/InstallmentsSection';
import { InstallmentModal } from './components/InstallmentModal';
import { NewLaunchSheet } from './components/NewLaunchSheet';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { ProfileModal } from './components/ProfileModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { getComputedInstallment } from './utils/installmentHelpers';
import { getTransactionsForMonth } from './utils/transactionHelpers';
import { formatMonthYear, getCurrentYearMonth } from './utils/formatters';
import { Receipt, Target, PiggyBank } from 'lucide-react';

export const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Core database-backed states
  const [categories, setCategories] = useState<Category[]>([]);
  const [parcelCategories, setParcelCategories] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [installments, setInstallments] = useState<DebtInstallment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  // Settings states
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Month competence
  const [currentYearMonth, setCurrentYearMonth] = useState<string>(() => getCurrentYearMonth());

  // Cloud sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleSyncCloud = async () => {
    if (!currentUser || isSyncing) return;
    setIsSyncing(true);
    try {
      await FirestoreSyncService.fullSync(currentUser.id);
      const data = await loadUserData(currentUser.id);
      setCategories(data.categories || []);
      setParcelCategories(data.parcelCategories || []);
      setTransactions(data.transactions || []);
      setInstallments(data.installments || []);
      setBudgets(data.budgets || []);
      setGoals(data.savingsGoals || []);
    } catch (e) {
      console.warn('Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Check active session and load user data on mount
  useEffect(() => {
    let isMounted = true;
    async function initSession() {
      try {
        if (Capacitor.isNativePlatform()) {
          GoogleAuth.initialize({
            clientId: '901690992750-jbuc5p2bebr2940uaorqtn5qcp72q6cp.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: false,
          }).catch((e) => console.warn('Native GoogleAuth pre-init warn:', e));
        }

        // Verifica se o usuário concluiu um login por redirecionamento do Google
        const redirectResult = await authOperations.checkGoogleRedirectResult();
        let activeUser = redirectResult?.success && redirectResult.user ? redirectResult.user : await authOperations.getActiveSessionUser();
        if (!isMounted) return;

        if (activeUser) {
          setCurrentUser(activeUser);
          const data = await loadUserData(activeUser.id);
          if (!isMounted) return;

          setCategories(data.categories || []);
          setParcelCategories(data.parcelCategories || []);
          setTransactions(data.transactions || []);
          setInstallments(data.installments || []);
          setBudgets(data.budgets || []);
          setGoals(data.savingsGoals || []);

          if (data.settings) {
            if (data.settings.isDarkMode !== undefined) setIsDarkMode(Boolean(data.settings.isDarkMode));
            if (data.settings.isBalanceHidden !== undefined) setIsBalanceHidden(Boolean(data.settings.isBalanceHidden));
            if (data.settings.currentYearMonth) setCurrentYearMonth(String(data.settings.currentYearMonth));
          }

          // Trigger background sync with Firestore for active session
          FirestoreSyncService.fullSync(activeUser.id)
            .then(async (result) => {
              if (result.success && result.downloadedCount > 0 && isMounted) {
                const refreshed = await loadUserData(activeUser.id);
                if (!isMounted) return;
                setCategories(refreshed.categories || []);
                setParcelCategories(refreshed.parcelCategories || []);
                setTransactions(refreshed.transactions || []);
                setInstallments(refreshed.installments || []);
                setBudgets(refreshed.budgets || []);
                setGoals(refreshed.savingsGoals || []);
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    }

    initSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    try {
      const data = await loadUserData(user.id);
      setCategories(data.categories || []);
      setParcelCategories(data.parcelCategories || []);
      setTransactions(data.transactions || []);
      setInstallments(data.installments || []);
      setBudgets(data.budgets || []);
      setGoals(data.savingsGoals || []);

      if (data.settings) {
        if (data.settings.isDarkMode !== undefined) setIsDarkMode(Boolean(data.settings.isDarkMode));
        if (data.settings.isBalanceHidden !== undefined) setIsBalanceHidden(Boolean(data.settings.isBalanceHidden));
        if (data.settings.currentYearMonth) setCurrentYearMonth(String(data.settings.currentYearMonth));
      }
      setActiveTab('overview');

      // Trigger background sync with Firestore
      FirestoreSyncService.fullSync(user.id)
        .then(async (result) => {
          if (result.success && result.downloadedCount > 0) {
            const refreshed = await loadUserData(user.id);
            setCategories(refreshed.categories || []);
            setParcelCategories(refreshed.parcelCategories || []);
            setTransactions(refreshed.transactions || []);
            setInstallments(refreshed.installments || []);
            setBudgets(refreshed.budgets || []);
            setGoals(refreshed.savingsGoals || []);
          }
        })
        .catch(() => {});
    } catch (e) {
      console.error('Error loading data after login:', e);
    }
  };

  const handleLogout = async () => {
    await authOperations.logout();
    setCurrentUser(null);
    setCategories([]);
    setParcelCategories([]);
    setTransactions([]);
    setInstallments([]);
    setBudgets([]);
    setGoals([]);
  };

  // Continuous & Automatic Background Synchronization for all user data (transactions, attachments, categories, budgets, goals)
  useEffect(() => {
    if (!currentUser) return;

    let isSyncing = false;

    const performAutoSync = async () => {
      if (isSyncing || !navigator.onLine) return;
      isSyncing = true;
      try {
        const result = await FirestoreSyncService.fullSync(currentUser.id);
        if (result.success && result.downloadedCount > 0) {
          const refreshed = await loadUserData(currentUser.id);
          setCategories(refreshed.categories || []);
          setParcelCategories(refreshed.parcelCategories || []);
          setTransactions(refreshed.transactions || []);
          setInstallments(refreshed.installments || []);
          setBudgets(refreshed.budgets || []);
          setGoals(refreshed.savingsGoals || []);
        }
      } catch (err) {
        console.warn('Auto sync check failed:', err);
      } finally {
        isSyncing = false;
      }
    };

    // 1. Initial sync trigger
    performAutoSync();

    // 2. Continuous interval sync every 20 seconds
    const syncInterval = setInterval(performAutoSync, 20000);

    // 3. Sync immediately when connection recovers or app window regains focus
    const handleOnline = () => performAutoSync();
    const handleFocus = () => performAutoSync();

    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser]);

  // Theme synchronization
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (currentUser) {
      dbOperations.setUserSetting(currentUser.id, 'isDarkMode', isDarkMode).catch(console.error);
    }
  }, [isDarkMode, currentUser]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleToggleBalancePrivacy = () => {
    setIsBalanceHidden((prev) => {
      const nextVal = !prev;
      if (currentUser) {
        dbOperations.setUserSetting(currentUser.id, 'isBalanceHidden', nextVal).catch(console.error);
      }
      return nextVal;
    });
  };

  // Sync state mutations to Dexie Local Database isolated per user
  useEffect(() => {
    if (currentUser) {
      dbOperations.saveTransactions(transactions, currentUser.id).catch(console.error);
    }
  }, [transactions, currentUser]);

  useEffect(() => {
    if (currentUser) {
      dbOperations.saveInstallments(installments, currentUser.id).catch(console.error);
    }
  }, [installments, currentUser]);

  useEffect(() => {
    if (currentUser) {
      dbOperations.saveCategories(categories, currentUser.id).catch(console.error);
    }
  }, [categories, currentUser]);

  useEffect(() => {
    if (currentUser) {
      dbOperations.saveParcelCategories(parcelCategories, currentUser.id).catch(console.error);
    }
  }, [parcelCategories, currentUser]);

  useEffect(() => {
    if (currentUser) {
      dbOperations.saveBudgets(budgets, currentUser.id).catch(console.error);
    }
  }, [budgets, currentUser]);

  useEffect(() => {
    if (currentUser) {
      dbOperations.saveGoals(goals, currentUser.id).catch(console.error);
    }
  }, [goals, currentUser]);

  useEffect(() => {
    if (currentUser) {
      dbOperations.setUserSetting(currentUser.id, 'currentYearMonth', currentYearMonth).catch(console.error);
    }
  }, [currentYearMonth, currentUser]);

  // Delete confirmation modal state (non-blocking)
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
    description: string;
    type: 'transaction' | 'installment' | 'goal' | 'budget';
  }>({
    isOpen: false,
    id: '',
    title: '',
    description: '',
    type: 'transaction',
  });

  // Active Bottom Tab
  const [activeTab, setActiveTab] = useState<AppNavTab>('overview');

  // Secondary sub-tab when viewing planning/history (extrato, orçamentos, metas)
  const [planningSubTab, setPlanningSubTab] = useState<'transactions' | 'budgets' | 'goals'>('transactions');

  // Modals state
  const [isNewLaunchSheetOpen, setIsNewLaunchSheetOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalInitialType, setTxModalInitialType] = useState<'income' | 'expense'>('expense');
  const [txModalIsFixedDefault, setTxModalIsFixedDefault] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<DebtInstallment | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalInitialTab, setCategoryModalInitialTab] = useState<'fixed' | 'parcelas' | 'income'>('fixed');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleOpenCategoryManager = (tab: 'fixed' | 'parcelas' | 'income' = 'fixed') => {
    setCategoryModalInitialTab(tab);
    setIsCategoryModalOpen(true);
  };

  // Keep planningSubTab in sync if activeTab is changed from header shortcuts
  useEffect(() => {
    if (activeTab === 'budgets' || activeTab === 'goals' || activeTab === 'transactions') {
      setPlanningSubTab(activeTab);
    }
  }, [activeTab]);

  // Computed transactions for current month:
  // Ensures fixed expenses persist into all subsequent months!
  const currentMonthTransactions = useMemo(() => {
    return getTransactionsForMonth(transactions, currentYearMonth);
  }, [transactions, currentYearMonth]);

  // Overall total balance (all time completed transactions)
  const overallBalance = useMemo(() => {
    return transactions
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  }, [transactions]);

  // Summary for currently selected month incorporating Fixed Expenses, Variable Expenses and Installments
  const monthlySummary = useMemo<MonthlySummary>(() => {
    let totalIncome = 0;
    let fixedExpenses = 0;
    let variableExpenses = 0;
    let pendingIncome = 0;
    let pendingExpense = 0;
    let totalPaidExpenses = 0;

    currentMonthTransactions.forEach((t) => {
      if (t.type === 'income') {
        totalIncome += t.amount;
        if (t.status === 'pending') pendingIncome += t.amount;
      } else {
        if (t.isFixed) {
          fixedExpenses += t.amount;
        } else {
          variableExpenses += t.amount;
        }

        if (t.status === 'completed') {
          totalPaidExpenses += t.amount;
        } else {
          pendingExpense += t.amount;
        }
      }
    });

    // Active installments relevant for this competence (auto-progression and completion-aware)
    const activeInstallments = installments
      .map((i) => getComputedInstallment(i, currentYearMonth))
      .filter((ci) => ci.isActive);

    const installmentsAmount = activeInstallments.reduce((sum, ci) => sum + ci.installment.monthlyAmount, 0);
    const paidInstallments = activeInstallments
      .filter((ci) => ci.status === 'completed')
      .reduce((sum, ci) => sum + ci.installment.monthlyAmount, 0);
    const pendingInstallments = installmentsAmount - paidInstallments;

    const totalExpense = fixedExpenses + variableExpenses + installmentsAmount;
    const totalCompromissos = totalExpense;
    const totalPaid = totalPaidExpenses + paidInstallments;
    const totalPending = pendingExpense + pendingInstallments;
    const balance = totalIncome - totalCompromissos;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
    const incomeCommitmentPercentage = totalIncome > 0 ? (totalCompromissos / totalIncome) * 100 : 0;
    const paidPercentage = totalCompromissos > 0 ? (totalPaid / totalCompromissos) * 100 : 0;

    let healthStatus: FinancialHealthStatus = 'SAUDÁVEL';
    if (balance < 0) {
      healthStatus = 'NEGATIVO';
    } else if (incomeCommitmentPercentage > 85) {
      healthStatus = 'CRÍTICO';
    } else if (incomeCommitmentPercentage > 70) {
      healthStatus = 'ATENÇÃO';
    } else {
      healthStatus = 'SAUDÁVEL';
    }

    return {
      month: currentYearMonth,
      totalIncome,
      totalExpense,
      fixedExpenses,
      variableExpenses,
      installmentsAmount,
      totalCompromissos,
      totalPaid,
      totalPending,
      balance,
      savingsRate,
      incomeCommitmentPercentage,
      paidPercentage,
      healthStatus,
      pendingIncome,
      pendingExpense: totalPending,
    };
  }, [currentMonthTransactions, installments, currentYearMonth]);

  // Pending count in current month for dock badge
  const pendingCount = useMemo(() => {
    const txPending = currentMonthTransactions.filter((t) => t.status === 'pending').length;
    const instPending = installments
      .map((i) => getComputedInstallment(i, currentYearMonth))
      .filter((ci) => ci.isActive && ci.status === 'pending').length;
    return txPending + instPending;
  }, [currentMonthTransactions, installments, currentYearMonth]);

  // Handlers for Transactions
  const handleOpenNewTransaction = (type?: 'income' | 'expense', isFixed: boolean = false) => {
    setEditingTransaction(null);
    setTxModalInitialType(type || 'expense');
    setTxModalIsFixedDefault(isFixed);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTxModalInitialType(tx.type);
    setTxModalIsFixedDefault(!!tx.isFixed);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === existingId ? { ...t, ...txData } : t))
      );
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        startMonthYear: txData.isFixed ? (txData.startMonthYear || currentYearMonth) : undefined,
        createdAt: Date.now(),
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const handleRequestDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    const isFixed = tx?.isFixed;
    setDeleteModalState({
      isOpen: true,
      id,
      title: isFixed ? 'Excluir Despesa Fixa' : 'Excluir Movimentação',
      description: isFixed
        ? `Deseja excluir "${tx?.description || 'esta despesa fixa'}"? Ela deixará de constar em ${formatMonthYear(currentYearMonth)} e em todos os meses subsequentes.`
        : `Tem certeza que deseja excluir "${tx?.description || 'este lançamento'}"?`,
      type: 'transaction',
    });
  };

  const handleRequestDeleteInstallment = (id: string) => {
    const inst = installments.find((i) => i.id === id);
    setDeleteModalState({
      isOpen: true,
      id,
      title: 'Excluir Parcela',
      description: `Deseja excluir "${inst?.description || 'esta parcela'}"? Ela não será mais lançada a partir de ${formatMonthYear(currentYearMonth)} e nos meses seguintes.`,
      type: 'installment',
    });
  };

  const handleRequestDeleteGoal = (id: string) => {
    const goal = goals.find((g) => g.id === id);
    setDeleteModalState({
      isOpen: true,
      id,
      title: 'Excluir Meta',
      description: `Tem certeza que deseja excluir o objetivo "${goal?.title || 'esta meta'}"?`,
      type: 'goal',
    });
  };

  const handleRequestDeleteBudget = (id: string) => {
    const b = budgets.find((item) => item.id === id);
    const cat = categories.find((c) => c.id === b?.categoryId);
    setDeleteModalState({
      isOpen: true,
      id,
      title: 'Excluir Teto de Gastos',
      description: `Deseja remover o teto de gastos da categoria "${cat?.name || 'selecionada'}"?`,
      type: 'budget',
    });
  };

  // Propagate deletions to all subsequent months as requested:
  // "Ao Excluir uma despesa fixa ou uma parcela no mês atual, os meses subsequentes devem ser atualizados também, seguindo o mês atual"
  const handleConfirmDelete = () => {
    const { id, type } = deleteModalState;
    if (type === 'transaction') {
      setTransactions((prev) =>
        prev
          .map((t) => {
            if (t.id === id) {
              if (t.isFixed) {
                // Se a despesa foi criada exatamente no mês atual ou posterior, remove ou marca deletedFromMonthYear
                const startMonth = t.startMonthYear || t.date.slice(0, 7);
                if (currentYearMonth <= startMonth) {
                  dbOperations.deleteTransaction(id, currentUser?.id).catch(console.error);
                  return null; // Removida completamente
                }
                // Despesa fixa: cancelada a partir deste mês (e meses subsequentes)
                const updated = { ...t, deletedFromMonthYear: currentYearMonth };
                if (currentUser) dbOperations.saveTransaction(updated, currentUser.id).catch(console.error);
                return updated;
              }
              // Transação variável: remove
              dbOperations.deleteTransaction(id, currentUser?.id).catch(console.error);
              return null;
            }
            return t;
          })
          .filter(Boolean) as Transaction[]
      );
    } else if (type === 'installment') {
      const target = installments.find((inst) => inst.id === id);
      const startMonth = target?.competence || '';
      if (!target || !startMonth || currentYearMonth <= startMonth) {
        dbOperations.deleteInstallment(id, currentUser?.id).catch(console.error);
        setInstallments((prev) => prev.filter((inst) => inst.id !== id));
      } else {
        setInstallments((prev) =>
          prev.map((inst) => {
            if (inst.id === id) {
              const updated = { ...inst, deletedFromMonthYear: currentYearMonth };
              if (currentUser) dbOperations.saveInstallment(updated, currentUser.id).catch(console.error);
              return updated;
            }
            return inst;
          })
        );
      }
    } else if (type === 'goal') {
      dbOperations.deleteGoal(id, currentUser?.id).catch(console.error);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } else if (type === 'budget') {
      dbOperations.deleteBudget(id, currentUser?.id).catch(console.error);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    }
    setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleToggleStatus = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const currentStatus = t.paidMonths?.includes(currentYearMonth)
          ? 'completed'
          : currentYearMonth === (t.startMonthYear || t.date.slice(0, 7))
          ? t.status
          : 'pending';
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

        const updatedPaidMonths = newStatus === 'completed'
          ? Array.from(new Set([...(t.paidMonths || []), currentYearMonth]))
          : (t.paidMonths || []).filter((m) => m !== currentYearMonth);

        return {
          ...t,
          status: currentYearMonth === (t.startMonthYear || t.date.slice(0, 7)) ? newStatus : t.status,
          paidMonths: updatedPaidMonths,
        };
      })
    );
  };

  // Fixed Expenses bulk toggles
  const handleMarkAllFixedPaid = () => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (!t.isFixed || (t.deletedFromMonthYear && currentYearMonth >= t.deletedFromMonthYear)) return t;
        const baseMonth = t.startMonthYear || t.date.slice(0, 7);
        if (currentYearMonth < baseMonth) return t;
        return {
          ...t,
          status: currentYearMonth === baseMonth ? 'completed' : t.status,
          paidMonths: Array.from(new Set([...(t.paidMonths || []), currentYearMonth])),
        };
      })
    );
  };

  const handleMarkAllFixedPending = () => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (!t.isFixed) return t;
        const baseMonth = t.startMonthYear || t.date.slice(0, 7);
        return {
          ...t,
          status: currentYearMonth === baseMonth ? 'pending' : t.status,
          paidMonths: (t.paidMonths || []).filter((m) => m !== currentYearMonth),
        };
      })
    );
  };

  // Handlers for Debt Installments
  const handleOpenNewInstallment = () => {
    setEditingInstallment(null);
    setIsInstallmentModalOpen(true);
  };

  const handleEditInstallment = (item: DebtInstallment) => {
    setEditingInstallment(item);
    setIsInstallmentModalOpen(true);
  };

  const handleSaveInstallment = (
    data: Omit<DebtInstallment, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setInstallments((prev) =>
        prev.map((item) => (item.id === existingId ? { ...item, ...data } : item))
      );
    } else {
      const newItem: DebtInstallment = {
        ...data,
        id: `inst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        competence: currentYearMonth,
        createdAt: Date.now(),
      };
      setInstallments((prev) => [newItem, ...prev]);
    }
  };

  const handleToggleInstallmentStatus = (id: string) => {
    setInstallments((prev) =>
      prev.map((inst) => {
        if (inst.id !== id) return inst;
        const isPaidInMonth = inst.paidMonths?.includes(currentYearMonth) || (currentYearMonth === inst.competence && inst.status === 'completed');
        const nextStatus = isPaidInMonth ? 'pending' : 'completed';
        const updatedPaidMonths = nextStatus === 'completed'
          ? Array.from(new Set([...(inst.paidMonths || []), currentYearMonth]))
          : (inst.paidMonths || []).filter((m) => m !== currentYearMonth);

        return {
          ...inst,
          status: currentYearMonth === inst.competence ? nextStatus : inst.status,
          paidMonths: updatedPaidMonths,
        };
      })
    );
  };

  const handleAdvanceInstallment = (id: string) => {
    setInstallments((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextInstallment = Math.min(item.totalInstallments, item.currentInstallment + 1);
        return {
          ...item,
          currentInstallment: nextInstallment,
          status: 'completed',
        };
      })
    );
  };

  // Selection from NewLaunchSheet
  const handleSelectNewLaunchType = (type: 'fixed' | 'installment' | 'income' | 'variable') => {
    switch (type) {
      case 'fixed':
        handleOpenNewTransaction('expense', true);
        break;
      case 'installment':
        handleOpenNewInstallment();
        break;
      case 'income':
        handleOpenNewTransaction('income', false);
        break;
      case 'variable':
        handleOpenNewTransaction('expense', false);
        break;
    }
  };

  // Handlers for Budgets (Teto)
  const handleSaveBudget = (budget: Budget) => {
    setBudgets((prev) => {
      const exists = prev.some((b) => b.id === budget.id);
      if (exists) {
        return prev.map((b) => (b.id === budget.id ? budget : b));
      }
      return [...prev, budget];
    });
  };

  // Handlers for Savings Goals (Metas)
  const handleAddGoal = (goalData: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const handleEditGoal = (updatedGoal: SavingsGoal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
  };

  const handleUpdateGoalAmount = (goalId: string, addedAmount: number) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, currentAmount: Math.max(0, g.currentAmount + addedAmount) }
          : g
      )
    );
  };

  // Category Manager Handlers (Despesas, Parcelas, Receitas)
  const handleAddCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const handleEditCategory = (id: string, updated: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
  };

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    const catName = cat ? cat.name : id;
    const isUsed =
      transactions.some((t) => t.categoryId === id || t.categoryId === catName) ||
      budgets.some((b) => b.categoryId === id) ||
      installments.some((i) => i.category === catName || i.category === id);
    if (isUsed) return;
    dbOperations.deleteCategory(id, currentUser?.id).catch(console.error);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddParcelCategory = (name: string) => {
    if (!parcelCategories.includes(name)) {
      setParcelCategories((prev) => [...prev, name]);
    }
  };

  const handleEditParcelCategory = (oldName: string, newName: string) => {
    setParcelCategories((prev) =>
      prev.map((cat) => (cat === oldName ? newName : cat))
    );
    setInstallments((prev) =>
      prev.map((inst) =>
        inst.category === oldName ? { ...inst, category: newName } : inst
      )
    );
  };

  const handleDeleteParcelCategory = (name: string) => {
    const isUsed =
      installments.some((i) => i.category === name) ||
      transactions.some((t) => t.categoryId === name);
    if (isUsed) return;
    setParcelCategories((prev) => prev.filter((cat) => cat !== name));
  };

  const handleImportData = (data: {
    transactions?: Transaction[];
    categories?: Category[];
    budgets?: Budget[];
    goals?: SavingsGoal[];
    installments?: DebtInstallment[];
  }) => {
    if (data.transactions) setTransactions(data.transactions);
    if (data.categories) setCategories(data.categories);
    if (data.budgets) setBudgets(data.budgets);
    if (data.goals) setGoals(data.goals);
    if (data.installments) setInstallments(data.installments);
  };

  if (isInitializing) {
    return <SplashScreen message="Inicializando Carteira & Finanças..." />;
  }

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} isDarkMode={isDarkMode} />;
  }

  return (
    <MobileFrame activeTab={activeTab}>
      
      {/* Mobile App Header with Month Selector Dropdown, Dark Mode & Categories */}
      <MobileHeader
        user={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        currentYearMonth={currentYearMonth}
        onMonthChange={setCurrentYearMonth}
        summary={monthlySummary}
        overallBalance={overallBalance}
        isBalanceHidden={isBalanceHidden}
        onToggleBalancePrivacy={handleToggleBalancePrivacy}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenCategoryManager={() => handleOpenCategoryManager('fixed')}
        onOpenNewTransaction={() => setIsNewLaunchSheetOpen(true)}
        onOpenExportImport={() => setIsExportModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSyncCloud={handleSyncCloud}
        isSyncing={isSyncing}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          const scrollEl = document.getElementById('smartphone-content-scroll') || document.getElementById('smartphone-screen');
          if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Mobile Screen Viewport */}
      <div id="mobile-viewport-content" className="flex-1 px-3 py-2.5 space-y-3 max-w-full overflow-x-hidden">
        
        {/* Tab 1: Início (Dashboard / Resumo) */}
        {activeTab === 'overview' && (
          <div id="view-mobile-overview" className="space-y-3 animate-in fade-in duration-200">
            {/* Executive Indicator Cards with Financial Diagnosis */}
            <SummaryCards 
              summary={monthlySummary} 
              overallBalance={overallBalance} 
              isBalanceHidden={isBalanceHidden}
              onNavigateToFixed={() => setActiveTab('fixed')}
              onNavigateToInstallments={() => setActiveTab('installments')}
            />

            {/* Financial Charts (Evolution & Categories) */}
            <FinancialCharts
              transactions={currentMonthTransactions}
              categories={categories}
              currentYearMonth={currentYearMonth}
            />

            {/* Recent Transactions List with Quick Actions */}
            <div className="pt-0.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  Movimentações no Mês
                </span>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition-colors"
                >
                  Ver Extrato Completo →
                </button>
              </div>

              <TransactionList
                transactions={currentMonthTransactions}
                categories={categories}
                currentYearMonth={currentYearMonth}
                onEdit={handleEditTransaction}
                onDelete={handleRequestDeleteTransaction}
                onToggleStatus={handleToggleStatus}
                onOpenNewTransaction={() => setIsNewLaunchSheetOpen(true)}
                isBalanceHidden={isBalanceHidden}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Despesas Fixas (Moradia, Alimentação, Educação, Assinaturas, etc.) */}
        {activeTab === 'fixed' && (
          <div id="view-mobile-fixed-expenses" className="space-y-3 animate-in fade-in duration-200">
            <FixedExpensesSection
              transactions={currentMonthTransactions}
              categories={categories}
              currentYearMonth={currentYearMonth}
              onOpenAddModal={() => handleOpenNewTransaction('expense', true)}
              onEdit={handleEditTransaction}
              onDelete={handleRequestDeleteTransaction}
              onToggleStatus={handleToggleStatus}
              onMarkAllFixedPaid={handleMarkAllFixedPaid}
              onMarkAllFixedPending={handleMarkAllFixedPending}
              isBalanceHidden={isBalanceHidden}
            />
          </div>
        )}

        {/* Tab 3: Parcelas e Dívidas (Contratos, Empréstimos, Renegociações) */}
        {activeTab === 'installments' && (
          <div id="view-mobile-installments" className="space-y-3 animate-in fade-in duration-200">
            <InstallmentsSection
              installments={installments}
              currentYearMonth={currentYearMonth}
              onOpenAddModal={handleOpenNewInstallment}
              onEdit={handleEditInstallment}
              onDelete={handleRequestDeleteInstallment}
              onToggleStatus={handleToggleInstallmentStatus}
              onAdvanceInstallment={handleAdvanceInstallment}
              isBalanceHidden={isBalanceHidden}
            />
          </div>
        )}

        {/* Tab 4: Extrato / Tetos / Metas */}
        {(activeTab === 'transactions' || activeTab === 'budgets' || activeTab === 'goals') && (
          <div id="view-mobile-planning-hub" className="space-y-3 animate-in fade-in duration-200">
            
            {/* Segmented Sub-Tab Switcher (Extrato / Tetos / Metas) */}
            <div className="bg-neutral-200/80 dark:bg-neutral-800/80 p-1 rounded-2xl flex items-center gap-1 shadow-inner transition-colors">
              <button
                id="subtab-transactions"
                onClick={() => setPlanningSubTab('transactions')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  planningSubTab === 'transactions'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Extrato</span>
              </button>

              <button
                id="subtab-budgets"
                onClick={() => setPlanningSubTab('budgets')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  planningSubTab === 'budgets'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Tetos</span>
              </button>

              <button
                id="subtab-goals"
                onClick={() => setPlanningSubTab('goals')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  planningSubTab === 'goals'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <PiggyBank className="w-3.5 h-3.5" />
                <span>Metas</span>
              </button>
            </div>

            {/* Sub-view Content */}
            {planningSubTab === 'transactions' && (
              <div className="space-y-4">
                <TransactionList
                  transactions={currentMonthTransactions}
                  categories={categories}
                  currentYearMonth={currentYearMonth}
                  onEdit={handleEditTransaction}
                  onDelete={handleRequestDeleteTransaction}
                  onToggleStatus={handleToggleStatus}
                  onOpenNewTransaction={() => setIsNewLaunchSheetOpen(true)}
                  isBalanceHidden={isBalanceHidden}
                />
              </div>
            )}

            {planningSubTab === 'budgets' && (
              <div className="space-y-4">
                <BudgetsSection
                  budgets={budgets}
                  categories={categories}
                  transactions={currentMonthTransactions}
                  currentYearMonth={currentYearMonth}
                  onSaveBudget={handleSaveBudget}
                  onDeleteBudget={handleRequestDeleteBudget}
                  onOpenCategoryManager={handleOpenCategoryManager}
                />
              </div>
            )}

            {planningSubTab === 'goals' && (
              <div className="space-y-4">
                <SavingsGoalsSection
                  goals={goals}
                  onAddGoal={handleAddGoal}
                  onEditGoal={handleEditGoal}
                  onUpdateGoalAmount={handleUpdateGoalAmount}
                  onDeleteGoal={handleRequestDeleteGoal}
                />
              </div>
            )}

          </div>
        )}

      </div>

      {/* Fixed Mobile Bottom Tab Bar with Center FAB */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          const scrollEl = document.getElementById('smartphone-content-scroll') || document.getElementById('smartphone-screen');
          if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenNewTransaction={() => setIsNewLaunchSheetOpen(true)}
        pendingCount={pendingCount}
      />

      {/* Bottom Sheet Menu: Choose what to add (Fixa, Parcela, Renda, Variável) */}
      <NewLaunchSheet
        isOpen={isNewLaunchSheetOpen}
        onClose={() => setIsNewLaunchSheetOpen(false)}
        onSelectFixedExpense={() => handleSelectNewLaunchType('fixed')}
        onSelectInstallment={() => handleSelectNewLaunchType('installment')}
        onSelectIncome={() => handleSelectNewLaunchType('income')}
        onSelectVariableExpense={() => handleSelectNewLaunchType('variable')}
      />

      {/* Mobile Modal: Transaction Form (Income / Expense / Fixed) */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        categories={categories}
        existingTransactions={transactions}
        initialData={editingTransaction}
        initialType={txModalInitialType}
        isFixedDefault={txModalIsFixedDefault}
        onOpenCategoryManager={handleOpenCategoryManager}
      />

      {/* Mobile Modal: Debt Installment Form */}
      <InstallmentModal
        isOpen={isInstallmentModalOpen}
        onClose={() => {
          setIsInstallmentModalOpen(false);
          setEditingInstallment(null);
        }}
        onSave={handleSaveInstallment}
        existingInstallments={installments}
        initialData={editingInstallment}
        competence={currentYearMonth}
        parcelCategories={parcelCategories}
        onOpenCategoryManager={handleOpenCategoryManager}
      />

      {/* Modal: Category Manager (Fixed, Installments, Income) */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        parcelCategories={parcelCategories}
        initialTab={categoryModalInitialTab}
        transactions={transactions}
        installments={installments}
        budgets={budgets}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        onAddParcelCategory={handleAddParcelCategory}
        onEditParcelCategory={handleEditParcelCategory}
        onDeleteParcelCategory={handleDeleteParcelCategory}
      />

      {/* Mobile Bottom Sheet: Export / Import Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        userId={currentUser?.id}
        transactions={transactions}
        categories={categories}
        budgets={budgets}
        goals={goals}
        installments={installments}
        currentYearMonth={currentYearMonth}
        monthTransactions={currentMonthTransactions}
        onImportData={handleImportData}
      />

      {/* Reusable Delete Confirmation Dialog (non-blocking) */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        title={deleteModalState.title}
        description={deleteModalState.description}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onUpdateUser={(updatedUser) => setCurrentUser(updatedUser)}
        onLogout={handleLogout}
      />

      {/* PWA Offline Toast */}
      <OfflineIndicator />

    </MobileFrame>
  );
};

export default App;
