/**
 * Brazilian CPF validation and formatting utilities
 */

/**
 * Strips all non-digit characters and limits to 11 digits
 */
export function unmaskCpf(value: string): string {
  if (!value) return '';
  return value.replace(/\D/g, '').slice(0, 11);
}

/**
 * Formats a raw or partial string into CPF mask: 000.000.000-00
 */
export function formatCpf(value: string): string {
  const digits = unmaskCpf(value);
  if (!digits) return '';

  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Validates a Brazilian CPF using official modulus-11 verification digits
 */
export function validateCpf(cpf: string): boolean {
  const clean = unmaskCpf(cpf);

  // Must have exactly 11 numeric digits
  if (clean.length !== 11) {
    return false;
  }

  // Reject known invalid CPFs with all repeated digits (e.g., 00000000000, 11111111111)
  if (/^(\d)\1{10}$/.test(clean)) {
    return false;
  }

  // 1st Verification Digit calculation
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let remainder1 = (sum1 * 10) % 11;
  if (remainder1 === 10 || remainder1 === 11) {
    remainder1 = 0;
  }
  if (remainder1 !== parseInt(clean.charAt(9), 10)) {
    return false;
  }

  // 2nd Verification Digit calculation
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  let remainder2 = (sum2 * 10) % 11;
  if (remainder2 === 10 || remainder2 === 11) {
    remainder2 = 0;
  }
  if (remainder2 !== parseInt(clean.charAt(10), 10)) {
    return false;
  }

  return true;
}
