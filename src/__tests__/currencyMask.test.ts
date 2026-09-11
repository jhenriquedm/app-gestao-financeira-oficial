import { describe, it, expect } from 'vitest';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currencyMask';

describe('currencyMask utilities', () => {
  describe('formatCurrencyInput', () => {
    it('formats a number properly into pt-BR decimal string', () => {
      expect(formatCurrencyInput(1500.5)).toBe('1.500,50');
      expect(formatCurrencyInput(0)).toBe('0,00');
    });

    it('formats typed raw digit strings into currency', () => {
      expect(formatCurrencyInput('100')).toBe('1,00');
      expect(formatCurrencyInput('125000')).toBe('1.250,00');
      expect(formatCurrencyInput('50')).toBe('0,50');
      expect(formatCurrencyInput('5')).toBe('0,05');
    });

    it('returns empty string for empty input', () => {
      expect(formatCurrencyInput('')).toBe('');
    });

    it('respects safety cap on excessive digits', () => {
      // Inputting 15 digits gets capped to 11 digits (e.g. 12345678901 -> 123.456.789,01)
      const formatted = formatCurrencyInput('123456789012345');
      expect(formatted).toBe('123.456.789,01');
    });
  });

  describe('parseCurrencyInput', () => {
    it('parses formatted string into correct float value', () => {
      expect(parseCurrencyInput('1.500,50')).toBe(1500.5);
      expect(parseCurrencyInput('0,00')).toBe(0);
      expect(parseCurrencyInput('12,34')).toBe(12.34);
      expect(parseCurrencyInput('100')).toBe(1);
    });

    it('handles numeric input directly', () => {
      expect(parseCurrencyInput(250.75)).toBe(250.75);
      expect(parseCurrencyInput(NaN)).toBe(0);
    });

    it('handles empty input', () => {
      expect(parseCurrencyInput('')).toBe(0);
    });
  });
});
