import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GroupMember, Group } from '../../models/group.model';
import { AuthService } from '../../services/auth.service';
import { GroupService } from '../../services/group.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-create-group-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './create-group-dialog.html',
  styleUrl: './create-group-dialog.scss',
})
export class CreateGroupDialog {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateGroupDialog>);
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  loading = false;

  groupForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  onCreate(): void {
    if (this.groupForm.valid) {
      this.loading = true;

      this.authService.user$.subscribe((user) => {
        if (user) {
          const member: GroupMember = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || user.email!,
            addedAt: new Date(),
          };

          const group: Omit<Group, 'id'> = {
            name: this.groupForm.value.name,
            description: this.groupForm.value.description,
            adminId: user.uid,
            members: [member],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          this.groupService.createGroup(group).subscribe({
            next: () => {
              this.notificationService.showSuccess('Group created successfully!');
              this.dialogRef.close(true);
            },
            error: (error) => {
              this.loading = false;
              this.notificationService.showError('Failed to create group');
              console.error('Error creating group:', error);
            },
          });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
