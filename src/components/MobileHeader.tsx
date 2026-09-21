import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Download, 
  Building2,
  CreditCard,
  Sun,
  Moon,
  Tag,
  Calendar,
  X,
  LogOut,
  MoreVertical,
} from 'lucide-react';
import { formatCurrency, formatMonthYear, getCurrentYearMonth } from '../utils/formatters';
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
  onOpenProfile?: () => void;
  onSyncCloud?: () => void;
  isSyncing?: boolean;
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
  onOpenProfile,
  onSyncCloud: _onSyncCloud,
  isSyncing: _isSyncing = false,
}) => {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [year, month] = currentYearMonth.split('-').map(Number);
  const systemCurrentMonth = getCurrentYearMonth();

  const [pickerYear, setPickerYear] = useState<number>(year);
  const [pickerMonth, setPickerMonth] = useState<number>(month);

  const [isKebabOpen, setIsKebabOpen] = useState(false);
  const kebabMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (kebabMenuRef.current && !kebabMenuRef.current.contains(e.target as Node)) {
        setIsKebabOpen(false);
      }
    };
    if (isKebabOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isKebabOpen]);

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

  const rawFullName = user?.name?.trim() || 'José Henrique';
  const nameParts = rawFullName.split(/\s+/).filter(Boolean);
  const shortDisplayName = nameParts.slice(0, 2).join(' ') || 'José Henrique';
  const initials = nameParts
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('') || 'JH';

  // Get date breakdown for the Sesame-styled date card
  const [, currentM] = currentYearMonth.split('-').map(Number);
  const monthObj = MONTHS_LIST.find((m) => m.value === currentM) || MONTHS_LIST[0];
  const today = new Date();
  const displayDay = today.getDate();
  const dayOfWeekNames = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
  const displayDayOfWeek = dayOfWeekNames[today.getDay()];

  return (
    <div id="mobile-header-root" className="relative text-white pt-3.5 pb-4 px-3.5 sm:px-4 rounded-b-[28px] shadow-lg transition-all duration-300 bg-[#1c2838] dark:bg-[#0f172a]">
      
      {/* Sesame Organic Wavy SVG Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-45 overflow-hidden rounded-b-[28px]">
        <svg className="w-full h-full object-cover" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M-50 80 C100 20, 250 140, 450 60 L450 -50 L-50 -50 Z" fill="#293b52" />
          <path d="M-20 180 C120 110, 280 230, 430 140 L430 -50 L-20 -50 Z" fill="#223348" />
          <path d="M0 260 C150 200, 300 280, 450 220 L450 300 L0 300 Z" fill="#172232" opacity="0.6" />
        </svg>
      </div>

      {/* Top Bar: User Greeting & Sesame White Circular Controls */}
      <div className={`relative z-50 flex items-center justify-between gap-2 min-w-0 ${isOverview ? 'mb-3.5' : 'mb-1'}`}>
        <div 
          id="btn-header-user-profile"
          onClick={onOpenProfile}
          title="Meu Perfil - Toque para gerenciar"
          aria-label="Abrir gerenciamento de perfil"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenProfile?.();
            }
          }}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group select-none focus:outline-hidden"
        >
          {/* Sesame Organic Avatar with ring and status dot */}
          <div className="relative shrink-0">
            <div 
              id="btn-header-profile-avatar"
              className="w-10 h-10 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white/60 shadow-md group-hover:scale-105 group-hover:ring-blue-400 transition-all overflow-hidden"
            >
              {(user?.photoUrl && !user.photoUrl.includes('googleusercontent.com')) ? (
                <img
                  src={user.photoUrl}
                  alt={user.name || 'Foto de perfil'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-extrabold text-sm text-slate-100">{initials}</span>
              )}
            </div>
            {/* Status indicator ring dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-xs">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight truncate group-hover:text-sky-300 transition-colors">
              {shortDisplayName}
            </h2>
            <p className="text-[11px] font-medium text-slate-300/90 tracking-wide uppercase truncate">
              {user?.department || 'Finanças Pessoais'}
            </p>
          </div>
        </div>

        {/* Action icons: Clean White Circular Buttons (Sesame App style) */}
        <div className="relative z-50 flex items-center gap-1.5 shrink-0">
          {onToggleDarkMode && (
            <button
              id="btn-mobile-toggle-theme"
              onClick={onToggleDarkMode}
              title={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
              aria-label="Alternar tema claro/escuro"
              className="w-8.5 h-8.5 flex items-center justify-center text-slate-700 dark:text-slate-200 bg-white/95 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all cursor-pointer shadow-sm hover:scale-105"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          )}

          <button
            id="btn-mobile-toggle-privacy"
            onClick={onToggleBalancePrivacy}
            title={isBalanceHidden ? "Mostrar valores" : "Ocultar valores"}
            aria-label="Alternar privacidade de saldo"
            className="w-8.5 h-8.5 flex items-center justify-center text-slate-700 dark:text-slate-200 bg-white/95 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all cursor-pointer shadow-sm hover:scale-105"
          >
            {isBalanceHidden ? <EyeOff className="w-4 h-4 text-blue-500 dark:text-blue-400" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Kebab Menu - White circular button with high z-index overlay and non-blocking backdrop */}
          <div className="relative z-50" ref={kebabMenuRef}>
            {isKebabOpen && (
              <div 
                className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
                onClick={() => setIsKebabOpen(false)}
              />
            )}
            <button
              id="btn-kebab-menu"
              onClick={() => setIsKebabOpen((prev) => !prev)}
              title="Mais opções"
              aria-label="Mais opções"
              aria-expanded={isKebabOpen}
              className={`relative z-50 w-8.5 h-8.5 flex items-center justify-center rounded-full transition-all cursor-pointer shadow-sm hover:scale-105 ${
                isKebabOpen
                  ? 'bg-slate-800 text-white dark:bg-slate-700 ring-2 ring-blue-400/50'
                  : 'text-slate-700 dark:text-slate-200 bg-white/95 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isKebabOpen && (
              <div
                id="kebab-dropdown-menu"
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#152238] border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.35)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md text-slate-800 dark:text-slate-100"
              >
                {onOpenCategoryManager && (
                  <button
                    id="kebab-item-categories"
                    type="button"
                    onClick={() => {
                      setIsKebabOpen(false);
                      onOpenCategoryManager();
                    }}
                    className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold">Categorias / Tags</p>
                      <p className="text-[10px] text-slate-400 font-normal">Gerenciar e cadastrar tags</p>
                    </div>
                  </button>
                )}

                <button
                  id="kebab-item-export"
                  type="button"
                  onClick={() => {
                    setIsKebabOpen(false);
                    onOpenExportImport();
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold">Download CSV e Backup</p>
                    <p className="text-[10px] text-slate-400 font-normal">Exportar ou restaurar dados</p>
                  </div>
                </button>

                {onLogout && (
                  <>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      id="kebab-item-logout"
                      type="button"
                      onClick={() => {
                        setIsKebabOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <LogOut className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold">Sair da Conta</p>
                        <p className="text-[10px] text-rose-500/70 font-normal">Encerrar sessão no app</p>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Month Navigator Sub-Bar when NOT in Overview */}
      {!isOverview && (
        <div id="mobile-sub-month-bar" className="relative z-10 flex items-center justify-between mt-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Competência
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isCurrentMonth && (
              <button
                onClick={handleCurrentMonth}
                className="text-[10px] font-bold text-sky-300 hover:text-white bg-blue-800/60 border border-blue-400/30 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer shrink-0"
              >
                Mês Atual
              </button>
            )}

            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full px-1.5 py-0.5 border border-white/20 shadow-xs">
              <button
                id="header-sub-prev-month"
                onClick={handlePrevMonth}
                className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/10"
                title="Mês anterior"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                id="header-sub-open-month-list"
                onClick={handleOpenMonthPicker}
                className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-sky-300 px-2 py-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Clique para selecionar o mês"
              >
                <Calendar className="w-3 h-3 text-sky-400 shrink-0" />
                <span>{formatMonthYear(currentYearMonth)}</span>
              </button>

              <button
                id="header-sub-next-month"
                onClick={handleNextMonth}
                className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/10"
                title="Próximo mês"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Sesame Overview Cards */}
      {isOverview && (
        <div className="relative z-10 space-y-2.5 mt-2">
          
          {/* Card 1: The Signature Sesame White "Registros" Card (Balance & Activity) */}
          <div 
            id="mobile-balance-card" 
            className="bg-white dark:bg-[#152238] text-slate-900 dark:text-slate-100 rounded-2xl p-4 shadow-md border border-slate-100 dark:border-slate-800/80 transition-colors"
          >
            {/* Card Header: Title & Total / Current Month */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                Registros
              </span>

              {/* Month Navigator pill */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-1.5 py-0.5 border border-slate-200/80 dark:border-slate-700">
                <button
                  id="mobile-btn-prev-month"
                  onClick={handlePrevMonth}
                  className="p-0.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer rounded-full"
                  title="Mês anterior"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>

                <button
                  id="btn-open-month-list"
                  onClick={handleOpenMonthPicker}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-400 px-1.5 py-0.5 rounded-full transition-colors cursor-pointer"
                  title="Clique para selecionar o mês na lista"
                >
                  <Calendar className="w-2.5 h-2.5 text-blue-600 dark:text-sky-400" />
                  <span>{formatMonthYear(currentYearMonth)}</span>
                </button>

                <button
                  id="mobile-btn-next-month"
                  onClick={handleNextMonth}
                  className="p-0.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                  title="Próximo mês"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Middle Section: Big Sesame Date Block on Left + Income / Expense Arrows on Right */}
            <div className="flex items-center justify-between gap-3 py-1">
              
              {/* Sesame Date Block (e.g. 21 Segunda-Feira Setembro) */}
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {displayDay}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {displayDayOfWeek}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {monthObj.name}
                  </p>
                </div>
              </div>

              {/* Sesame In/Out Arrows with values */}
              <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-blue-600 dark:text-sky-400">
                  <span className="text-sm leading-none">➔</span>
                  <span>{isBalanceHidden ? '••••••' : formatCurrency(summary.totalIncome)}</span>
                </div>
                <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-rose-500 dark:text-rose-400">
                  <span className="text-sm leading-none">➔</span>
                  <span>{isBalanceHidden ? '••••••' : formatCurrency(summary.totalExpense)}</span>
                </div>
              </div>
            </div>

            {/* Bottom Status / Balance Sub-row */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
              <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span>Saldo Líquido:</span>
                <span className={`font-black ${summary.balance < 0 ? 'text-rose-500' : 'text-blue-600 dark:text-sky-400'}`}>
                  {isBalanceHidden ? 'R$ ••••••' : formatCurrency(summary.balance)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>Fixas: <b className="text-slate-700 dark:text-slate-200">{isBalanceHidden ? '••' : formatCurrency(summary.fixedExpenses)}</b></span>
              </div>
            </div>

          </div>

          {/* Quick Action Navigation Chips - Sesame Clean Pill Grid */}
          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            <button
              id="btn-quick-new-income"
              onClick={() => onOpenNewTransaction('income')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer group hover:scale-[1.02]"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-500/25 text-sky-300 flex items-center justify-center mb-0.5">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-white">Receita</span>
            </button>

            <button
              id="btn-quick-new-expense"
              onClick={() => onOpenNewTransaction('expense')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer group hover:scale-[1.02]"
            >
              <div className="w-6 h-6 rounded-lg bg-rose-500/25 text-rose-300 flex items-center justify-center mb-0.5">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-white">Despesa</span>
            </button>

            <button
              id="btn-quick-go-fixed"
              onClick={() => onNavigateTab('fixed')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer group hover:scale-[1.02]"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-500/25 text-indigo-300 flex items-center justify-center mb-0.5">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-white">Fixas</span>
            </button>

            <button
              id="btn-quick-go-parcelas"
              onClick={() => onNavigateTab('installments')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer group hover:scale-[1.02]"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-500/25 text-amber-300 flex items-center justify-center mb-0.5">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-white">Parcelas</span>
            </button>
          </div>

        </div>
      )}

      {/* Month Selection Modal / Sheet */}
      {isMonthPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#152238] border border-slate-700/80 text-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 bg-[#111c2e]/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-slate-800 text-sky-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Selecionar Mês e Ano
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              {/* Filtro / Controle de Ano */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ano
                </label>
                <div className="flex items-center justify-between bg-white dark:bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setPickerYear((prev) => prev - 1)}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
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
                      className="w-24 text-center font-black text-xl bg-transparent text-slate-900 focus:outline-none"
                      placeholder="2026"
                      min={2000}
                      max={2100}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickerYear((prev) => prev + 1)}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    title="Próximo ano"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filtro / Seleção de Mês - Grade dos 12 meses */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
                    className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                  >
                    Ir para Mês Atual
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 max-h-[42vh] overflow-y-auto pr-0.5">
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
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-[#2563eb] text-white shadow-md shadow-blue-900/40 font-bold ring-2 ring-blue-400'
                            : isPickerActive
                            ? 'bg-blue-50 text-blue-700 border-2 border-blue-500 font-bold shadow-xs'
                            : 'bg-white dark:bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-blue-300'
                        }`}
                      >
                        <span className="text-xs">{m.name}</span>
                        {isCurrentSystemMonth && (
                          <span className={`text-[8px] mt-0.5 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                            isSelected ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-700'
                          }`}>
                            Atual
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-700/60 bg-[#111c2e]/60 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const [sysY, sysM] = systemCurrentMonth.split('-').map(Number);
                  setPickerYear(sysY);
                  setPickerMonth(sysM);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
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
                className="px-5 py-2 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl transition-all cursor-pointer shadow-md shadow-blue-900/30 active:scale-95"
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
