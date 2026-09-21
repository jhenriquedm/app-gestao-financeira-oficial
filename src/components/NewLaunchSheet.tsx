import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, CreditCard, ArrowUpRight, Plus, Sparkles } from 'lucide-react';

interface NewLaunchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFixedExpense: () => void;
  onSelectInstallment: () => void;
  onSelectIncome: () => void;
  onSelectVariableExpense: () => void;
}

export const NewLaunchSheet: React.FC<NewLaunchSheetProps> = ({
  isOpen,
  onClose,
  onSelectFixedExpense,
  onSelectInstallment,
  onSelectIncome,
  onSelectVariableExpense,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="sheet-backdrop-new-launch"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            id="sheet-card-new-launch"
            className="bg-white dark:bg-[#152238] rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200/90 dark:border-slate-700/80 overflow-hidden flex flex-col p-5 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Novo Lançamento</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Escolha o que deseja registrar</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Opção 1: Despesa Fixa */}
              <button
                onClick={() => {
                  onClose();
                  onSelectFixedExpense();
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-indigo-100/90 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/25 hover:bg-indigo-100/60 dark:hover:bg-indigo-950/40 active:scale-[0.98] transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/25 transition-transform group-hover:scale-105">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Despesa Fixa</span>
                    <span className="px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-md">
                      Mensal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Aluguel, internet, feira, faculdade, condomínio
                  </p>
                </div>
              </button>

              {/* Opção 2: Parcela / Dívida */}
              <button
                onClick={() => {
                  onClose();
                  onSelectInstallment();
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-amber-100/90 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/25 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 active:scale-[0.98] transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-600/25 transition-transform group-hover:scale-105">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Parcela / Dívida</span>
                    <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-md">
                      Prestações
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Empréstimo, compras em 10x, acordo do cartão
                  </p>
                </div>
              </button>

              {/* Opção 3: Renda / Salário */}
              <button
                onClick={() => {
                  onClose();
                  onSelectIncome();
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-emerald-100/90 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/25 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 active:scale-[0.98] transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/25 transition-transform group-hover:scale-105">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Renda / Salário</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                      Receita
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Salário, freelance, rendimento, PIX recebido
                  </p>
                </div>
              </button>

              {/* Opção 4: Despesa Variável / Dia a dia */}
              <button
                onClick={() => {
                  onClose();
                  onSelectVariableExpense();
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98] transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block mb-0.5">Gasto Avulso / Variável</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Combustível, restaurante, compras do dia a dia
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
