import React, { useState } from 'react';
import { PiggyBank, Plus, Trophy, Calendar, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { SavingsGoal } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currencyMask';

const MAX_GOAL_TITLE_LENGTH = 40;

interface SavingsGoalsSectionProps {
  goals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onUpdateGoalAmount: (goalId: string, addedAmount: number) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const SavingsGoalsSection: React.FC<SavingsGoalsSectionProps> = ({
  goals,
  onAddGoal,
  onEditGoal,
  onUpdateGoalAmount,
  onDeleteGoal,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [createError, setCreateError] = useState('');

  // Editing state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editCurrentAmount, setEditCurrentAmount] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editError, setEditError] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setCreateError('Por favor, informe o título da meta.');
      return;
    }

    const target = parseCurrencyInput(targetAmount);
    if (target <= 0) {
      setCreateError('O valor alvo deve ser maior que zero (Ex: R$ 5.000,00).');
      return;
    }

    const initial = parseCurrencyInput(currentAmount);

    onAddGoal({
      title: trimmedTitle,
      targetAmount: target,
      currentAmount: Math.max(0, initial || 0),
      targetDate: targetDate || undefined,
      color: '#10b981',
      iconName: 'ShieldCheck',
    });

    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setCreateError('');
    setIsAdding(false);
  };

  const handleStartEdit = (goal: SavingsGoal) => {
    setEditingGoalId(goal.id);
    setEditTitle(goal.title);
    setEditTargetAmount(formatCurrencyInput(goal.targetAmount));
    setEditCurrentAmount(formatCurrencyInput(goal.currentAmount));
    setEditTargetDate(goal.targetDate || '');
    setEditError('');
    setIsAdding(false);
  };

  const handleSaveEdit = (e: React.FormEvent, goal: SavingsGoal) => {
    e.preventDefault();
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditError('Por favor, informe o título da meta.');
      return;
    }

    const target = parseCurrencyInput(editTargetAmount);
    if (target <= 0) {
      setEditError('O valor alvo deve ser maior que zero.');
      return;
    }

    const current = parseCurrencyInput(editCurrentAmount);

    onEditGoal({
      ...goal,
      title: trimmedTitle,
      targetAmount: target,
      currentAmount: Math.max(0, current),
      targetDate: editTargetDate || undefined,
    });

    setEditingGoalId(null);
    setEditError('');
  };

  return (
    <div id="savings-goals-section" className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xs p-3.5 sm:p-5 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 id="savings-title" className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2 truncate">
            <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="truncate">Objetivos & Metas</span>
          </h2>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
            Reserva de emergência e planos de economia
          </p>
        </div>

        <button
          id="btn-add-goal-toggle"
          onClick={() => { setIsAdding(!isAdding); setEditingGoalId(null); }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200/80 dark:border-teal-800 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAdding ? 'Fechar' : 'Novo'}</span>
        </button>
      </div>

      {/* New Goal Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="p-3.5 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-800/60 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-teal-900 dark:text-teal-300 uppercase tracking-wider">Criar Novo Objetivo</h4>
          
          {createError && (
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-medium flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">Título do Objetivo *</label>
                <span className={`text-[10px] font-medium ${
                  title.length >= MAX_GOAL_TITLE_LENGTH ? 'text-rose-500 font-bold' : 'text-neutral-400'
                }`}>
                  {title.length}/{MAX_GOAL_TITLE_LENGTH}
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={MAX_GOAL_TITLE_LENGTH}
                placeholder="Ex: Reserva de Emergência, Viagem..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setCreateError('');
                }}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-teal-300 dark:border-teal-700 rounded-xl focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">Valor Alvo (R$) *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-xs font-bold text-neutral-400">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0,00"
                  maxLength={14}
                  value={targetAmount}
                  onChange={(e) => {
                    setTargetAmount(formatCurrencyInput(e.target.value));
                    setCreateError('');
                  }}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-bold bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-teal-300 dark:border-teal-700 rounded-xl focus:outline-hidden"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">Já Guardado (R$)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-xs font-bold text-neutral-400">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  maxLength={14}
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(formatCurrencyInput(e.target.value))}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-bold bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-teal-300 dark:border-teal-700 rounded-xl focus:outline-hidden"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">Data Prevista</label>
              <input
                type="date"
                min="2026-10-01"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-teal-300 dark:border-teal-700 rounded-xl focus:outline-hidden"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setCreateError('');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Salvar Meta
            </button>
          </div>
        </form>
      )}

      {/* Goals Grid */}
      <div id="goals-grid" className="flex flex-col gap-3">
        {goals.length > 0 ? (
          goals.map((goal) => {
            const isEditing = editingGoalId === goal.id;
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const isCompleted = goal.currentAmount >= goal.targetAmount;

            if (isEditing) {
              return (
                <form
                  key={goal.id}
                  onSubmit={(e) => handleSaveEdit(e, goal)}
                  className="p-3.5 rounded-xl border border-teal-400 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-950/30 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-200">Editar Meta</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGoalId(null);
                        setEditError('');
                      }}
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {editError && (
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{editError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">Título</label>
                        <span className={`text-[9px] font-medium ${
                          editTitle.length >= MAX_GOAL_TITLE_LENGTH ? 'text-rose-500 font-bold' : 'text-neutral-400'
                        }`}>
                          {editTitle.length}/{MAX_GOAL_TITLE_LENGTH}
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={MAX_GOAL_TITLE_LENGTH}
                        value={editTitle}
                        onChange={(e) => {
                          setEditTitle(e.target.value);
                          setEditError('');
                        }}
                        className="w-full px-2.5 py-1 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-teal-300 dark:border-teal-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">Valor Alvo (R$)</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1 text-[11px] font-bold text-neutral-400">R$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          maxLength={14}
                          value={editTargetAmount}
                          onChange={(e) => {
                            setEditTargetAmount(formatCurrencyInput(e.target.value));
                            setEditError('');
                          }}
                          className="w-full pl-7 pr-2 py-1 text-xs font-bold bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-teal-300 dark:border-teal-700 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">Valor Atual (R$)</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1 text-[11px] font-bold text-neutral-400">R$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={14}
                          value={editCurrentAmount}
                          onChange={(e) => setEditCurrentAmount(formatCurrencyInput(e.target.value))}
                          className="w-full pl-7 pr-2 py-1 text-xs font-bold bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-teal-300 dark:border-teal-700 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">Data Limite</label>
                      <input
                        type="date"
                        min="2026-10-01"
                        value={editTargetDate}
                        onChange={(e) => setEditTargetDate(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-teal-300 dark:border-teal-700 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingGoalId(null)}
                      className="px-2.5 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar Alterações</span>
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={goal.id}
                id={`goal-card-${goal.id}`}
                className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all bg-white dark:bg-neutral-900/90 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <CategoryIcon name={goal.iconName || 'PiggyBank'} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white leading-tight truncate">{goal.title}</h4>
                        {goal.targetDate && (
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
                            <Calendar className="w-2.5 h-2.5 shrink-0" /> Até {formatDate(goal.targetDate)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isCompleted && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 flex items-center gap-0.5">
                          <Trophy className="w-2.5 h-2.5" /> Concluído
                        </span>
                      )}

                      <button
                        id={`btn-edit-goal-${goal.id}`}
                        onClick={() => handleStartEdit(goal)}
                        title="Editar objetivo"
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        id={`btn-delete-goal-${goal.id}`}
                        onClick={() => onDeleteGoal(goal.id)}
                        title="Excluir objetivo"
                        className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Values and bar */}
                  <div className="my-2.5">
                    <div className="flex items-baseline justify-between text-xs mb-1 gap-1">
                      <span className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        meta: {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">{progress.toFixed(0)}% guardado</span>
                      {!isCompleted ? (
                        <span>Falta {formatCurrency(remaining)}</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Meta atingida!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Deposit Actions */}
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 shrink-0">Aportar:</span>
                  <div className="flex items-center gap-1 flex-1 justify-end">
                    <button
                      onClick={() => onUpdateGoalAmount(goal.id, 50)}
                      title="Adicionar R$ 50"
                      className="flex-1 max-w-[68px] text-center text-[10px] sm:text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300 py-1 px-1 rounded-lg transition-colors cursor-pointer"
                    >
                      +R$ 50
                    </button>
                    <button
                      onClick={() => onUpdateGoalAmount(goal.id, 100)}
                      title="Adicionar R$ 100"
                      className="flex-1 max-w-[68px] text-center text-[10px] sm:text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300 py-1 px-1 rounded-lg transition-colors cursor-pointer"
                    >
                      +R$ 100
                    </button>
                    <button
                      onClick={() => onUpdateGoalAmount(goal.id, 500)}
                      title="Adicionar R$ 500"
                      className="flex-1 max-w-[68px] text-center text-[10px] sm:text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300 py-1 px-1 rounded-lg transition-colors cursor-pointer"
                    >
                      +R$ 500
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <PiggyBank className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mb-2" />
            <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Nenhum objetivo cadastrado</h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 mb-3">
              Defina metas para sua reserva de emergência, viagens ou sonhos.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 border border-teal-200 dark:border-teal-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              Criar primeiro objetivo
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
