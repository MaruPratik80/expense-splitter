import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddExpenseDialog } from './add-expense-dialog';

describe('AddExpenseDialog', () => {
  let component: AddExpenseDialog;
  let fixture: ComponentFixture<AddExpenseDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddExpenseDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddExpenseDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
