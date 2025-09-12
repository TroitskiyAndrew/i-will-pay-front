import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomPaymentsComponent } from './room-payments.component';

describe('RoomPaymentsComponent', () => {
  let component: RoomPaymentsComponent;
  let fixture: ComponentFixture<RoomPaymentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomPaymentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomPaymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
