import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileSpreadsheet, Download, Upload, AlertTriangle, Check } from 'lucide-react';
import { Transaction, Category, Budget, SavingsGoal, DebtInstallment } from '../types';
import { downloadCSV, downloadJSON } from '../utils/formatters';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: SavingsGoal[];
  installments?: DebtInstallment[];
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
  onImportData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleExportCSV = () => {
    downloadCSV(transactions, categories);
    setFeedback({ type: 'success', message: 'Relatório CSV exportado com sucesso!' });
  };

  const handleExportJSON = () => {
    const backup = {
      version: '1.2',
      exportedAt: new Date().toISOString(),
      transactions,
      categories,
      budgets,
      goals,
      installments,
    };
    downloadJSON(backup, `backup-gestao-financeira-${new Date().toISOString().slice(0, 10)}.json`);
    setFeedback({ type: 'success', message: 'Arquivo de backup JSON gerado com sucesso!' });
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
      } catch (err) {
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
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            id="modal-card-export"
            className="bg-white rounded-t-[28px] w-full shadow-2xl border-t border-neutral-200 overflow-hidden flex flex-col max-h-[85%]"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mt-2 shrink-0" />

            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-neutral-900">
                Backup, Exportação e Dados
              </h3>
              <button
                id="btn-close-export-modal"
                onClick={onClose}
                className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto space-y-3.5 text-xs flex-1">
              {feedback && (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2 font-medium ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Export options */}
              <div className="space-y-2.5">
                <span className="font-semibold text-neutral-700 block uppercase tracking-wider text-[11px]">
                  Exportar Dados
                </span>

                <button
                  id="btn-export-csv-action"
                  onClick={handleExportCSV}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 text-xs">Planilha CSV</h4>
                      <p className="text-[11px] text-neutral-500">Compatível com Excel, Google Planilhas</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-neutral-400" />
                </button>

                <button
                  id="btn-export-json-action"
                  onClick={handleExportJSON}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 text-xs">Backup Completo (JSON)</h4>
                      <p className="text-[11px] text-neutral-500">Salva transações, orçamentos e metas</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              {/* Import options */}
              <div className="pt-3 border-t border-neutral-100 space-y-2.5">
                <span className="font-semibold text-neutral-700 block uppercase tracking-wider text-[11px]">
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
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 text-xs">Restaurar de arquivo JSON</h4>
                      <p className="text-[11px] text-neutral-500">Recuperar dados previamente salvos</p>
                    </div>
                  </div>
                  <Upload className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
