import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  CloudOff,
  FolderDown,
  FolderOpen,
  Share2,
  Paperclip,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Transaction, Category, Budget, SavingsGoal, DebtInstallment, ReceiptAttachment } from '../types';
import { downloadCSV, downloadJSON, buildCSVContent, formatMonthYearUppercase } from '../utils/formatters';
import { shareFile, saveAttachmentFile } from '../utils/fileSaver';
import { getComputedInstallment } from '../utils/installmentHelpers';
import { FirestoreSyncService } from '../services/firestoreSyncService';
import { localDb } from '../db/localDatabase';
import { APP_VERSION } from '../version';

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
  const [isSavingCSV, setIsSavingCSV] = useState(false);
  const [isSavingJSON, setIsSavingJSON] = useState(false);
  const [isSavingReceipts, setIsSavingReceipts] = useState(false);
  const [showReceiptsList, setShowReceiptsList] = useState(false);
  const [syncState, setSyncState] = useState<{
    status: 'synced' | 'pending' | 'offline' | 'loading';
    pendingCount: number;
    lastSyncTimeText: string | null;
  }>({
    status: 'loading',
    pendingCount: 0,
    lastSyncTimeText: null,
  });

  // Lista de todos os comprovantes anexados para backup exclusivo
  const allAttachments = useMemo(() => {
    const list: Array<{
      id: string;
      source: 'transaction' | 'installment';
      sourceType: string;
      description: string;
      dateOrCompetence: string;
      amount: number;
      attachment: ReceiptAttachment;
    }> = [];

    transactions.forEach((t) => {
      const atts: ReceiptAttachment[] = (t.attachments && t.attachments.length > 0)
        ? t.attachments
        : t.attachment ? [t.attachment] : [];

      atts.forEach((att, idx) => {
        list.push({
          id: `${t.id}_att_${idx}`,
          source: 'transaction',
          sourceType: t.type === 'income' ? 'Receita' : t.isFixed ? 'Despesa Fixa' : 'Despesa Variável',
          description: atts.length > 1 ? `${t.description} (${idx + 1}/${atts.length})` : t.description,
          dateOrCompetence: t.date,
          amount: t.amount,
          attachment: att,
        });
      });
    });

    installments.forEach((i) => {
      const atts: ReceiptAttachment[] = (i.attachments && i.attachments.length > 0)
        ? i.attachments
        : i.attachment ? [i.attachment] : [];

      atts.forEach((att, idx) => {
        list.push({
          id: `${i.id}_att_${idx}`,
          source: 'installment',
          sourceType: `Parcelamento (${i.currentInstallment}/${i.totalInstallments})`,
          description: atts.length > 1 ? `${i.description} (${idx + 1}/${atts.length})` : i.description,
          dateOrCompetence: i.competence,
          amount: i.monthlyAmount,
          attachment: att,
        });
      });
    });

    return list;
  }, [transactions, installments]);

  const totalAttachmentsBytes = useMemo(() => {
    return allAttachments.reduce((sum, item) => sum + (item.attachment.size || 0), 0);
  }, [allAttachments]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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

  const handleExportCSV = async (chooseFolder = false) => {
    setIsSavingCSV(true);
    try {
      const res = await downloadCSV(csvTransactions, categories, activeMonth, installments, { chooseFolder });
      if (res.success) {
        setFeedback({ 
          type: 'success', 
          message: res.message || `Relatório CSV do mês ${activeMonth} salvo com sucesso!` 
        });
      } else {
        setFeedback({ 
          type: 'error', 
          message: res.message || 'Operação cancelada.' 
        });
      }
    } catch (err: unknown) {
      setFeedback({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Erro ao exportar CSV.' 
      });
    } finally {
      setIsSavingCSV(false);
    }
  };

  const handleShareCSV = async () => {
    setIsSavingCSV(true);
    try {
      const content = buildCSVContent(csvTransactions, categories, activeMonth, installments);
      const fileName = `gestao-financeira-${activeMonth}.csv`;
      const res = await shareFile({
        fileName,
        content,
        mimeType: 'text/csv',
      });
      if (res.success) {
        setFeedback({ 
          type: 'success', 
          message: 'Menu de compartilhamento aberto com sucesso!' 
        });
      } else {
        setFeedback({ 
          type: 'error', 
          message: res.message || 'Não foi possível compartilhar.' 
        });
      }
    } catch (err: unknown) {
      setFeedback({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Erro ao compartilhar CSV.' 
      });
    } finally {
      setIsSavingCSV(false);
    }
  };

  const handleExportJSON = async (chooseFolder = false) => {
    setIsSavingJSON(true);
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
    const fileName = `backup-gestao-financeira-ate-${todayStr}.json`;

    try {
      const res = await downloadJSON(backup, fileName, { chooseFolder });
      if (res.success) {
        setFeedback({ 
          type: 'success', 
          message: res.message || `Backup JSON gerado com sucesso!` 
        });
      } else {
        setFeedback({ 
          type: 'error', 
          message: res.message || 'Operação cancelada.' 
        });
      }
    } catch (err: unknown) {
      setFeedback({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Erro ao exportar Backup JSON.' 
      });
    } finally {
      setIsSavingJSON(false);
    }
  };

  const handleShareJSON = async () => {
    setIsSavingJSON(true);
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
    const fileName = `backup-gestao-financeira-ate-${todayStr}.json`;

    try {
      const res = await shareFile({
        fileName,
        content: JSON.stringify(backup, null, 2),
        mimeType: 'application/json',
      });
      if (res.success) {
        setFeedback({ 
          type: 'success', 
          message: 'Menu de compartilhamento aberto com sucesso!' 
        });
      } else {
        setFeedback({ 
          type: 'error', 
          message: res.message || 'Não foi possível compartilhar.' 
        });
      }
    } catch (err: unknown) {
      setFeedback({ 
        type: 'error', 
        message: err instanceof Error ? err.message : 'Erro ao compartilhar Backup JSON.' 
      });
    } finally {
      setIsSavingJSON(false);
    }
  };

  const handleExportReceiptsBackup = async (chooseFolder = false) => {
    if (allAttachments.length === 0) {
      setFeedback({ type: 'error', message: 'Nenhum comprovante anexado para exportar.' });
      return;
    }
    setIsSavingReceipts(true);
    const todayStr = new Date().toISOString().slice(0, 10);
    const backupData = {
      version: '1.0',
      type: 'receipts_backup',
      exportedAt: new Date().toISOString(),
      totalAttachments: allAttachments.length,
      totalBytes: totalAttachmentsBytes,
      items: allAttachments,
    };
    const fileName = `backup-comprovantes-gestao-financeira-${todayStr}.json`;

    try {
      const res = await downloadJSON(backupData, fileName, { chooseFolder });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || `Backup de ${allAttachments.length} comprovante(s) salvo com sucesso!`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Operação cancelada.',
        });
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao exportar backup de comprovantes.',
      });
    } finally {
      setIsSavingReceipts(false);
    }
  };

  const handleShareReceiptsBackup = async () => {
    if (allAttachments.length === 0) {
      setFeedback({ type: 'error', message: 'Nenhum comprovante anexado para compartilhar.' });
      return;
    }
    setIsSavingReceipts(true);
    const todayStr = new Date().toISOString().slice(0, 10);
    const backupData = {
      version: '1.0',
      type: 'receipts_backup',
      exportedAt: new Date().toISOString(),
      totalAttachments: allAttachments.length,
      totalBytes: totalAttachmentsBytes,
      items: allAttachments,
    };
    const fileName = `backup-comprovantes-gestao-financeira-${todayStr}.json`;

    try {
      const res = await shareFile({
        fileName,
        content: JSON.stringify(backupData, null, 2),
        mimeType: 'application/json',
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Menu de compartilhamento aberto com sucesso!',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Não foi possível compartilhar.',
        });
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao compartilhar backup de comprovantes.',
      });
    } finally {
      setIsSavingReceipts(false);
    }
  };

  const handleDownloadSingleAttachment = async (att: ReceiptAttachment) => {
    try {
      const res = await saveAttachmentFile(att);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || `Arquivo "${att.name}" salvo com sucesso!`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Não foi possível baixar o comprovante.',
        });
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao salvar comprovante.',
      });
    }
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
            className="bg-white dark:bg-[#152238] rounded-t-[32px] sm:rounded-[32px] sm:max-w-lg w-full shadow-2xl border border-slate-200/90 dark:border-slate-700/80 overflow-hidden flex flex-col max-h-[88%] text-slate-900 dark:text-slate-100"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 shrink-0 sm:hidden" />

            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/60 dark:bg-[#111c2e]/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FolderDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Backup, Exportação e Dados
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Gerencie seus dados e sincronização
                  </p>
                </div>
              </div>
              <button
                id="btn-close-export-modal"
                onClick={handleClose}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
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
              <div className="space-y-3">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300 block uppercase tracking-wider text-[11px]">
                  Exportar & Salvar Arquivos
                </span>

                {/* Planilha CSV */}
                <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                        Planilha CSV do Mês ({formatMonthYearUppercase(activeMonth)})
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {totalMonthlyItems} lançamentos para abrir no Excel ou Google Planilhas.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                    <button
                      id="btn-export-csv-download-folder"
                      onClick={() => handleExportCSV(false)}
                      disabled={isSavingCSV}
                      title="Salvar diretamente na pasta Download do telefone"
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-[11px] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                      <span>{isSavingCSV ? 'Salvando...' : 'Salvar em Downloads'}</span>
                    </button>

                    <button
                      id="btn-export-csv-choose-folder"
                      onClick={() => handleExportCSV(true)}
                      disabled={isSavingCSV}
                      title="Escolher a pasta do telefone onde salvar"
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 active:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Escolher Pasta</span>
                    </button>

                    <button
                      id="btn-export-csv-share"
                      onClick={handleShareCSV}
                      disabled={isSavingCSV}
                      title="Compartilhar via WhatsApp, Drive ou Email"
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 active:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-medium text-[11px] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Compartilhar</span>
                    </button>
                  </div>
                </div>

                {/* Backup JSON */}
                <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                        Backup Histórico Completo (JSON)
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Salva todos os dados históricos acumulados até hoje para segurança e restauração.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                    <button
                      id="btn-export-json-download-folder"
                      onClick={() => handleExportJSON(false)}
                      disabled={isSavingJSON}
                      title="Salvar diretamente na pasta Download do telefone"
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-[11px] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                      <span>{isSavingJSON ? 'Salvando...' : 'Salvar em Downloads'}</span>
                    </button>

                    <button
                      id="btn-export-json-choose-folder"
                      onClick={() => handleExportJSON(true)}
                      disabled={isSavingJSON}
                      title="Escolher a pasta do telefone onde salvar"
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 active:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Escolher Pasta</span>
                    </button>

                    <button
                      id="btn-export-json-share"
                      onClick={handleShareJSON}
                      disabled={isSavingJSON}
                      title="Compartilhar via WhatsApp, Drive ou Email"
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 active:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-medium text-[11px] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Compartilhar</span>
                    </button>
                  </div>
                </div>

                {/* Backup de Comprovantes & Anexos */}
                <div
                  id="card-receipts-backup-export"
                  className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                            Backup de Comprovantes & Anexos
                          </h4>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                            {allAttachments.length} {allAttachments.length === 1 ? 'anexo' : 'anexos'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {allAttachments.length > 0
                            ? `${allAttachments.length} comprovante(s) totalizando ${formatBytes(totalAttachmentsBytes)}. Salvos localmente no aparelho.`
                            : 'Nenhum comprovante anexado. Você pode anexar notas e recibos (PDF, DOCX, JPG, PNG) ao criar despesas ou parcelas.'}
                        </p>
                      </div>
                    </div>

                    {allAttachments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowReceiptsList(!showReceiptsList)}
                        className="px-2 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>{showReceiptsList ? 'Ocultar' : 'Ver Todos'}</span>
                        {showReceiptsList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {allAttachments.length > 0 && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                        <button
                          id="btn-export-receipts-download-folder"
                          onClick={() => handleExportReceiptsBackup(false)}
                          disabled={isSavingReceipts}
                          title="Salvar arquivo de backup dos comprovantes na pasta Downloads"
                          className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-[11px] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <FolderDown className="w-3.5 h-3.5" />
                          <span>{isSavingReceipts ? 'Salvando...' : 'Salvar em Downloads'}</span>
                        </button>

                        <button
                          id="btn-export-receipts-choose-folder"
                          onClick={() => handleExportReceiptsBackup(true)}
                          disabled={isSavingReceipts}
                          title="Escolher a pasta do telefone onde salvar o backup dos comprovantes"
                          className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 active:bg-neutral-200 text-neutral-800 dark:text-neutral-200 font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Escolher Pasta</span>
                        </button>

                        <button
                          id="btn-export-receipts-share"
                          onClick={handleShareReceiptsBackup}
                          disabled={isSavingReceipts}
                          title="Compartilhar backup dos comprovantes via WhatsApp, Drive ou Email"
                          className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 active:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-medium text-[11px] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Compartilhar</span>
                        </button>
                      </div>

                      {/* Lista expansível de comprovantes individuais */}
                      <AnimatePresence>
                        {showReceiptsList && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-2 border-t border-neutral-200/70 dark:border-neutral-700/60 space-y-1.5 max-h-48 overflow-y-auto"
                          >
                            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                              Baixar Comprovantes Individuais:
                            </span>
                            {allAttachments.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                      {item.description}
                                    </p>
                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                                      {item.attachment.name} • {formatBytes(item.attachment.size)} • {item.sourceType}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDownloadSingleAttachment(item.attachment)}
                                  title={`Baixar ${item.attachment.name}`}
                                  className="px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Baixar</span>
                                </button>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
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

              {/* Version & Data Safety Info */}
              <div className="pt-2 text-center">
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                  Gestão Financeira • Versão {APP_VERSION}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
