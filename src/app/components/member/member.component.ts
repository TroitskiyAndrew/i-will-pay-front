import { Component, computed, input, signal } from '@angular/core';
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
  });
  submissiveQuestion = computed(() => {
    const member = this.member();
    const userMember = this.userMember();
    if(userMember?.payer === member?.userId){
      return 'перестанет платить за меня'
    }
    return member?.payer !== userMember?.userId ? `платить за ${member?.name}?` : `перестать платить за ${member?.name}?`
  });
  editSubmissive = signal(false)

  submissiveButton: IButton = {
    icon: 'add',
    action: () => this.editSubmissive.set(true),
    show: computed(() => this.member()?.userId !== this.stateService.user().id),
    class: 'square',
    statesMapFn: () => new Map([
      [false, { stateClass: 'black', icon: 'group_off' }],
      [true, { stateClass: 'black', icon: 'group' }],
    ]),
  }

  acceptSubmissiveButton : IButton = {
    icon: 'check',
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
      this.editSubmissive.set(false)
    },
    class: 'square square--small',
  }
  declineSubmissiveButton : IButton = {
    icon: 'cancel',
    action: () => this.editSubmissive.set(false),
    class: 'square square--small',
  }

  createLinkButton: IButton = {
    icon: 'link',
    action: async () => navigator.clipboard.writeText(`${this.stateService.appLink}?startapp=userId=${this.member()?.userId}`),
    class: 'square'
  }
  showLink = computed(() => {
    const usersMap = this.stateService.usersMap();
    const user = usersMap.get(this.member()?.userId || '');
  return user != null && user.telegramId == null
  })

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
