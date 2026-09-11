import { PaymentMethod, Transaction, Category, DebtInstallment } from '../types';
import { getComputedInstallment } from './installmentHelpers';

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

export const downloadCSV = (
  transactions: Transaction[],
  categories: Category[],
  currentMonthYear?: string,
  installments?: DebtInstallment[]
) => {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  // Filter by target month if specified
  const filteredTx = currentMonthYear 
    ? transactions.filter(t => t.date.startsWith(currentMonthYear))
    : transactions;

  interface ExportRow {
    date: string;
    type: string;
    description: string;
    category: string;
    amount: number;
    paymentMethod: string;
    status: string;
    notes: string;
  }

  const exportRows: ExportRow[] = [];

  // Add standard/avulsas and fixed transactions
  filteredTx.forEach(t => {
    let typeLabel = '';
    if (t.type === 'income') {
      typeLabel = t.isFixed ? 'Receita Fixa' : 'Receita';
    } else {
      typeLabel = t.isFixed ? 'Despesa Fixa' : 'Despesa Avulsa';
    }

    exportRows.push({
      date: t.date,
      type: typeLabel,
      description: t.description || '',
      category: categoryMap.get(t.categoryId) || 'Sem Categoria',
      amount: t.amount,
      paymentMethod: PAYMENT_METHOD_LABELS[t.paymentMethod] || t.paymentMethod,
      status: t.status === 'completed' ? 'Concluído' : 'Pendente',
      notes: t.notes || (t.isFixed ? 'Recorrente Mensal' : 'Despesa Avulsa'),
    });
  });

  // Add active installments if provided
  if (installments && installments.length > 0) {
    const targetMonth = currentMonthYear || new Date().toISOString().slice(0, 7);
    const [y, m] = targetMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();

    installments.forEach(inst => {
      const ci = getComputedInstallment(inst, targetMonth);
      if (ci.isActive) {
        const safeDay = Math.min(daysInMonth, Math.max(1, inst.dueDay || 5));
        const dateStr = `${targetMonth}-${String(safeDay).padStart(2, '0')}`;
        
        exportRows.push({
          date: dateStr,
          type: 'Despesa Parcelada',
          description: `${inst.description} (Parcela ${ci.current}/${ci.total})`,
          category: inst.category || 'Parcelamento',
          amount: inst.monthlyAmount,
          paymentMethod: inst.origin || 'Cartão de Crédito',
          status: ci.status === 'completed' ? 'Concluído' : 'Pendente',
          notes: inst.notes 
            ? `${inst.notes} | Parcela ${ci.current} de ${ci.total} (Restam ${ci.remaining})`
            : `Parcela ${ci.current} de ${ci.total} (Restam ${ci.remaining})`,
        });
      }
    });
  }

  // Sort all rows by date descending
  exportRows.sort((a, b) => b.date.localeCompare(a.date));

  const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)', 'Forma de Pagamento', 'Status', 'Observações'];
  const rows = exportRows.map(r => [
    r.date,
    r.type,
    `"${r.description.replace(/"/g, '""')}"`,
    `"${r.category.replace(/"/g, '""')}"`,
    r.amount.toFixed(2).replace('.', ','),
    `"${r.paymentMethod.replace(/"/g, '""')}"`,
    r.status,
    `"${r.notes.replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const fileSuffix = currentMonthYear ? `-${currentMonthYear}` : `-${new Date().toISOString().slice(0, 10)}`;
  link.setAttribute('download', `gestao-financeira${fileSuffix}.csv`);
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
