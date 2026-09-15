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
  ArrowUpRight,
  ArrowDownUp,
  Search,
  X
} from 'lucide-react';
import { DebtInstallment, TransactionStatus } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getComputedInstallment, ComputedInstallment } from '../utils/installmentHelpers';

interface InstallmentsSectionProps {
  installments: DebtInstallment[];
  currentYearMonth: string;
  monthlyStatusOverrides?: Record<string, TransactionStatus>;
  onOpenAddModal: () => void;
  onEdit: (installment: DebtInstallment) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onAdvanceInstallment: (id: string) => void;
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
  onAdvanceInstallment,
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
      <div className="sticky top-0 z-20 pt-0.5 pb-1 -mt-1 bg-neutral-100/95 dark:bg-neutral-950/95 backdrop-blur-md">
        <div className="bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-700 dark:to-amber-900 rounded-2xl p-3.5 text-white shadow-lg shadow-amber-700/20 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-amber-100" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Parcelas & Empréstimos</h2>
              <p className="text-[11px] text-amber-100/80">
                Compromissos ativos no mês ({currentYearMonth})
              </p>
            </div>
          </div>
          <button
            id="btn-add-installment-top"
            onClick={onOpenAddModal}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-amber-900 text-xs font-bold rounded-xl shadow-xs hover:bg-amber-50 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </div>

        {/* Hero Value: Total do Mês */}
        <div className="mb-3 relative z-10">
          <span className="text-[11px] uppercase tracking-wider text-amber-200/90 font-semibold block">
            Total em Parcelas Neste Mês
          </span>
          <div className="text-2xl font-black tracking-tight">
            {isBalanceHidden ? '••••••' : formatCurrency(totalMonthlyAmount)}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="bg-black/20 rounded-xl p-2.5 space-y-1.5 relative z-10 border border-white/10">
          <div className="flex justify-between text-[11px]">
            <span className="text-amber-100 font-medium">Quitação Global dos Contratos Ativos:</span>
            <span className="font-bold text-white">{overallProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10.5px] text-amber-100/90 pt-0.5">
            <span>
              Saldo Devedor:{' '}
              <strong className="text-white">
                {isBalanceHidden ? '••••' : formatCurrency(totalRemainingDebt)}
              </strong>
            </span>
            <span>
              Quitado:{' '}
              <strong className="text-amber-200">
                {isBalanceHidden ? '••••' : formatCurrency(totalPaidDebt)}
              </strong>
            </span>
          </div>
        </div>

        {/* Month Paid / Pending mini chips */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs relative z-10">
          <div className="bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/10 flex items-center justify-between">
            <span className="text-amber-100 text-[11px]">Pagas no mês:</span>
            <strong className="text-emerald-300 font-bold">
              {isBalanceHidden ? '•••' : formatCurrency(paidMonthlyAmount)}
            </strong>
          </div>
          <div className="bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/10 flex items-center justify-between">
            <span className="text-amber-100 text-[11px]">Pendentes:</span>
            <strong className="text-amber-200 font-bold">
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
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
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
                className="w-full pl-9 pr-8 py-2 text-xs font-medium text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:border-amber-500 focus:outline-hidden transition-all placeholder:text-neutral-400 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Autocomplete suggestions dropdown */}
            {showSuggestions && searchQuery.trim() && autocompleteSuggestions.length > 0 && (
              <div className="absolute top-full left-1 right-1 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden z-30 py-1">
                {autocompleteSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-neutral-800 dark:text-neutral-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center justify-between cursor-pointer"
                  >
                    <span>{suggestion}</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Selecionar</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
            <span>Contratos Ativos</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md font-bold">
              {sortedList.length}
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

        {activeComputedList.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                Nenhuma parcela ativa em {currentYearMonth}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto mt-1">
                Todas as parcelas foram finalizadas ou não há contratos ativos nesta competência.
              </p>
            </div>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova Parcela</span>
            </button>
          </div>
        ) : sortedList.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 space-y-3">
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Nenhuma parcela encontrada para &quot;{searchQuery}&quot;.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl cursor-pointer"
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
                className={`bg-white dark:bg-neutral-900 rounded-2xl p-3.5 border transition-all shadow-xs ${
                  isPaid 
                    ? 'border-emerald-200/90 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10' 
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-amber-300 dark:hover:border-amber-700'
                }`}
              >
                {/* Linha 1: Ícone + Título + Tags + Valor + Status Toggle */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border mt-0.5 ${
                        isPaid
                          ? 'bg-emerald-100/70 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100/70 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs font-bold leading-snug break-words ${
                            isPaid 
                              ? 'line-through text-neutral-400 dark:text-neutral-500' 
                              : 'text-neutral-900 dark:text-neutral-100'
                          }`}
                        >
                          {inst.description}
                        </span>
                      </div>

                      {/* Tags: Categoria, Origem e Dia de Vencimento */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-medium rounded">
                          {inst.category}
                        </span>
                        <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-medium rounded flex items-center gap-1">
                          <Landmark className="w-2.5 h-2.5" />
                          {inst.origin}
                        </span>
                        <span className="px-1.5 py-0.5 bg-neutral-50 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 text-[10px] font-medium rounded flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          Dia {inst.dueDay}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Valor Mensal e Status Toggle */}
                  <div className="flex flex-col items-end shrink-0">
                    <span
                      className={`text-xs font-black ${
                        isPaid 
                          ? 'text-emerald-700 dark:text-emerald-400' 
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {isBalanceHidden ? '••••••' : formatCurrency(inst.monthlyAmount)}
                    </span>
                    <button
                      onClick={() => onToggleStatus(inst.id)}
                      className={`mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isPaid
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 hover:bg-amber-200'
                      }`}
                      title="Clique para alternar situação"
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
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
                <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {current} / {total}{' '}
                      <span className="text-neutral-400 font-normal">
                        ({remaining} {remaining === 1 ? 'restante' : 'restantes'})
                      </span>
                    </span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      {progressPercent.toFixed(0)}% pago
                    </span>
                  </div>

                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        progressPercent >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                    />
                  </div>

                  {/* Linha 3: Subtotais & Ações */}
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <div className="text-[10.5px] text-neutral-400 dark:text-neutral-500">
                      Saldo restante:{' '}
                      <strong className="text-neutral-600 dark:text-neutral-300">
                        {isBalanceHidden ? '•••' : formatCurrency(remainingAmount)}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Botão Avançar Parcela (+1) */}
                      {current < total && (
                        <button
                          onClick={() => onAdvanceInstallment(inst.id)}
                          title="Avançar uma parcela paga"
                          className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-700 dark:text-amber-300 text-[10.5px] font-bold rounded-lg border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-0.5 cursor-pointer"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          <span>+1 Parcela</span>
                        </button>
                      )}

                      {/* Editar */}
                      <button
                        onClick={() => onEdit(inst)}
                        title="Editar contrato"
                        className="p-1 rounded-lg text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Excluir */}
                      <button
                        onClick={() => onDelete(inst.id)}
                        title="Excluir contrato"
                        className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
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
