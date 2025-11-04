export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
}

export interface UserProfile extends User {
  groups: string[];
}
