import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Building2,
  CreditCard,
  Sun,
  Moon,
  Tag,
  Calendar,
  X,
  Check
} from 'lucide-react';
import { formatCurrency, formatMonthYear } from '../utils/formatters';
import { MonthlySummary } from '../types';
import { AppNavTab } from './MobileBottomNav';
import { PWAInstallButton } from './PWAInstallButton';

interface MobileHeaderProps {
  activeTab: AppNavTab;
  currentYearMonth: string;
  onMonthChange: (yearMonth: string) => void;
  summary: MonthlySummary;
  overallBalance: number;
  isBalanceHidden: boolean;
  onToggleBalancePrivacy: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenCategoryManager?: () => void;
  onOpenNewTransaction: (type?: 'income' | 'expense') => void;
  onOpenExportImport: () => void;
  onNavigateTab: (tab: AppNavTab) => void;
}

const AVAILABLE_MONTHS = [
  { ym: '2026-10', label: 'Outubro de 2026 (Início)' },
  { ym: '2026-11', label: 'Novembro de 2026' },
  { ym: '2026-12', label: 'Dezembro de 2026' },
  { ym: '2027-01', label: 'Janeiro de 2027' },
  { ym: '2027-02', label: 'Fevereiro de 2027' },
  { ym: '2027-03', label: 'Março de 2027' },
  { ym: '2027-04', label: 'Abril de 2027' },
  { ym: '2027-05', label: 'Maio de 2027' },
  { ym: '2027-06', label: 'Junho de 2027' },
  { ym: '2027-07', label: 'Julho de 2027' },
  { ym: '2027-08', label: 'Agosto de 2027' },
  { ym: '2027-09', label: 'Setembro de 2027' },
  { ym: '2027-10', label: 'Outubro de 2027' },
  { ym: '2027-11', label: 'Novembro de 2027' },
  { ym: '2027-12', label: 'Dezembro de 2027' },
];

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeTab,
  currentYearMonth,
  onMonthChange,
  summary,
  overallBalance,
  isBalanceHidden,
  onToggleBalancePrivacy,
  isDarkMode = false,
  onToggleDarkMode,
  onOpenCategoryManager,
  onOpenNewTransaction,
  onOpenExportImport,
  onNavigateTab,
}) => {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [year, month] = currentYearMonth.split('-').map(Number);

  const handlePrevMonth = () => {
    if (currentYearMonth <= '2026-10') return;
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const newYm = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    if (newYm >= '2026-10') {
      onMonthChange(newYm);
    }
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    onMonthChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleCurrentMonth = () => {
    onMonthChange('2026-10');
  };

  const isBaseMonth = currentYearMonth === '2026-10';
  const isOverview = activeTab === 'overview';

  return (
    <div id="mobile-header-root" className="bg-neutral-900 text-white pt-3 pb-3.5 px-4 rounded-b-3xl shadow-md transition-all duration-200">
      
      {/* Top Bar: User Greeting & Quick Settings */}
      <div className={`flex items-center justify-between gap-2 ${isOverview ? 'mb-3.5' : 'mb-0'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-emerald-400/30 shadow-xs">
            JH
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-neutral-200">Olá, Henrique</span>
              <span className="text-xs">👋</span>
            </div>
            <p className="text-[10px] text-neutral-400">Finanças Pessoais</p>
          </div>
        </div>

        {/* Action icons & Month Navigator (when not on overview) */}
        <div className="flex items-center gap-1">
          {/* Month selector pill in top bar when not in Overview */}
          {!isOverview && (
            <div className="flex items-center bg-neutral-800/90 rounded-full px-1.5 py-0.5 border border-neutral-700/80 mr-0.5">
              <button
                id="header-sub-prev-month"
                onClick={handlePrevMonth}
                disabled={currentYearMonth <= '2026-10'}
                className={`p-1 rounded-full transition-colors ${
                  currentYearMonth <= '2026-10'
                    ? 'text-neutral-600 opacity-30 cursor-not-allowed'
                    : 'text-neutral-400 hover:text-white cursor-pointer'
                }`}
                title={currentYearMonth <= '2026-10' ? 'Início: Outubro de 2026' : 'Mês anterior'}
              >
                <ChevronLeft className="w-3 h-3" />
              </button>

              <button
                id="header-sub-open-month-list"
                onClick={() => setIsMonthPickerOpen(true)}
                className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 px-1 py-0.5 rounded-full hover:bg-neutral-700/60 transition-colors cursor-pointer"
                title="Clique para selecionar o mês"
              >
                <Calendar className="w-2.5 h-2.5 text-emerald-400" />
                <span className="truncate max-w-[85px] sm:max-w-none">{formatMonthYear(currentYearMonth)}</span>
              </button>

              <button
                id="header-sub-next-month"
                onClick={handleNextMonth}
                className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {onToggleDarkMode && (
            <button
              id="btn-mobile-toggle-theme"
              onClick={onToggleDarkMode}
              title={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
              aria-label="Alternar tema claro/escuro"
              className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-neutral-300" />}
            </button>
          )}

          {onOpenCategoryManager && (
            <button
              id="btn-mobile-categories"
              onClick={onOpenCategoryManager}
              title="Gerenciar Categorias (Despesas, Parcelas, Receitas)"
              aria-label="Gerenciar Categorias"
              className="p-2 text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            >
              <Tag className="w-4 h-4" />
            </button>
          )}

          {isOverview && (
            <button
              id="btn-mobile-toggle-privacy"
              onClick={onToggleBalancePrivacy}
              title={isBalanceHidden ? "Mostrar valores" : "Ocultar valores"}
              aria-label="Alternar privacidade de saldo"
              className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            >
              {isBalanceHidden ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          <button
            id="btn-mobile-export"
            onClick={onOpenExportImport}
            title="Exportar CSV ou Restaurar"
            aria-label="Exportar ou importar dados"
            className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          <PWAInstallButton compact />
        </div>
      </div>

      {/* Hero Balance Card - Rendered ONLY in 'Início' (overview tab) */}
      {isOverview && (
        <div 
          id="mobile-balance-card" 
          className="bg-neutral-800/90 border border-neutral-700/60 rounded-2xl p-4 backdrop-blur-xs shadow-xs"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Saldo em Caixa
            </span>

            {/* Month Navigator pill with dropdown selection */}
            <div className="flex items-center bg-neutral-900/90 rounded-full px-2 py-0.5 border border-neutral-700/80">
              <button
                id="mobile-btn-prev-month"
                onClick={handlePrevMonth}
                disabled={currentYearMonth <= '2026-10'}
                className={`p-1 rounded-full transition-colors ${
                  currentYearMonth <= '2026-10'
                    ? 'text-neutral-600 opacity-30 cursor-not-allowed'
                    : 'text-neutral-400 hover:text-white cursor-pointer'
                }`}
                title={currentYearMonth <= '2026-10' ? 'Início do contador: Outubro de 2026' : 'Mês anterior'}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Clickable Month Label to open full list */}
              <button
                id="btn-open-month-list"
                onClick={() => setIsMonthPickerOpen(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Clique para selecionar o mês na lista"
              >
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>{formatMonthYear(currentYearMonth)}</span>
              </button>

              <button
                id="mobile-btn-next-month"
                onClick={handleNextMonth}
                className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Big Balance Number */}
          <div className="flex items-baseline justify-between mt-1">
            <div 
              id="mobile-val-overall-balance" 
              className={`text-2xl font-black tracking-tight ${
                overallBalance < 0 ? 'text-rose-400' : 'text-white'
              }`}
            >
              {isBalanceHidden ? 'R$ ••••••' : formatCurrency(overallBalance)}
            </div>
            {!isBaseMonth && (
              <button
                onClick={handleCurrentMonth}
                className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full hover:bg-emerald-900/60 transition-colors cursor-pointer"
              >
                Outubro 2026
              </button>
            )}
          </div>

          {/* Monthly Income and Expense Badges */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-neutral-700/50">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-900/50 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-neutral-400 block leading-tight truncate">Renda no mês</span>
                <span className="text-xs font-bold text-emerald-400 block truncate">
                  {isBalanceHidden ? '••••••' : formatCurrency(summary.totalIncome)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-rose-900/50 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-neutral-400 block leading-tight truncate">Gastos totais</span>
                <span className="text-xs font-bold text-rose-400 block truncate">
                  {isBalanceHidden ? '••••••' : formatCurrency(summary.totalExpense)}
                </span>
              </div>
            </div>
          </div>

          {/* Planilha Breakdown Pill Indicators */}
          <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-neutral-700/40 text-[10px]">
            <div className="bg-neutral-900/60 rounded-lg p-1.5 text-center">
              <span className="text-neutral-400 block text-[9px]">Fixas</span>
              <span className="font-semibold text-neutral-200">
                {isBalanceHidden ? '••••' : formatCurrency(summary.fixedExpenses)}
              </span>
            </div>
            <div className="bg-neutral-900/60 rounded-lg p-1.5 text-center">
              <span className="text-neutral-400 block text-[9px]">Parcelas</span>
              <span className="font-semibold text-amber-400">
                {isBalanceHidden ? '••••' : formatCurrency(summary.installmentsAmount)}
              </span>
            </div>
            <div className="bg-neutral-900/60 rounded-lg p-1.5 text-center">
              <span className="text-neutral-400 block text-[9px]">Pendentes</span>
              <span className="font-semibold text-rose-400">
                {isBalanceHidden ? '••••' : formatCurrency(summary.totalPending)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Navigation Chips - Rendered ONLY in 'Início' (overview tab) */}
      {isOverview && (
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          <button
            id="btn-quick-new-income"
            onClick={() => onOpenNewTransaction('income')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/50 transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-neutral-300">Receita</span>
          </button>

          <button
            id="btn-quick-new-expense"
            onClick={() => onOpenNewTransaction('expense')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/50 transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-neutral-300">Despesa</span>
          </button>

          <button
            id="btn-quick-go-fixed"
            onClick={() => onNavigateTab('fixed')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/50 transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-neutral-300">Fixas</span>
          </button>

          <button
            id="btn-quick-go-parcelas"
            onClick={() => onNavigateTab('installments')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/50 transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold text-neutral-300">Parcelas</span>
          </button>
        </div>
      )}

      {/* Month Selection Modal / Sheet */}
      {isMonthPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/60">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Selecionar Mês
                </h4>
              </div>
              <button
                onClick={() => setIsMonthPickerOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {AVAILABLE_MONTHS.map((item) => {
                const isSelected = item.ym === currentYearMonth;
                return (
                  <button
                    key={item.ym}
                    onClick={() => {
                      onMonthChange(item.ym);
                      setIsMonthPickerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'bg-neutral-800/60 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>

            <div className="p-2.5 border-t border-neutral-800 bg-neutral-950/60 flex justify-end">
              <button
                onClick={() => setIsMonthPickerOpen(false)}
                className="px-3 py-1 text-xs text-neutral-400 hover:text-white"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
