import { DebtInstallment, TransactionStatus } from '../types';

export interface ComputedInstallment {
  installment: DebtInstallment;
  current: number; // e.g. 4
  total: number; // e.g. 20
  remaining: number; // e.g. 16
  isActive: boolean; // 1 <= current <= total
  isFutureEnded: boolean; // current > total (already ended)
  isPastNotStarted: boolean; // current < 1
  status: TransactionStatus;
  progressPercent: number;
}

/**
 * Computes the installment status and counter for a specific target year-month (YYYY-MM).
 * - Increment each month: e.g., Setembro 3/5, Outubro 4/5, Novembro 5/5
 * - If current > total (e.g., Dezembro 6/5): isActive is false and it must NOT be displayed or counted!
 */
export function getComputedInstallment(
  inst: DebtInstallment,
  targetYearMonth: string,
  monthlyStatusOverrides?: Record<string, TransactionStatus>
): ComputedInstallment {
  const [baseYear, baseMonth] = (inst.competence || targetYearMonth).split('-').map(Number);
  const [targetYear, targetMonth] = targetYearMonth.split('-').map(Number);

  const diffMonths = (targetYear - baseYear) * 12 + (targetMonth - baseMonth);
  const current = inst.currentInstallment + diffMonths;
  const total = inst.totalInstallments;
  const remaining = Math.max(0, total - current);

  const isDeletedForTarget = !!(inst.deletedFromMonthYear && targetYearMonth >= inst.deletedFromMonthYear);
  const isActive = current >= 1 && current <= total && !isDeletedForTarget;
  const isFutureEnded = current > total || isDeletedForTarget;
  const isPastNotStarted = current < 1;

  // Status for this specific month
  const overrideKey = `${inst.id}_${targetYearMonth}`;
  let status: TransactionStatus = 'pending';

  if (monthlyStatusOverrides && overrideKey in monthlyStatusOverrides) {
    status = monthlyStatusOverrides[overrideKey];
  } else if (inst.paidMonths && inst.paidMonths.includes(targetYearMonth)) {
    status = 'completed';
  } else if (targetYearMonth === inst.competence) {
    status = inst.status;
  } else {
    // If not overridden and not the base creation month, default to pending
    status = 'pending';
  }

  const progressPercent = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;

  return {
    installment: inst,
    current,
    total,
    remaining,
    isActive,
    isFutureEnded,
    isPastNotStarted,
    status,
    progressPercent,
  };
}
