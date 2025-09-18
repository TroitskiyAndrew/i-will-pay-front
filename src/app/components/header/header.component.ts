import { Component, computed, signal } from '@angular/core';
import { StateService } from '../../services/state.service';
import { ButtonComponent } from "../button/button.component";
import { IButton, IRoomState } from '../../models/models';
import { CommonModule } from '@angular/common';
import { UpdateItemComponent } from "../update-item/update-item.component";
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-header',
  imports: [ButtonComponent, CommonModule, UpdateItemComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  state = computed(() => this.stateService.totalState());
  unchecked = computed(() => this.state().unchecked || false);
  hasUnsharedPayment = computed(() => this.state().hasUnsharedPayment || false);
  balance = computed(() => this.state().balance);
  name = computed(() => this.stateService.currentRoom() ? this.stateService.membersMapByUser().get(this.stateService.user().id)?.name : this.stateService.user().name)
  editNameMode = signal(false);
  editNameButton: IButton = {
    icon: 'edit',
    action: () => this.editNameMode.set(true),
    class: 'square border-less white-content'
  }

  warningButton: IButton = {
    icon: 'question_mark',
    action: () => { },
    class: 'square square--small border-less stroke-content yellow-content',
    show: computed(() => this.unchecked()),
    disabled: signal(true),
  }
  errorButton: IButton = {
    icon: 'error_outline',
    action: () => { },
    show: computed(() => this.hasUnsharedPayment()),
    class: 'square square--small border-less red-content',
    disabled: signal(true),
  }
  homeButton: IButton = {
    icon: 'person',
    action: () => this.stateService.roomId.set(''),
    class: 'square square--small border-less white-content',
    disabled: signal(false),
  }

  constructor(public stateService: StateService, public apiService: ApiService) { }

  editName(name: string | number) {
    if (!name || typeof name === 'number') {
      this.editNameMode.set(false);
      return
    }
    const room = this.stateService.currentRoom()!;
    const user = this.stateService.user();
    this.editNameMode.set(false);
    if(room) {
      const member = this.stateService.membersMapByUser().get(user.id)!
      this.apiService.updateMember({ ...member, name })
    } else {
      this.apiService.updateUser({ ...user, name })
    }
  }

}
