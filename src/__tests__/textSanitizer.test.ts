import { describe, it, expect } from 'vitest';
import { 
  formatSentenceCase, 
  sanitizeTextInput, 
  sanitizeNameInput, 
  sanitizePersonName 
} from '../utils/textSanitizer';

describe('textSanitizer utilities', () => {
  describe('formatSentenceCase', () => {
    it('capitalizes the first letter of a sentence', () => {
      expect(formatSentenceCase('salário mensal')).toBe('Salário mensal');
      expect(formatSentenceCase('compra no supermercado')).toBe('Compra no supermercado');
    });

    it('capitalizes the first letter after sentence terminators (., !, ?)', () => {
      expect(formatSentenceCase('primeira frase. segunda frase')).toBe('Primeira frase. Segunda frase');
      expect(formatSentenceCase('tudo certo! novo item')).toBe('Tudo certo! Novo item');
      expect(formatSentenceCase('pagar conta? sim')).toBe('Pagar conta? Sim');
    });

    it('handles empty or blank string gracefully', () => {
      expect(formatSentenceCase('')).toBe('');
    });
  });

  describe('sanitizeTextInput', () => {
    it('allows letters, accents, numbers, spaces, and safe punctuation', () => {
      const input = 'aluguel apto 102 - r$ 1.500,00 (pago/mês)';
      const result = sanitizeTextInput(input);
      expect(result).toBe('Aluguel apto 102 - r 1.500,00 (pago/mês)');
    });

    it('strips dangerous characters and symbols like <, >, $, @, #, *, etc.', () => {
      const dirty = '<script>alert("hack")</script> conta @luz #123';
      const result = sanitizeTextInput(dirty);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('@');
      expect(result).not.toContain('#');
    });
  });

  describe('sanitizeNameInput', () => {
    it('sanitizes bank/category names and applies sentence case', () => {
      expect(sanitizeNameInput('banco do brasil')).toBe('Banco do brasil');
      expect(sanitizeNameInput('nubank - conta corrente')).toBe('Nubank - conta corrente');
    });

    it('removes invalid special symbols', () => {
      expect(sanitizeNameInput('itau & bradesco $$$')).toBe('Itau  bradesco ');
    });
  });

  describe('sanitizePersonName', () => {
    it('sanitizes proper names keeping letters, accents, spaces and hyphens', () => {
      expect(sanitizePersonName('joão henrique d\'ávila')).toBe('João henrique d\'ávila');
      expect(sanitizePersonName('maria-clara silva')).toBe('Maria-clara silva');
    });

    it('strips numbers and non-name symbols', () => {
      expect(sanitizePersonName('carlos @silva')).toBe('Carlos silva');
      expect(sanitizePersonName('ana 123 lima')).toBe('Ana  lima');
    });
  });
});
