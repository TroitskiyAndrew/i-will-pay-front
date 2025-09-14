import { Component, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { MemberComponent } from "../member/member.component";
import { NewItemComponent } from "../new-item/new-item.component";
import { IButton } from '../../models/models';
import { ButtonComponent } from "../button/button.component";
import { StateButtonComponent } from "../state-button/state-button.component";

@Component({
  selector: 'app-room-members',
  imports: [MemberComponent, NewItemComponent,  StateButtonComponent],
  templateUrl: './room-members.component.html',
  styleUrl: './room-members.component.scss'
})
export class RoomMembersComponent {
  showMembers = signal<boolean>(false);

  expandButton: IButton = {
    icon: 'expand_more',
    action: () => this.showMembers.update(val => !val),
    valueFn: () => this.showMembers(),
    class: 'square border-less',
    statesMapFn: () => new Map([
      [true, { stateClass: '', icon: 'keyboard_arrow_down' }],
      [false, { stateClass: '', icon: 'keyboard_arrow_left' }],
    ]),
  }

  constructor(public stateService: StateService, private apiService: ApiService) { }

  createMember(newMember: string) {
    this.apiService.createMember(this.stateService.roomId(), newMember);
  }

  toggleMembers() {
    this.showMembers.update(val => !val)
  }

}
