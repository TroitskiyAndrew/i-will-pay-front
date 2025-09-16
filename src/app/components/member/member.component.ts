import { Component, computed, input } from '@angular/core';
import { StateService } from '../../services/state.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../services/api.service';
import { StateButtonComponent } from "../state-button/state-button.component";
import { IButton, IMember } from '../../models/models';
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
  userMember = computed(() => this.stateService.membersMapByUser().get(this.stateService.user().id));
  submissiveAction = computed(() => {
    const member = this.member();
    const userMember = this.userMember();
    return userMember?.payer === member?.userId ? false : member?.payer !== userMember?.userId
  })

  submissiveButton: IButton = {
    icon: 'add',
    action: () => {
      let member = this.member()!;
      const userMember = this.userMember()!;
      const membersToChange: IMember[] = []
      if (userMember.payer === member.userId) {
        userMember.payer = userMember.userId;
        membersToChange.push(userMember)
      } else {
        if (member.payer === userMember.userId) {
          member.payer = member.userId;
          membersToChange.push(member)
        } else {
          const memberId = member.userId;
          const members = this.stateService.members().filter(member => member.userId === memberId || member.payer === memberId);
          members.forEach( member => {
            member.payer = userMember.userId;
            membersToChange.push(member);
          })
        }
      }
      membersToChange.forEach(member => {
        this.apiService.updateMember(member)
      })
    },
    show: computed(() => this.member()?.userId !== this.stateService.user().id),
    class: 'square',
    statesMapFn: () => new Map([
      [false, { stateClass: 'black', icon: 'group_off' }],
      [true, { stateClass: 'black', icon: 'group' }],
    ]),
  }

  createLinkButton: IButton = {
    icon: 'link',
    action: async () => navigator.clipboard.writeText(`${this.stateService.appLink}?startapp=userId=${this.member()?.userId}`),
    show: computed(() => this.stateService.usersMap.get(this.member()!.userId)?.telegramId == null),
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
