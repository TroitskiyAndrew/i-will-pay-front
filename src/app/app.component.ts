import { Component, signal } from '@angular/core';
import { StateService } from './services/state.service';
import { UserRoomsComponent } from "./components/user-rooms/user-rooms.component";
import { RoomMembersComponent } from './components/room-members/room-members.component';
import { RoomPaymentsComponent } from "./components/room-payments/room-payments.component";
import { PaymentComponent } from "./components/payment/payment.component";
import { PaymentButtonComponent } from "./components/payment-button/payment-button.component";
import { ErrorService } from './services/error.service';

@Component({
  selector: 'app-root',
  imports: [RoomMembersComponent, UserRoomsComponent, RoomPaymentsComponent, PaymentButtonComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  window = Object.keys(window);
  showMembers = signal(false)

  constructor(public stateService: StateService, public errorService: ErrorService){
    this.stateService.init()
  }

  goBack(){
    this.showMembers.set(false)
    this.stateService.roomId.set('')
  }
}
