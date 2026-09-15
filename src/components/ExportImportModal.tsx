import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  AlertTriangle, 
  Check, 
  Cloud, 
  RefreshCw,
  CloudOff
} from 'lucide-react';
import { Transaction, Category, Budget, SavingsGoal, DebtInstallment } from '../types';
import { downloadCSV, downloadJSON } from '../utils/formatters';
import { getComputedInstallment } from '../utils/installmentHelpers';
import { FirestoreSyncService } from '../services/firestoreSyncService';
import { localDb } from '../db/localDatabase';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: SavingsGoal[];
  installments?: DebtInstallment[];
  currentYearMonth?: string;
  monthTransactions?: Transaction[];
  onImportData: (data: {
    transactions?: Transaction[];
    categories?: Category[];
    budgets?: Budget[];
    goals?: SavingsGoal[];
    installments?: DebtInstallment[];
  }) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  userId,
  transactions,
  categories,
  budgets,
  goals,
  installments = [],
  currentYearMonth,
  monthTransactions,
  onImportData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncState, setSyncState] = useState<{
    status: 'synced' | 'pending' | 'offline' | 'loading';
    pendingCount: number;
    lastSyncTimeText: string | null;
  }>({
    status: 'loading',
    pendingCount: 0,
    lastSyncTimeText: null,
  });

  const loadSyncStatus = useCallback(async () => {
    if (!userId) {
      setSyncState({
        status: 'offline',
        pendingCount: 0,
        lastSyncTimeText: null,
      });
      return;
    }
    try {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const st = await FirestoreSyncService.getSyncStatus(userId);
      const lastSyncSetting = await localDb.settings.get(`user_${userId}_lastSyncTimestamp`);
      let formattedLastSync: string | null = null;
      if (lastSyncSetting?.value) {
        const d = new Date(Number(lastSyncSetting.value));
        if (!isNaN(d.getTime())) {
          formattedLastSync = d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }

      if (!isOnline) {
        setSyncState({
          status: 'offline',
          pendingCount: st.pendingCount,
          lastSyncTimeText: formattedLastSync,
        });
      } else if (st.pendingCount > 0) {
        setSyncState({
          status: 'pending',
          pendingCount: st.pendingCount,
          lastSyncTimeText: formattedLastSync,
        });
      } else {
        setSyncState({
          status: 'synced',
          pendingCount: 0,
          lastSyncTimeText: formattedLastSync,
        });
      }
    } catch {
      setSyncState({
        status: 'synced',
        pendingCount: 0,
        lastSyncTimeText: null,
      });
    }
  }, [userId]);

  // Clear feedback and refresh sync status whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      loadSyncStatus();
    }
  }, [isOpen, loadSyncStatus]);

  // Auto-dismiss feedback message after 3 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleClose = () => {
    setFeedback(null);
    onClose();
  };

  // Month to use for CSV: currentYearMonth if provided, else today's month
  const activeMonth = currentYearMonth || new Date().toISOString().slice(0, 7);

  // Transactions to export to CSV: monthTransactions or transactions of activeMonth
  const csvTransactions = monthTransactions || transactions.filter(t => t.date.startsWith(activeMonth));

  // Active installments for this specific month
  const activeInstallmentsCount = installments
    .map(i => getComputedInstallment(i, activeMonth))
    .filter(ci => ci.isActive).length;

  const totalMonthlyItems = csvTransactions.length + activeInstallmentsCount;

  const handleExportCSV = () => {
    downloadCSV(csvTransactions, categories, activeMonth, installments);
    setFeedback({ 
      type: 'success', 
      message: `Relatório CSV do mês ${activeMonth} (${totalMonthlyItems} lançamentos: avulsas, fixas e parcelas) exportado com sucesso!` 
    });
  };

  const handleExportJSON = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const backupTransactions = transactions.filter(t => t.date <= todayStr);

    const backup = {
      version: '1.3',
      exportedAt: new Date().toISOString(),
      coverage: {
        upToDate: todayStr,
        upToMonth: activeMonth,
      },
      transactions: backupTransactions,
      categories,
      budgets,
      goals,
      installments,
    };
    downloadJSON(backup, `backup-gestao-financeira-ate-${todayStr}.json`);
    setFeedback({ 
      type: 'success', 
      message: `Backup JSON gerado com sucesso contendo todos os dados até ${todayStr} (${backupTransactions.length} transações)!` 
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          onImportData(parsed);
          setFeedback({
            type: 'success',
            message: `Backup restaurado: ${parsed.transactions.length} transações importadas com sucesso!`,
          });
        } else {
          setFeedback({ type: 'error', message: 'Formato de arquivo JSON inválido para este aplicativo.' });
        }
      } catch {
        setFeedback({ type: 'error', message: 'Erro ao analisar o arquivo JSON selecionado.' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualCloudSync = async () => {
    if (!userId) {
      setFeedback({ type: 'error', message: 'Faça login para sincronizar com a nuvem.' });
      return;
    }
    setIsSyncingCloud(true);
    try {
      const result = await FirestoreSyncService.fullSync(userId);
      if (result.success) {
        setFeedback({
          type: 'success',
          message: `Sincronização concluída! Enviados: ${result.uploadedCount}, Baixados da nuvem: ${result.downloadedCount}.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'Falha ao sincronizar com o Firebase.',
        });
      }
      await loadSyncStatus();
    } catch {
      setFeedback({ type: 'error', message: 'Erro inesperado na sincronização com a nuvem.' });
      await loadSyncStatus();
    } finally {
      setIsSyncingCloud(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="modal-backdrop-export" 
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            id="modal-card-export"
            className="bg-white dark:bg-neutral-900 rounded-t-[28px] w-full shadow-2xl border-t border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[85%]"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-2 shrink-0" />

            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Backup, Exportação e Dados
              </h3>
              <button
                id="btn-close-export-modal"
                onClick={handleClose}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto space-y-3.5 text-xs flex-1">
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={`p-3 rounded-xl flex items-center justify-between gap-2 font-medium ${
                      feedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {feedback.type === 'success' ? <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />}
                      <span className="leading-snug">{feedback.message}</span>
                    </div>
                    <button 
                      onClick={() => setFeedback(null)}
                      className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status de Sincronização em Nuvem */}
              <div
                id="card-cloud-sync-status-export"
                className={`p-3.5 rounded-2xl border transition-all ${
                  syncState.status === 'synced'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60'
                    : syncState.status === 'pending'
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/60'
                    : syncState.status === 'offline'
                    ? 'bg-neutral-100/80 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700/80'
                    : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/60 dark:border-neutral-700/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      syncState.status === 'synced'
                        ? 'bg-emerald-600 text-white'
                        : syncState.status === 'pending'
                        ? 'bg-amber-500 text-white'
                        : syncState.status === 'offline'
                        ? 'bg-neutral-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {syncState.status === 'offline' ? (
                        <CloudOff className="w-4 h-4" />
                      ) : syncState.status === 'pending' ? (
                        <RefreshCw className="w-4 h-4" />
                      ) : (
                        <Cloud className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                          {syncState.status === 'synced' && 'Nuvem Sincronizada'}
                          {syncState.status === 'pending' && `${syncState.pendingCount} Lançamento(s) Pendente(s)`}
                          {syncState.status === 'offline' && 'Modo Offline (Sem Conexão)'}
                          {syncState.status === 'loading' && 'Verificando Nuvem...'}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          syncState.status === 'synced'
                            ? 'bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                            : syncState.status === 'pending'
                            ? 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}>
                          {syncState.status === 'synced' ? 'Online' : syncState.status === 'pending' ? 'Aguardando Envio' : 'Offline'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                        {syncState.status === 'synced'
                          ? (syncState.lastSyncTimeText ? `Última sincronização: ${syncState.lastSyncTimeText}` : 'Todos os dados locais estão salvos na nuvem')
                          : syncState.status === 'pending'
                          ? 'Clique ao lado para sincronizar os dados pendentes'
                          : 'As alterações estão salvas no aparelho e sincronizarão ao reconectar'}
                      </p>
                    </div>
                  </div>

                  {userId && (
                    <button
                      id="btn-quick-sync-export-header"
                      onClick={handleManualCloudSync}
                      disabled={isSyncingCloud}
                      title="Sincronizar dados agora com o Firebase Firestore"
                      className="px-2.5 py-1.5 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin text-emerald-500' : ''}`} />
                      <span>{isSyncingCloud ? 'Sincronizando' : 'Sincronizar'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Export options */}
              <div className="space-y-2.5">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300 block uppercase tracking-wider text-[11px]">
                  Exportar Dados
                </span>

                <button
                  id="btn-export-csv-action"
                  onClick={handleExportCSV}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Planilha CSV do Mês ({activeMonth})</h4>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium ${
                          syncState.status === 'synced'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${syncState.status === 'synced' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {syncState.status === 'synced' ? 'Nuvem Atualizada' : `${syncState.pendingCount} Pendente(s)`}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Exporta {totalMonthlyItems} lançamentos (despesas avulsas, fixas e parcelas)</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                </button>

                <button
                  id="btn-export-json-action"
                  onClick={handleExportJSON}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Backup Histórico (JSON)</h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Salva todos os dados históricos acumulados até hoje</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                </button>
              </div>

              {/* Import options */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300 block uppercase tracking-wider text-[11px]">
                  Importar & Restauração
                </span>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />

                <button
                  id="btn-import-json-action"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Restaurar de arquivo JSON</h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Recuperar dados previamente salvos</p>
                    </div>
                  </div>
                  <Upload className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                </button>
              </div>

              {/* Cloud Sync (Firebase) */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300 block uppercase tracking-wider text-[11px]">
                  Sincronização em Nuvem (Firebase)
                </span>

                <button
                  id="btn-sync-firebase-action"
                  onClick={handleManualCloudSync}
                  disabled={isSyncingCloud}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                        {isSyncingCloud ? 'Sincronizando com Firestore...' : 'Sincronizar com a Nuvem Agora'}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Envia alterações locais e baixa registros salvos do Firestore
                      </p>
                    </div>
                  </div>
                  <RefreshCw className={`w-4 h-4 text-neutral-400 dark:text-neutral-500 ${isSyncingCloud ? 'animate-spin text-emerald-500' : ''}`} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
