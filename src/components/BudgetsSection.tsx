import React, { useState } from 'react';
import { Target, Edit2, CheckCircle2, ShieldAlert, Trash2, Plus, X, Tag } from 'lucide-react';
import { Budget, Category, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currencyMask';

interface BudgetsSectionProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  currentYearMonth: string;
  onSaveBudget: (budget: Budget) => void;
  onDeleteBudget: (budgetId: string) => void;
}

interface BudgetFormData {
  id?: string;
  name: string;
  categoryId: string;
  monthlyLimit: string;
}

const MAX_NAME_LENGTH = 35;

export const BudgetsSection: React.FC<BudgetsSectionProps> = ({
  budgets,
  categories,
  transactions,
  currentYearMonth,
  onSaveBudget,
  onDeleteBudget,
}) => {
  const [formData, setFormData] = useState<BudgetFormData | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);

  // Filter and sort expense categories alphabetically
  const expenseCategories = categories
    .filter((c) => c.type === 'expense')
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Calculate expenses in current month per category
  const currentMonthExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(currentYearMonth)
  );

  const spentPerCategory: Record<string, number> = {};
  currentMonthExpenses.forEach((t) => {
    spentPerCategory[t.categoryId] = (spentPerCategory[t.categoryId] || 0) + t.amount;
  });

  // Calculate total budget vs total spent in budgeted categories
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalSpentInBudgeted = budgets.reduce((sum, b) => sum + (spentPerCategory[b.categoryId] || 0), 0);
  const overallBudgetPercent = totalBudgeted > 0 ? (totalSpentInBudgeted / totalBudgeted) * 100 : 0;

  const handleOpenCreate = () => {
    const defaultCat = expenseCategories[0];
    setFormData({
      name: defaultCat ? defaultCat.name : '',
      categoryId: defaultCat ? defaultCat.id : '',
      monthlyLimit: '500,00',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (budget: Budget) => {
    const cat = categoryMap.get(budget.categoryId);
    setFormData({
      id: budget.id,
      name: budget.name || cat?.name || 'Teto de Gastos',
      categoryId: budget.categoryId,
      monthlyLimit: formatCurrencyInput(budget.monthlyLimit),
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormData(null);
    setIsFormOpen(false);
    setFormError('');
  };

  const handleCategoryChange = (newCatId: string) => {
    if (!formData) return;
    const cat = categoryMap.get(newCatId);
    // If the name was empty or equal to the previous category name, update it automatically to the new category name
    const currentCat = categoryMap.get(formData.categoryId);
    const shouldUpdateName = !formData.name.trim() || (currentCat && formData.name === currentCat.name);
    
    setFormData({
      ...formData,
      categoryId: newCatId,
      name: shouldUpdateName && cat ? cat.name.slice(0, MAX_NAME_LENGTH) : formData.name,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setFormError('Por favor, informe o nome do teto.');
      return;
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      setFormError(`O nome do teto não pode exceder ${MAX_NAME_LENGTH} caracteres.`);
      return;
    }

    if (!formData.categoryId) {
      setFormError('Por favor, selecione uma categoria vinculada.');
      return;
    }

    const limit = parseCurrencyInput(formData.monthlyLimit);
    if (limit <= 0) {
      setFormError('Por favor, informe um valor de limite mensal maior que zero.');
      return;
    }

    onSaveBudget({
      id: formData.id || `b-${Date.now()}`,
      name: trimmedName,
      categoryId: formData.categoryId,
      monthlyLimit: limit,
    });

    handleCloseForm();
  };

  return (
    <div id="budgets-section" className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs p-3.5 sm:p-5 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 id="budgets-title" className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Tetos de Gastos & Orçamentos</span>
          </h2>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Defina limites por categoria para manter suas despesas sob controle
          </p>
        </div>

        <button
          id="btn-add-budget"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Teto</span>
        </button>
      </div>

      {/* Global Budget Overview Bar */}
      <div id="budget-overall-card" className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3 sm:p-4 border border-neutral-200/80 dark:border-neutral-700/60">
        <div className="flex flex-wrap items-center justify-between text-xs mb-1.5 gap-1">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300 text-[11px] sm:text-xs">
            Gasto Orçado vs Teto Mensal
          </span>
          <span className="font-bold text-neutral-900 dark:text-white text-[11px] sm:text-xs">
            {formatCurrency(totalSpentInBudgeted)} / {formatCurrency(totalBudgeted)} ({overallBudgetPercent.toFixed(0)}%)
          </span>
        </div>
        <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallBudgetPercent >= 100
                ? 'bg-rose-500'
                : overallBudgetPercent >= 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(overallBudgetPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Modal / Form for Creating or Editing Budget */}
      {isFormOpen && formData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {formData.id ? 'Editar Teto de Gastos' : 'Novo Teto de Gastos'}
                </h3>
              </div>
              <button
                onClick={handleCloseForm}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3.5">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Teto Name with Character Limit */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="budget-name-input" className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                    Nome do Teto *
                  </label>
                  <span className={`text-[10px] font-medium ${
                    formData.name.length >= MAX_NAME_LENGTH ? 'text-rose-500 font-bold' : 'text-neutral-400'
                  }`}>
                    {formData.name.length}/{MAX_NAME_LENGTH}
                  </span>
                </div>
                <input
                  id="budget-name-input"
                  type="text"
                  required
                  maxLength={MAX_NAME_LENGTH}
                  placeholder="Ex: Mercado & Feira, Combustível, Lazer..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xl focus:border-indigo-500 focus:outline-hidden transition-all"
                  autoFocus
                />
              </div>

              {/* Linked Category (Sorted Alphabetically) */}
              <div>
                <label htmlFor="budget-category-select" className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Categoria Vinculada *
                </label>
                <div className="relative">
                  <select
                    id="budget-category-select"
                    required
                    value={formData.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-xs font-medium bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xl focus:border-indigo-500 focus:outline-hidden transition-all appearance-none cursor-pointer"
                  >
                    {expenseCategories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="text-neutral-900 bg-white dark:bg-neutral-800 dark:text-white">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <Tag className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Monthly Limit Value */}
              <div>
                <label htmlFor="budget-limit-input" className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Limite Mensal (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">R$</span>
                  <input
                    id="budget-limit-input"
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0,00"
                    maxLength={14}
                    value={formData.monthlyLimit}
                    onChange={(e) => setFormData({ ...formData, monthlyLimit: formatCurrencyInput(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xl focus:border-indigo-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-save-budget-modal"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Salvar Teto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBudgetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
              Excluir este Teto de Gastos?
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              O limite deixará de ser monitorado. Os lançamentos de despesas vinculados à categoria não serão apagados.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingBudgetId(null)}
                className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteBudget(deletingBudgetId);
                  setDeletingBudgetId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer"
              >
                Sim, Excluir Teto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Budgets List */}
      <div id="budgets-grid" className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
        {budgets.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30">
            <Target className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Nenhum teto de gastos cadastrado ainda.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              + Criar primeiro teto de gastos
            </button>
          </div>
        ) : (
          budgets.map((budget) => {
            const cat = categoryMap.get(budget.categoryId);
            const spent = spentPerCategory[budget.categoryId] || 0;
            const percentage = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;
            const remaining = budget.monthlyLimit - spent;
            const isExceeded = spent > budget.monthlyLimit;
            const isWarning = percentage >= 80 && !isExceeded;
            const displayName = budget.name || cat?.name || 'Teto de Gastos';

            return (
              <div
                key={budget.id}
                id={`budget-card-${budget.id}`}
                className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all bg-white dark:bg-neutral-900/90 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${cat?.color || '#6366f1'}22`,
                          color: cat?.color || '#6366f1',
                        }}
                      >
                        <CategoryIcon name={cat?.iconName || 'Tag'} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {displayName}
                          </h4>
                          {cat && cat.name !== displayName && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                              {cat.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          Teto: {formatCurrency(budget.monthlyLimit)}/mês
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        id={`btn-edit-budget-${budget.id}`}
                        onClick={() => handleOpenEdit(budget)}
                        title="Editar todos os dados do teto"
                        className="p-1.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        id={`btn-delete-budget-${budget.id}`}
                        onClick={() => setDeletingBudgetId(budget.id)}
                        title="Excluir este teto"
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isExceeded ? 'bg-rose-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] sm:text-xs pt-1 border-t border-neutral-100 dark:border-neutral-800 gap-1">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Gasto: <strong className="text-neutral-800 dark:text-neutral-200">{formatCurrency(spent)}</strong> ({percentage.toFixed(0)}%)
                  </span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      isExceeded ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {isExceeded ? (
                      <>
                        <ShieldAlert className="w-3 h-3 shrink-0" /> Excedeu {formatCurrency(Math.abs(remaining))}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 shrink-0" /> Restam {formatCurrency(remaining)}
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
