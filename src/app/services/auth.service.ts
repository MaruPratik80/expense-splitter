import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  user,
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  user$ = user(this.auth);

  async signInWithEmail(email: string, password: string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  async signUpWithEmail(email: string, password: string) {
    return await createUserWithEmailAndPassword(this.auth, email, password);
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(this.auth, provider);
  }

  async signOut() {
    return await signOut(this.auth);
  }
}
