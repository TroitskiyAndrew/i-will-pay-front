import { Component, computed, input } from '@angular/core';
import { StateService } from '../../services/state.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../services/api.service';
import { StateButtonComponent } from "../state-button/state-button.component";
import { IButton } from '../../models/models';
import { ButtonComponent } from "../button/button.component";

@Component({
  selector: 'app-member',
  imports: [CommonModule, MatIconModule, MatButtonModule, StateButtonComponent, ButtonComponent],
  templateUrl: './member.component.html',
  styleUrl: './member.component.scss'
})
export class MemberComponent {

  memberId = input('');
  member = computed(() => this.stateService.membersMap().get(this.memberId()));

  submissiveButton: IButton = {
    icon: 'add',
    action: () => {
      const member = this.member()!;
      const userId = this.stateService.user().id;
      if (member.payer === userId) {
        this.apiService.updateMember({ ...member, payer: member.userId })
      } else {
        const memberId = member.userId;
        const currentUser = this.stateService.user()
        const membersToChange = this.stateService.members().filter(member => member.userId === memberId || member.payer === memberId);
        membersToChange.forEach(member => {
          this.apiService.updateMember({ ...member, payer: currentUser.id })
        })
      }

    },
    show: computed(() => this.member()?.userId !== this.stateService.user().id),
    class: 'square',
    statesMapFn: () => new Map([
      [true, { stateClass: 'black', icon: 'group_remove' }],
      [false, { stateClass: 'black', icon: 'group_add' }],
    ]),
  }

  createLinkButton: IButton = {
    icon: 'link',
    action: async () => navigator.clipboard.writeText(`${this.stateService.appLink}?startapp=userId=${this.member()?.userId}`),
    showFn: ()=> this.stateService.usersMap.get(this.member()!.userId)?.telegramId == null,
    class: 'square'
  }

  constructor(public stateService: StateService, private apiService: ApiService) { }

  payFor() {
    const memberId = this.member()?.userId;
    const currentUser = this.stateService.user()
    const membersToChange = this.stateService.members().filter(member => member.userId === memberId || member.payer === memberId);
    membersToChange.forEach(member => {
      this.apiService.updateMember({ ...member, payer: currentUser.id })
    })
  }

  stopPayingFor() {
    const member = this.member()!
    this.apiService.updateMember({ ...member, payer: member.userId })
  }



}
