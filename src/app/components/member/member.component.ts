import { Component, computed, input } from '@angular/core';
import { StateService } from '../../services/state.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-member',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './member.component.html',
  styleUrl: './member.component.scss'
})
export class MemberComponent {

  memberId = input('');
  member = computed(() => this.stateService.membersMap().get(this.memberId()));

  constructor(public stateService: StateService, private apiService: ApiService){}

  payFor(){
    const memberId = this.member()?.userId;
    const currentUser = this.stateService.user()
    const membersToChange = this.stateService.members().filter(member => member.userId === memberId || member.payer === memberId);
    membersToChange.forEach(member => {
      this.apiService.updateMember({...member, payer: currentUser.id})
    })
  }

  stopPayingFor(){
    const member = this.member()!
    this.apiService.updateMember({...member, payer: member.userId})
  }
}
