export interface Expense {
  id?: string;
  groupId: string;
  description: string;
  totalAmount: number;
  category: ExpenseCategory;
  payers: Payer[];
  beneficiaries: Beneficiary[];
  splitType: SplitType;
  receiptUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payer {
  uid: string;
  displayName: string;
  amount: number;
}

export interface Beneficiary {
  uid: string;
  displayName: string;
  amount: number;
  percentage?: number;
  shares?: number;
}

export enum SplitType {
  EQUAL = 'equal',
  PERCENTAGE = 'percentage',
  EXACT = 'exact',
  SHARES = 'shares',
}

export enum ExpenseCategory {
  FOOD = 'Food & Dining',
  TRANSPORT = 'Transport',
  SHOPPING = 'Shopping',
  ENTERTAINMENT = 'Entertainment',
  UTILITIES = 'Utilities',
  RENT = 'Rent',
  OTHER = 'Other',
}
