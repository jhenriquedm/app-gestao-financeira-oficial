import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Transaction, Category, TransactionType, TransactionStatus } from '../types';
import { formatCurrency, formatDate, PAYMENT_METHOD_LABELS } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  currentYearMonth: string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onOpenNewTransaction: () => void;
  isBalanceHidden?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  currentYearMonth,
  onEdit,
  onDelete,
  onToggleStatus,
  onOpenNewTransaction,
  isBalanceHidden = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  // Default sort: highest amount to lowest (do maior para o menor)
  const [sortBy, setSortBy] = useState<'amount-desc' | 'amount-asc' | 'date-desc' | 'date-asc'>('amount-desc');

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Filter transactions for current month first
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentYearMonth));

  // Apply search and filters
  const filteredTransactions = monthTransactions.filter((t) => {
    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(term);
      const matchNotes = t.notes?.toLowerCase().includes(term);
      const cat = categoryMap.get(t.categoryId);
      const matchCat = cat?.name.toLowerCase().includes(term);
      if (!matchDesc && !matchNotes && !matchCat) return false;
    }

    // Type filter
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) return false;

    // Status filter
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;

    return true;
  });

  // Sort
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
    if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
    return 0;
  });

  const hasActiveFilters = searchTerm !== '' || typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  return (
    <div id="transaction-list-section" className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs overflow-hidden transition-colors">
      
      {/* Top Header & Search / Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
        
        {/* Title row + Sort select */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 id="tx-section-title" className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              Extrato & Lançamentos
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold">
                {filteredTransactions.length} {filteredTransactions.length === 1 ? 'item' : 'itens'}
              </span>
            </h2>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Movimentações no período selecionado
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                id="btn-clear-filters"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/60 px-2 py-1 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                Limpar
              </button>
            )}

            <select
              id="tx-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
            >
              <option value="amount-desc">Maior valor (padrão)</option>
              <option value="amount-asc">Menor valor</option>
              <option value="date-desc">Mais recentes</option>
              <option value="date-asc">Mais antigas</option>
            </select>
          </div>
        </div>

        {/* Search Input (Clean full width) */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            id="tx-search-input"
            type="text"
            maxLength={50}
            placeholder="Buscar por descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs font-medium text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:bg-white dark:focus:bg-neutral-800 focus:border-emerald-500 focus:outline-hidden transition-all placeholder:text-neutral-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Chips (Responsive Wrap & Scroll-safe) */}
        <div id="tx-quick-filter-chips" className="flex items-center gap-1.5 flex-wrap py-0.5">
          <button
            onClick={() => { setTypeFilter('all'); setStatusFilter('all'); }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              typeFilter === 'all' && statusFilter === 'all'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Todos ({monthTransactions.length})
          </button>

          <button
            onClick={() => { setTypeFilter('expense'); }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              typeFilter === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            Despesas
          </button>

          <button
            onClick={() => { setTypeFilter('income'); }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              typeFilter === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            Receitas
          </button>

          <button
            onClick={() => { setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending'); }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            Pendentes
          </button>

          <button
            onClick={() => { setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed'); }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            Concluídos
          </button>
        </div>

        {/* 2-Column Responsive Filter Dropdowns */}
        <div className="grid grid-cols-2 gap-2">
          {/* Category Filter */}
          <div>
            <select
              id="filter-category-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-medium text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:bg-white dark:focus:bg-neutral-800 focus:border-emerald-500 focus:outline-hidden transition-all cursor-pointer truncate"
            >
              <option value="all">Todas Categorias</option>
              {[...categories]
                .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs font-medium text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:bg-white dark:focus:bg-neutral-800 focus:border-emerald-500 focus:outline-hidden transition-all cursor-pointer truncate"
            >
              <option value="all">Todas Situações</option>
              <option value="completed">Pagas / Recebidas</option>
              <option value="pending">Pendentes</option>
            </select>
          </div>
        </div>

      </div>

      {/* Transaction Items List */}
      <div id="tx-items-list" className="divide-y divide-neutral-100 dark:divide-neutral-800/80 max-h-[500px] overflow-y-auto custom-scrollbar">
        {sortedTransactions.length > 0 ? (
          sortedTransactions.map((tx) => {
            const cat = categoryMap.get(tx.categoryId);
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                id={`tx-row-${tx.id}`}
                className="p-3 sm:p-4 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors flex items-center justify-between gap-2.5"
              >
                {/* Left: Category Icon */}
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                  style={{
                    backgroundColor: `${cat?.color || '#a855f7'}18`,
                    color: cat?.color || '#a855f7',
                  }}
                >
                  <CategoryIcon name={cat?.iconName || 'Tag'} className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                {/* Middle: Details */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate max-w-[150px] sm:max-w-xs">
                      {tx.description}
                    </span>

                    {/* Status badge & toggle */}
                    <button
                      onClick={() => onToggleStatus(tx.id)}
                      title="Alternar situação"
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md transition-colors cursor-pointer shrink-0 ${
                        tx.status === 'completed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60'
                      }`}
                    >
                      {tx.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{isIncome ? 'Recebido' : 'Pago'}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-2.5 h-2.5" />
                          <span>{isIncome ? 'A Receber' : 'Pendente'}</span>
                        </>
                      )}
                    </button>

                    {tx.isFixed && (
                      <span className="inline-flex items-center text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shrink-0">
                        Fixa {tx.dueDay ? `• Dia ${tx.dueDay}` : ''}
                      </span>
                    )}
                  </div>

                  {/* Metadata tags */}
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">{cat?.name || 'Geral'}</span>
                    <span>•</span>
                    <span className="shrink-0">{formatDate(tx.date)}</span>
                    <span className="hidden xs:inline">•</span>
                    <span className="hidden xs:inline text-neutral-400 dark:text-neutral-500 truncate">{PAYMENT_METHOD_LABELS[tx.paymentMethod]}</span>
                  </div>
                </div>

                {/* Right: Amount & Quick Actions */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div
                    className={`text-xs sm:text-sm font-bold flex items-center justify-end gap-0.5 ${
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isIncome ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{isBalanceHidden ? 'R$ ••••••' : formatCurrency(tx.amount)}</span>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-0.5">
                    <button
                      id={`btn-edit-${tx.id}`}
                      onClick={() => onEdit(tx)}
                      aria-label="Editar"
                      title="Editar lançamento"
                      className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-delete-${tx.id}`}
                      onClick={() => onDelete(tx.id)}
                      aria-label="Excluir"
                      title="Excluir lançamento"
                      className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div id="tx-empty-state" className="p-10 text-center flex flex-col items-center justify-center">
            <SlidersHorizontal className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-3" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Nenhuma movimentação encontrada</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1 mb-4">
              {hasActiveFilters
                ? 'Nenhum lançamento corresponde aos filtros ativos. Tente redefinir a busca.'
                : 'Você ainda não registrou receitas ou despesas neste mês.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            ) : (
              <button
                onClick={onOpenNewTransaction}
                className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                Registrar primeiro lançamento
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
