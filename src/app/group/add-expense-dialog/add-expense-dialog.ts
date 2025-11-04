import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  ExpenseCategory,
  SplitType,
  Payer,
  Beneficiary,
  Expense,
} from '../../models/expense.model';
import { Group } from '../../models/group.model';
import { AuthService } from '../../services/auth.service';
import { ExpenseService } from '../../services/expense.service';
import { NotificationService } from '../../services/notification.service';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-expense-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatRadioModule,
  ],
  templateUrl: './add-expense-dialog.html',
  styleUrl: './add-expense-dialog.scss',
})
export class AddExpenseDialog {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddExpenseDialog>);
  private expenseService = inject(ExpenseService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  data: { group: Group } = inject(MAT_DIALOG_DATA);

  group!: Group;
  loading = false;
  selectedFile = signal<File | null>(null);
  categories = Object.values(ExpenseCategory);

  expenseForm!: FormGroup;

  ngOnInit(): void {
    this.group = this.data.group;
    this.initForm();
  }

  initForm(): void {
    this.expenseForm = this.fb.group({
      description: ['', Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
      category: [ExpenseCategory.OTHER, Validators.required],
      splitType: [SplitType.EQUAL, Validators.required],
      payers: this.fb.array(
        this.group.members.map((member) =>
          this.fb.group({
            uid: [member.uid],
            displayName: [member.displayName],
            selected: [false],
            amount: [0],
          })
        )
      ),
      beneficiaries: this.fb.array(
        this.group.members.map((member) =>
          this.fb.group({
            uid: [member.uid],
            displayName: [member.displayName],
            selected: [true],
            amount: [0],
            percentage: [0],
            shares: [1],
          })
        )
      ),
    });

    // Select all beneficiaries by default
    this.onBeneficiaryChange();
  }

  get payersArray(): FormArray {
    return this.expenseForm.get('payers') as FormArray;
  }

  get beneficiariesArray(): FormArray {
    return this.expenseForm.get('beneficiaries') as FormArray;
  }

  onPayerChange(index: number): void {
    const payer = this.payersArray.at(index);
    if (!payer.get('selected')?.value) {
      payer.get('amount')?.setValue(0);
    }
  }

  onBeneficiaryChange(): void {
    const splitType = this.expenseForm.get('splitType')?.value;
    if (splitType === SplitType.EQUAL) {
      this.calculateEqualSplit();
    }
  }

  calculateEqualSplit(): void {
    const totalAmount = this.expenseForm.get('totalAmount')?.value || 0;
    const selectedBeneficiaries = this.beneficiariesArray.controls.filter(
      (b) => b.get('selected')?.value
    );

    if (selectedBeneficiaries.length > 0) {
      const amount = totalAmount / selectedBeneficiaries.length;
      selectedBeneficiaries.forEach((b) => {
        b.get('amount')?.setValue(amount);
      });
    }
  }

  getEqualSplitAmount(): number {
    const totalAmount = this.expenseForm.get('totalAmount')?.value || 0;
    const selectedBeneficiaries = this.beneficiariesArray.controls.filter(
      (b) => b.get('selected')?.value
    ).length;

    return selectedBeneficiaries > 0 ? totalAmount / selectedBeneficiaries : 0;
  }

  calculateFromPercentage(index: number): void {
    const totalAmount = this.expenseForm.get('totalAmount')?.value || 0;
    const beneficiary = this.beneficiariesArray.at(index);
    const percentage = beneficiary.get('percentage')?.value || 0;
    const amount = (totalAmount * percentage) / 100;
    beneficiary.get('amount')?.setValue(amount);
  }

  calculateFromShares(): void {
    const totalAmount = this.expenseForm.get('totalAmount')?.value || 0;
    const totalShares = this.beneficiariesArray.controls
      .filter((b) => b.get('selected')?.value)
      .reduce((sum, b) => sum + (b.get('shares')?.value || 0), 0);

    this.beneficiariesArray.controls.forEach((b) => {
      if (b.get('selected')?.value) {
        const shares = b.get('shares')?.value || 0;
        const amount = totalShares > 0 ? (totalAmount * shares) / totalShares : 0;
        b.get('amount')?.setValue(amount);
      }
    });
  }

  getTotalPaid(): number {
    return this.payersArray.controls
      .filter((p) => p.get('selected')?.value)
      .reduce((sum, p) => sum + (p.get('amount')?.value || 0), 0);
  }

  isExactSplitValid(): boolean {
    const totalAmount = this.expenseForm.get('totalAmount')?.value || 0;
    const splitTotal = this.beneficiariesArray.controls
      .filter((b) => b.get('selected')?.value)
      .reduce((sum, b) => sum + (b.get('amount')?.value || 0), 0);
    return Math.abs(totalAmount - splitTotal) < 0.01;
  }

  isPercentageValid(): boolean {
    const totalPercentage = this.beneficiariesArray.controls
      .filter((b) => b.get('selected')?.value)
      .reduce((sum, b) => sum + (b.get('percentage')?.value || 0), 0);
    return Math.abs(totalPercentage - 100) < 0.01;
  }

  isFormValid(): boolean {
    const basicValid = this.expenseForm.valid;
    const paidValid = this.getTotalPaid() === this.expenseForm.get('totalAmount')?.value;
    const splitType = this.expenseForm.get('splitType')?.value;

    let splitValid = true;
    if (splitType === SplitType.EXACT) {
      splitValid = this.isExactSplitValid();
    } else if (splitType === SplitType.PERCENTAGE) {
      splitValid = this.isPercentageValid();
    }

    return basicValid && paidValid && splitValid;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.isFormValid()) {
      this.loading = true;

      try {
        let receiptUrl = '';

        // Upload receipt if selected
        if (this.selectedFile()) {
          // receiptUrl = await this.expenseService
          //   .uploadReceipt(this.selectedFile()!, this.group.id!)
          //   .toPromise();
          receiptUrl = '';
        }

        // Prepare expense data
        const payers: Payer[] = this.payersArray.controls
          .filter((p) => p.get('selected')?.value)
          .map((p) => ({
            uid: p.get('uid')?.value,
            displayName: p.get('displayName')?.value,
            amount: p.get('amount')?.value,
          }));
        console.log(payers, 'payer');

        const beneficiaries: Beneficiary[] = this.beneficiariesArray.controls
          .filter((b) => b.get('selected')?.value)
          .map((b) => ({
            uid: b.get('uid')?.value,
            displayName: b.get('displayName')?.value,
            amount: b.get('amount')?.value,
            percentage: b.get('percentage')?.value,
            shares: b.get('shares')?.value,
          }));
        console.log(beneficiaries, 'baneficiaries');

        console.log(this.authService.user$, 'current User');
        const currentUser = await firstValueFrom(this.authService.user$);
        console.log(currentUser, 'current User');
        const expense: Omit<Expense, 'id'> = {
          groupId: this.group.id!,
          description: this.expenseForm.get('description')?.value,
          totalAmount: this.expenseForm.get('totalAmount')?.value,
          category: this.expenseForm.get('category')?.value,
          payers,
          beneficiaries,
          splitType: this.expenseForm.get('splitType')?.value,
          receiptUrl,
          createdBy: currentUser?.uid || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        console.log(expense);

        this.expenseService.addExpense(expense).subscribe({
          next: () => {
            this.notificationService.showSuccess('Expense added successfully!');
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.loading = false;
            this.notificationService.showError('Failed to add expense');
            console.error('Error adding expense:', error);
          },
        });
      } catch (error) {
        this.loading = false;
        this.notificationService.showError('Failed to upload receipt');
        console.error('Error uploading receipt:', error);
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
