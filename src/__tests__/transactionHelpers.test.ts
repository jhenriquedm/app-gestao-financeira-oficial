import { describe, it, expect } from 'vitest';
import { getTransactionsForMonth } from '../utils/transactionHelpers';
import { Transaction } from '../types';

describe('transactionHelpers', () => {
  const fixedExpense: Transaction = {
    id: 'tx-fixed-1',
    description: 'Internet Fibra',
    amount: 120,
    type: 'expense',
    date: '2026-09-05',
    startMonthYear: '2026-09',
    isFixed: true,
    dueDay: 5,
    status: 'pending',
    categoryId: 'cat-bills',
    paymentMethod: 'pix',
    createdAt: Date.now(),
  };

  const variableExpense: Transaction = {
    id: 'tx-var-1',
    description: 'Jantar Restaurante',
    amount: 250,
    type: 'expense',
    date: '2026-09-15',
    isFixed: false,
    status: 'completed',
    categoryId: 'cat-food',
    paymentMethod: 'credit_card',
    createdAt: Date.now(),
  };

  const incomeTx: Transaction = {
    id: 'tx-income-1',
    description: 'Salário Setembro',
    amount: 5000,
    type: 'income',
    date: '2026-09-01',
    isFixed: false,
    status: 'completed',
    categoryId: 'cat-salary',
    paymentMethod: 'transfer',
    createdAt: Date.now(),
  };

  const transactions = [fixedExpense, variableExpense, incomeTx];

  it('includes both fixed and variable transactions for the current launch month', () => {
    const list = getTransactionsForMonth(transactions, '2026-09');
    expect(list.length).toBe(3);
    expect(list.some(t => t.id === 'tx-fixed-1')).toBe(true);
    expect(list.some(t => t.id === 'tx-var-1')).toBe(true);
    expect(list.some(t => t.id === 'tx-income-1')).toBe(true);
  });

  it('projects fixed expense into future months while strictly isolating variable expenses', () => {
    // In October 2026: only the fixed expense should appear, variable expense must NOT leak
    const listOct = getTransactionsForMonth(transactions, '2026-10');
    expect(listOct.length).toBe(1);
    expect(listOct[0].id).toBe('tx-fixed-1');
    expect(listOct[0].date).toBe('2026-10-05');
  });

  it('does not project fixed expense into past months before its startMonthYear', () => {
    const listAug = getTransactionsForMonth(transactions, '2026-08');
    expect(listAug.length).toBe(0);
  });

  it('stops recurring fixed expense when deletedFromMonthYear is set', () => {
    const deletedFixed: Transaction = {
      ...fixedExpense,
      deletedFromMonthYear: '2026-11',
    };

    const listOct = getTransactionsForMonth([deletedFixed], '2026-10');
    expect(listOct.length).toBe(1);

    const listNov = getTransactionsForMonth([deletedFixed], '2026-11');
    expect(listNov.length).toBe(0);

    const listDec = getTransactionsForMonth([deletedFixed], '2026-12');
    expect(listDec.length).toBe(0);
  });

  it('applies monthlyStatusOverrides correctly to recurring fixed instances', () => {
    const overrides = {
      'tx-fixed-1_2026-10': 'completed' as const,
    };

    const listOct = getTransactionsForMonth(transactions, '2026-10', overrides);
    expect(listOct[0].status).toBe('completed');

    const listNov = getTransactionsForMonth(transactions, '2026-11', overrides);
    expect(listNov[0].status).toBe('pending');
  });
});
