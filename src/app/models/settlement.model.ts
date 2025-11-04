export interface Settlement {
  id: string;
  groupId: string;
  from: string;
  to: string;
  amount: number;
  date: Date;
}

export interface Balance {
  [member: string]: number;
}

export interface SettlementSuggestion {
  from: string;
  to: string;
  amount: number;
}
