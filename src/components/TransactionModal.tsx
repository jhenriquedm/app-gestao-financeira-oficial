import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod, TransactionStatus, Category } from '../types';
import { PAYMENT_METHOD_LABELS } from '../utils/formatters';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currencyMask';

const MAX_DESC_LENGTH = 60;
const MAX_NOTES_LENGTH = 150;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  categories: Category[];
  initialData?: Transaction | null;
  defaultDate?: string;
  initialType?: 'income' | 'expense';
  isFixedDefault?: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialData,
  defaultDate,
  initialType = 'expense',
  isFixedDefault = false,
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
  const [error, setError] = useState('');

  // Reset or populate form when opened or initialData changes
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setDescription(initialData.description);
      setAmount(formatCurrencyInput(initialData.amount));
      setCategoryId(initialData.categoryId);
      setDate(initialData.date);
      setPaymentMethod(initialData.paymentMethod);
      setStatus(initialData.status);
      setIsFixed(!!initialData.isFixed);
      setDueDay(initialData.dueDay ? initialData.dueDay.toString() : '');
      setNotes(initialData.notes || '');
    } else {
      const today = defaultDate || new Date().toISOString().slice(0, 10);
      const parsedDay = new Date().getDate();
      setType(initialType || 'expense');
      setDescription('');
      setAmount('');
      const defaultExpCat = categories.find((c) => c.type === (initialType || 'expense'));
      setCategoryId(defaultExpCat ? defaultExpCat.id : categories[0]?.id || '');
      setDate(today >= '2026-10-01' ? today : '2026-10-01');
      setPaymentMethod('pix');
      setStatus('completed');
      setIsFixed(isFixedDefault);
      setDueDay(parsedDay.toString());
      setNotes('');
    }
    setError('');
  }, [initialData, isOpen, defaultDate, categories, initialType, isFixedDefault]);

  // When type toggles, default category to matching type
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const matchingCat = categories.find((c) => c.type === newType);
    if (matchingCat) {
      setCategoryId(matchingCat.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Por favor, informe a descrição da transação.');
      return;
    }

    const parsedAmount = parseCurrencyInput(amount);
    if (parsedAmount <= 0) {
      setError('Por favor, informe um valor monetário positivo válido.');
      return;
    }

    if (!categoryId) {
      setError('Por favor, selecione uma categoria.');
      return;
    }

    if (!date) {
      setError('Por favor, selecione uma data.');
      return;
    }

    const parsedDueDay = dueDay ? parseInt(dueDay, 10) : undefined;
    if (isFixed && parsedDueDay && (parsedDueDay < 1 || parsedDueDay > 31)) {
      setError('O dia de vencimento deve estar entre 1 e 31.');
      return;
    }

    onSave(
      {
        description: description.trim(),
        amount: parsedAmount,
        type,
        categoryId,
        date,
        paymentMethod,
        status,
        isFixed: type === 'expense' ? isFixed : false,
        dueDay: type === 'expense' && isFixed ? (parsedDueDay || new Date(date).getDate()) : undefined,
        notes: notes.trim(),
      },
      initialData ? initialData.id : undefined
    );

    onClose();
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            id="modal-card-transaction"
            className="bg-white rounded-t-[28px] w-full shadow-2xl border-t border-neutral-200 overflow-hidden flex flex-col max-h-[88%]"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mt-2 shrink-0" />

            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <h2 id="modal-title-transaction" className="text-sm font-bold text-neutral-900">
                  {initialData ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h2>
              </div>
              <button
                id="btn-close-transaction-modal"
                onClick={onClose}
                aria-label="Fechar"
                className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} id="form-transaction" className="p-4 overflow-y-auto space-y-3.5 flex-1">
              {error && (
                <div id="tx-error-message" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                  Tipo de Lançamento
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-2xl border border-neutral-200">
                  <button
                    type="button"
                    id="btn-type-expense"
                    onClick={() => handleTypeChange('expense')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      type === 'expense'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
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
                        : 'text-neutral-600 hover:text-neutral-900'
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
                  <label htmlFor="tx-amount-input" className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Valor (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-neutral-400">R$</span>
                    <input
                      id="tx-amount-input"
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="0,00"
                      maxLength={14}
                      value={amount}
                      onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
                      className="w-full pl-8 pr-2 py-1.5 text-sm font-bold text-neutral-900 bg-neutral-50 focus:bg-white border border-neutral-300 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="tx-date-input" className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Data *
                  </label>
                  <input
                    id="tx-date-input"
                    type="date"
                    required
                    min="2026-10-01"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs text-neutral-900 bg-neutral-50 focus:bg-white border border-neutral-300 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="tx-description-input" className="text-[11px] font-semibold text-neutral-600">
                    Descrição *
                  </label>
                  <span className={`text-[10px] font-medium ${
                    description.length >= MAX_DESC_LENGTH ? 'text-rose-500 font-bold' : 'text-neutral-400'
                  }`}>
                    {description.length}/{MAX_DESC_LENGTH}
                  </span>
                </div>
                <input
                  id="tx-description-input"
                  type="text"
                  required
                  maxLength={MAX_DESC_LENGTH}
                  placeholder={type === 'expense' ? 'Ex: Supermercado, Aluguel...' : 'Ex: Salário, Freelance...'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-neutral-900 bg-neutral-50 focus:bg-white border border-neutral-300 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="tx-category-select" className="block text-[11px] font-semibold text-neutral-600 mb-1">
                  Categoria *
                </label>
                <div className="relative">
                  <select
                    id="tx-category-select"
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full pl-3 pr-8 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-50 focus:bg-white border border-neutral-300 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all appearance-none cursor-pointer"
                  >
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="text-neutral-900 bg-white font-medium py-1">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <Tag className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-2 pointer-events-none" />
                </div>
              </div>

              {/* Payment Method & Status */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="tx-payment-select" className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    id="tx-payment-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-2 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-50 focus:bg-white border border-neutral-300 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all cursor-pointer"
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                      <option key={key} value={key} className="text-neutral-900 bg-white font-medium py-1">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tx-status-select" className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Situação
                  </label>
                  <select
                    id="tx-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                    className="w-full px-2 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-50 focus:bg-white border border-neutral-300 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all cursor-pointer"
                  >
                    <option value="completed" className="text-neutral-900 bg-white font-medium py-1">
                      {type === 'income' ? 'Recebido' : 'Pago'}
                    </option>
                    <option value="pending" className="text-neutral-900 bg-white font-medium py-1">
                      {type === 'income' ? 'A Receber' : 'Pendente'}
                    </option>
                  </select>
                </div>
              </div>

              {/* Opção de Despesa Fixa (Aluguel, Moradia, etc) */}
              {type === 'expense' && (
                <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-indigo-950 block">Despesa Fixa Recorrente</span>
                      <span className="text-[10.5px] text-indigo-700/80">
                        Aluguel, moradia, condomínio, internet, feira essencial
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isFixed}
                      onChange={(e) => setIsFixed(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-neutral-300 cursor-pointer"
                    />
                  </label>

                  {isFixed && (
                    <div className="pt-1.5 border-t border-indigo-100 flex items-center justify-between gap-2">
                      <label className="text-[11px] font-semibold text-indigo-900">
                        Dia de Vencimento no Mês:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        maxLength={2}
                        placeholder="Ex: 15"
                        value={dueDay}
                        onChange={(e) => setDueDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
                        className="w-20 px-2 py-1 text-xs font-bold text-center bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="tx-notes-input" className="text-[11px] font-semibold text-neutral-600">
                    Observações (Opcional)
                  </label>
                  <span className={`text-[10px] font-medium ${
                    notes.length >= MAX_NOTES_LENGTH ? 'text-rose-500 font-bold' : 'text-neutral-400'
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
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-neutral-900 bg-neutral-50 focus:bg-white border border-neutral-300 focus:border-emerald-500 rounded-xl focus:outline-hidden transition-all"
                />
              </div>
            </form>

            {/* Sticky Action Footer */}
            <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50/90 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                id="btn-cancel-transaction"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="form-transaction"
                id="btn-save-transaction"
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer ${
                  type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Salvar Lançamento
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
