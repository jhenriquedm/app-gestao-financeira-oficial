/**
 * Utilities for sanitizing and blocking special characters from text input fields,
 * and enforcing sentence-case capitalization (first letter uppercase, and first letter uppercase after a period).
 */

export const formatSentenceCase = (text: string): string => {
  if (!text) return '';
  return text.replace(/(^|[.!?]\s*)([\p{L}])/gu, (_match, prefix, char) => {
    return prefix + char.toUpperCase();
  });
};

// Permite letras (com acentos em português), números, espaços e pontuações seguras (hífen, ponto, vírgula, barra, parênteses e apóstrofo)
export const sanitizeTextInput = (value: string): string => {
  const sanitized = value.replace(/[^\p{L}\p{N}\s\-.,/()']/gu, '');
  return formatSentenceCase(sanitized);
};

// Permite letras, números, espaços, hífens, barras e pontos (ideal para bancos, origens e nomes de categorias)
export const sanitizeNameInput = (value: string): string => {
  const sanitized = value.replace(/[^\p{L}\p{N}\s\-./]/gu, '');
  return formatSentenceCase(sanitized);
};

// Permite apenas letras, acentos, espaços, hífens e apóstrofos (ideal para nomes próprios)
export const sanitizePersonName = (value: string): string => {
  const sanitized = value.replace(/[^\p{L}\s'-]/gu, '');
  return formatSentenceCase(sanitized);
};
