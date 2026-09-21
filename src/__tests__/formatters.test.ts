import { describe, it, expect } from 'vitest';
import { 
  formatCurrency, 
  formatDate, 
  formatMonthYear, 
  formatMonthYearShort,
  formatMonthYearSlash,
  getCurrentYearMonth 
} from '../utils/formatters';

describe('formatters utilities', () => {
  describe('formatCurrency', () => {
    it('formats numbers into Brazilian Real currency format', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1.234,56');
    });

    it('formats zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0,00');
    });
  });

  describe('formatDate', () => {
    it('formats ISO YYYY-MM-DD to DD/MM/YYYY', () => {
      expect(formatDate('2026-09-11')).toBe('11/09/2026');
      expect(formatDate('2027-12-25')).toBe('25/12/2027');
    });

    it('returns original string if format is irregular', () => {
      expect(formatDate('')).toBe('');
    });
  });

  describe('formatMonthYear and formatMonthYearShort', () => {
    it('formats YYYY-MM to full localized month and year', () => {
      expect(formatMonthYear('2026-09')).toBe('Setembro de 2026');
      expect(formatMonthYear('2027-01')).toBe('Janeiro de 2027');
    });

    it('formats YYYY-MM to short month and year format', () => {
      expect(formatMonthYearShort('2026-09')).toBe('Set/26');
      expect(formatMonthYearShort('2027-12')).toBe('Dez/27');
    });

    it('formats YYYY-MM to full month slash year format (e.g. Agosto/2026)', () => {
      expect(formatMonthYearSlash('2026-08')).toBe('Agosto/2026');
      expect(formatMonthYearSlash('2026-09')).toBe('Setembro/2026');
      expect(formatMonthYearSlash('2026-10')).toBe('Outubro/2026');
      expect(formatMonthYearSlash('2027-01')).toBe('Janeiro/2027');
    });
  });

  describe('getCurrentYearMonth', () => {
    it('returns a valid YYYY-MM string', () => {
      const ym = getCurrentYearMonth();
      expect(ym).toMatch(/^\d{4}-\d{2}$/);
    });
  });
});
