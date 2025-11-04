export interface Group {
  id?: string;
  name: string;
  description: string;
  adminId: string;
  members: GroupMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  uid: string;
  email: string;
  displayName: string;
  addedAt: Date;
}
