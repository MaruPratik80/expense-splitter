import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
} from '@angular/fire/firestore';
import { Observable, from, map, combineLatest } from 'rxjs';
import { Settlement, Balance, SimplifiedDebt } from '../models/settlement.model';
import { ExpenseService } from './expense.service';
import { Expense } from '../models/expense.model';

@Injectable({
  providedIn: 'root',
})
export class SettlementService {
  private firestore = inject(Firestore);
  private expenseService = inject(ExpenseService);

  addSettlement(settlement: Omit<Settlement, 'id'>): Observable<string> {
    const settlementsRef = collection(this.firestore, 'settlements');
    return from(addDoc(settlementsRef, settlement)).pipe(map((docRef) => docRef.id));
  }

  getGroupSettlements(groupId: string): Observable<Settlement[]> {
    const settlementsRef = collection(this.firestore, 'settlements');
    const q = query(settlementsRef, where('groupId', '==', groupId), orderBy('settledAt', 'desc'));

    return from(getDocs(q)).pipe(
      map((snapshot) => {
        return snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Settlement)
        );
      })
    );
  }

  calculateBalances(groupId: string): Observable<Balance[]> {
    return combineLatest([
      this.expenseService.getGroupExpenses(groupId),
      this.getGroupSettlements(groupId),
    ]).pipe(
      map(([expenses, settlements]) => {
        const balanceMap = new Map<string, number>();
        const userNames = new Map<string, string>();

        // Calculate from expenses
        expenses.forEach((expense) => {
          // Track user names
          expense.payers.forEach((p) => userNames.set(p.uid, p.displayName));
          expense.beneficiaries.forEach((b) => userNames.set(b.uid, b.displayName));

          // Each payer paid their amount
          expense.payers.forEach((payer) => {
            const key = payer.uid;
            balanceMap.set(key, (balanceMap.get(key) || 0) + payer.amount);
          });

          // Each beneficiary owes their amount
          expense.beneficiaries.forEach((beneficiary) => {
            const key = beneficiary.uid;
            balanceMap.set(key, (balanceMap.get(key) || 0) - beneficiary.amount);
          });
        });

        // Subtract settlements
        settlements.forEach((settlement) => {
          const fromKey = settlement.fromUser;
          const toKey = settlement.toUser;

          balanceMap.set(fromKey, (balanceMap.get(fromKey) || 0) + settlement.amount);
          balanceMap.set(toKey, (balanceMap.get(toKey) || 0) - settlement.amount);
        });

        // Convert to Balance array
        const balances: Balance[] = [];
        const users = Array.from(balanceMap.keys());

        for (let i = 0; i < users.length; i++) {
          for (let j = i + 1; j < users.length; j++) {
            const user1 = users[i];
            const user2 = users[j];
            const balance1 = balanceMap.get(user1) || 0;
            const balance2 = balanceMap.get(user2) || 0;

            if (balance1 < 0 && balance2 > 0) {
              const amount = Math.min(Math.abs(balance1), balance2);
              if (amount > 0.01) {
                balances.push({
                  user1,
                  user1Name: userNames.get(user1) || '',
                  user2,
                  user2Name: userNames.get(user2) || '',
                  amount: Math.round(amount * 100) / 100,
                });
              }
            } else if (balance1 > 0 && balance2 < 0) {
              const amount = Math.min(balance1, Math.abs(balance2));
              if (amount > 0.01) {
                balances.push({
                  user1: user2,
                  user1Name: userNames.get(user2) || '',
                  user2: user1,
                  user2Name: userNames.get(user1) || '',
                  amount: Math.round(amount * 100) / 100,
                });
              }
            }
          }
        }

        return balances;
      })
    );
  }

  getSimplifiedDebts(groupId: string): Observable<SimplifiedDebt[]> {
    return this.calculateBalances(groupId).pipe(
      map((balances) => {
        // Calculate net balance for each user
        const netBalances = new Map<string, { amount: number; name: string }>();

        balances.forEach((balance) => {
          const current1 = netBalances.get(balance.user1) || { amount: 0, name: balance.user1Name };
          const current2 = netBalances.get(balance.user2) || { amount: 0, name: balance.user2Name };

          netBalances.set(balance.user1, {
            amount: current1.amount - balance.amount,
            name: balance.user1Name,
          });

          netBalances.set(balance.user2, {
            amount: current2.amount + balance.amount,
            name: balance.user2Name,
          });
        });

        // Separate creditors and debtors
        const creditors: Array<{ uid: string; name: string; amount: number }> = [];
        const debtors: Array<{ uid: string; name: string; amount: number }> = [];

        netBalances.forEach((value, uid) => {
          if (value.amount > 0.01) {
            creditors.push({ uid, name: value.name, amount: value.amount });
          } else if (value.amount < -0.01) {
            debtors.push({ uid, name: value.name, amount: Math.abs(value.amount) });
          }
        });

        // Simplify debts
        const simplifiedDebts: SimplifiedDebt[] = [];
        let i = 0,
          j = 0;

        while (i < debtors.length && j < creditors.length) {
          const debt = Math.min(debtors[i].amount, creditors[j].amount);

          simplifiedDebts.push({
            from: debtors[i].uid,
            fromName: debtors[i].name,
            to: creditors[j].uid,
            toName: creditors[j].name,
            amount: Math.round(debt * 100) / 100,
          });

          debtors[i].amount -= debt;
          creditors[j].amount -= debt;

          if (debtors[i].amount < 0.01) i++;
          if (creditors[j].amount < 0.01) j++;
        }

        return simplifiedDebts;
      })
    );
  }
}
