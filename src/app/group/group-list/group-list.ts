import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Group } from '../../models/group.model';
import { AuthService } from '../../services/auth.service';
import { GroupService } from '../../services/group.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateGroupDialog } from '../create-group-dialog/create-group-dialog';

@Component({
  selector: 'app-group-list',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './group-list.html',
  styleUrl: './group-list.scss',
})
export class GroupList {
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  groups = signal<Group[]>([]);
  loading = signal(true);
  currentUserId = signal<string>('');

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.currentUserId.set(user.uid);
        this.loadGroups(user.uid);
      }
    });
  }

  loadGroups(userId: string): void {
    this.loading.set(true);
    this.groupService.getUserGroups(userId).subscribe({
      next: (groups) => {
        this.groups.set(groups);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading groups:', error);
        this.loading.set(false);
      },
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateGroupDialog, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadGroups(this.currentUserId());
      }
    });
  }

  navigateToGroup(groupId: string): void {
    this.router.navigate(['/groups', groupId]);
  }
}
