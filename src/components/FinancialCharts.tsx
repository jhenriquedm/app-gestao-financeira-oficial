import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Transaction, Category } from '../types';
import { formatCurrency, MONTH_NAMES } from '../utils/formatters';
import { PieChart as PieIcon, BarChart3 } from 'lucide-react';

interface FinancialChartsProps {
  transactions: Transaction[];
  categories: Category[];
  currentYearMonth: string;
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  transactions,
  categories,
  currentYearMonth,
}) => {
  const [mobileTab, setMobileTab] = React.useState<'monthly' | 'categories' | 'both'>('monthly');
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // 1. Data for Monthly Comparison (Last 6 months)
  const monthlyData = React.useMemo(() => {
    const [currYear, currMonth] = currentYearMonth.split('-').map(Number);
    const months: { year: number; month: number; key: string; label: string }[] = [];

    for (let i = 5; i >= 0; i--) {
      let m = currMonth - i;
      let y = currYear;
      while (m <= 0) {
        m += 12;
        y -= 1;
      }
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[m - 1].slice(0, 3)}/${String(y).slice(2)}`;
      months.push({ year: y, month: m, key, label });
    }

    return months.map(({ key, label }) => {
      const monthTx = transactions.filter((t) => t.date.startsWith(key));
      const income = monthTx
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTx
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        key,
        name: label,
        Receitas: Number(income.toFixed(2)),
        Despesas: Number(expense.toFixed(2)),
      };
    });
  }, [transactions, currentYearMonth]);

  // 2. Data for Category Distribution (Current selected month)
  const categoryExpenseData = React.useMemo(() => {
    const currentMonthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(currentYearMonth)
    );

    const expenseByCategory: Record<string, number> = {};
    currentMonthExpenses.forEach((t) => {
      expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] || 0) + t.amount;
    });

    const totalExpense = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

    const data = Object.entries(expenseByCategory).map(([catId, amount]) => {
      const cat = categoryMap.get(catId);
      const percent = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        id: catId,
        name: cat?.name || 'Outras Despesas',
        value: Number(amount.toFixed(2)),
        percent: Number(percent.toFixed(1)),
        color: cat?.color || '#a855f7',
      };
    });

    // Sort highest to lowest
    return data.sort((a, b) => b.value - a.value);
  }, [transactions, currentYearMonth, categoryMap]);

  return (
    <div id="financial-charts-wrapper" className="space-y-3 my-2">
      {/* Chart View Switcher (Always visible and responsive) */}
      <div className="flex bg-neutral-200/80 p-1 rounded-xl gap-1">
        <button
          onClick={() => setMobileTab('monthly')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            mobileTab === 'monthly'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Evolução</span>
        </button>

        <button
          onClick={() => setMobileTab('categories')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            mobileTab === 'categories'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <PieIcon className="w-3.5 h-3.5 text-rose-600" />
          <span>Categorias</span>
        </button>

        <button
          onClick={() => setMobileTab('both')}
          className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            mobileTab === 'both'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <span>Ambos</span>
        </button>
      </div>

      <div id="financial-charts-container" className="flex flex-col gap-3.5">
        
        {/* Gráfico 1: Receitas vs Despesas (Últimos 6 meses) */}
        {(mobileTab === 'monthly' || mobileTab === 'both') && (
          <div 
            id="chart-monthly-comparison" 
            className="w-full bg-white rounded-xl p-3 border border-neutral-200/90 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                  Evolução: Receitas vs Despesas
                </h3>
                <p className="text-[10px] text-neutral-500">
                  Histórico dos últimos 6 meses
                </p>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tick={{ fontSize: 10, fill: '#6b7280' }} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={{ stroke: '#e5e7eb' }} 
                    tick={{ fontSize: 9.5, fill: '#6b7280' }}
                    tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip 
                    formatter={(val: any) => [
                      formatCurrency(Number(val || 0)), 
                      ''
                    ]}
                    contentStyle={{ 
                      borderRadius: '10px', 
                      border: '1px solid #e5e7eb', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '11px'
                    }} 
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} 
                    iconType="circle"
                  />
                  <Bar dataKey="Receitas" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="Despesas" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Gráfico 2: Despesas por Categoria no Mês */}
        {(mobileTab === 'categories' || mobileTab === 'both') && (
          <div 
            id="chart-category-distribution" 
            className="w-full bg-white rounded-xl p-3 border border-neutral-200/90 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-rose-600" />
                  Despesas por Categoria
                </h3>
                <p className="text-[10px] text-neutral-500">
                  Distribuição no mês selecionado
                </p>
              </div>
            </div>

            {categoryExpenseData.length > 0 ? (
              <div className="flex flex-col items-center">
                {/* Donut Chart - Full Width Centered */}
                <div className="h-38 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryExpenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={58}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryExpenseData.map((entry) => (
                          <Cell key={entry.id} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: any, _name: any, item: any) => [
                          `${formatCurrency(Number(val || 0))} (${item?.payload?.percent || 0}%)`,
                          item?.payload?.name || ''
                        ]}
                        contentStyle={{ 
                          borderRadius: '10px', 
                          border: '1px solid #e5e7eb', 
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '11px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category breakdown list - Full Width, Beautiful & Responsive */}
                <div className="w-full space-y-2 pt-2 border-t border-neutral-100">
                  {categoryExpenseData.slice(0, 6).map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: cat.color }} 
                          />
                          <span className="text-neutral-800 font-semibold truncate max-w-[140px]">
                            {cat.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-1.5">
                          <span className="font-bold text-neutral-900">{formatCurrency(cat.value)}</span>
                          <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md">
                            {cat.percent}%
                          </span>
                        </div>
                      </div>
                      {/* Visual progress bar for proportion */}
                      <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(cat.percent, 100)}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  ))}
                  {categoryExpenseData.length > 6 && (
                    <p className="text-[11px] text-neutral-500 text-center pt-1">
                      +{categoryExpenseData.length - 6} outras categorias registradas
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4">
                <PieIcon className="w-8 h-8 text-neutral-300 mb-2" />
                <p className="text-sm font-medium text-neutral-600">Nenhuma despesa registrada</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Adicione uma despesa para ver os gráficos.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
