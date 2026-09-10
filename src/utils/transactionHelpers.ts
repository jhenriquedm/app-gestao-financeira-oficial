import { Transaction, TransactionStatus } from '../types';

export interface ComputedTransaction extends Transaction {
  isRecurringInstance?: boolean;
}

/**
 * Resolves the transactions for a target month (YYYY-MM).
 * - Fixed expenses (and fixed income, if any) automatically appear in ALL subsequent months
 *   starting from their `startMonthYear` (or creation month).
 * - If deleted starting from a month (`deletedFromMonthYear`), they cease to appear
 *   from that month forward.
 * - Variable transactions appear only in their specific date's month.
 */
export function getTransactionsForMonth(
  transactions: Transaction[],
  targetYearMonth: string,
  monthlyStatusOverrides?: Record<string, TransactionStatus>
): Transaction[] {
  const result: Transaction[] = [];

  for (const t of transactions) {
    // Check if deleted for this target month
    if (t.deletedFromMonthYear && targetYearMonth >= t.deletedFromMonthYear) {
      continue;
    }

    if (t.isFixed) {
      const baseMonth = t.startMonthYear || t.date.slice(0, 7);
      // Fixed items appear in the start month and all subsequent months
      if (targetYearMonth >= baseMonth) {
        const day = t.dueDay || parseInt(t.date.split('-')[2], 10) || 5;
        const formattedDay = String(Math.min(28, Math.max(1, day))).padStart(2, '0');
        const computedDate = `${targetYearMonth}-${formattedDay}`;

        // Determine status for this specific month
        const overrideKey = `${t.id}_${targetYearMonth}`;
        let status: TransactionStatus = 'pending';

        if (monthlyStatusOverrides && overrideKey in monthlyStatusOverrides) {
          status = monthlyStatusOverrides[overrideKey];
        } else if (t.paidMonths && t.paidMonths.includes(targetYearMonth)) {
          status = 'completed';
        } else if (targetYearMonth === baseMonth) {
          status = t.status;
        } else {
          status = 'pending';
        }

        result.push({
          ...t,
          date: computedDate,
          status,
        });
      }
    } else {
      // Variable transaction: must match target month exactly
      if (t.date.startsWith(targetYearMonth)) {
        const overrideKey = `${t.id}_${targetYearMonth}`;
        let status = t.status;
        if (monthlyStatusOverrides && overrideKey in monthlyStatusOverrides) {
          status = monthlyStatusOverrides[overrideKey];
        }

        result.push({
          ...t,
          status,
        });
      }
    }
  }

  return result;
}
