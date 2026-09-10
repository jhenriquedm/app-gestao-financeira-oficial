import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Download, 
  Calendar,
  Wallet
} from 'lucide-react';
import { formatMonthYear } from '../utils/formatters';

interface HeaderProps {
  currentYearMonth: string; // YYYY-MM
  onMonthChange: (yearMonth: string) => void;
  onOpenNewTransaction: () => void;
  onOpenExportImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentYearMonth,
  onMonthChange,
  onOpenNewTransaction,
  onOpenExportImport,
}) => {
  const [year, month] = currentYearMonth.split('-').map(Number);

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onMonthChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
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
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${curYear}-${curMonth}`);
  };

  const now = new Date();
  const todayYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = currentYearMonth === todayYearMonth;

  return (
    <header id="app-header" className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div id="brand-icon-wrapper" className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 id="app-title" className="text-xl font-bold tracking-tight text-neutral-900">
                  Gestão Financeira
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  Pessoal
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Controle inteligente de fluxo, receitas e despesas
              </p>
            </div>
          </div>

          {/* Month Navigator */}
          <div id="month-navigator" className="flex items-center justify-between sm:justify-center gap-1.5 bg-neutral-100/80 p-1.5 rounded-xl border border-neutral-200">
            <button
              id="btn-prev-month"
              onClick={handlePrevMonth}
              title="Mês anterior"
              aria-label="Mês anterior"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span id="current-month-display" className="text-sm font-semibold text-neutral-800 min-w-[140px] text-center">
                {formatMonthYear(currentYearMonth)}
              </span>
            </div>

            <button
              id="btn-next-month"
              onClick={handleNextMonth}
              title="Próximo mês"
              aria-label="Próximo mês"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isCurrentMonth && (
              <button
                id="btn-today-month"
                onClick={handleCurrentMonth}
                className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition-colors ml-1 cursor-pointer"
              >
                Hoje
              </button>
            )}
          </div>

          {/* Header Action Buttons */}
          <div id="header-actions" className="flex items-center gap-2.5">
            <button
              id="btn-export-backup"
              onClick={onOpenExportImport}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl transition-colors shadow-2xs cursor-pointer"
              title="Exportar CSV ou restaurar backup"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>Exportar / Dados</span>
            </button>

            <button
              id="btn-open-new-transaction"
              onClick={onOpenNewTransaction}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Transação</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
