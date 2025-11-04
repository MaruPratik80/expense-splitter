import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable, from, map } from 'rxjs';
import { Expense, SplitType } from '../models/expense.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);

  addExpense(expense: Omit<Expense, 'id'>): Observable<string> {
    const expensesRef = collection(this.firestore, 'expenses');
    return from(addDoc(expensesRef, expense)).pipe(map((docRef) => docRef.id));
  }

  getGroupExpenses(groupId: string): Observable<Expense[]> {
    const expensesRef = collection(this.firestore, 'expenses');
    const q = query(expensesRef, where('groupId', '==', groupId), orderBy('createdAt', 'desc'));

    return from(getDocs(q)).pipe(
      map((snapshot) => {
        return snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Expense)
        );
      })
    );
  }

  getExpense(expenseId: string): Observable<Expense | null> {
    const expenseRef = doc(this.firestore, `expenses/${expenseId}`);
    return from(getDoc(expenseRef)).pipe(
      map((docSnap) => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Expense;
        }
        return null;
      })
    );
  }

  updateExpense(expenseId: string, updates: Partial<Expense>): Observable<void> {
    const expenseRef = doc(this.firestore, `expenses/${expenseId}`);
    return from(updateDoc(expenseRef, { ...updates, updatedAt: new Date() }));
  }

  deleteExpense(expenseId: string): Observable<void> {
    const expenseRef = doc(this.firestore, `expenses/${expenseId}`);
    return from(deleteDoc(expenseRef));
  }

  // uploadReceipt(file: File, groupId: string): Observable<string> {
  //   const fileName = `receipts/${groupId}/${Date.now()}_${file.name}`;
  //   const storageRef = ref(this.storage, fileName);

  //   return from(uploadBytes(storageRef, file)).pipe(
  //     map(() => getDownloadURL(storageRef)),
  //     map((urlPromise) => urlPromise)
  //   ) as Observable<string>;
  // }

  calculateSplit(totalAmount: number, beneficiaries: any[], splitType: SplitType): number[] {
    switch (splitType) {
      case SplitType.EQUAL:
        return this.splitEqually(totalAmount, beneficiaries.length);

      case SplitType.PERCENTAGE:
        return this.splitByPercentage(totalAmount, beneficiaries);

      case SplitType.EXACT:
        return beneficiaries.map((b) => b.amount);

      case SplitType.SHARES:
        return this.splitByShares(totalAmount, beneficiaries);

      default:
        return [];
    }
  }

  private splitEqually(total: number, count: number): number[] {
    const baseAmount = Math.floor((total * 100) / count) / 100;
    const amounts = new Array(count).fill(baseAmount);
    const remainder = Math.round((total - baseAmount * count) * 100) / 100;

    if (remainder > 0) {
      amounts[0] += remainder;
    }

    return amounts;
  }

  private splitByPercentage(total: number, beneficiaries: any[]): number[] {
    return beneficiaries.map((b) => Math.round(((total * (b.percentage || 0)) / 100) * 100) / 100);
  }

  private splitByShares(total: number, beneficiaries: any[]): number[] {
    const totalShares = beneficiaries.reduce((sum, b) => sum + (b.shares || 0), 0);
    return beneficiaries.map(
      (b) => Math.round(((total * (b.shares || 0)) / totalShares) * 100) / 100
    );
  }
}
