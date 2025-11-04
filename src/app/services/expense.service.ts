import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Expense } from '../models/expense.model';
import { Balance, SettlementSuggestion } from '../models/settlement.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private firestore = inject(Firestore);
  private expensesCollection = collection(this.firestore, 'expenses');

  async createExpense(expense: any): Promise<string> {
    const docRef = await addDoc(this.expensesCollection, {
      ...expense,
      date: new Date(),
    });
    // Send email notifications here
    return docRef.id;
  }

  getGroupExpenses(groupId: string): Observable<Expense[]> {
    return new Observable((observer) => {
      const q = query(
        this.expensesCollection,
        where('groupId', '==', groupId),
        orderBy('date', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const expenses = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Expense)
        );
        observer.next(expenses);
      });
      return unsubscribe;
    });
  }

  calculateBalances(expenses: Expense[], members: string[]): Balance {
    const balances: Balance = {};
    members.forEach((member) => (balances[member] = 0));

    expenses
      .filter((e) => !e.settled)
      .forEach((expense) => {
        const { amount, payer, beneficiaries, splitType, splitData } = expense;

        if (splitType === 'equal') {
          const perPerson = amount / beneficiaries.length;
          beneficiaries.forEach((member) => {
            if (member !== payer) {
              balances[member] -= perPerson;
              balances[payer] += perPerson;
            }
          });
        } else if (splitType === 'percentage' && splitData) {
          beneficiaries.forEach((member) => {
            const memberAmount = (amount * (splitData[member] || 0)) / 100;
            if (member !== payer) {
              balances[member] -= memberAmount;
              balances[payer] += memberAmount;
            }
          });
        } else if (splitType === 'exact' && splitData) {
          beneficiaries.forEach((member) => {
            const memberAmount = splitData[member] || 0;
            if (member !== payer) {
              balances[member] -= memberAmount;
              balances[payer] += memberAmount;
            }
          });
        } else if (splitType === 'shares' && splitData) {
          const totalShares = beneficiaries.reduce((sum, m) => sum + (splitData[m] || 0), 0);
          beneficiaries.forEach((member) => {
            const memberAmount = (amount * (splitData[member] || 0)) / totalShares;
            if (member !== payer) {
              balances[member] -= memberAmount;
              balances[payer] += memberAmount;
            }
          });
        }
      });

    return balances;
  }

  generateSettlementSuggestions(balances: Balance): SettlementSuggestion[] {
    const suggestions: SettlementSuggestion[] = [];
    const creditors = Object.entries(balances)
      .filter(([_, amt]) => amt > 0.01)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amt]) => ({ name, amount: amt }));

    const debtors = Object.entries(balances)
      .filter(([_, amt]) => amt < -0.01)
      .sort((a, b) => a[1] - b[1])
      .map(([name, amt]) => ({ name, amount: Math.abs(amt) }));

    let i = 0,
      j = 0;
    while (i < creditors.length && j < debtors.length) {
      const settleAmount = Math.min(creditors[i].amount, debtors[j].amount);

      suggestions.push({
        from: debtors[j].name,
        to: creditors[i].name,
        amount: settleAmount,
      });

      creditors[i].amount -= settleAmount;
      debtors[j].amount -= settleAmount;

      if (creditors[i].amount < 0.01) i++;
      if (debtors[j].amount < 0.01) j++;
    }

    return suggestions;
  }

  async markExpenseSettled(expenseId: string) {
    const expenseDoc = doc(this.firestore, 'expenses', expenseId);
    return await updateDoc(expenseDoc, { settled: true });
  }
}
