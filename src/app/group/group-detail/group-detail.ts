import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { Expense } from '../../models/expense.model';
import { Group } from '../../models/group.model';
import { SimplifiedDebt, Settlement } from '../../models/settlement.model';
import { AuthService } from '../../services/auth.service';
import { ExpenseService } from '../../services/expense.service';
import { GroupService } from '../../services/group.service';
import { NotificationService } from '../../services/notification.service';
import { SettlementService } from '../../services/settlement.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { AddExpenseDialog } from '../add-expense-dialog/add-expense-dialog';
import { AddMemberDialog } from '../add-member-dialog/add-member-dialog';
import { SettleDebtDialog } from '../settle-debt-dialog/settle-debt-dialog';

@Component({
  selector: 'app-group-detail',
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
  ],
  templateUrl: './group-detail.html',
  styleUrl: './group-detail.scss',
})
export class GroupDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private groupService = inject(GroupService);
  private expenseService = inject(ExpenseService);
  private settlementService = inject(SettlementService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  group = signal<Group | null>(null);
  expenses = signal<Expense[]>([]);
  simplifiedDebts = signal<SimplifiedDebt[]>([]);
  settlements = signal<Settlement[]>([]);
  currentUserId = signal<string>('');
  groupId = '';

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id')!;

    this.authService.user$.subscribe((user) => {
      if (user) {
        this.currentUserId.set(user.uid);
        this.loadGroupData();
      }
    });
  }

  loadGroupData(): void {
    // Load group
    this.groupService.getGroup(this.groupId).subscribe((group) => {
      this.group.set(group);
    });

    // Load expenses
    this.expenseService.getGroupExpenses(this.groupId).subscribe((expenses) => {
      const expensesWithDates = expenses.map((expense) => {
        const createdAt = expense.createdAt as any;
        return {
          ...expense,
          createdAt: createdAt?.toDate ? createdAt.toDate() : new Date(createdAt),
        };
      });
      this.expenses.set(expensesWithDates);
    });

    // Load balances
    this.settlementService.getSimplifiedDebts(this.groupId).subscribe((debts) => {
      this.simplifiedDebts.set(debts);
    });

    // Load settlements
    this.settlementService.getGroupSettlements(this.groupId).subscribe((settlements) => {
      const settlementsWithDates = settlements.map((settlement) => {
        const settledAt = settlement.settledAt as any;
        return {
          ...settlement,
          settledAt: settledAt?.toDate ? settledAt.toDate() : new Date(settledAt),
        };
      });
      this.settlements.set(settlementsWithDates);
    });
  }

  isAdmin(): boolean {
    const group = this.group();
    return group ? group.adminId === this.currentUserId() : false;
  }

  openAddExpense(): void {
    const dialogRef = this.dialog.open(AddExpenseDialog, {
      width: '700px',
      data: { group: this.group() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadGroupData();
      }
    });
  }

  openAddMember(): void {
    const dialogRef = this.dialog.open(AddMemberDialog, {
      width: '500px',
      data: { group: this.group() },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadGroupData();
      }
    });
  }

  removeMember(member: any): void {
    if (confirm(`Remove ${member.displayName} from the group?`)) {
      this.groupService.removeMember(this.groupId, member).subscribe({
        next: () => {
          this.notificationService.showSuccess('Member removed successfully');
          this.loadGroupData();
        },
        error: (error) => {
          this.notificationService.showError('Failed to remove member');
          console.error('Error removing member:', error);
        },
      });
    }
  }

  settleDebt(debt: SimplifiedDebt): void {
    const dialogRef = this.dialog.open(SettleDebtDialog, {
      width: '500px',
      data: { debt, groupId: this.groupId },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadGroupData();
      }
    });
  }

  editGroup(): void {
    // Implement edit group functionality
    this.notificationService.showInfo('Edit group feature coming soon');
  }

  deleteGroup(): void {
    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      const group = this.group();
      if (group) {
        this.groupService.deleteGroup(this.groupId, group.members).subscribe({
          next: () => {
            this.notificationService.showSuccess('Group deleted successfully');
            this.router.navigate(['/groups']);
          },
          error: (error) => {
            this.notificationService.showError('Failed to delete group');
            console.error('Error deleting group:', error);
          },
        });
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/groups']);
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Food & Dining': 'restaurant',
      Transport: 'directions_car',
      Shopping: 'shopping_cart',
      Entertainment: 'movie',
      Utilities: 'bolt',
      Rent: 'home',
      Other: 'category',
    };
    return icons[category] || 'category';
  }
}
