import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Calendar, Landmark, CheckCircle2, Clock, Plus, Tag } from 'lucide-react';
import { DebtInstallment, TransactionStatus, ReceiptAttachment } from '../types';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currencyMask';
import { sanitizeTextInput, sanitizeNameInput } from '../utils/textSanitizer';
import { ReceiptAttachmentField } from './ReceiptAttachmentField';

const MAX_DESC_LENGTH = 60;
const MAX_NOTES_LENGTH = 150;
const MAX_ORIGIN_LENGTH = 35;

interface InstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (installmentData: Omit<DebtInstallment, 'id' | 'createdAt'>, existingId?: string) => void;
  existingInstallments?: DebtInstallment[];
  initialData?: DebtInstallment | null;
  competence: string;
  parcelCategories?: string[];
  onOpenCategoryManager?: (tab?: 'fixed' | 'parcelas' | 'income') => void;
}

export const InstallmentModal: React.FC<InstallmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingInstallments,
  initialData,
  competence,
  parcelCategories = [],
  onOpenCategoryManager,
}) => {
  const categoryOptions = [...parcelCategories].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categoryOptions[0] || '');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [totalInstallments, setTotalInstallments] = useState('12');
  const [dueDay, setDueDay] = useState('5');
  const [origin, setOrigin] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<ReceiptAttachment[]>([]);
  const [error, setError] = useState('');
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<{
    description: string;
    origin: string;
    monthlyAmount: number;
    currentInstallment: number;
    totalInstallments: number;
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

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setCategory(initialData.category || (categoryOptions[0] || ''));
      setMonthlyAmount(formatCurrencyInput(initialData.monthlyAmount));
      setCurrentInstallment(initialData.currentInstallment.toString());
      setTotalInstallments(initialData.totalInstallments.toString());
      setDueDay(initialData.dueDay.toString());
      setOrigin(initialData.origin || '');
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
      const loadedAtts = (initialData.attachments && initialData.attachments.length > 0)
        ? initialData.attachments
        : initialData.attachment
        ? [initialData.attachment]
        : [];
      setAttachments(loadedAtts);
    } else {
      setDescription('');
      setCategory(categoryOptions[0] || '');
      setMonthlyAmount('');
      setCurrentInstallment('1');
      setTotalInstallments('12');
      setDueDay('5');
      setOrigin('');
      setStatus('pending');
      setNotes('');
      setAttachments([]);
    }
    setError('');
    setSuccessFeedback(null);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
  }, [initialData, isOpen, parcelCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessFeedback(null);

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      triggerError('Informe a descrição da parcela ou dívida.');
      return;
    }

    const parsedAmount = parseCurrencyInput(monthlyAmount);
    if (parsedAmount <= 0) {
      triggerError('Informe um valor mensal válido maior que zero.');
      return;
    }

    const parsedCurrent = parseInt(currentInstallment, 10);
    const parsedTotal = parseInt(totalInstallments, 10);
    if (isNaN(parsedCurrent) || parsedCurrent < 1) {
      triggerError('A parcela atual deve ser pelo menos 1.');
      return;
    }
    if (isNaN(parsedTotal) || parsedTotal < parsedCurrent) {
      triggerError('O total de parcelas deve ser maior ou igual à parcela atual.');
      return;
    }

    const parsedDueDay = parseInt(dueDay, 10);
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      triggerError('O dia de vencimento deve estar entre 1 e 31.');
      return;
    }

    const cleanOrigin = origin.trim();
    if (!cleanOrigin) {
      triggerError('Por favor, informe a origem ou banco da parcela.');
      return;
    }

    if (!category.trim()) {
      triggerError('Por favor, cadastre e selecione uma categoria para esta parcela.');
      return;
    }

    // Protection against duplicate records
    const isDuplicate = (!initialData && existingInstallments && existingInstallments.some((inst) => {
      const sameDesc = inst.description.trim().toLowerCase() === cleanDesc.toLowerCase();
      const sameOrigin = inst.origin.trim().toLowerCase() === cleanOrigin.toLowerCase();
      const sameAmount = Math.abs(inst.monthlyAmount - parsedAmount) < 0.01;
      const sameInstallment = inst.currentInstallment === parsedCurrent && inst.totalInstallments === parsedTotal;
      return sameDesc && (sameOrigin || sameAmount || sameInstallment);
    })) || (
      lastSaved &&
      lastSaved.description.toLowerCase() === cleanDesc.toLowerCase() &&
      lastSaved.origin.toLowerCase() === cleanOrigin.toLowerCase() &&
      lastSaved.monthlyAmount === parsedAmount &&
      lastSaved.currentInstallment === parsedCurrent &&
      lastSaved.totalInstallments === parsedTotal
    );

    if (isDuplicate) {
      triggerError('Este registro já existe no sistema.');
      return;
    }

    setIsSubmitting(true);

    onSave(
      {
        description: cleanDesc,
        category: category.trim(),
        monthlyAmount: parsedAmount,
        currentInstallment: parsedCurrent,
        totalInstallments: parsedTotal,
        dueDay: parsedDueDay,
        origin: cleanOrigin,
        status,
        competence: initialData?.competence || competence,
        notes: notes.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
        attachment: attachments[0] || undefined,
      },
      initialData?.id
    );

    const now = Date.now();
    setLastSaved({
      description: cleanDesc,
      origin: cleanOrigin,
      monthlyAmount: parsedAmount,
      currentInstallment: parsedCurrent,
      totalInstallments: parsedTotal,
      timestamp: now,
    });

    if (initialData) {
      triggerSuccess('Parcela atualizada com sucesso!');
      setError('');
      setIsSubmitting(false);
    } else {
      // Keep modal open, reset fields for next installment
      triggerSuccess('Registro salvo com sucesso');
      setError('');
      setDescription('');
      setMonthlyAmount('');
      setOrigin('');
      setNotes('');
      setAttachments([]);
      setIsSubmitting(false);
    }
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            id="modal-card-installment"
            className="bg-white dark:bg-neutral-900 rounded-3xl max-w-md w-full shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="modal-title-installment" className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {initialData ? 'Editar Parcela / Dívida' : 'Nova Parcela / Compra Parcelada'}
                  </h2>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Controle de prestações, empréstimos e parcelamentos
                  </p>
                </div>
              </div>
              <button
                id="btn-close-installment-modal"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
              {successFeedback && (
                <div id="installment-success-message" className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{successFeedback}</span>
                </div>
              )}

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Descrição */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Descrição do Contrato / Compra *
                  </label>
                  <span className={`text-[10px] font-medium ${
                    description.length >= MAX_DESC_LENGTH ? 'text-rose-500 font-bold' : 'text-neutral-400 dark:text-neutral-500'
                  }`}>
                    {description.length}/{MAX_DESC_LENGTH}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={MAX_DESC_LENGTH}
                  placeholder="Ex: Compra parcelada, financiamento, empréstimo..."
                  value={description}
                  onChange={(e) => setDescription(sanitizeTextInput(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800/90 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-xl border border-neutral-300 dark:border-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>

              {/* Valor Mensal (Hero Input) */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Valor da Parcela Mensal (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500 dark:text-neutral-400">
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
                    className="w-full pl-10 pr-3 py-2 text-base font-extrabold text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800/90 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-xl border border-neutral-300 dark:border-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Parcela Atual vs Total de Parcelas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
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
                    className="w-full px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800/90 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-xl border border-neutral-300 dark:border-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
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
                    className="w-full px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800/90 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-xl border border-neutral-300 dark:border-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Card de Cálculo Automático */}
              {amountParsed > 0 && totalParsed > 0 && (
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-900/60 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                    <span className="font-semibold">Progresso:</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      {currentParsed} de {totalParsed} ({totalParsed - currentParsed} restantes)
                    </span>
                  </div>
                  <div className="w-full bg-amber-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (currentParsed / totalParsed) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between pt-1 text-[11px] items-center flex-wrap gap-1">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      Dívida Total: <strong className="text-neutral-900 dark:text-neutral-100 font-bold">R$ {totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </span>
                    <span className="text-amber-900 dark:text-amber-300 font-bold bg-amber-100/90 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                      Restante: R$ {remainingDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Dia de Vencimento e Origem/Banco em Texto Livre */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
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
                    className="w-full px-3 py-2 text-sm font-black text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800/90 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-xl border-2 border-neutral-300 dark:border-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-xs transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                      Origem / Banco *
                    </label>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                      {origin.length}/{MAX_ORIGIN_LENGTH}
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={MAX_ORIGIN_LENGTH}
                    placeholder="Ex: Nubank, Itaú, Pan..."
                    value={origin}
                    onChange={(e) => setOrigin(sanitizeNameInput(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800/90 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-xl border border-neutral-300 dark:border-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Categoria */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                    Categoria de Parcela *
                  </label>
                  {onOpenCategoryManager && (
                    <button
                      type="button"
                      onClick={() => onOpenCategoryManager('parcelas')}
                      className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Nova Categoria
                    </button>
                  )}
                </div>

                {categoryOptions.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between gap-2">
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      Nenhuma categoria de parcela cadastrada.
                    </div>
                    {onOpenCategoryManager && (
                      <button
                        type="button"
                        onClick={() => onOpenCategoryManager('parcelas')}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Cadastrar Categoria
                      </button>
                    )}
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800/90 rounded-xl border border-neutral-300 dark:border-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all cursor-pointer"
                  >
                    <option value="" disabled className="text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900">
                      Selecione uma categoria...
                    </option>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat} className="text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 font-medium py-1">
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Status no Mês Atual */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  Situação desta Parcela no Mês
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('pending')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      status === 'pending'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
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
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
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
                  <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Observações (Opcional)
                  </label>
                  <span className={`text-[10px] font-medium ${
                    notes.length >= MAX_NOTES_LENGTH ? 'text-rose-500 font-bold' : 'text-neutral-400 dark:text-neutral-500'
                  }`}>
                    {notes.length}/{MAX_NOTES_LENGTH}
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={MAX_NOTES_LENGTH}
                  placeholder="Número de contrato, link do boleto ou anotações..."
                  value={notes}
                  onChange={(e) => setNotes(sanitizeTextInput(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800/90 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-xl border border-neutral-300 dark:border-neutral-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none transition-all"
                />
              </div>

              {/* Anexos de Comprovantes (Até 4 arquivos) */}
              <ReceiptAttachmentField
                attachments={attachments}
                onChange={setAttachments}
                disabled={isSubmitting}
              />

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 text-xs font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
                >
                  {successFeedback ? 'Concluir e Fechar' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Salvar Parcela'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
