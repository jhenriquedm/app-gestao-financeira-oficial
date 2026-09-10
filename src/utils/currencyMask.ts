/**
 * Utilitários para formatação e máscara de moeda em tempo real (Padrão pt-BR)
 */

export const formatCurrencyInput = (raw: string | number): string => {
  if (typeof raw === 'number') {
    if (isNaN(raw) || raw === 0) return '0,00';
    return raw.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Remove todos os caracteres que não sejam dígitos numéricos
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';

  // Limite de segurança de 11 dígitos (até R$ 999.999.999,99)
  const trimmedDigits = digits.slice(0, 11);
  const cents = parseInt(trimmedDigits, 10);
  const value = cents / 100;

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const parseCurrencyInput = (formatted: string | number): number => {
  if (typeof formatted === 'number') return isNaN(formatted) ? 0 : formatted;
  const digits = (formatted || '').replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
};
