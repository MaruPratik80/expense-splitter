import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  arrayRemove,
  orderBy,
} from '@angular/fire/firestore';
import { Observable, from, map, switchMap } from 'rxjs';
import { Group, GroupMember } from '../models/group.model';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private firestore = inject(Firestore);

  createGroup(group: Omit<Group, 'id'>): Observable<string> {
    const groupsRef = collection(this.firestore, 'groups');
    return from(addDoc(groupsRef, group)).pipe(
      switchMap((docRef) => {
        // Add group to admin's groups array
        const adminRef = doc(this.firestore, `users/${group.adminId}`);
        return from(
          updateDoc(adminRef, {
            groups: arrayUnion(docRef.id),
          })
        ).pipe(map(() => docRef.id));
      })
    );
  }

  getGroup(groupId: string): Observable<Group | null> {
    const groupRef = doc(this.firestore, `groups/${groupId}`);
    return from(getDoc(groupRef)).pipe(
      map((docSnap) => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Group;
        }
        return null;
      })
    );
  }

  getUserGroups(userId: string): Observable<Group[]> {
    const groupsRef = collection(this.firestore, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', { uid: userId }));

    // Alternative query approach
    return from(getDocs(collection(this.firestore, 'groups'))).pipe(
      map((snapshot) => {
        const groups: Group[] = [];
        snapshot.forEach((doc) => {
          const group = { id: doc.id, ...doc.data() } as Group;
          if (group.members.some((m) => m.uid === userId)) {
            groups.push(group);
          }
        });
        return groups;
      })
    );
  }

  addMember(groupId: string, member: GroupMember): Observable<void> {
    const groupRef = doc(this.firestore, `groups/${groupId}`);
    return from(
      updateDoc(groupRef, {
        members: arrayUnion(member),
        updatedAt: new Date(),
      })
    ).pipe(
      switchMap(() => {
        const userRef = doc(this.firestore, `users/${member.uid}`);
        return from(
          updateDoc(userRef, {
            groups: arrayUnion(groupId),
          })
        );
      })
    );
  }

  removeMember(groupId: string, member: GroupMember): Observable<void> {
    const groupRef = doc(this.firestore, `groups/${groupId}`);
    return from(
      updateDoc(groupRef, {
        members: arrayRemove(member),
        updatedAt: new Date(),
      })
    ).pipe(
      switchMap(() => {
        const userRef = doc(this.firestore, `users/${member.uid}`);
        return from(
          updateDoc(userRef, {
            groups: arrayRemove(groupId),
          })
        );
      })
    );
  }

  updateGroup(groupId: string, updates: Partial<Group>): Observable<void> {
    const groupRef = doc(this.firestore, `groups/${groupId}`);
    return from(updateDoc(groupRef, { ...updates, updatedAt: new Date() }));
  }

  deleteGroup(groupId: string, members: GroupMember[]): Observable<void> {
    const groupRef = doc(this.firestore, `groups/${groupId}`);

    return from(deleteDoc(groupRef)).pipe(
      switchMap(() => {
        // Remove group from all members
        const updates = members.map((member) => {
          const userRef = doc(this.firestore, `users/${member.uid}`);
          return updateDoc(userRef, {
            groups: arrayRemove(groupId),
          });
        });
        return from(Promise.all(updates)).pipe(map(() => void 0));
      })
    );
  }
}
