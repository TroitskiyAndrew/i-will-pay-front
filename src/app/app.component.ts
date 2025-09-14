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

@Component({
  selector: 'app-root',
  imports: [RoomMembersComponent, UserRoomsComponent, RoomPaymentsComponent, ButtonComponent, PaymentComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
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

  constructor(public stateService: StateService, public errorService: ErrorService){
    this.stateService.init()
  }
}
