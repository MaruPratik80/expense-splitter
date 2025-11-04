import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Group, GroupMember } from '../../models/group.model';
import { AuthService } from '../../services/auth.service';
import { GroupService } from '../../services/group.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-add-member-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './add-member-dialog.html',
  styleUrl: './add-member-dialog.scss',
})
export class AddMemberDialog {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddMemberDialog>);
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  data: { group: Group } = inject(MAT_DIALOG_DATA);

  loading = false;
  errorMessage = '';

  memberForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onAdd(): void {
    if (this.memberForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      
      const email = this.memberForm.value.email.toLowerCase();
      
      // Check if member already exists
      const existingMember = this.data.group.members.find(
        m => m.email.toLowerCase() === email
      );
      
      if (existingMember) {
        this.loading = false;
        this.errorMessage = 'This user is already a member of the group';
        return;
      }

      // Search for user
      this.authService.searchUserByEmail(email).subscribe({
        next: (user) => {
          if (user) {
            const member: GroupMember = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              addedAt: new Date()
            };

            this.groupService.addMember(this.data.group.id!, member).subscribe({
              next: () => {
                this.notificationService.showSuccess('Member added successfully!');
                this.dialogRef.close(true);
              },
              error: (error) => {
                this.loading = false;
                this.notificationService.showError('Failed to add member');
                console.error('Error adding member:', error);
              }
            });
          } else {
            this.loading = false;
            this.errorMessage = 'User not found. Please ensure they have registered.';
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Error searching for user';
          console.error('Error searching user:', error);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
