import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Edit2, 
  Trash2, 
  Tag, 
  Layers, 
  CreditCard, 
  TrendingUp, 
  Check, 
  AlertCircle,
  Lock
} from 'lucide-react';
import { Category, Transaction, DebtInstallment, Budget } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { sanitizeNameInput } from '../utils/textSanitizer';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  parcelCategories: string[];
  initialTab?: 'fixed' | 'parcelas' | 'income';
  transactions?: Transaction[];
  installments?: DebtInstallment[];
  budgets?: Budget[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onEditCategory: (id: string, updated: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
  onAddParcelCategory: (name: string) => void;
  onEditParcelCategory: (oldName: string, newName: string) => void;
  onDeleteParcelCategory: (name: string) => void;
}

type TabType = 'fixed' | 'parcelas' | 'income';

const PRESET_COLORS = [
  '#f97316', '#ef4444', '#3b82f6', '#64748b', '#6366f1', 
  '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#10b981', 
  '#f59e0b', '#84cc16', '#a855f7', '#06b6d4'
];

const PRESET_ICONS = [
  'DollarSign', 'Coins', 'Briefcase', 'Wallet', 'PiggyBank', 'Landmark',
  'TrendingUp', 'CreditCard', 'Home', 'Utensils', 'Car',
  'HeartPulse', 'GraduationCap', 'Coffee', 'Tv', 'ShoppingBag',
  'ShieldCheck', 'Plane', 'Laptop', 'PlusCircle', 'Tag'
];

const MAX_CATEGORY_NAME_LENGTH = 25;
// Permitir letras (com acentos), números, espaços, barras e hífens. Sem caracteres especiais.
const VALID_NAME_REGEX = /^[\p{L}\p{N}\s\-/]+$/u;

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  parcelCategories,
  initialTab = 'fixed',
  transactions = [],
  installments = [],
  budgets = [],
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddParcelCategory,
  onEditParcelCategory,
  onDeleteParcelCategory,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  
  // Add category state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newIcon, setNewIcon] = useState(PRESET_ICONS[0]);
  const [addError, setAddError] = useState('');
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const successTimerRef = React.useRef<any>(null);

  const triggerSuccess = (msg: string) => {
    setSuccessFeedback(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => {
      setSuccessFeedback(null);
    }, 2000);
  };

  React.useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Edit category state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(PRESET_COLORS[0]);
  const [editIcon, setEditIcon] = useState(PRESET_ICONS[0]);
  const [editError, setEditError] = useState('');

  // Edit parcel category state
  const [editingParcelName, setEditingParcelName] = useState<string | null>(null);
  const [editParcelInput, setEditParcelInput] = useState('');
  const [editParcelError, setEditParcelError] = useState('');

  // Delete confirmation or blocked modal state
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{
    type: 'category' | 'parcel';
    idOrName: string;
    title: string;
  } | null>(null);

  const [blockedDeleteMessage, setBlockedDeleteMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Organize categories in alphabetical order
  const sortedExpenseCategories = categories
    .filter((c) => c.type === 'expense')
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const sortedIncomeCategories = categories
    .filter((c) => c.type === 'income')
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const sortedParcelCategories = [...parcelCategories]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Helper to check if a category is currently linked to any records
  const getCategoryUsage = (catId: string, catName: string) => {
    const txCount = transactions.filter(t => t.categoryId === catId || t.categoryId === catName).length;
    const budgetCount = budgets.filter(b => b.categoryId === catId).length;
    const instCount = installments.filter(i => i.category === catName || i.category === catId).length;
    const total = txCount + budgetCount + instCount;
    const details: string[] = [];
    if (txCount > 0) details.push(`${txCount} transação(ões)`);
    if (budgetCount > 0) details.push(`${budgetCount} teto(s) de gastos`);
    if (instCount > 0) details.push(`${instCount} parcela(s)`);
    return { total, detailsText: details.join(', ') };
  };

  // Helper to check if a parcel category is linked
  const getParcelUsage = (name: string) => {
    const instCount = installments.filter(i => i.category === name).length;
    const txCount = transactions.filter(t => t.categoryId === name).length;
    const total = instCount + txCount;
    const details: string[] = [];
    if (instCount > 0) details.push(`${instCount} parcela(s)`);
    if (txCount > 0) details.push(`${txCount} transação(ões)`);
    return { total, detailsText: details.join(', ') };
  };

  const validateCategoryName = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'O nome da categoria é obrigatório.';
    }
    if (trimmed.length > MAX_CATEGORY_NAME_LENGTH) {
      return `O nome não pode ter mais que ${MAX_CATEGORY_NAME_LENGTH} caracteres.`;
    }
    if (!VALID_NAME_REGEX.test(trimmed)) {
      return 'Não são permitidos caracteres especiais (como @, #, $, %, etc.). Use apenas letras, números e espaços.';
    }
    return null;
  };

  const handleStartAdd = () => {
    setNewName('');
    setNewColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setNewIcon('Tag');
    setAddError('');
    setIsAdding(true);
    setEditingId(null);
    setEditingParcelName(null);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    const errorMsg = validateCategoryName(newName);
    if (errorMsg) {
      setAddError(errorMsg);
      return;
    }

    const trimmed = newName.trim();
    if (activeTab === 'parcelas') {
      onAddParcelCategory(trimmed);
    } else {
      onAddCategory({
        name: trimmed,
        type: activeTab === 'income' ? 'income' : 'expense',
        target: activeTab === 'income' ? 'income' : 'fixed',
        color: newColor,
        iconName: newIcon,
      });
    }

    setNewName('');
    setAddError('');
    // Keep form open for further registrations and notify user
    setIsAdding(true);
    triggerSuccess('Registro salvo com sucesso');
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditIcon(cat.iconName);
    setEditError('');
    setIsAdding(false);
    setEditingParcelName(null);
  };

  const handleSaveEdit = (id: string) => {
    const errorMsg = validateCategoryName(editName);
    if (errorMsg) {
      setEditError(errorMsg);
      return;
    }

    onEditCategory(id, {
      name: editName.trim(),
      color: editColor,
      iconName: editIcon,
    });
    setEditingId(null);
    setEditError('');
    triggerSuccess('Registro salvo com sucesso');
  };

  const handleStartEditParcel = (name: string) => {
    setEditingParcelName(name);
    setEditParcelInput(name);
    setEditParcelError('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSaveEditParcel = (oldName: string) => {
    const errorMsg = validateCategoryName(editParcelInput);
    if (errorMsg) {
      setEditParcelError(errorMsg);
      return;
    }

    onEditParcelCategory(oldName, editParcelInput.trim());
    setEditingParcelName(null);
    setEditParcelError('');
    triggerSuccess('Registro salvo com sucesso');
  };

  const attemptDeleteCategory = (cat: Category) => {
    const usage = getCategoryUsage(cat.id, cat.name);
    if (usage.total > 0) {
      setBlockedDeleteMessage(
        `A categoria "${cat.name}" não pode ser excluída pois está vinculada a ${usage.detailsText}. Altere ou exclua os lançamentos antes de remover esta categoria.`
      );
      return;
    }
    setConfirmDeleteTarget({
      type: 'category',
      idOrName: cat.id,
      title: cat.name,
    });
  };

  const attemptDeleteParcelCategory = (name: string) => {
    const usage = getParcelUsage(name);
    if (usage.total > 0) {
      setBlockedDeleteMessage(
        `A categoria de parcelas "${name}" não pode ser excluída pois está vinculada a ${usage.detailsText}. Altere ou exclua as parcelas vinculadas antes de remover esta categoria.`
      );
      return;
    }
    setConfirmDeleteTarget({
      type: 'parcel',
      idOrName: name,
      title: name,
    });
  };

  const confirmDelete = () => {
    if (!confirmDeleteTarget) return;
    if (confirmDeleteTarget.type === 'category') {
      onDeleteCategory(confirmDeleteTarget.idOrName);
    } else {
      onDeleteParcelCategory(confirmDeleteTarget.idOrName);
    }
    setConfirmDeleteTarget(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="category-manager-modal" 
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                Gerenciar Categorias
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Organizadas em ordem alfabética • Crie, edite e personalize
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-4 pt-2 gap-2 bg-neutral-100/50 dark:bg-neutral-950/40">
          <button
            onClick={() => { setActiveTab('fixed'); setIsAdding(false); setEditingId(null); }}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'fixed'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Despesas ({sortedExpenseCategories.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('parcelas'); setIsAdding(false); setEditingId(null); }}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'parcelas'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Parcelas ({sortedParcelCategories.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('income'); setIsAdding(false); setEditingId(null); }}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'income'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Receitas ({sortedIncomeCategories.length})</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Success Feedback Alert (displays for 2 seconds) */}
          {successFeedback && (
            <div
              id="category-modal-success-feedback"
              className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in duration-200"
            >
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successFeedback}</span>
            </div>
          )}

          {/* Add Category Button / Form */}
          {!isAdding ? (
            <button
              onClick={handleStartAdd}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Categoria de {activeTab === 'fixed' ? 'Despesa' : activeTab === 'parcelas' ? 'Parcela' : 'Receita'}</span>
            </button>
          ) : (
            <form onSubmit={handleSaveNew} className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Criar Nova Categoria
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {addError && (
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                    Nome da Categoria *
                  </label>
                  <span className={`text-[10px] font-medium ${
                    newName.length >= MAX_CATEGORY_NAME_LENGTH ? 'text-rose-500 font-bold' : 'text-neutral-400'
                  }`}>
                    {newName.length}/{MAX_CATEGORY_NAME_LENGTH}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={MAX_CATEGORY_NAME_LENGTH}
                  placeholder="Ex: Farmácia, Manutenção..."
                  value={newName}
                  onChange={(e) => {
                    setNewName(sanitizeNameInput(e.target.value));
                    setAddError('');
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-hidden"
                  autoFocus
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Máximo de 25 caracteres. Apenas letras, números e espaços (sem caracteres especiais).
                </p>
              </div>

              {activeTab !== 'parcelas' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Cor Identificadora
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewColor(c)}
                          className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${newColor === c ? 'scale-110 ring-2 ring-emerald-500 ring-offset-1' : 'opacity-80 hover:opacity-100'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Ícone
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white/60 dark:bg-neutral-900/60 rounded-lg border border-neutral-200 dark:border-neutral-800">
                      {PRESET_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewIcon(icon)}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${newIcon === icon ? 'bg-emerald-600 text-white' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
                        >
                          <CategoryIcon name={icon} className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          )}

          {/* List of Items in Alphabetical Order */}
          <div className="space-y-2">
            {activeTab === 'parcelas' ? (
              sortedParcelCategories.length === 0 ? (
                <div className="text-center py-6 px-4 bg-neutral-50/50 dark:bg-neutral-800/30 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500">
                  <CreditCard className="w-7 h-7 mx-auto text-neutral-400 mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Nenhuma categoria de parcelas
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Clique em "+ Nova Categoria" acima para criar.
                  </p>
                </div>
              ) : (
                sortedParcelCategories.map((name) => {
                  const isEditing = editingParcelName === name;
                  const usage = getParcelUsage(name);
                  const isLinked = usage.total > 0;

                  return (
                    <div
                      key={name}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-1.5 flex-1 mr-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              maxLength={MAX_CATEGORY_NAME_LENGTH}
                              value={editParcelInput}
                              onChange={(e) => {
                                setEditParcelInput(sanitizeNameInput(e.target.value));
                                setEditParcelError('');
                              }}
                              className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-emerald-500 rounded-lg focus:outline-hidden"
                              autoFocus
                            />
                            <span className="text-[10px] text-neutral-400 font-medium">
                              {editParcelInput.length}/{MAX_CATEGORY_NAME_LENGTH}
                            </span>
                            <button
                              onClick={() => handleSaveEditParcel(name)}
                              className="p-1 bg-emerald-600 text-white rounded-md cursor-pointer hover:bg-emerald-700"
                              title="Salvar alteração"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingParcelName(null)}
                              className="p-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {editParcelError && (
                            <span className="text-[10px] text-rose-500 font-medium">
                              {editParcelError}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                                {name}
                              </span>
                              {isLinked && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                                  <Lock className="w-2.5 h-2.5" /> {usage.total} registro(s)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEditParcel(name)}
                            title="Editar categoria"
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => attemptDeleteParcelCategory(name)}
                            title={isLinked ? `Bloqueada: vinculada a ${usage.detailsText}` : "Excluir categoria"}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isLinked 
                                ? 'text-neutral-300 dark:text-neutral-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30' 
                                : 'text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                            }`}
                          >
                            {isLinked ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )
            ) : (activeTab === 'fixed' ? sortedExpenseCategories : sortedIncomeCategories).length === 0 ? (
              <div className="text-center py-6 px-4 bg-neutral-50/50 dark:bg-neutral-800/30 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500">
                <Tag className="w-7 h-7 mx-auto text-neutral-400 mb-2 opacity-60" />
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Nenhuma categoria de {activeTab === 'fixed' ? 'despesa' : 'receita'}
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Clique em "+ Nova Categoria" acima para criar.
                </p>
              </div>
            ) : (
              (activeTab === 'fixed' ? sortedExpenseCategories : sortedIncomeCategories).map((cat) => {
                const isEditing = editingId === cat.id;
                const usage = getCategoryUsage(cat.id, cat.name);
                const isLinked = usage.total > 0;

                return (
                  <div
                    key={cat.id}
                    className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 transition-colors"
                  >
                    {isEditing ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={MAX_CATEGORY_NAME_LENGTH}
                            value={editName}
                            onChange={(e) => {
                              setEditName(sanitizeNameInput(e.target.value));
                              setEditError('');
                            }}
                            className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-emerald-500 rounded-lg focus:outline-hidden"
                            autoFocus
                          />
                          <span className="text-[10px] text-neutral-400 font-medium">
                            {editName.length}/{MAX_CATEGORY_NAME_LENGTH}
                          </span>
                          <button
                            onClick={() => handleSaveEdit(cat.id)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded-md text-xs font-semibold cursor-pointer hover:bg-emerald-700 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Salvar</span>
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {editError && (
                          <p className="text-[10px] text-rose-500 font-medium">
                            {editError}
                          </p>
                        )}

                        {/* Color Selector */}
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditColor(c)}
                              className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${editColor === c ? 'scale-110 ring-2 ring-emerald-500 ring-offset-1' : 'opacity-80'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>

                        {/* Icon Selector */}
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1 bg-white/60 dark:bg-neutral-900/60 rounded-lg border border-neutral-200 dark:border-neutral-800">
                          {PRESET_ICONS.map((icon) => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => setEditIcon(icon)}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${editIcon === icon ? 'bg-emerald-600 text-white' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
                            >
                              <CategoryIcon name={icon} className="w-3.5 h-3.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${cat.color}22`,
                              color: cat.color,
                            }}
                          >
                            <CategoryIcon name={cat.iconName} className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                                {cat.name}
                              </span>
                              {isLinked && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                                  <Lock className="w-2.5 h-2.5" /> {usage.total} registro(s)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEdit(cat)}
                            title="Editar categoria"
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => attemptDeleteCategory(cat)}
                            title={isLinked ? `Bloqueada: vinculada a ${usage.detailsText}` : "Excluir categoria"}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isLinked 
                                ? 'text-neutral-300 dark:text-neutral-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30' 
                                : 'text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                            }`}
                          >
                            {isLinked ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Blocked Deletion Notice Modal */}
        {blockedDeleteMessage && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-700 rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Lock className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Exclusão Bloqueada
                </h4>
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {blockedDeleteMessage}
              </p>
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setBlockedDeleteMessage(null)}
                  className="px-4 py-1.5 text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal (only for unlinked categories) */}
        {confirmDeleteTarget && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-3">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                Excluir Categoria?
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Deseja realmente excluir a categoria <strong>"{confirmDeleteTarget.title}"</strong>?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmDeleteTarget(null)}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
