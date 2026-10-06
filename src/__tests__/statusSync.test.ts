import { describe, it, expect } from 'vitest';
import { Transaction, DebtInstallment } from '../types';
import { getTransactionsForMonth } from '../utils/transactionHelpers';
import { getComputedInstallment } from '../utils/installmentHelpers';

describe('Transaction & Installment Status Sync & Retention Tests', () => {
  it('should toggle transaction status from pending to completed and retain updated state', () => {
    const originalTx: Transaction = {
      id: 'tx-1',
      description: 'Supermercado',
      amount: 150,
      type: 'expense',
      categoryId: 'cat-alimentacao',
      date: '2026-10-06',
      paymentMethod: 'pix',
      status: 'pending',
      createdAt: 1000,
      syncStatus: 'synced',
    };

    // User toggles status in currentYearMonth '2026-10'
    const currentYearMonth = '2026-10';
    const currentStatus = originalTx.paidMonths?.includes(currentYearMonth)
      ? 'completed'
      : currentYearMonth === (originalTx.startMonthYear || originalTx.date.slice(0, 7))
      ? originalTx.status
      : 'pending';
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const updatedPaidMonths = newStatus === 'completed'
      ? Array.from(new Set([...(originalTx.paidMonths || []), currentYearMonth]))
      : (originalTx.paidMonths || []).filter((m) => m !== currentYearMonth);

    const updatedTx: Transaction = {
      ...originalTx,
      status: currentYearMonth === (originalTx.startMonthYear || originalTx.date.slice(0, 7)) ? newStatus : originalTx.status,
      paidMonths: updatedPaidMonths,
      syncStatus: 'pendingUpload',
      updatedAt: 2000,
    };

    expect(updatedTx.status).toBe('completed');
    expect(updatedTx.paidMonths).toEqual(['2026-10']);
    expect(updatedTx.syncStatus).toBe('pendingUpload');
    expect(updatedTx.updatedAt).toBe(2000);

    // Verify getTransactionsForMonth returns completed
    const monthList = getTransactionsForMonth([updatedTx], '2026-10');
    expect(monthList[0].status).toBe('completed');
  });

  it('should toggle transaction status from completed back to pending and retain updated state', () => {
    const originalTx: Transaction = {
      id: 'tx-2',
      description: 'Salário',
      amount: 5000,
      type: 'income',
      categoryId: 'cat-renda',
      date: '2026-10-01',
      paymentMethod: 'transfer',
      status: 'completed',
      paidMonths: ['2026-10'],
      createdAt: 1000,
      syncStatus: 'synced',
    };

    const currentYearMonth = '2026-10';
    const currentStatus = originalTx.paidMonths?.includes(currentYearMonth)
      ? 'completed'
      : currentYearMonth === (originalTx.startMonthYear || originalTx.date.slice(0, 7))
      ? originalTx.status
      : 'pending';
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const updatedPaidMonths = newStatus === 'completed'
      ? Array.from(new Set([...(originalTx.paidMonths || []), currentYearMonth]))
      : (originalTx.paidMonths || []).filter((m) => m !== currentYearMonth);

    const updatedTx: Transaction = {
      ...originalTx,
      status: currentYearMonth === (originalTx.startMonthYear || originalTx.date.slice(0, 7)) ? newStatus : originalTx.status,
      paidMonths: updatedPaidMonths,
      syncStatus: 'pendingUpload',
      updatedAt: 2500,
    };

    expect(updatedTx.status).toBe('pending');
    expect(updatedTx.paidMonths).toEqual([]);
    expect(updatedTx.syncStatus).toBe('pendingUpload');

    const monthList = getTransactionsForMonth([updatedTx], '2026-10');
    expect(monthList[0].status).toBe('pending');
  });

  it('should toggle fixed expense status across consecutive months correctly', () => {
    const fixedExpense: Transaction = {
      id: 'tx-fixed-1',
      description: 'Internet Fibra',
      amount: 120,
      type: 'expense',
      categoryId: 'cat-moradia',
      date: '2026-08-10',
      paymentMethod: 'pix',
      isFixed: true,
      startMonthYear: '2026-08',
      status: 'pending',
      paidMonths: ['2026-08'], // August was paid
      createdAt: 1000,
    };

    // In August: completed because in paidMonths
    expect(getTransactionsForMonth([fixedExpense], '2026-08')[0].status).toBe('completed');
    // In September: pending (not in paidMonths)
    expect(getTransactionsForMonth([fixedExpense], '2026-09')[0].status).toBe('pending');

    // Mark September as paid
    const updatedFixed: Transaction = {
      ...fixedExpense,
      paidMonths: ['2026-08', '2026-09'],
      syncStatus: 'pendingUpload',
      updatedAt: 3000,
    };

    expect(getTransactionsForMonth([updatedFixed], '2026-09')[0].status).toBe('completed');
    expect(getTransactionsForMonth([updatedFixed], '2026-10')[0].status).toBe('pending');
  });

  it('should toggle installment status for specific competence month correctly', () => {
    const installment: DebtInstallment = {
      id: 'inst-1',
      description: 'Smartphone 10x',
      origin: 'Cartão de Crédito',
      monthlyAmount: 300,
      currentInstallment: 1,
      totalInstallments: 10,
      category: 'Eletrônicos',
      competence: '2026-10',
      dueDay: 15,
      status: 'pending',
      paidMonths: [],
      createdAt: 1000,
    };

    // Before toggle in 2026-10
    const computed1 = getComputedInstallment(installment, '2026-10');
    expect(computed1.status).toBe('pending');

    // After toggle in 2026-10
    const updatedInst: DebtInstallment = {
      ...installment,
      status: 'completed',
      paidMonths: ['2026-10'],
      syncStatus: 'pendingUpload',
      updatedAt: 4000,
    };

    const computed2 = getComputedInstallment(updatedInst, '2026-10');
    expect(computed2.status).toBe('completed');
  });
});
