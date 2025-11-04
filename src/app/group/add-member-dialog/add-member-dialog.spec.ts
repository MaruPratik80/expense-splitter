import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMemberDialog } from './add-member-dialog';

describe('AddMemberDialog', () => {
  let component: AddMemberDialog;
  let fixture: ComponentFixture<AddMemberDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMemberDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddMemberDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
