import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Calendar, Landmark, CheckCircle2, Clock } from 'lucide-react';
import { DebtInstallment, TransactionStatus } from '../types';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currencyMask';

const MAX_DESC_LENGTH = 60;
const MAX_NOTES_LENGTH = 150;
const MAX_ORIGIN_LENGTH = 35;

interface InstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (installmentData: Omit<DebtInstallment, 'id' | 'createdAt'>, existingId?: string) => void;
  initialData?: DebtInstallment | null;
  competence: string;
  parcelCategories?: string[];
}

const RAW_COMMON_ORIGINS = [
  'Banco do Brasil',
  'Banco Inter',
  'Banco Pan',
  'Cartão Amazon',
  'Cartão Havan',
  'Débito na Conta Itaú',
  'Holerite',
  'Linha de crédito MP',
  'Mercado pago',
  'Nubank',
];

// Always sorted alphabetically with 'Outro' as the last option
const COMMON_ORIGINS = [...RAW_COMMON_ORIGINS.sort((a, b) => a.localeCompare(b, 'pt-BR')), 'Outro'];

const COMMON_CATEGORIES = [
  'Renegociação de dívidas',
  'Manutenção Automóvel',
  'Manutenção Moradia',
  'Vestimentas',
  'Empréstimos',
  'Investimento Stúdio',
  'Investimento Shows',
  'Extras',
];

export const InstallmentModal: React.FC<InstallmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  competence,
  parcelCategories,
}) => {
  const rawOptions = parcelCategories && parcelCategories.length > 0 ? parcelCategories : COMMON_CATEGORIES;
  const categoryOptions = [...rawOptions].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categoryOptions[0]);
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [totalInstallments, setTotalInstallments] = useState('12');
  const [dueDay, setDueDay] = useState('5');
  const [origin, setOrigin] = useState(COMMON_ORIGINS[0]);
  const [customOrigin, setCustomOrigin] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setCategory(initialData.category || COMMON_CATEGORIES[0]);
      setMonthlyAmount(formatCurrencyInput(initialData.monthlyAmount));
      setCurrentInstallment(initialData.currentInstallment.toString());
      setTotalInstallments(initialData.totalInstallments.toString());
      setDueDay(initialData.dueDay.toString());
      if (COMMON_ORIGINS.includes(initialData.origin)) {
        setOrigin(initialData.origin);
        setCustomOrigin('');
      } else {
        setOrigin('Outro');
        setCustomOrigin(initialData.origin);
      }
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
    } else {
      setDescription('');
      setCategory(COMMON_CATEGORIES[0]);
      setMonthlyAmount('');
      setCurrentInstallment('1');
      setTotalInstallments('12');
      setDueDay('5');
      setOrigin(COMMON_ORIGINS[0]);
      setCustomOrigin('');
      setStatus('pending');
      setNotes('');
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Informe a descrição da parcela ou dívida.');
      return;
    }

    const parsedAmount = parseCurrencyInput(monthlyAmount);
    if (parsedAmount <= 0) {
      setError('Informe um valor mensal válido maior que zero.');
      return;
    }

    const parsedCurrent = parseInt(currentInstallment, 10);
    const parsedTotal = parseInt(totalInstallments, 10);
    if (isNaN(parsedCurrent) || parsedCurrent < 1) {
      setError('A parcela atual deve ser pelo menos 1.');
      return;
    }
    if (isNaN(parsedTotal) || parsedTotal < parsedCurrent) {
      setError('O total de parcelas deve ser maior ou igual à parcela atual.');
      return;
    }

    const parsedDueDay = parseInt(dueDay, 10);
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      setError('O dia de vencimento deve estar entre 1 e 31.');
      return;
    }

    const resolvedOrigin = origin === 'Outro' && customOrigin.trim() ? customOrigin.trim() : origin;

    onSave(
      {
        description: description.trim(),
        category,
        monthlyAmount: parsedAmount,
        currentInstallment: parsedCurrent,
        totalInstallments: parsedTotal,
        dueDay: parsedDueDay,
        origin: resolvedOrigin,
        status,
        competence: initialData?.competence || competence,
        notes: notes.trim(),
      },
      initialData?.id
    );

    onClose();
  };

  const currentParsed = parseInt(currentInstallment, 10) || 1;
  const totalParsed = parseInt(totalInstallments, 10) || 1;
  const amountParsed = parseCurrencyInput(monthlyAmount);
  const totalDebt = amountParsed * totalParsed;
  const remainingDebt = Math.max(0, amountParsed * (totalParsed - currentParsed));

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="modal-backdrop-installment"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            id="modal-card-installment"
            className="bg-white rounded-t-[28px] w-full shadow-2xl border-t border-neutral-200 overflow-hidden flex flex-col max-h-[90%]"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mt-2 shrink-0" />

            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="modal-title-installment" className="text-sm font-bold text-neutral-900">
                    {initialData ? 'Editar Parcela / Dívida' : 'Nova Parcela / Compra Parcelada'}
                  </h2>
                  <p className="text-[11px] text-neutral-500">
                    Controle de prestações, empréstimos e parcelamentos
                  </p>
                </div>
              </div>
              <button
                id="btn-close-installment-modal"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Descrição */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-800">
                    Descrição do Contrato / Compra *
                  </label>
                  <span className={`text-[10px] font-medium ${
                    description.length >= MAX_DESC_LENGTH ? 'text-rose-500 font-bold' : 'text-neutral-400'
                  }`}>
                    {description.length}/{MAX_DESC_LENGTH}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={MAX_DESC_LENGTH}
                  placeholder="Ex: Empréstimo Trabalhador, Renegociação Cartão Itaú"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold text-neutral-900 bg-white placeholder:text-neutral-400 rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>

              {/* Valor Mensal (Hero Input) */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Valor da Parcela Mensal (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0,00"
                    maxLength={14}
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(formatCurrencyInput(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 text-base font-extrabold text-neutral-900 bg-white placeholder:text-neutral-400 rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Parcela Atual vs Total de Parcelas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Parcela Atual *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    maxLength={3}
                    required
                    value={currentInstallment}
                    onChange={(e) => setCurrentInstallment(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    className="w-full px-3 py-2 text-sm font-semibold text-neutral-900 bg-white placeholder:text-neutral-400 rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Total de Parcelas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    maxLength={3}
                    required
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    className="w-full px-3 py-2 text-sm font-semibold text-neutral-900 bg-white placeholder:text-neutral-400 rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Card de Cálculo Automático */}
              {amountParsed > 0 && totalParsed > 0 && (
                <div className="p-3 bg-amber-50/80 border border-amber-300/80 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between text-neutral-700">
                    <span className="font-semibold text-neutral-700">Progresso:</span>
                    <span className="font-bold text-neutral-900">
                      {currentParsed} de {totalParsed} ({totalParsed - currentParsed} restantes)
                    </span>
                  </div>
                  <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (currentParsed / totalParsed) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between pt-1 text-[11px] items-center flex-wrap gap-1">
                    <span className="text-neutral-700">
                      Dívida Total: <strong className="text-neutral-900 font-bold">R$ {totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </span>
                    <span className="text-amber-900 font-bold bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300">
                      Restante: R$ {remainingDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Dia de Vencimento e Origem */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                    Dia Vencimento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    maxLength={2}
                    required
                    placeholder="Ex: 5"
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
                    className="w-full px-3 py-2 text-sm font-black text-neutral-900 bg-white placeholder:text-neutral-400 rounded-xl border-2 border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5 text-neutral-600" />
                    Origem / Banco *
                  </label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold text-neutral-900 bg-white rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all cursor-pointer"
                  >
                    {COMMON_ORIGINS.map((o) => (
                      <option key={o} value={o} className="text-neutral-900 bg-white font-medium py-1">
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {origin === 'Outro' && (
                <div>
                  <input
                    type="text"
                    maxLength={MAX_ORIGIN_LENGTH}
                    placeholder="Especifique a origem (Ex: Empréstimo Família, Carnê Loja)"
                    value={customOrigin}
                    onChange={(e) => setCustomOrigin(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold text-neutral-900 bg-white placeholder:text-neutral-400 rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              )}

              {/* Categoria */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold text-neutral-900 bg-white rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all cursor-pointer"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat} className="text-neutral-900 bg-white font-medium py-1">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status no Mês Atual */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  Situação desta Parcela no Mês
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('pending')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      status === 'pending'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 ring-1 ring-amber-500'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Pendente
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('completed')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      status === 'completed'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Paga
                  </button>
                </div>
              </div>

              {/* Observações */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-800">
                    Observações (Opcional)
                  </label>
                  <span className={`text-[10px] font-medium ${
                    notes.length >= MAX_NOTES_LENGTH ? 'text-rose-500 font-bold' : 'text-neutral-400'
                  }`}>
                    {notes.length}/{MAX_NOTES_LENGTH}
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={MAX_NOTES_LENGTH}
                  placeholder="Número de contrato, link do boleto ou anotações..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold text-neutral-900 bg-white placeholder:text-neutral-400 rounded-xl border border-neutral-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none transition-all"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  {initialData ? 'Salvar Alterações' : 'Confirmar Parcela'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
