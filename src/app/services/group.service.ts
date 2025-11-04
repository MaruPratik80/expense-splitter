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
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Group } from '../models/group.model';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private firestore = inject(Firestore);
  private groupsCollection = collection(this.firestore, 'groups');

  async createGroup(group: Omit<Group, 'id'>): Promise<string> {
    const docRef = await addDoc(this.groupsCollection, {
      ...group,
      createdAt: new Date(),
    });
    return docRef.id;
  }

  getUserGroups(userId: string): Observable<Group[]> {
    return new Observable((observer) => {
      const q = query(this.groupsCollection, where('createdBy', '==', userId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const groups = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Group)
        );
        observer.next(groups);
      });
      return unsubscribe;
    });
  }

  async updateGroup(groupId: string, data: Partial<Group>) {
    const groupDoc = doc(this.firestore, 'groups', groupId);
    return await updateDoc(groupDoc, data);
  }

  async deleteGroup(groupId: string) {
    const groupDoc = doc(this.firestore, 'groups', groupId);
    return await deleteDoc(groupDoc);
  }
}
