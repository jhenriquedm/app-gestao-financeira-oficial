import React from 'react';
import { 
  Wallet, 
  PiggyBank, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle,
  Building2,
  CreditCard,
  Percent
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { MonthlySummary, FinancialHealthStatus } from '../types';

interface SummaryCardsProps {
  summary: MonthlySummary;
  overallBalance: number;
  isBalanceHidden?: boolean;
  onNavigateToFixed?: () => void;
  onNavigateToInstallments?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ 
  summary, 
  overallBalance,
  isBalanceHidden = false,
  onNavigateToFixed,
  onNavigateToInstallments
}) => {
  const displayVal = (val: number) => {
    if (isBalanceHidden) return 'R$ ••••••';
    return formatCurrency(val);
  };

  const statusConfig: Record<
    FinancialHealthStatus,
    { label: string; bg: string; text: string; dot: string; icon: React.ReactNode }
  > = {
    SAUDÁVEL: {
      label: 'Saudável',
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-800',
      dot: 'bg-emerald-500',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
    },
    ATENÇÃO: {
      label: 'Atenção',
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      dot: 'bg-amber-500',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
    },
    CRÍTICO: {
      label: 'Crítico',
      bg: 'bg-orange-50 border-orange-200',
      text: 'text-orange-800',
      dot: 'bg-orange-500',
      icon: <AlertCircle className="w-3.5 h-3.5 text-orange-600" />,
    },
    NEGATIVO: {
      label: 'Negativo',
      bg: 'bg-rose-50 border-rose-200',
      text: 'text-rose-800',
      dot: 'bg-rose-500',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
    },
  };

  const currentStatus = statusConfig[summary.healthStatus || 'SAUDÁVEL'];

  return (
    <div id="summary-indicator-dashboard" className="space-y-2.5">
      
      {/* Executive Card de Saúde Financeira e Comprometimento */}
      <div 
        id="card-executive-health"
        className="bg-white dark:bg-neutral-900 rounded-xl p-3 border border-neutral-200 dark:border-neutral-800 shadow-xs relative overflow-hidden transition-colors"
      >
        {/* Top Header: Badge de Saúde Financeira */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
              Diagnóstico Mensal
            </span>
          </div>

          <div 
            id="badge-health-status" 
            className={`px-2 py-0.5 rounded-full border text-[10.5px] font-bold flex items-center gap-1.5 shadow-2xs ${currentStatus.bg} ${currentStatus.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${currentStatus.dot}`} />
            <span>{currentStatus.label}</span>
          </div>
        </div>

        {/* 3 Pillars: Renda Prevista | Comprometido | Saldo Livre */}
        <div className="grid grid-cols-3 gap-1.5 py-1.5 border-y border-neutral-100 dark:border-neutral-800 text-center">
          <div className="px-0.5">
            <span className="text-[9.5px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-tight block truncate">
              Renda Prevista
            </span>
            <span className="text-xs sm:text-[13px] font-black text-emerald-600 dark:text-emerald-400 block mt-0.5 truncate leading-tight">
              {displayVal(summary.totalIncome)}
            </span>
          </div>

          <div className="px-0.5 border-x border-neutral-100 dark:border-neutral-800">
            <span className="text-[9.5px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-tight block truncate">
              Comprometido
            </span>
            <span className="text-xs sm:text-[13px] font-black text-rose-600 dark:text-rose-400 block mt-0.5 truncate leading-tight">
              {displayVal(summary.totalCompromissos || summary.totalExpense)}
            </span>
          </div>

          <div className="px-0.5">
            <span className="text-[9.5px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-tight block truncate">
              Saldo Livre
            </span>
            <span 
              className={`text-xs sm:text-[13px] font-black block mt-0.5 truncate leading-tight ${
                summary.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {displayVal(summary.balance)}
            </span>
          </div>
        </div>

        {/* Barra de Progresso de Quitação do Mês */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="font-semibold text-neutral-600 dark:text-neutral-400">Progresso de Quitação</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              {summary.paidPercentage?.toFixed(0) || 0}% quitado
            </span>
          </div>

          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, summary.paidPercentage || 0))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500">
            <span>
              Pago: <strong className="text-emerald-700 dark:text-emerald-400">{displayVal(summary.totalPaid || 0)}</strong>
            </span>
            <span>
              Pendente: <strong className="text-amber-700 dark:text-amber-400">{displayVal(summary.totalPending || 0)}</strong>
            </span>
          </div>
        </div>

        {/* Informative Sub-chips: Despesas Fixas, Parcelas e Comprometimento */}
        <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={onNavigateToFixed}
            className="p-1 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 border border-indigo-100/70 dark:border-indigo-900/60 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1 text-[9.5px] font-bold text-indigo-700 dark:text-indigo-300">
              <Building2 className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Fixas</span>
            </div>
            <div className="text-[11px] font-black text-neutral-900 dark:text-neutral-100 mt-0.5 truncate leading-tight">
              {displayVal(summary.fixedExpenses || 0)}
            </div>
          </button>

          <button
            onClick={onNavigateToInstallments}
            className="p-1 rounded-lg bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-50 dark:hover:bg-amber-900/50 border border-amber-100/70 dark:border-amber-900/60 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1 text-[9.5px] font-bold text-amber-700 dark:text-amber-300">
              <CreditCard className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Parcelas</span>
            </div>
            <div className="text-[11px] font-black text-neutral-900 dark:text-neutral-100 mt-0.5 truncate leading-tight">
              {displayVal(summary.installmentsAmount || 0)}
            </div>
          </button>

          <div className="p-1 rounded-lg bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-700/60 text-left">
            <div className="flex items-center gap-1 text-[9.5px] font-bold text-neutral-600 dark:text-neutral-400">
              <Percent className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Compromisso</span>
            </div>
            <div className="text-[11px] font-black text-neutral-900 dark:text-neutral-100 mt-0.5 truncate leading-tight">
              {summary.incomeCommitmentPercentage?.toFixed(0) || 0}%
            </div>
          </div>
        </div>

      </div>

      {/* Grid de 2 Cards Secundários (Saldo em Caixa e Poupança) */}
      <div id="summary-subcards-container" className="grid grid-cols-2 gap-2">
        
        {/* Saldo Total Acumulado */}
        <div 
          id="card-balance" 
          className="bg-white dark:bg-neutral-900 rounded-xl p-2.5 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-tight">
              Saldo em Caixa
            </span>
            <div className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Wallet className="w-3 h-3" />
            </div>
          </div>
          <div>
            <div id="val-overall-balance" className="text-xs sm:text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 truncate">
              {displayVal(overallBalance)}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[9.5px]">
              <span className={`font-semibold ${summary.balance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                {isBalanceHidden ? '••••' : `${summary.balance >= 0 ? '+' : ''}${formatCurrency(summary.balance)}`}
              </span>
              <span className="text-neutral-400 dark:text-neutral-500">no mês</span>
            </div>
          </div>
        </div>

        {/* Economia / Taxa de Poupança */}
        <div 
          id="card-savings" 
          className="bg-white dark:bg-neutral-900 rounded-xl p-2.5 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-tight">
              Taxa de Poupança
            </span>
            <div className="w-5 h-5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <PiggyBank className="w-3 h-3" />
            </div>
          </div>
          <div>
            <div id="val-savings-rate" className={`text-xs sm:text-sm font-bold tracking-tight ${summary.savingsRate >= 20 ? 'text-teal-700 dark:text-teal-400' : summary.savingsRate > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isBalanceHidden ? '••%' : `${summary.savingsRate.toFixed(0)}%`}
            </div>
            <div className="mt-0.5 text-[9.5px] text-neutral-500 dark:text-neutral-400 truncate">
              {summary.savingsRate >= 20 ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">Meta 20%+ atingida</span>
              ) : summary.savingsRate > 0 ? (
                <span className="text-amber-700 dark:text-amber-400 font-medium">Margem moderada</span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 font-medium">Sem margem</span>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
