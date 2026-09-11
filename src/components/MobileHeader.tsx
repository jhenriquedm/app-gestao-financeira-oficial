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
  LogOut
} from 'lucide-react';
import { formatCurrency, formatMonthYear, formatMonthYearShort, getCurrentYearMonth } from '../utils/formatters';
import { MonthlySummary, User } from '../types';
import { AppNavTab } from './MobileBottomNav';

const MONTHS_LIST = [
  { value: 1, name: 'Janeiro', short: 'Jan' },
  { value: 2, name: 'Fevereiro', short: 'Fev' },
  { value: 3, name: 'Março', short: 'Mar' },
  { value: 4, name: 'Abril', short: 'Abr' },
  { value: 5, name: 'Maio', short: 'Mai' },
  { value: 6, name: 'Junho', short: 'Jun' },
  { value: 7, name: 'Julho', short: 'Jul' },
  { value: 8, name: 'Agosto', short: 'Ago' },
  { value: 9, name: 'Setembro', short: 'Set' },
  { value: 10, name: 'Outubro', short: 'Out' },
  { value: 11, name: 'Novembro', short: 'Nov' },
  { value: 12, name: 'Dezembro', short: 'Dez' },
];

interface MobileHeaderProps {
  user?: User | null;
  onLogout?: () => void;
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

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  user,
  onLogout,
  activeTab,
  currentYearMonth,
  onMonthChange,
  summary,
  overallBalance: _overallBalance,
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
  const systemCurrentMonth = getCurrentYearMonth();

  const [pickerYear, setPickerYear] = useState<number>(year);
  const [pickerMonth, setPickerMonth] = useState<number>(month);

  const handleOpenMonthPicker = () => {
    setPickerYear(year);
    setPickerMonth(month);
    setIsMonthPickerOpen(true);
  };

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const targetYm = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    onMonthChange(targetYm);
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
    onMonthChange(systemCurrentMonth);
  };

  const isCurrentMonth = currentYearMonth === systemCurrentMonth;
  const isOverview = activeTab === 'overview';

  const firstName = user?.name ? user.name.split(' ')[0] : 'Usuário';
  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n.charAt(0).toUpperCase())
        .join('')
    : 'U';

  return (
    <div id="mobile-header-root" className="bg-neutral-900 text-white pt-2.5 pb-2.5 px-3 rounded-b-2xl shadow-md transition-all duration-200">
      
      {/* Top Bar: User Greeting & Quick Settings */}
      <div className={`flex items-center justify-between gap-1.5 min-w-0 ${isOverview ? 'mb-2.5' : 'mb-0'}`}>
        <div className="flex items-center gap-2 min-w-0 shrink">
          <div className="w-7.5 h-7.5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center ring-2 ring-emerald-400/30 shadow-xs shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs font-bold text-neutral-200 truncate">Olá, {firstName}</span>
              <span className="text-xs shrink-0">👋</span>
            </div>
            <p className="text-[9.5px] text-neutral-400 leading-tight truncate max-w-[85px] xs:max-w-[120px] sm:max-w-none">
              {user?.email || 'Finanças Pessoais'}
            </p>
          </div>
        </div>

        {/* Action icons & Month Navigator (when not on overview) */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Compact Month selector pill in top bar when not in Overview */}
          {!isOverview && (
            <div className="flex items-center bg-neutral-800/90 rounded-full px-1 py-0.5 border border-neutral-700/80 mr-0.5 shrink-0">
              <button
                id="header-sub-prev-month"
                onClick={handlePrevMonth}
                className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-full"
                title="Mês anterior"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>

              <button
                id="header-sub-open-month-list"
                onClick={handleOpenMonthPicker}
                className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 px-1 py-0.5 rounded-full hover:bg-neutral-700/60 transition-colors cursor-pointer"
                title="Clique para selecionar o mês"
              >
                <Calendar className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[70px] xs:max-w-[95px] sm:max-w-none">
                  {formatMonthYearShort(currentYearMonth)}
                </span>
              </button>

              <button
                id="header-sub-next-month"
                onClick={handleNextMonth}
                className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Próximo mês"
                aria-label="Próximo mês"
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
              className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-neutral-300" />}
            </button>
          )}

          {onOpenCategoryManager && (
            <button
              id="btn-mobile-categories"
              onClick={onOpenCategoryManager}
              title="Gerenciar Categorias"
              aria-label="Gerenciar Categorias"
              className="p-1.5 text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
            </button>
          )}

          {isOverview && (
            <button
              id="btn-mobile-toggle-privacy"
              onClick={onToggleBalancePrivacy}
              title={isBalanceHidden ? "Mostrar valores" : "Ocultar valores"}
              aria-label="Alternar privacidade de saldo"
              className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
            >
              {isBalanceHidden ? <EyeOff className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            id="btn-mobile-export"
            onClick={onOpenExportImport}
            title="Exportar CSV ou Restaurar"
            aria-label="Exportar ou importar dados"
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onLogout && (
            <button
              id="btn-mobile-logout"
              onClick={onLogout}
              title="Sair da Conta"
              aria-label="Sair da Conta"
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-full transition-colors cursor-pointer ml-0.5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Hero Balance Card - Rendered ONLY in 'Início' (overview tab) */}
      {isOverview && (
        <div 
          id="mobile-balance-card" 
          className="bg-neutral-800/90 border border-neutral-700/60 rounded-xl p-3 backdrop-blur-xs shadow-xs"
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3 h-3 text-emerald-400" /> Saldo no Mês
            </span>

            {/* Month Navigator pill with dropdown selection */}
            <div className="flex items-center bg-neutral-900/90 rounded-full px-1.5 py-0.5 border border-neutral-700/80">
              <button
                id="mobile-btn-prev-month"
                onClick={handlePrevMonth}
                className="p-0.5 text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-full"
                title="Mês anterior"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>

              {/* Clickable Month Label to open full list */}
              <button
                id="btn-open-month-list"
                onClick={handleOpenMonthPicker}
                className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 px-1 py-0.5 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Clique para selecionar o mês na lista"
              >
                <Calendar className="w-2.5 h-2.5 text-emerald-400" />
                <span>{formatMonthYear(currentYearMonth)}</span>
              </button>

              <button
                id="mobile-btn-next-month"
                onClick={handleNextMonth}
                className="p-0.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Próximo mês"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Big Balance Number */}
          <div className="flex items-baseline justify-between mt-0.5">
            <div 
              id="mobile-val-overall-balance" 
              className={`text-xl font-black tracking-tight ${
                summary.balance < 0 ? 'text-rose-400' : 'text-white'
              }`}
            >
              {isBalanceHidden ? 'R$ ••••••' : formatCurrency(summary.balance)}
            </div>
            {!isCurrentMonth && (
              <button
                onClick={handleCurrentMonth}
                className="text-[9.5px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full hover:bg-emerald-900/60 transition-colors cursor-pointer"
              >
                Ir para Mês Atual
              </button>
            )}
          </div>

          {/* Monthly Income and Expense Badges */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-neutral-700/50">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5.5 h-5.5 rounded-md bg-emerald-900/50 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3 h-3" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9.5px] text-neutral-400 block leading-tight truncate">Renda no mês</span>
                <span className="text-[11.5px] font-bold text-emerald-400 block truncate leading-tight">
                  {isBalanceHidden ? '••••••' : formatCurrency(summary.totalIncome)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5.5 h-5.5 rounded-md bg-rose-900/50 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <TrendingDown className="w-3 h-3" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9.5px] text-neutral-400 block leading-tight truncate">Gastos totais</span>
                <span className="text-[11.5px] font-bold text-rose-400 block truncate leading-tight">
                  {isBalanceHidden ? '••••••' : formatCurrency(summary.totalExpense)}
                </span>
              </div>
            </div>
          </div>

          {/* Planilha Breakdown Pill Indicators */}
          <div className="grid grid-cols-3 gap-1.5 mt-2 pt-1.5 border-t border-neutral-700/40 text-[9.5px]">
            <div className="bg-neutral-900/60 rounded-md py-1 px-1.5 text-center">
              <span className="text-neutral-400 block text-[8.5px]">Fixas</span>
              <span className="font-bold text-neutral-200">
                {isBalanceHidden ? '••••' : formatCurrency(summary.fixedExpenses)}
              </span>
            </div>
            <div className="bg-neutral-900/60 rounded-md py-1 px-1.5 text-center">
              <span className="text-neutral-400 block text-[8.5px]">Parcelas</span>
              <span className="font-bold text-amber-400">
                {isBalanceHidden ? '••••' : formatCurrency(summary.installmentsAmount)}
              </span>
            </div>
            <div className="bg-neutral-900/60 rounded-md py-1 px-1.5 text-center">
              <span className="text-neutral-400 block text-[8.5px]">Pendentes</span>
              <span className="font-bold text-rose-400">
                {isBalanceHidden ? '••••' : formatCurrency(summary.totalPending)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Navigation Chips - Rendered ONLY in 'Início' (overview tab) */}
      {isOverview && (
        <div className="grid grid-cols-4 gap-1.5 mt-2.5">
          <button
            id="btn-quick-new-income"
            onClick={() => onOpenNewTransaction('income')}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/50 transition-colors cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-0.5 group-hover:scale-105 transition-transform">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9.5px] font-semibold text-neutral-300">Receita</span>
          </button>

          <button
            id="btn-quick-new-expense"
            onClick={() => onOpenNewTransaction('expense')}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/50 transition-colors cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center mb-0.5 group-hover:scale-105 transition-transform">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9.5px] font-semibold text-neutral-300">Despesa</span>
          </button>

          <button
            id="btn-quick-go-fixed"
            onClick={() => onNavigateTab('fixed')}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/50 transition-colors cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-0.5 group-hover:scale-105 transition-transform">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9.5px] font-semibold text-neutral-300">Fixas</span>
          </button>

          <button
            id="btn-quick-go-parcelas"
            onClick={() => onNavigateTab('installments')}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/50 transition-colors cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-0.5 group-hover:scale-105 transition-transform">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9.5px] font-semibold text-neutral-300">Parcelas</span>
          </button>
        </div>
      )}

      {/* Month Selection Modal / Sheet */}
      {isMonthPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/60">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Selecionar Mês e Ano
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              {/* Filtro / Controle de Ano com botões e digitação livre */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Ano
                </label>
                <div className="flex items-center justify-between bg-neutral-950/90 p-1.5 rounded-xl border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setPickerYear((prev) => prev - 1)}
                    className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Ano anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="input-picker-year"
                      type="number"
                      value={pickerYear}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setPickerYear(val);
                        }
                      }}
                      className="w-24 text-center font-black text-lg bg-transparent text-emerald-400 focus:outline-none"
                      placeholder="2026"
                      min={2000}
                      max={2100}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickerYear((prev) => prev + 1)}
                    className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Próximo ano"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filtro / Seleção de Mês - Grade dos 12 meses */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Mês ({pickerYear})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const [sysY, sysM] = systemCurrentMonth.split('-').map(Number);
                      setPickerYear(sysY);
                      setPickerMonth(sysM);
                      onMonthChange(systemCurrentMonth);
                      setIsMonthPickerOpen(false);
                    }}
                    className="text-[10.5px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer underline"
                  >
                    Ir para Mês Atual
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 max-h-[42vh] overflow-y-auto pr-0.5">
                  {MONTHS_LIST.map((m) => {
                    const ym = `${pickerYear}-${String(m.value).padStart(2, '0')}`;
                    const isSelected = ym === currentYearMonth;
                    const isCurrentSystemMonth = ym === systemCurrentMonth;
                    const isPickerActive = pickerMonth === m.value;

                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => {
                          setPickerMonth(m.value);
                          const targetYm = `${pickerYear}-${String(m.value).padStart(2, '0')}`;
                          onMonthChange(targetYm);
                          setIsMonthPickerOpen(false);
                        }}
                        className={`p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs font-bold ring-2 ring-emerald-400/40'
                            : isPickerActive
                            ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/50'
                            : 'bg-neutral-950/80 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800/80'
                        }`}
                      >
                        <span className="text-xs">{m.name}</span>
                        {isCurrentSystemMonth && (
                          <span className="text-[8.5px] mt-0.5 px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                            Atual
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const [sysY, sysM] = systemCurrentMonth.split('-').map(Number);
                  setPickerYear(sysY);
                  setPickerMonth(sysM);
                }}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Resetar Ano
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetYm = `${pickerYear}-${String(pickerMonth).padStart(2, '0')}`;
                  onMonthChange(targetYm);
                  setIsMonthPickerOpen(false);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
