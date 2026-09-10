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
    <nav
      id="mobile-bottom-dock"
      className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800 px-2 py-1 shadow-lg transition-colors"
    >
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        
        {/* Tab 1: Início */}
        <button
          id="mobile-tab-overview"
          onClick={() => onTabChange('overview')}
          className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className={`w-5 h-5 ${activeTab === 'overview' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Início</span>
        </button>

        {/* Tab 2: Fixas (Despesas Fixas / Aluguel) */}
        <button
          id="mobile-tab-fixed"
          onClick={() => onTabChange('fixed')}
          className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'fixed'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium'
          }`}
        >
          <div className="relative">
            <Building2 className={`w-5 h-5 ${activeTab === 'fixed' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Fixas</span>
        </button>

        {/* Center Floating Action Button (FAB) */}
        <div className="flex flex-col items-center justify-center px-1">
          <button
            id="mobile-center-fab"
            onClick={onOpenNewTransaction}
            title="Adicionar Lançamento, Fixa ou Parcela"
            aria-label="Novo Lançamento"
            className="w-11 h-11 -mt-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 ring-4 ring-white dark:ring-neutral-900 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
          <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 mt-0.5">Novo</span>
        </div>

        {/* Tab 3: Parcelas (Dívidas e Prestações) */}
        <button
          id="mobile-tab-installments"
          onClick={() => onTabChange('installments')}
          className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'installments'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium'
          }`}
        >
          <div className="relative">
            <CreditCard className={`w-5 h-5 ${activeTab === 'installments' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Parcelas</span>
        </button>

        {/* Tab 4: Extrato / Histórico */}
        <button
          id="mobile-tab-transactions"
          onClick={() => onTabChange('transactions')}
          className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition-colors cursor-pointer ${
            activeTab === 'transactions' || activeTab === 'budgets' || activeTab === 'goals'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium'
          }`}
        >
          <div className="relative">
            <Receipt className={`w-5 h-5 ${activeTab === 'transactions' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {pendingCount > 0 && (
              <span 
                title={`${pendingCount} pendentes`}
                className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white"
              >
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Extrato</span>
        </button>

      </div>
    </nav>
  );
};
