import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './../services/auth.service';
import { GroupService } from './../services/group.service';
import { ExpenseService } from './../services/expense.service';
import { StorageService } from './../services/storage.service';
import { Group } from './../models/group.model';
import { Expense } from './../models/expense.model';
import { Balance, SettlementSuggestion } from './../models/settlement.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private groupService = inject(GroupService);
  private expenseService = inject(ExpenseService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  user$ = this.authService.user$;
  groups: Group[] = [];
  selectedGroup: Group | null = null;
  expenses: Expense[] = [];
  balances: Balance = {};
  settlementSuggestions: SettlementSuggestion[] = [];

  showModal = false;
  modalType: 'group' | 'expense' = 'group';

  // Group form
  groupName = '';
  groupMembers = [''];

  // Expense form
  expenseName = '';
  expenseAmount: number | null = null;
  expenseCategory = 'Food';
  expensePayer = '';
  splitType: 'equal' | 'percentage' | 'exact' | 'shares' = 'equal';
  splitData: { [key: string]: number } = {};
  receiptFile: File | null = null;
  receiptPreview: string | null = null;

  categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Travel', 'Other'];

  splitTypes: {
    value: 'equal' | 'percentage' | 'exact' | 'shares';
    label: string;
    icon: string;
  }[] = [
    {
      value: 'equal',
      label: 'Equal',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      value: 'percentage',
      label: 'Percent',
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    },
    { value: 'exact', label: 'Exact', icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14' },
    {
      value: 'shares',
      label: 'Shares',
      icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z',
    },
  ];

  ngOnInit() {
    this.user$.subscribe((user) => {
      if (user) {
        this.loadGroups(user.uid);
      }
    });
  }

  loadGroups(userId: string) {
    this.groupService.getUserGroups(userId).subscribe((groups) => {
      this.groups = groups;
    });
  }

  selectGroup(group: Group) {
    this.selectedGroup = group;
    this.loadExpenses(group.id);
  }

  loadExpenses(groupId: string) {
    this.expenseService.getGroupExpenses(groupId).subscribe((expenses) => {
      this.expenses = expenses;
      this.calculateBalancesAndSuggestions();
    });
  }

  calculateBalancesAndSuggestions() {
    if (this.selectedGroup) {
      this.balances = this.expenseService.calculateBalances(
        this.expenses,
        this.selectedGroup.members
      );
      this.settlementSuggestions = this.expenseService.generateSettlementSuggestions(this.balances);
    }
  }

  openModal(type: 'group' | 'expense') {
    this.modalType = type;
    this.showModal = true;
    if (type === 'expense' && this.selectedGroup) {
      this.initializeSplitData();
    }
  }

  closeModal() {
    this.showModal = false;
    this.resetForms();
  }

  resetForms() {
    this.groupName = '';
    this.groupMembers = [''];
    this.expenseName = '';
    this.expenseAmount = null;
    this.expenseCategory = 'Food';
    this.expensePayer = '';
    this.splitType = 'equal';
    this.splitData = {};
    this.receiptFile = null;
    this.receiptPreview = null;
  }

  addMember() {
    this.groupMembers.push('');
  }

  removeMember(index: number) {
    this.groupMembers.splice(index, 1);
  }

  async handleCreateGroup() {
    if (!this.groupName || this.groupMembers.filter((m) => m.trim()).length === 0) {
      alert('Please fill all required fields');
      return;
    }

    this.user$.subscribe(async (user) => {
      if (user) {
        await this.groupService.createGroup({
          name: this.groupName,
          members: this.groupMembers.filter((m) => m.trim()),
          createdBy: user.uid,
          createdAt: new Date(),
        });
        this.closeModal();
      }
    });
  }

  initializeSplitData() {
    this.splitData = {};
    this.selectedGroup?.members.forEach((member) => {
      this.splitData[member] = 0;
    });
  }

  setSplitType(type: 'equal' | 'percentage' | 'exact' | 'shares') {
    this.splitType = type;
    this.initializeSplitData();
  }

  getSplitTypeLabel(): string {
    switch (this.splitType) {
      case 'percentage':
        return 'Enter percentages for each member';
      case 'exact':
        return 'Enter exact amounts for each member';
      case 'shares':
        return 'Enter shares for each member';
      default:
        return '';
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.receiptFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.receiptPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeReceipt() {
    this.receiptFile = null;
    this.receiptPreview = null;
  }

  async handleAddExpense() {
    if (!this.expenseName || !this.expenseAmount || !this.expensePayer || !this.selectedGroup) {
      alert('Please fill all required fields');
      return;
    }

    let receiptUrl: string | undefined = '';
    if (this.receiptFile) {
      receiptUrl = await this.storageService.uploadReceipt(this.receiptFile, Date.now().toString());
    }

    await this.expenseService.createExpense({
      groupId: this.selectedGroup.id,
      name: this.expenseName,
      amount: this.expenseAmount,
      category: this.expenseCategory,
      payer: this.expensePayer,
      splitType: this.splitType,
      splitData: this.splitType !== 'equal' ? this.splitData : undefined,
      beneficiaries: this.selectedGroup.members,
      date: new Date(),
      settled: false,
      receiptImageUrl: receiptUrl,
    });

    this.closeModal();
  }

  async handleSettleDebt(settlement: SettlementSuggestion) {
    // Mark related expenses as settled
    // In a real app, you'd track settlements separately
    alert(
      `Settlement recorded: ${settlement.from} pays ${settlement.to} ${settlement.amount.toFixed(
        2
      )}`
    );
    this.calculateBalancesAndSuggestions();
  }

  async handleLogout() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}
