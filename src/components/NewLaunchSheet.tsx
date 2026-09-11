import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, CreditCard, ArrowUpRight, Plus } from 'lucide-react';

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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            id="sheet-card-new-launch"
            className="bg-white dark:bg-neutral-900 rounded-3xl max-w-sm w-full shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col p-4 sm:p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Novo Lançamento</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Escolha o que deseja registrar</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              {/* Opção 1: Despesa Fixa (Aluguel, Moradia, Contas) */}
              <button
                onClick={() => {
                  onClose();
                  onSelectFixedExpense();
                }}
                className="flex items-center gap-3 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 active:scale-[0.99] transition-all text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Despesa Fixa / Recorrente</span>
                    <span className="px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded">
                      Mensal
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    Aluguel, internet, feira fixa, faculdade, condomínio
                  </p>
                </div>
              </button>

              {/* Opção 2: Parcela / Dívida (Empréstimos, Financiamentos) */}
              <button
                onClick={() => {
                  onClose();
                  onSelectInstallment();
                }}
                className="flex items-center gap-3 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/30 hover:bg-amber-50 dark:hover:bg-amber-950/50 active:scale-[0.99] transition-all text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-600/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Parcela / Dívida Parcelada</span>
                    <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded">
                      Prestações
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    Empréstimo consignado, compras em 10x, acordo do cartão
                  </p>
                </div>
              </button>

              {/* Opção 3: Renda / Salário */}
              <button
                onClick={() => {
                  onClose();
                  onSelectIncome();
                }}
                className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 active:scale-[0.99] transition-all text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/20">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Renda / Entrada Financeira</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded">
                      Receita
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    Salário, freelance, rendimento de investimento, PIX recebido
                  </p>
                </div>
              </button>

              {/* Opção 4: Despesa Variável / Dia a dia */}
              <button
                onClick={() => {
                  onClose();
                  onSelectVariableExpense();
                }}
                className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/80 hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-[0.99] transition-all text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-800 dark:bg-neutral-700 text-white flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Gasto Avulso / Variável</span>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    Combustível, restaurante, farmácia, compras do dia a dia
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
