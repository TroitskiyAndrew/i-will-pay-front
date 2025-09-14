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

@Component({
  selector: 'app-root',
  imports: [RoomMembersComponent, UserRoomsComponent, RoomPaymentsComponent, ButtonComponent, PaymentComponent, HeaderComponent, UpdateItemComponent],
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
    content: 'Я плачу',
    action: () => this.stateService.createPaymentMode.set(true),
    class: '',
  }
  editGroupNameBUtton: IButton = {
    icon: 'edit',
    action: () => this.editGroupNameMode.set(true),
    show: computed(() => !this.stateService.membersMapByUser().get(this.stateService.user().id)?.isGuest),
    class: 'square border-less .black-content'
  }

  constructor(public stateService: StateService, public errorService: ErrorService, private apiService: ApiService){
    this.stateService.init()
  }

  editGroupName(name: string){
    if(!name){
      this.editGroupNameMode.set(false);
      return
    }
    const room = this.stateService.currentRoom()!;
    this.editGroupNameMode.set(false);
    this.apiService.updateRoom({...room, name})
  }
}
