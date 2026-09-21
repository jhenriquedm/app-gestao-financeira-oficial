import React, { useState, useRef, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Edit2, 
  Trash2, 
  Landmark, 
  Calendar,
  ArrowDownUp,
  Search,
  X
} from 'lucide-react';
import { DebtInstallment, TransactionStatus } from '../types';
import { formatCurrency, formatMonthYearUppercase } from '../utils/formatters';
import { getComputedInstallment, ComputedInstallment } from '../utils/installmentHelpers';

interface InstallmentsSectionProps {
  installments: DebtInstallment[];
  currentYearMonth: string;
  monthlyStatusOverrides?: Record<string, TransactionStatus>;
  onOpenAddModal: () => void;
  onEdit: (installment: DebtInstallment) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onAdvanceInstallment?: (id: string) => void;
  isBalanceHidden?: boolean;
}

export const InstallmentsSection: React.FC<InstallmentsSectionProps> = ({
  installments,
  currentYearMonth,
  monthlyStatusOverrides,
  onOpenAddModal,
  onEdit,
  onDelete,
  onToggleStatus,
  onAdvanceInstallment: _onAdvanceInstallment,
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

  // Compute installment state for the selected month
  const computedList: ComputedInstallment[] = installments.map((inst) =>
    getComputedInstallment(inst, currentYearMonth, monthlyStatusOverrides)
  );

  // Active in this month only (1 <= current <= total)
  // Finished installments (current > total) are automatically excluded as requested!
  const activeComputedList = computedList.filter((item) => item.isActive);

  // Autocomplete suggestions based on installment descriptions
  const autocompleteSuggestions = Array.from(
    new Set(
      activeComputedList
        .map((i) => i.installment.description)
        .filter((desc) => desc.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    )
  ).slice(0, 5);

  // Filter by search query
  const filteredActiveList = activeComputedList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase().trim();
    const inst = item.installment;
    return (
      inst.description.toLowerCase().includes(term) ||
      inst.category.toLowerCase().includes(term) ||
      inst.origin.toLowerCase().includes(term)
    );
  });

  // Sort: default is highest monthly amount to lowest (do maior para o menor)
  const sortedList = [...filteredActiveList].sort((a, b) => {
    if (sortOrder === 'amount-desc') return b.installment.monthlyAmount - a.installment.monthlyAmount;
    if (sortOrder === 'amount-asc') return a.installment.monthlyAmount - b.installment.monthlyAmount;
    if (sortOrder === 'dueDay-asc') return (a.installment.dueDay || 1) - (b.installment.dueDay || 1);
    return 0;
  });

  // Calculations for current month (computed from all active in month)
  const totalMonthlyAmount = activeComputedList.reduce((sum, item) => sum + item.installment.monthlyAmount, 0);
  const paidMonthlyAmount = activeComputedList
    .filter((i) => i.status === 'completed')
    .reduce((sum, item) => sum + item.installment.monthlyAmount, 0);
  const pendingMonthlyAmount = totalMonthlyAmount - paidMonthlyAmount;

  // Global calculations across active debt commitments
  const totalContractedDebt = activeComputedList.reduce(
    (sum, item) => sum + item.installment.monthlyAmount * item.total,
    0
  );
  const totalPaidDebt = activeComputedList.reduce(
    (sum, item) => sum + item.installment.monthlyAmount * item.current,
    0
  );
  const totalRemainingDebt = Math.max(0, totalContractedDebt - totalPaidDebt);
  const overallProgress = totalContractedDebt > 0 ? (totalPaidDebt / totalContractedDebt) * 100 : 0;

  return (
    <div id="section-installments-manager" className="space-y-4">
      {/* Top Banner Card: Visão Geral das Dívidas e Parcelamentos - Fixed/Sticky */}
      <div className="sticky top-0 z-20 pt-0.5 pb-1 -mt-1 bg-slate-50/95 dark:bg-[#0b111e]/95 backdrop-blur-md">
        <div className="bg-gradient-to-br from-[#1c2838] to-[#152238] dark:from-[#152238] dark:to-[#0f172a] rounded-3xl p-4 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Parcelas & Empréstimos</h2>
              <p className="text-[11px] text-slate-300/80">
                Compromissos ativos no mês ({formatMonthYearUppercase(currentYearMonth)})
              </p>
            </div>
          </div>
          <button
            id="btn-add-installment-top"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-900/30 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Adicionar</span>
          </button>
        </div>

        {/* Hero Value: Total do Mês */}
        <div className="mb-3 relative z-10">
          <span className="text-[11px] uppercase tracking-wider text-slate-300/90 font-semibold block">
            Total em Parcelas Neste Mês
          </span>
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
            {isBalanceHidden ? '••••••' : formatCurrency(totalMonthlyAmount)}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="bg-[#0e1726]/80 rounded-2xl p-3 space-y-2 relative z-10 border border-slate-700/60">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-300 font-medium">Quitação Global dos Contratos:</span>
            <span className="font-bold text-sky-400">{overallProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#2563eb] h-full rounded-full transition-all duration-500 shadow-sm shadow-blue-500/50"
              style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10.5px] text-slate-300/90 pt-0.5">
            <span>
              Saldo Devedor:{' '}
              <strong className="text-white">
                {isBalanceHidden ? '••••' : formatCurrency(totalRemainingDebt)}
              </strong>
            </span>
            <span>
              Quitado:{' '}
              <strong className="text-sky-300">
                {isBalanceHidden ? '••••' : formatCurrency(totalPaidDebt)}
              </strong>
            </span>
          </div>
        </div>

        {/* Month Paid / Pending mini chips */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs relative z-10">
          <div className="bg-[#0e1726]/60 rounded-xl px-3 py-2 border border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-300 text-[11px]">Pagas no mês:</span>
            <strong className="text-sky-400 font-bold">
              {isBalanceHidden ? '•••' : formatCurrency(paidMonthlyAmount)}
            </strong>
          </div>
          <div className="bg-[#0e1726]/60 rounded-xl px-3 py-2 border border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-300 text-[11px]">Pendentes:</span>
            <strong className="text-amber-400 font-bold">
              {isBalanceHidden ? '•••' : formatCurrency(pendingMonthlyAmount)}
            </strong>
          </div>
        </div>
        </div>
      </div>

      {/* Lista de Parcelas */}
      <div className="space-y-2.5">
        {/* Name Filter with Autocomplete for Installments */}
        {activeComputedList.length > 0 && (
          <div ref={searchContainerRef} className="relative z-10 px-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                id="input-search-installments"
                placeholder="Buscar parcela por nome..."
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
            <span>Contratos Ativos</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-bold">
              {sortedList.length}
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

        {activeComputedList.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#152238] rounded-3xl border border-dashed border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Nenhuma parcela ativa em {currentYearMonth}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                Todas as parcelas foram finalizadas ou não há contratos ativos nesta competência.
              </p>
            </div>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-900/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova Parcela</span>
            </button>
          </div>
        ) : sortedList.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#152238] rounded-3xl border border-dashed border-slate-200 dark:border-slate-700/80 space-y-3">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Nenhuma parcela encontrada para &quot;{searchQuery}&quot;.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Limpar busca
            </button>
          </div>
        ) : (
          <div id="installments-cards-scroll" className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
            {sortedList.map(({ installment: inst, current, total, remaining, status, progressPercent }) => {
            const isPaid = status === 'completed';
            const remainingAmount = remaining * inst.monthlyAmount;

            return (
              <div
                key={inst.id}
                id={`installment-card-${inst.id}`}
                onClick={() => onEdit(inst)}
                className={`bg-white dark:bg-[#152238] rounded-3xl p-4 border transition-all shadow-xs cursor-pointer group ${
                  isPaid 
                    ? 'border-blue-500/30 bg-blue-50/15 dark:bg-blue-950/20 hover:border-blue-400' 
                    : 'border-slate-200/90 dark:border-slate-700/80 hover:border-blue-500/50 dark:hover:border-blue-500/50'
                }`}
              >
                {/* Linha 1: Ícone + Título + Tags + Valor + Status Toggle */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border mt-0.5 ${
                        isPaid
                          ? 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-sky-400'
                          : 'bg-amber-500/10 border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      <CreditCard className="w-4.5 h-4.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs font-bold leading-snug break-words group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors ${
                            isPaid 
                              ? 'line-through text-slate-400 dark:text-slate-500' 
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {inst.description}
                        </span>
                      </div>

                      {/* Tags: Categoria, Origem e Dia de Vencimento */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded-lg">
                          {inst.category}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-semibold rounded-lg flex items-center gap-1">
                          <Landmark className="w-2.5 h-2.5" />
                          {inst.origin}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] font-medium rounded-lg flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          Dia {inst.dueDay}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Valor Mensal e Status Toggle */}
                  <div className="flex flex-col items-end shrink-0">
                    <span
                      className={`text-xs sm:text-sm font-black ${
                        isPaid 
                          ? 'text-blue-600 dark:text-sky-400' 
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {isBalanceHidden ? '••••••' : formatCurrency(inst.monthlyAmount)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(inst.id);
                      }}
                      className={`mt-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isPaid
                          ? 'bg-blue-500/15 text-blue-600 dark:text-sky-400 hover:bg-blue-500/25'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                      }`}
                      title="Clique para alternar situação"
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-sky-400" />
                          Paga
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          Pendente
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Linha 2: Barra de Progresso e Contador da Parcela */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {current} / {total}{' '}
                      <span className="text-slate-400 font-normal">
                        ({remaining} {remaining === 1 ? 'restante' : 'restantes'})
                      </span>
                    </span>
                    <span className="font-bold text-blue-600 dark:text-sky-400">
                      {progressPercent.toFixed(0)}% pago
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        progressPercent >= 100 ? 'bg-blue-600' : 'bg-[#2563eb]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                    />
                  </div>

                  {/* Linha 3: Subtotais & Ações */}
                  <div className="flex items-center justify-between mt-2.5 pt-1">
                    <div className="text-[10.5px] text-slate-400 dark:text-slate-500">
                      Saldo restante:{' '}
                      <strong className="text-slate-700 dark:text-slate-300 font-bold">
                        {isBalanceHidden ? '•••' : formatCurrency(remainingAmount)}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Editar */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(inst);
                        }}
                        title="Editar contrato"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Excluir */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(inst.id);
                        }}
                        title="Excluir contrato"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
