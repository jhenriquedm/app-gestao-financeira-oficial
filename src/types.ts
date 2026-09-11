export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'transfer' | 'other';

export type TransactionStatus = 'completed' | 'pending';

export type CategoryTarget = 'fixed' | 'installment' | 'income' | 'variable';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}

export interface Category {
  id: string;
  userId?: string;
  name: string;
  type: TransactionType;
  target?: CategoryTarget;
  color: string;
  iconName: string;
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
  isFixed?: boolean; // Despesa Fixa Recorrente (ex: Aluguel, Internet)
  dueDay?: number; // Dia de Vencimento no Mês (1-31)
  startMonthYear?: string; // YYYY-MM quando foi criada
  deletedFromMonthYear?: string; // YYYY-MM se foi cancelada/excluída a partir deste mês
  paidMonths?: string[]; // Meses em que foi marcada como concluída/paga
  createdAt: number;
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
  createdAt: number;
}

export interface Budget {
  id: string;
  userId?: string;
  name?: string; // Nome personalizado do teto de gastos
  categoryId: string;
  monthlyLimit: number;
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
  createdAt: number;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: number;
}

