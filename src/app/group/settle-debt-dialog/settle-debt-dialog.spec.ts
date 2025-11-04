import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettleDebtDialog } from './settle-debt-dialog';

describe('SettleDebtDialog', () => {
  let component: SettleDebtDialog;
  let fixture: ComponentFixture<SettleDebtDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettleDebtDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettleDebtDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
