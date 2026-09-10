import { PaymentMethod, Transaction, Category } from '../types';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
};

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const formatMonthYear = (yearMonthStr: string): string => {
  const [year, month] = yearMonthStr.split('-');
  const monthIdx = parseInt(month, 10) - 1;
  return `${MONTH_NAMES[monthIdx] || month} de ${year}`;
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro em Espécie',
  transfer: 'Transferência / TED',
  other: 'Outro',
};

export const downloadCSV = (transactions: Transaction[], categories: Category[]) => {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)', 'Forma de Pagamento', 'Status', 'Observações'];
  const rows = transactions.map(t => [
    t.date,
    t.type === 'income' ? 'Receita' : 'Despesa',
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(categoryMap.get(t.categoryId) || 'Sem Categoria').replace(/"/g, '""')}"`,
    t.amount.toFixed(2).replace('.', ','),
    `"${PAYMENT_METHOD_LABELS[t.paymentMethod] || t.paymentMethod}"`,
    t.status === 'completed' ? 'Concluído' : 'Pendente',
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `gestao-financeira-transacoes-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadJSON = (data: unknown, filename = 'backup-gestao-financeira.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
