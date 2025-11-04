import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore = inject(Firestore);

  async createOrUpdateUser(user: User) {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    await setDoc(userRef, user, { merge: true });
  }

  async getUser(uid: string): Promise<User | null> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? (snapshot.data() as User) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : (snapshot.docs[0].data() as User);
  }
}
