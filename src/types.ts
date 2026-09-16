export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'transfer' | 'other';

export type TransactionStatus = 'completed' | 'pending';

export type CategoryTarget = 'fixed' | 'installment' | 'income' | 'variable';

export type SyncStatus = 'synced' | 'pendingUpload' | 'pendingDelete';

export interface Category {
  id: string;
  userId?: string;
  name: string;
  type: TransactionType;
  target?: CategoryTarget;
  color: string;
  iconName: string;
  syncStatus?: SyncStatus;
  updatedAt?: number;
  isDeleted?: boolean;
}

export interface ReceiptAttachment {
  id: string;
  name: string;
  size: number; // Tamanho em bytes
  type: string; // mimeType (ex: application/pdf, image/jpeg, image/png, application/vnd.openxmlformats-officedocument.wordprocessingml.document)
  dataUrl?: string; // Base64 Data URL para armazenamento local e download rápido
  fileUrl?: string; // URL pública/segura do Firebase Storage para acesso em múltiplos dispositivos ou nova instalação
  storagePath?: string; // Caminho no bucket do Firebase Storage (ex: users/{userId}/attachments/{id}_{name})
  uploadedAt: number;
}

export interface Transaction {
  id: string;
  userId?: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  notes?: string;
  attachment?: ReceiptAttachment; // mantido para compatibilidade retroativa
  attachments?: ReceiptAttachment[]; // até 4 comprovantes anexados
  isFixed?: boolean; // Despesa Fixa Recorrente (ex: Aluguel, Internet)
  dueDay?: number; // Dia de Vencimento no Mês (1-31)
  startMonthYear?: string; // YYYY-MM quando foi criada
  deletedFromMonthYear?: string; // YYYY-MM se foi cancelada/excluída a partir deste mês
  paidMonths?: string[]; // Meses em que foi marcada como concluída/paga
  createdAt: number;
  syncStatus?: SyncStatus;
  updatedAt?: number;
  isDeleted?: boolean;
}

export interface DebtInstallment {
  id: string;
  userId?: string;
  description: string;
  category: string;
  currentInstallment: number; // Parcela atual (ex: 4)
  totalInstallments: number; // Total de parcelas (ex: 20)
  monthlyAmount: number; // Valor mensal da parcela (R$)
  dueDay: number; // Dia de vencimento (1-31)
  origin: string; // Origem (ex: Holerite, Débito na Conta Itaú, Mercado Pago, Nubank)
  status: TransactionStatus; // 'completed' (Pago) ou 'pending' (Pendente)
  competence: string; // AAAA-MM
  deletedFromMonthYear?: string; // YYYY-MM se foi cancelada/excluída a partir deste mês
  paidMonths?: string[]; // Meses em que a parcela foi marcada como paga
  notes?: string;
  attachment?: ReceiptAttachment; // mantido para compatibilidade retroativa
  attachments?: ReceiptAttachment[]; // até 4 comprovantes anexados
  createdAt: number;
  syncStatus?: SyncStatus;
  updatedAt?: number;
  isDeleted?: boolean;
}

export interface Budget {
  id: string;
  userId?: string;
  name?: string; // Nome personalizado do teto de gastos
  categoryId: string;
  monthlyLimit: number;
  syncStatus?: SyncStatus;
  updatedAt?: number;
  isDeleted?: boolean;
}

export interface SavingsGoal {
  id: string;
  userId?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // YYYY-MM-DD
  color: string;
  iconName: string;
  syncStatus?: SyncStatus;
  updatedAt?: number;
  isDeleted?: boolean;
}

export type FinancialHealthStatus = 'SAUDÁVEL' | 'ATENÇÃO' | 'CRÍTICO' | 'NEGATIVO';

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  fixedExpenses: number;
  variableExpenses: number;
  installmentsAmount: number;
  totalCompromissos: number; // fixedExpenses + installmentsAmount + variableExpenses
  totalPaid: number;
  totalPending: number;
  balance: number;
  savingsRate: number;
  incomeCommitmentPercentage: number;
  paidPercentage: number;
  healthStatus: FinancialHealthStatus;
  pendingIncome: number;
  pendingExpense: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  photoUrl?: string;
  createdAt: number;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  cpf: string;
  passwordHash: string;
  photoUrl?: string;
  createdAt: number;
}

