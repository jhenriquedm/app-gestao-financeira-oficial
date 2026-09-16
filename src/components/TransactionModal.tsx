import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowUpRight, ArrowDownRight, Tag, Plus } from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod, TransactionStatus, Category, ReceiptAttachment } from '../types';
import { PAYMENT_METHOD_LABELS } from '../utils/formatters';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currencyMask';
import { sanitizeTextInput } from '../utils/textSanitizer';
import { ReceiptAttachmentField } from './ReceiptAttachmentField';

const MAX_DESC_LENGTH = 60;
const MAX_NOTES_LENGTH = 150;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  categories: Category[];
  existingTransactions?: Transaction[];
  initialData?: Transaction | null;
  defaultDate?: string;
  initialType?: 'income' | 'expense';
  isFixedDefault?: boolean;
  onOpenCategoryManager?: (tab?: 'fixed' | 'parcelas' | 'income') => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  existingTransactions,
  initialData,
  defaultDate,
  initialType = 'expense',
  isFixedDefault = false,
  onOpenCategoryManager,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<TransactionStatus>('completed');
  const [isFixed, setIsFixed] = useState(false);
  const [dueDay, setDueDay] = useState('');
  const [notes, setNotes] = useState('');
  const [attachment, setAttachment] = useState<ReceiptAttachment | undefined>(undefined);
  const [error, setError] = useState('');
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<{
    description: string;
    amount: number;
    date: string;
    type: string;
    timestamp: number;
  } | null>(null);

  const successTimerRef = React.useRef<any>(null);
  const errorTimerRef = React.useRef<any>(null);

  const triggerError = (msg: string) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setError('');
    }, 3000);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessFeedback(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => {
      setSuccessFeedback(null);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  // Reset or populate form when opened or initialData changes
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setDescription(initialData.description);
      setAmount(formatCurrencyInput(initialData.amount));
      setCategoryId(initialData.categoryId);
      setDate(initialData.date);
      setPaymentMethod(initialData.paymentMethod || 'pix');
      setStatus(initialData.status);
      setIsFixed(!!initialData.isFixed);
      setDueDay(initialData.dueDay ? initialData.dueDay.toString() : '');
      setNotes(initialData.notes || '');
      setAttachment(initialData.attachment);
    } else {
      const today = defaultDate || new Date().toISOString().slice(0, 10);
      const parsedDay = new Date().getDate();
      setType(initialType || 'expense');
      setDescription('');
      setAmount('');
      const defaultExpCat = categories.find((c) => c.type === (initialType || 'expense'));
      setCategoryId(defaultExpCat ? defaultExpCat.id : categories[0]?.id || '');
      setDate(today);
      setPaymentMethod('pix');
      setStatus('completed');
      setIsFixed(isFixedDefault);
      setDueDay(parsedDay.toString());
      setNotes('');
      setAttachment(undefined);
    }
    setError('');
    setSuccessFeedback(null);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
  }, [initialData, isOpen, defaultDate, categories, initialType, isFixedDefault]);

  // When type toggles, default category to matching type
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setSuccessFeedback(null);
    const matchingCat = categories.find((c) => c.type === newType);
    if (matchingCat) {
      setCategoryId(matchingCat.id);
    } else {
      setCategoryId('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessFeedback(null);

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      triggerError('Por favor, informe a descrição da transação.');
      return;
    }

    const parsedAmount = parseCurrencyInput(amount);
    if (parsedAmount <= 0) {
      triggerError('Por favor, informe um valor monetário positivo válido.');
      return;
    }

    if (!categoryId) {
      triggerError(`Por favor, cadastre uma categoria de ${type === 'income' ? 'receita' : 'despesa'} antes de salvar.`);
      return;
    }

    if (!date) {
      triggerError('Por favor, selecione uma data.');
      return;
    }

    const parsedDueDay = dueDay ? parseInt(dueDay, 10) : undefined;
    if (isFixed && parsedDueDay && (parsedDueDay < 1 || parsedDueDay > 31)) {
      triggerError('O dia de vencimento deve estar entre 1 e 31.');
      return;
    }

    // Protection against duplicate records
    const isDuplicate = (!initialData && existingTransactions && existingTransactions.some((t) => {
      if (t.type !== type) return false;
      const sameDesc = t.description.trim().toLowerCase() === cleanDesc.toLowerCase();
      const sameAmount = Math.abs(t.amount - parsedAmount) < 0.01;
      if (type === 'expense' && isFixed) {
        return t.isFixed && sameDesc && sameAmount;
      }
      return sameDesc && sameAmount && t.date === date && t.categoryId === categoryId;
    })) || (
      lastSaved &&
      lastSaved.description.toLowerCase() === cleanDesc.toLowerCase() &&
      lastSaved.amount === parsedAmount &&
      lastSaved.date === date &&
      lastSaved.type === type
    );

    if (isDuplicate) {
      triggerError('Este registro já existe no sistema.');
      return;
    }

    setIsSubmitting(true);

    onSave(
      {
        description: cleanDesc,
        amount: parsedAmount,
        type,
        categoryId,
        date,
        paymentMethod: type === 'income' ? 'pix' : paymentMethod,
        status,
        isFixed: type === 'expense' ? isFixed : false,
        dueDay: type === 'expense' && isFixed ? (parsedDueDay || new Date(date).getDate()) : undefined,
        notes: notes.trim(),
        attachment,
      },
      initialData ? initialData.id : undefined
    );

    const now = Date.now();
    setLastSaved({
      description: cleanDesc,
      amount: parsedAmount,
      date,
      type,
      timestamp: now,
    });

    if (initialData) {
      triggerSuccess('Registro atualizado com sucesso!');
      setError('');
      setIsSubmitting(false);
    } else {
      // Keep modal open for next entry as requested, clear specific fields
      triggerSuccess('Registro salvo com sucesso');
      setError('');
      setDescription('');
      setAmount('');
      setNotes('');
      setAttachment(undefined);
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories
    .filter((c) => c.type === type)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="modal-backdrop-transaction" 
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            id="modal-card-transaction"
            className="bg-white dark:bg-neutral-900 rounded-3xl max-w-md w-full shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    type === 'income' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <h2 id="modal-title-transaction" className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {initialData ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h2>
              </div>
              <button
                id="btn-close-transaction-modal"
                onClick={onClose}
                aria-label="Fechar"
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} id="form-transaction" className="p-4 overflow-y-auto space-y-3.5 flex-1">
              {successFeedback && (
                <div id="tx-success-message" className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{successFeedback}</span>
                </div>
              )}

              {error && (
                <div id="tx-error-message" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                  Tipo de Lançamento
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-800/90 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    id="btn-type-expense"
                    onClick={() => handleTypeChange('expense')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      type === 'expense'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    Despesa
                  </button>
                  <button
                    type="button"
                    id="btn-type-income"
                    onClick={() => handleTypeChange('income')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      type === 'income'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Receita
                  </button>
                </div>
              </div>

              {/* Amount & Date in Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="tx-amount-input" className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Valor (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-neutral-400 dark:text-neutral-500">R$</span>
                    <input
                      id="tx-amount-input"
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="0,00"
                      maxLength={14}
                      value={amount}
                      onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
                      className="w-full pl-8 pr-2 py-1.5 text-sm font-bold text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800/90 focus:bg-white dark:focus:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="tx-date-input" className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Data *
                  </label>
                  <input
                    id="tx-date-input"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800/90 focus:bg-white dark:focus:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="tx-description-input" className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                    Descrição *
                  </label>
                  <span className={`text-[10px] font-medium ${
                    description.length >= MAX_DESC_LENGTH ? 'text-rose-500 font-bold' : 'text-neutral-400 dark:text-neutral-500'
                  }`}>
                    {description.length}/{MAX_DESC_LENGTH}
                  </span>
                </div>
                <input
                  id="tx-description-input"
                  type="text"
                  required
                  maxLength={MAX_DESC_LENGTH}
                  placeholder={type === 'expense' ? 'Ex: Supermercado, Aluguel...' : 'Ex: Salário do mês, Freelance...'}
                  value={description}
                  onChange={(e) => setDescription(sanitizeTextInput(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800/90 focus:bg-white dark:focus:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="tx-category-select" className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                    Categoria *
                  </label>
                  {onOpenCategoryManager && (
                    <button
                      type="button"
                      onClick={() => onOpenCategoryManager(type === 'income' ? 'income' : 'fixed')}
                      className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Nova Categoria
                    </button>
                  )}
                </div>

                {filteredCategories.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between gap-2">
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      Nenhuma categoria de {type === 'income' ? 'receita' : 'despesa'} cadastrada.
                    </div>
                    {onOpenCategoryManager && (
                      <button
                        type="button"
                        onClick={() => onOpenCategoryManager(type === 'income' ? 'income' : 'fixed')}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Cadastrar Categoria
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      id="tx-category-select"
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full pl-3 pr-8 py-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800/90 focus:bg-white dark:focus:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900">
                        Selecione a categoria...
                      </option>
                      {filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.id} className="text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 font-medium py-1">
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <Tag className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute right-3 top-2 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Payment Method & Status */}
              {type === 'expense' ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="tx-payment-select" className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      id="tx-payment-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-2 py-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800/90 focus:bg-white dark:focus:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all cursor-pointer"
                    >
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                        <option key={key} value={key} className="text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 font-medium py-1">
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="tx-status-select" className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Situação
                    </label>
                    <select
                      id="tx-status-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                      className="w-full px-2 py-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800/90 focus:bg-white dark:focus:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all cursor-pointer"
                    >
                      <option value="completed" className="text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 font-medium py-1">
                        Pago
                      </option>
                      <option value="pending" className="text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 font-medium py-1">
                        Pendente
                      </option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Receita: apenas situação, sem campo de forma de pagamento */
                <div>
                  <label htmlFor="tx-status-select" className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Situação da Receita
                  </label>
                  <select
                    id="tx-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                    className="w-full px-3 py-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800/90 focus:bg-white dark:focus:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all cursor-pointer"
                  >
                    <option value="completed" className="text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 font-medium py-1">
                      Recebido
                    </option>
                    <option value="pending" className="text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 font-medium py-1">
                      A Receber
                    </option>
                  </select>
                </div>
              )}

              {/* Opção de Despesa Fixa (Aluguel, Moradia, etc) */}
              {type === 'expense' && (
                <div className="p-2.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 block">Despesa Fixa Recorrente</span>
                      <span className="text-[10.5px] text-indigo-700/80 dark:text-indigo-400/80">
                        Aluguel, moradia, condomínio, internet, feira essencial
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isFixed}
                      onChange={(e) => setIsFixed(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-neutral-300 dark:border-neutral-600 cursor-pointer"
                    />
                  </label>

                  {isFixed && (
                    <div className="pt-1.5 border-t border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200">
                        Dia de Vencimento no Mês:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        maxLength={2}
                        placeholder="Ex: 15"
                        value={dueDay}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 2);
                          if (!digitsOnly) {
                            setDueDay('');
                            return;
                          }
                          const num = parseInt(digitsOnly, 10);
                          if (num > 31) {
                            setDueDay('31');
                          } else if (num < 1) {
                            setDueDay('1');
                          } else {
                            setDueDay(digitsOnly);
                          }
                        }}
                        className="w-20 px-2 py-1.5 text-xs font-black text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 border-2 border-indigo-300 dark:border-indigo-700 focus:border-indigo-600 rounded-lg focus:outline-hidden shadow-xs text-center"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="tx-notes-input" className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                    Observações (Opcional)
                  </label>
                  <span className={`text-[10px] font-medium ${
                    notes.length >= MAX_NOTES_LENGTH ? 'text-rose-500 font-bold' : 'text-neutral-400 dark:text-neutral-500'
                  }`}>
                    {notes.length}/{MAX_NOTES_LENGTH}
                  </span>
                </div>
                <input
                  id="tx-notes-input"
                  type="text"
                  maxLength={MAX_NOTES_LENGTH}
                  placeholder="Informações adicionais..."
                  value={notes}
                  onChange={(e) => setNotes(sanitizeTextInput(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800/90 focus:bg-white dark:focus:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                />
              </div>

              {/* Anexo de Comprovante (PDF, DOCX, JPG, PNG) */}
              <ReceiptAttachmentField
                attachment={attachment}
                onChange={setAttachment}
                disabled={isSubmitting}
              />
            </form>

            {/* Sticky Action Footer */}
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-950/90 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                id="btn-cancel-transaction"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                {successFeedback ? 'Concluir e Fechar' : 'Cancelar'}
              </button>
              <button
                type="submit"
                form="form-transaction"
                id="btn-save-transaction"
                disabled={isSubmitting}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
                  type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Salvando...' : 'Salvar Lançamento'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
