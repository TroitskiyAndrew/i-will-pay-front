import { Component, computed, signal } from '@angular/core';
import { StateService } from './services/state.service';
import { UserRoomsComponent } from "./components/user-rooms/user-rooms.component";
import { RoomMembersComponent } from './components/room-members/room-members.component';
import { RoomPaymentsComponent } from "./components/room-payments/room-payments.component";
import { PaymentComponent } from "./components/payment/payment.component";
import { ErrorService } from './services/error.service';
import { IButton } from './models/models';
import { ButtonComponent } from "./components/button/button.component";
import { HeaderComponent } from "./components/header/header.component";
import { NewItemComponent } from "./components/new-item/new-item.component";
import { UpdateItemComponent } from "./components/update-item/update-item.component";
import { ApiService } from './services/api.service';
import { RoomDebtsComponent } from "./components/room-debts/room-debts.component";
import { Clipboard } from '@angular/cdk/clipboard';
import { NEW_PAYMENT_ID } from './constants/constants';
import { StateButtonComponent } from "./components/state-button/state-button.component";

@Component({
  selector: 'app-root',
  imports: [RoomMembersComponent, UserRoomsComponent, RoomPaymentsComponent, ButtonComponent, PaymentComponent, HeaderComponent, UpdateItemComponent, RoomDebtsComponent, StateButtonComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  editGroupNameMode = signal(false);

  errorButton: IButton = {
    icon: 'check',
    action: () => this.errorService.hideError(),
    class: 'square'
  }
  createButton: IButton = {
    icon: '',
    content: 'Новый платеж',
    action: () => this.stateService.editPaymentId.set(NEW_PAYMENT_ID),
    class: '',
  }
  editGroupNameBUtton: IButton = {
    icon: 'edit',
    action: () => this.editGroupNameMode.set(true),
    show: computed(() => !this.stateService.membersMapByUser().get(this.stateService.user().id)?.isGuest),
    class: 'square'
  }
  createLinkButton: IButton = {
    icon: 'link',
    action: async () => navigator.clipboard.writeText(this.stateService.roomLink()),
    class: 'square'
  }
  muteValue = computed(() => {
    return this.stateService.membersMapByUser().get(this.stateService.user().id)?.mute || false
  })
  muteButton: IButton = {
    icon: 'link',
    action: () => {
      const member = this.stateService.membersMapByUser().get(this.stateService.user().id);
      if(member) {
        member.mute = !member.mute;
        this.apiService.updateMember(member)
      }
    },
    class: 'square',
    statesMapFn: () => new Map([
      [true, { stateClass: 'black white-content', icon: 'volume_mute' }],
      [false, { stateClass: 'black white-content', icon: 'volume_up' }],
    ]),
  }


  constructor(public stateService: StateService, public errorService: ErrorService, private apiService: ApiService, public clipboard: Clipboard){
    this.stateService.init()
  }

  editGroupName(name: string | number){
    if(!name || typeof name === 'number'){
      this.editGroupNameMode.set(false);
      return
    }
    const room = this.stateService.currentRoom()!;
    this.editGroupNameMode.set(false);
    this.apiService.updateRoom({...room, name})
  }
}
