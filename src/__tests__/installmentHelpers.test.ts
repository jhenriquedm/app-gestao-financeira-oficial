import { describe, it, expect } from 'vitest';
import { getComputedInstallment } from '../utils/installmentHelpers';
import { DebtInstallment } from '../types';

describe('installmentHelpers', () => {
  const baseInstallment: DebtInstallment = {
    id: 'inst-1',
    description: 'iPhone 15 Parcelado',
    category: 'Eletrônicos',
    monthlyAmount: 500,
    totalInstallments: 12,
    currentInstallment: 1,
    competence: '2026-09',
    dueDay: 10,
    origin: 'Cartão de Crédito',
    status: 'pending',
    createdAt: Date.now(),
  };

  it('computes installment 1 in the base month', () => {
    const computed = getComputedInstallment(baseInstallment, '2026-09');
    expect(computed.current).toBe(1);
    expect(computed.total).toBe(12);
    expect(computed.remaining).toBe(11);
    expect(computed.isActive).toBe(true);
    expect(computed.isFutureEnded).toBe(false);
    expect(computed.isPastNotStarted).toBe(false);
  });

  it('increments installment count correctly for future months', () => {
    // 3 months later: Dec 2026 (Month 9 -> Month 12: diff is 3 -> 1 + 3 = 4)
    const computed = getComputedInstallment(baseInstallment, '2026-12');
    expect(computed.current).toBe(4);
    expect(computed.remaining).toBe(8);
    expect(computed.isActive).toBe(true);
  });

  it('marks as ended/inactive when target month exceeds total installments', () => {
    // 12 installments starting Sept 2026 (ends Aug 2027: installment 12).
    // In Sept 2027 (diff = 12 months -> installment 13):
    const computed = getComputedInstallment(baseInstallment, '2027-09');
    expect(computed.current).toBe(13);
    expect(computed.isActive).toBe(false);
    expect(computed.isFutureEnded).toBe(true);
  });

  it('marks as past not started when checking months prior to competence', () => {
    const computed = getComputedInstallment(baseInstallment, '2026-08');
    expect(computed.current).toBe(0);
    expect(computed.isActive).toBe(false);
    expect(computed.isPastNotStarted).toBe(true);
  });

  it('respects deletedFromMonthYear stopping future month appearances', () => {
    const deletedInst: DebtInstallment = {
      ...baseInstallment,
      deletedFromMonthYear: '2026-11',
    };

    const beforeDelete = getComputedInstallment(deletedInst, '2026-10');
    expect(beforeDelete.isActive).toBe(true);

    const onOrAfterDelete = getComputedInstallment(deletedInst, '2026-11');
    expect(onOrAfterDelete.isActive).toBe(false);
    expect(onOrAfterDelete.isFutureEnded).toBe(true);
  });

  it('supports monthlyStatusOverrides for independent paid status per month', () => {
    const overrides = {
      'inst-1_2026-10': 'completed' as const,
    };

    const sept = getComputedInstallment(baseInstallment, '2026-09', overrides);
    expect(sept.status).toBe('pending');

    const oct = getComputedInstallment(baseInstallment, '2026-10', overrides);
    expect(oct.status).toBe('completed');
  });
});
