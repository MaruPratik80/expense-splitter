import { Timestamp } from '@angular/fire/firestore';

export interface Expense {
  id: string;
  groupId: string;
  name: string;
  amount: number;
  category: string;
  payer: string;
  splitType: 'equal' | 'percentage' | 'exact' | 'shares';
  splitData?: { [member: string]: number };
  beneficiaries: string[];
  date: Timestamp;
  settled: boolean;
  receiptImageUrl?: string;
}
