import { describe, it, expect } from 'vitest';
import { formatCpf, unmaskCpf, validateCpf } from '../utils/cpfValidator';

describe('cpfValidator', () => {
  it('unmaskCpf removes non-digits and caps at 11 characters', () => {
    expect(unmaskCpf('123.456.789-01')).toBe('12345678901');
    expect(unmaskCpf('123456789019999')).toBe('12345678901');
    expect(unmaskCpf('abc-123')).toBe('123');
    expect(unmaskCpf('')).toBe('');
  });

  it('formatCpf applies proper CPF mask incrementally', () => {
    expect(formatCpf('1')).toBe('1');
    expect(formatCpf('123')).toBe('123');
    expect(formatCpf('1234')).toBe('123.4');
    expect(formatCpf('123456')).toBe('123.456');
    expect(formatCpf('1234567')).toBe('123.456.7');
    expect(formatCpf('123456789')).toBe('123.456.789');
    expect(formatCpf('1234567890')).toBe('123.456.789-0');
    expect(formatCpf('12345678901')).toBe('123.456.789-01');
    expect(formatCpf('12345678901999')).toBe('123.456.789-01');
  });

  it('validateCpf rejects invalid CPF formats and sequences', () => {
    expect(validateCpf('')).toBe(false);
    expect(validateCpf('123')).toBe(false);
    expect(validateCpf('111.111.111-11')).toBe(false);
    expect(validateCpf('000.000.000-00')).toBe(false);
    expect(validateCpf('999.999.999-99')).toBe(false);
    expect(validateCpf('123.456.789-00')).toBe(false);
  });

  it('validateCpf correctly validates legitimate CPF checksums', () => {
    // Standard test CPFs with valid checksums
    expect(validateCpf('529.982.247-25')).toBe(true);
    expect(validateCpf('52998224725')).toBe(true);
    expect(validateCpf('111.444.777-35')).toBe(true);
    expect(validateCpf('11144477735')).toBe(true);
    expect(validateCpf('000.000.001-91')).toBe(true);
  });
});
