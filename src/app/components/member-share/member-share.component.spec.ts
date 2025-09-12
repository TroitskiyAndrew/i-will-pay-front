import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberShareComponent } from './member-share.component';

describe('MemberShareComponent', () => {
  let component: MemberShareComponent;
  let fixture: ComponentFixture<MemberShareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberShareComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemberShareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
