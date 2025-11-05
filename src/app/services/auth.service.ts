import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  user,
  updateProfile,
} from '@angular/fire/auth';
import {
  Firestore,
  DocumentData,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  DocumentReference,
} from '@angular/fire/firestore';
import { Observable, from, switchMap, of } from 'rxjs';
import { User, UserProfile } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  user$ = user(this.auth);

  signUp(email: string, password: string, displayName: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((credential) => {
        return from(updateProfile(credential.user, { displayName })).pipe(
          switchMap(() => this.createUserProfile(credential.user, displayName))
        );
      })
    );
  }

  signIn(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  signInWithGoogle(): Observable<any> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap((credential) => {
        return this.createUserProfile(credential.user, credential.user.displayName || 'User');
      })
    );
  }

  signOut(): Observable<void> {
    return from(signOut(this.auth));
  }

  private createUserProfile(user: any, displayName: string): Observable<void> {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: displayName,
      photoURL: user.photoURL || '',
      createdAt: new Date(),
      groups: [],
    };

    const userRef = doc(this.firestore, `users/${user.uid}`);
    return from(
      getDoc(userRef).then((docSnap) => {
        return docSnap.exists() ? Promise.resolve() : setDoc(userRef, userProfile);
      })
    );
  }

  getUserProfile(uid: string): Observable<UserProfile | null> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return from(getDoc(userRef)).pipe(
      switchMap((docSnap) => {
        if (docSnap.exists()) {
          return of({ id: docSnap.id, ...(docSnap.data() as UserProfile) });
        }
        return of(null);
      })
    );
  }

  searchUserByEmail(email: string): Observable<User | null> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('email', '==', email));

    return from(getDocs(q)).pipe(
      switchMap((snapshot) => {
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data() as User;
          return of(userData);
        }
        return of(null);
      })
    );
  }
}
