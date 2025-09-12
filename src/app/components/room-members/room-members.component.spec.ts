import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomMembersComponent } from './room-members.component';

describe('RoomMembersComponent', () => {
  let component: RoomMembersComponent;
  let fixture: ComponentFixture<RoomMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomMembersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
