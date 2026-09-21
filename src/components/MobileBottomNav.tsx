import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  Receipt, 
  Plus 
} from 'lucide-react';

export type AppNavTab = 'overview' | 'fixed' | 'installments' | 'transactions' | 'budgets' | 'goals';

interface MobileBottomNavProps {
  activeTab: AppNavTab;
  onTabChange: (tab: AppNavTab) => void;
  onOpenNewTransaction: () => void;
  pendingCount?: number;
  installmentsCount?: number;
  fixedCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenNewTransaction,
  pendingCount = 0,
}) => {
  return (
    <div className="shrink-0 w-full z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-1 bg-gradient-to-t from-[#f4f6fa] dark:from-[#0b111e] via-[#f4f6fa]/80 dark:via-[#0b111e]/80 to-transparent pointer-events-none">
      <nav
        id="mobile-bottom-dock"
        className="pointer-events-auto bg-[#1c2838] dark:bg-[#0f172a] backdrop-blur-2xl border border-slate-700/80 rounded-[28px] px-2.5 py-1.5 shadow-[0_14px_36px_-4px_rgba(15,23,42,0.35)] dark:shadow-[0_14px_36px_-4px_rgba(0,0,0,0.8)] transition-all max-w-md mx-auto"
      >
        <div className="flex items-center justify-between relative">
          
          {/* Tab 1: Início */}
          <button
            id="mobile-tab-overview"
            onClick={() => onTabChange('overview')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 min-h-[48px] rounded-2xl transition-all cursor-pointer relative group ${
              activeTab === 'overview'
                ? 'text-white font-bold bg-white/15 ring-1 ring-white/10'
                : 'text-slate-400 hover:text-slate-200 font-medium hover:bg-slate-800/40'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <LayoutDashboard className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${activeTab === 'overview' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Início</span>
          </button>

          {/* Tab 2: Fixas (Despesas Fixas) */}
          <button
            id="mobile-tab-fixed"
            onClick={() => onTabChange('fixed')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 min-h-[48px] rounded-2xl transition-all cursor-pointer relative group ${
              activeTab === 'fixed'
                ? 'text-white font-bold bg-white/15 ring-1 ring-white/10'
                : 'text-slate-400 hover:text-slate-200 font-medium hover:bg-slate-800/40'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Building2 className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${activeTab === 'fixed' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Fixas</span>
          </button>

          {/* Center Floating Action Button (FAB) */}
          <div className="flex flex-col items-center justify-center px-1.5 shrink-0">
            <button
              id="mobile-center-fab"
              onClick={onOpenNewTransaction}
              title="Adicionar Lançamento"
              aria-label="Novo Lançamento"
              className="w-12 h-12 -mt-5 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center shadow-lg shadow-blue-600/35 ring-4 ring-[#1c2838] dark:ring-[#0f172a] active:scale-90 hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.75]" />
            </button>
            <span className="text-[9.5px] font-bold text-slate-300 mt-0.5">Novo</span>
          </div>

          {/* Tab 3: Parcelas */}
          <button
            id="mobile-tab-installments"
            onClick={() => onTabChange('installments')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 min-h-[48px] rounded-2xl transition-all cursor-pointer relative group ${
              activeTab === 'installments'
                ? 'text-white font-bold bg-white/15 ring-1 ring-white/10'
                : 'text-slate-400 hover:text-slate-200 font-medium hover:bg-slate-800/40'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <CreditCard className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${activeTab === 'installments' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Parcelas</span>
          </button>

          {/* Tab 4: Extrato */}
          <button
            id="mobile-tab-transactions"
            onClick={() => onTabChange('transactions')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 min-h-[48px] rounded-2xl transition-all cursor-pointer relative group ${
              activeTab === 'transactions' || activeTab === 'budgets' || activeTab === 'goals'
                ? 'text-white font-bold bg-white/15 ring-1 ring-white/10'
                : 'text-slate-400 hover:text-slate-200 font-medium hover:bg-slate-800/40'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Receipt className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${activeTab === 'transactions' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {pendingCount > 0 && (
                <span 
                  title={`${pendingCount} pendentes`}
                  className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#1c2838] dark:ring-[#0f172a]"
                >
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Extrato</span>
          </button>

        </div>
      </nav>
    </div>
  );
};
