import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomButtonComponent } from './room-button.component';

describe('RoomButtonComponent', () => {
  let component: RoomButtonComponent;
  let fixture: ComponentFixture<RoomButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
