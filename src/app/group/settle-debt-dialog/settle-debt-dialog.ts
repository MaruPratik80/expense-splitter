import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SimplifiedDebt, Settlement } from '../../models/settlement.model';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { SettlementService } from '../../services/settlement.service';

@Component({
  selector: 'app-settle-debt-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './settle-debt-dialog.html',
  styleUrl: './settle-debt-dialog.scss',
})
export class SettleDebtDialog {
  private dialogRef = inject(MatDialogRef<SettleDebtDialog>);
  private settlementService = inject(SettlementService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  data: { debt: SimplifiedDebt; groupId: string } = inject(MAT_DIALOG_DATA);

  loading = false;

  onSettle(): void {
    this.loading = true;

    this.authService.user$.subscribe((user) => {
      if (user) {
        const settlement: Omit<Settlement, 'id'> = {
          groupId: this.data.groupId,
          fromUser: this.data.debt.from,
          fromUserName: this.data.debt.fromName,
          toUser: this.data.debt.to,
          toUserName: this.data.debt.toName,
          amount: this.data.debt.amount,
          settledAt: new Date(),
          settledBy: user.uid,
        };

        this.settlementService.addSettlement(settlement).subscribe({
          next: () => {
            this.notificationService.showSuccess('Debt marked as settled!');
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.loading = false;
            this.notificationService.showError('Failed to settle debt');
            console.error('Error settling debt:', error);
          },
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
