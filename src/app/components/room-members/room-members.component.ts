import { Component, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { MemberComponent } from "../member/member.component";
import { NewItemComponent } from "../new-item/new-item.component";

@Component({
  selector: 'app-room-members',
  imports: [MemberComponent, NewItemComponent],
  templateUrl: './room-members.component.html',
  styleUrl: './room-members.component.scss'
})
export class RoomMembersComponent {
  showMembers = signal<boolean>(false)

  constructor(public stateService: StateService, private apiService: ApiService){}

  createMember(newMember: string){
    this.apiService.createMember(this.stateService.roomId(), newMember);
  }

  toggleMembers(){
    this.showMembers.update(val => !val)
  }

}
