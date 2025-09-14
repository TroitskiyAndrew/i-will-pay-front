import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomDebtsComponent } from './room-debts.component';

describe('RoomDebtsComponent', () => {
  let component: RoomDebtsComponent;
  let fixture: ComponentFixture<RoomDebtsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomDebtsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomDebtsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
