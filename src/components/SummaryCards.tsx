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
  overallBalance: _overallBalance,
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
      bg: 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-800/60',
      text: 'text-blue-700 dark:text-sky-300',
      dot: 'bg-blue-500',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />,
    },
    ATENÇÃO: {
      label: 'Atenção',
      bg: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
    },
    CRÍTICO: {
      label: 'Crítico',
      bg: 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-200/80 dark:border-orange-800/60',
      text: 'text-orange-700 dark:text-orange-300',
      dot: 'bg-orange-500',
      icon: <AlertCircle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />,
    },
    NEGATIVO: {
      label: 'Negativo',
      bg: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60',
      text: 'text-rose-700 dark:text-rose-300',
      dot: 'bg-rose-500',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
    },
  };

  const currentStatus = statusConfig[summary.healthStatus || 'SAUDÁVEL'];

  return (
    <div id="summary-indicator-dashboard" className="space-y-2.5">
      
      {/* Executive Card de Saúde Financeira, Saldo do Mês e Comprometimento */}
      <div className="pt-0.5 pb-1 -mt-1">
        <div 
          id="card-executive-health"
          className="bg-white dark:bg-[#152238] rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors"
        >
          {/* Top Header: Badge de Saúde Financeira */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Diagnóstico Mensal
              </span>
            </div>

            <div 
              id="badge-health-status" 
              className={`px-2.5 py-0.5 rounded-full border text-[10.5px] font-bold flex items-center gap-1.5 shadow-2xs ${currentStatus.bg} ${currentStatus.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${currentStatus.dot}`} />
              <span>{currentStatus.label}</span>
            </div>
          </div>

          {/* 3 Pillars: Renda Prevista | Comprometido | Saldo Livre */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800/80 text-center">
            <div className="px-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight block truncate">
                Renda Prevista
              </span>
              <span className="text-xs sm:text-[13px] font-black text-blue-600 dark:text-sky-400 block mt-0.5 truncate leading-tight">
                {displayVal(summary.totalIncome)}
              </span>
            </div>

            <div className="px-0.5 border-x border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight block truncate">
                Comprometido
              </span>
              <span className="text-xs sm:text-[13px] font-black text-rose-500 dark:text-rose-400 block mt-0.5 truncate leading-tight">
                {displayVal(summary.totalCompromissos || summary.totalExpense)}
              </span>
            </div>

            <div className="px-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight block truncate">
                Saldo Livre
              </span>
              <span 
                className={`text-xs sm:text-[13px] font-black block mt-0.5 truncate leading-tight ${
                  summary.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500 dark:text-rose-400'
                }`}
              >
                {displayVal(summary.balance)}
              </span>
            </div>
          </div>

          {/* Barra de Progresso de Quitação do Mês */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Progresso de Quitação</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {summary.paidPercentage?.toFixed(0) || 0}% quitado
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#2563eb] h-full rounded-full transition-all duration-500 shadow-sm shadow-blue-500/50"
                style={{ width: `${Math.min(100, Math.max(0, summary.paidPercentage || 0))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10.5px] text-slate-400 dark:text-slate-500">
              <span>
                Pago: <strong className="text-blue-600 dark:text-sky-400 font-bold">{displayVal(summary.totalPaid || 0)}</strong>
              </span>
              <span>
                Pendente: <strong className="text-amber-600 dark:text-amber-400 font-bold">{displayVal(summary.totalPending || 0)}</strong>
              </span>
            </div>
          </div>

          {/* Informative Sub-chips: Despesas Fixas, Parcelas e Comprometimento */}
          <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={onNavigateToFixed}
              className="p-1.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-900/40 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">Fixas</span>
              </div>
              <div className="text-[11.5px] font-black text-slate-900 dark:text-slate-100 mt-0.5 truncate leading-tight">
                {displayVal(summary.fixedExpenses || 0)}
              </div>
            </button>

            <button
              onClick={onNavigateToInstallments}
              className="p-1.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 border border-amber-100 dark:border-amber-900/40 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                <CreditCard className="w-3 h-3 shrink-0" />
                <span className="truncate">Parcelas</span>
              </div>
              <div className="text-[11.5px] font-black text-slate-900 dark:text-slate-100 mt-0.5 truncate leading-tight">
                {displayVal(summary.installmentsAmount || 0)}
              </div>
            </button>

            <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 text-left">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                <Percent className="w-3 h-3 shrink-0" />
                <span className="truncate">Compromisso</span>
              </div>
              <div className="text-[11.5px] font-black text-slate-900 dark:text-slate-100 mt-0.5 truncate leading-tight">
                {summary.incomeCommitmentPercentage?.toFixed(0) || 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de 2 Cards Secundários (Saldo em Caixa e Poupança) */}
      <div id="summary-subcards-container" className="grid grid-cols-2 gap-2">
        
        {/* Saldo Livre no Mês */}
        <div 
          id="card-balance" 
          className="bg-white dark:bg-[#152238] rounded-2xl p-3 border border-slate-100 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
              Saldo no Mês
            </span>
            <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div id="val-overall-balance" className={`text-xs sm:text-sm font-black tracking-tight truncate ${summary.balance < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
              {displayVal(summary.balance)}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[10px]">
              <span className={`font-semibold ${summary.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {isBalanceHidden ? '••••' : `${summary.balance >= 0 ? 'Livre: +' : 'Déficit: '}${formatCurrency(summary.balance)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Economia / Taxa de Poupança */}
        <div 
          id="card-savings" 
          className="bg-white dark:bg-[#152238] rounded-2xl p-3 border border-slate-100 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
              Taxa de Poupança
            </span>
            <div className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <PiggyBank className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div id="val-savings-rate" className={`text-xs sm:text-sm font-black tracking-tight ${summary.savingsRate >= 20 ? 'text-teal-600 dark:text-teal-400' : summary.savingsRate > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'}`}>
              {isBalanceHidden ? '••%' : `${summary.savingsRate.toFixed(0)}%`}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">
              {summary.savingsRate >= 20 ? (
                <span className="text-emerald-600 dark:text-emerald-400">Meta 20%+ atingida</span>
              ) : summary.savingsRate > 0 ? (
                <span className="text-amber-600 dark:text-amber-400">Margem moderada</span>
              ) : (
                <span className="text-rose-500 dark:text-rose-400">Sem margem</span>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
