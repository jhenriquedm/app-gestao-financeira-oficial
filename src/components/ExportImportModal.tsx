import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileSpreadsheet, Download, Upload, AlertTriangle, Check } from 'lucide-react';
import { Transaction, Category, Budget, SavingsGoal, DebtInstallment } from '../types';
import { downloadCSV, downloadJSON } from '../utils/formatters';
import { getComputedInstallment } from '../utils/installmentHelpers';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
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

  // Clear feedback whenever the modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
    }
  }, [isOpen]);

  // Auto-dismiss feedback message after 4.5 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 4500);
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
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">Planilha CSV do Mês ({activeMonth})</h4>
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
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
