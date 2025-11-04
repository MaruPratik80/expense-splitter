export interface Settlement {
  id?: string;
  groupId: string;
  fromUser: string;
  fromUserName: string;
  toUser: string;
  toUserName: string;
  amount: number;
  settledAt: Date;
  settledBy: string;
}

export interface Balance {
  user1: string;
  user1Name: string;
  user2: string;
  user2Name: string;
  amount: number; // positive means user1 owes user2
}

export interface SimplifiedDebt {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}
