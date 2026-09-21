import React, { useState, useRef, useEffect } from 'react';
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
  ArrowDownUp,
  Search,
  X
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter fixed expenses active in the current month
  const rawFixedExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.isFixed && (!t.deletedFromMonthYear || currentYearMonth < t.deletedFromMonthYear)
  );

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Autocomplete suggestions based on fixed expense names and categories
  const autocompleteSuggestions = Array.from(
    new Set(
      rawFixedExpenses
        .map((t) => t.description)
        .filter((desc) => desc.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    )
  ).slice(0, 5);

  // Filter by search query
  const filteredRawExpenses = rawFixedExpenses.filter((t) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase().trim();
    const cat = categoryMap.get(t.categoryId);
    return t.description.toLowerCase().includes(term) || (cat && cat.name.toLowerCase().includes(term));
  });

  // Default sort: highest amount to lowest (do maior para o menor!)
  const fixedExpenses = [...filteredRawExpenses].sort((a, b) => {
    if (sortOrder === 'amount-desc') return b.amount - a.amount;
    if (sortOrder === 'amount-asc') return a.amount - b.amount;
    if (sortOrder === 'dueDay-asc') return (a.dueDay || 1) - (b.dueDay || 1);
    return 0;
  });

  const totalFixed = rawFixedExpenses.reduce((sum, t) => sum + t.amount, 0);
  const paidFixed = rawFixedExpenses
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingFixed = totalFixed - paidFixed;
  const paidCount = rawFixedExpenses.filter((t) => t.status === 'completed').length;

  return (
    <div id="section-fixed-expenses-manager" className="space-y-4">
      {/* Top Banner Card - Fixed/Sticky Main Summary */}
      <div className="sticky top-0 z-20 pt-0.5 pb-1 -mt-1 bg-slate-50/95 dark:bg-[#0b111e]/95 backdrop-blur-md">
        <div className="bg-gradient-to-br from-[#1c2838] to-[#152238] dark:from-[#152238] dark:to-[#0f172a] rounded-3xl p-4 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/15 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Despesas Fixas</h2>
              <p className="text-[11px] text-slate-300/80">
                Aluguel, contas essenciais e mensalidades
              </p>
            </div>
          </div>
          <button
            id="btn-add-fixed-expense-top"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-900/30 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Adicionar</span>
          </button>
        </div>

        {/* Hero Value */}
        <div className="mb-3 relative z-10">
          <span className="text-[11px] uppercase tracking-wider text-slate-300/90 font-semibold block">
            Total Despesas Fixas do Mês
          </span>
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
            {isBalanceHidden ? '••••••' : formatCurrency(totalFixed)}
          </div>
        </div>

        {/* Progress Bar of Paid vs Pending */}
        <div className="bg-[#0e1726]/80 rounded-2xl p-3 space-y-2 relative z-10 border border-slate-700/60">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-300 font-medium">Contas Quitadas:</span>
            <span className="font-bold text-sky-400">
              {paidCount} de {fixedExpenses.length} ({totalFixed > 0 ? ((paidFixed / totalFixed) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#2563eb] h-full rounded-full transition-all duration-500 shadow-sm shadow-blue-500/50"
              style={{
                width: `${totalFixed > 0 ? Math.min(100, (paidFixed / totalFixed) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="flex justify-between items-center text-[10.5px] text-slate-300/90 pt-0.5">
            <span>
              Pagas:{' '}
              <strong className="text-sky-400">
                {isBalanceHidden ? '••••' : formatCurrency(paidFixed)}
              </strong>
            </span>
            <span>
              Pendentes:{' '}
              <strong className="text-amber-400">
                {isBalanceHidden ? '••••' : formatCurrency(pendingFixed)}
              </strong>
            </span>
          </div>
        </div>

        {/* Ações em Lote: Quitar todas / Marcar pendente */}
        {fixedExpenses.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-1 relative z-10">
            <button
              onClick={onMarkAllFixedPaid}
              className="flex-1 py-2 px-2.5 bg-[#0e1726]/70 hover:bg-slate-800 active:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-xl border border-slate-700/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Quitar Todas</span>
            </button>
            <button
              onClick={onMarkAllFixedPending}
              className="flex-1 py-2 px-2.5 bg-[#0e1726]/70 hover:bg-slate-800 active:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-xl border border-slate-700/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Marcar Pendentes</span>
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Lista de Despesas Fixas */}
      <div className="space-y-2.5">
        {/* Name Filter with Autocomplete for Fixed Expenses */}
        {rawFixedExpenses.length > 0 && (
          <div ref={searchContainerRef} className="relative z-10 px-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                id="input-search-fixed-expenses"
                placeholder="Buscar despesa fixa por nome..."
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full pl-9 pr-8 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 bg-white dark:bg-[#152238] border border-slate-200/90 dark:border-slate-700/80 rounded-2xl focus:border-blue-500 focus:outline-hidden transition-all placeholder:text-slate-400 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Autocomplete suggestions dropdown */}
            {showSuggestions && searchQuery.trim() && autocompleteSuggestions.length > 0 && (
              <div className="absolute top-full left-1 right-1 mt-1 bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-30 py-1">
                {autocompleteSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between cursor-pointer"
                  >
                    <span>{suggestion}</span>
                    <span className="text-[10px] text-blue-600 dark:text-sky-400 font-semibold">Selecionar</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <span>Despesas Recorrentes</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-bold">
              {fixedExpenses.length}
            </span>
          </h3>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSortOrder(sortOrder === 'amount-desc' ? 'dueDay-asc' : 'amount-desc')}
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 cursor-pointer transition-colors"
              title="Alternar ordenação"
            >
              <ArrowDownUp className="w-3 h-3" />
              <span>{sortOrder === 'amount-desc' ? 'Maior valor' : 'Dia Vencimento'}</span>
            </button>
          </div>
        </div>

        {rawFixedExpenses.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#152238] rounded-3xl border border-dashed border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Nenhuma despesa fixa em {currentYearMonth}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                Cadastre o aluguel, condomínio, luz, internet, feira e assinaturas para manter o controle mensal.
              </p>
            </div>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-900/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Despesa Fixa</span>
            </button>
          </div>
        ) : fixedExpenses.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#152238] rounded-3xl border border-dashed border-slate-200 dark:border-slate-700/80 space-y-3">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Nenhuma despesa fixa encontrada para &quot;{searchQuery}&quot;.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Limpar busca
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
                onClick={() => onEdit(exp)}
                className={`bg-white dark:bg-[#152238] rounded-3xl p-3.5 sm:p-4 border transition-all shadow-xs flex items-center justify-between gap-3 cursor-pointer group ${
                  isPaid 
                    ? 'border-blue-500/30 bg-blue-50/15 dark:bg-blue-950/20 hover:border-blue-400' 
                    : 'border-slate-200/90 dark:border-slate-700/80 hover:border-blue-500/50 dark:hover:border-blue-500/50'
                }`}
              >
                {/* Ícone da Categoria + Descrição */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
                    style={{
                      backgroundColor: `${category?.color || '#3b82f6'}20`,
                      color: category?.color || '#3b82f6',
                    }}
                  >
                    <CategoryIcon name={category?.iconName || 'Home'} className="w-4.5 h-4.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-bold truncate group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors ${
                        isPaid ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {exp.description}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {category?.name || 'Geral'}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium rounded-lg flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        Dia {exp.dueDay || new Date(exp.date).getDate()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Valor + Status Toggle + Ações */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-xs sm:text-sm font-black block ${
                        isPaid ? 'text-blue-600 dark:text-sky-400' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {isBalanceHidden ? '••••••' : formatCurrency(exp.amount)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(exp.id);
                      }}
                      className={`mt-1 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isPaid
                          ? 'bg-blue-500/15 text-blue-600 dark:text-sky-400 hover:bg-blue-500/25'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-sky-400" />
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
                  <div className="flex flex-col items-center gap-1 pl-2 border-l border-slate-100 dark:border-slate-700/60">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(exp);
                      }}
                      title="Editar"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(exp.id);
                      }}
                      title="Excluir"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
