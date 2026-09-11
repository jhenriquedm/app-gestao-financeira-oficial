import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Edit2, 
  Trash2, 
  Calendar,
  CheckCheck,
  RotateCcw,
  ArrowDownUp
} from 'lucide-react';
import { Transaction, Category } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface FixedExpensesSectionProps {
  transactions: Transaction[];
  categories: Category[];
  currentYearMonth: string;
  onOpenAddModal: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onMarkAllFixedPaid: () => void;
  onMarkAllFixedPending: () => void;
  isBalanceHidden?: boolean;
}

export const FixedExpensesSection: React.FC<FixedExpensesSectionProps> = ({
  transactions,
  categories,
  currentYearMonth,
  onOpenAddModal,
  onEdit,
  onDelete,
  onToggleStatus,
  onMarkAllFixedPaid,
  onMarkAllFixedPending,
  isBalanceHidden = false,
}) => {
  const [sortOrder, setSortOrder] = useState<'amount-desc' | 'amount-asc' | 'dueDay-asc'>('amount-desc');

  // Filter fixed expenses active in the current month
  const rawFixedExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.isFixed && (!t.deletedFromMonthYear || currentYearMonth < t.deletedFromMonthYear)
  );

  // Default sort: highest amount to lowest (do maior para o menor!)
  const fixedExpenses = [...rawFixedExpenses].sort((a, b) => {
    if (sortOrder === 'amount-desc') return b.amount - a.amount;
    if (sortOrder === 'amount-asc') return a.amount - b.amount;
    if (sortOrder === 'dueDay-asc') return (a.dueDay || 1) - (b.dueDay || 1);
    return 0;
  });

  const totalFixed = fixedExpenses.reduce((sum, t) => sum + t.amount, 0);
  const paidFixed = fixedExpenses
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingFixed = totalFixed - paidFixed;
  const paidCount = fixedExpenses.filter((t) => t.status === 'completed').length;

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div id="section-fixed-expenses-manager" className="space-y-4">
      {/* Top Banner Card - Fixed/Sticky Main Summary */}
      <div className="sticky top-0 z-20 pt-0.5 pb-1 -mt-1 bg-neutral-100/95 dark:bg-neutral-950/95 backdrop-blur-md">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-indigo-700 dark:to-indigo-950 rounded-2xl p-3.5 text-white shadow-lg shadow-indigo-700/20 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
              <Building2 className="w-4 h-4 text-indigo-100" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Despesas Fixas</h2>
              <p className="text-[11px] text-indigo-100/80">
                Aluguel, contas essenciais e mensalidades
              </p>
            </div>
          </div>
          <button
            id="btn-add-fixed-expense-top"
            onClick={onOpenAddModal}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-indigo-900 text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-50 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </div>

        {/* Hero Value */}
        <div className="mb-3 relative z-10">
          <span className="text-[11px] uppercase tracking-wider text-indigo-200/90 font-semibold block">
            Total Despesas Fixas do Mês
          </span>
          <div className="text-2xl font-black tracking-tight">
            {isBalanceHidden ? '••••••' : formatCurrency(totalFixed)}
          </div>
        </div>

        {/* Progress Bar of Paid vs Pending */}
        <div className="bg-black/20 rounded-xl p-2.5 space-y-1.5 relative z-10 border border-white/10">
          <div className="flex justify-between text-[11px]">
            <span className="text-indigo-100 font-medium">Contas Quitadas:</span>
            <span className="font-bold text-white">
              {paidCount} de {fixedExpenses.length} ({totalFixed > 0 ? ((paidFixed / totalFixed) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{
                width: `${totalFixed > 0 ? Math.min(100, (paidFixed / totalFixed) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="flex justify-between items-center text-[10.5px] text-indigo-100/90 pt-0.5">
            <span>
              Pagas:{' '}
              <strong className="text-emerald-300">
                {isBalanceHidden ? '••••' : formatCurrency(paidFixed)}
              </strong>
            </span>
            <span>
              Pendentes:{' '}
              <strong className="text-amber-200">
                {isBalanceHidden ? '••••' : formatCurrency(pendingFixed)}
              </strong>
            </span>
          </div>
        </div>

        {/* Ações em Lote: Quitar todas / Marcar pendente */}
        {fixedExpenses.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-1 border-t border-white/15 relative z-10">
            <button
              onClick={onMarkAllFixedPaid}
              className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Quitar Todas</span>
            </button>
            <button
              onClick={onMarkAllFixedPending}
              className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
              <span>Marcar Pendentes</span>
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Lista de Despesas Fixas */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
            <span>Despesas Recorrentes</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md font-bold">
              {fixedExpenses.length}
            </span>
          </h3>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSortOrder(sortOrder === 'amount-desc' ? 'dueDay-asc' : 'amount-desc')}
              className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 cursor-pointer"
              title="Alternar ordenação"
            >
              <ArrowDownUp className="w-3 h-3" />
              <span>{sortOrder === 'amount-desc' ? 'Maior valor' : 'Dia Vencimento'}</span>
            </button>
          </div>
        </div>

        {fixedExpenses.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Nenhuma despesa fixa em {currentYearMonth}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto mt-1">
                Cadastre o aluguel, condomínio, luz, internet, feira e assinaturas para manter o controle mensal.
              </p>
            </div>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Despesa Fixa</span>
            </button>
          </div>
        ) : (
          <div id="fixed-expenses-scroll" className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {fixedExpenses.map((exp) => {
            const isPaid = exp.status === 'completed';
            const category = categoryMap.get(exp.categoryId);

            return (
              <div
                key={exp.id}
                id={`fixed-expense-card-${exp.id}`}
                className={`bg-white dark:bg-neutral-900 rounded-2xl p-3 border transition-all shadow-xs flex items-center justify-between gap-3 ${
                  isPaid 
                    ? 'border-emerald-200/90 dark:border-emerald-800/60 bg-emerald-50/15 dark:bg-emerald-950/10' 
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                {/* Ícone da Categoria + Descrição */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${category?.color || '#6366f1'}20`,
                      color: category?.color || '#6366f1',
                    }}
                  >
                    <CategoryIcon name={category?.iconName || 'Home'} className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-bold truncate ${
                        isPaid ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {exp.description}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                        {category?.name || 'Geral'}
                      </span>
                      <span className="text-neutral-300 dark:text-neutral-600">•</span>
                      <span className="px-1.5 py-0.2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-medium rounded flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        Dia {exp.dueDay || new Date(exp.date).getDate()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Valor + Status Toggle + Ações */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-xs font-black block ${
                        isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {isBalanceHidden ? '••••••' : formatCurrency(exp.amount)}
                    </span>
                    <button
                      onClick={() => onToggleStatus(exp.id)}
                      className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isPaid
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 hover:bg-amber-200'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Pago
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          Pendente
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center gap-1 pl-1 border-l border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={() => onEdit(exp)}
                      title="Editar"
                      className="p-1 rounded-md text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDelete(exp.id)}
                      title="Excluir"
                      className="p-1 rounded-md text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};
