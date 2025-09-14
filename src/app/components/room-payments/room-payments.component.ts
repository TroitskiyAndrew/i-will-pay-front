import { Component, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { NEW_PAYMENT_ID } from '../../constants/constants';
import { IButton } from '../../models/models';
import { ButtonComponent } from "../button/button.component";
import { PaymentComponent } from "../payment/payment.component";

@Component({
  selector: 'app-room-payments',
  imports: [ ButtonComponent, PaymentComponent],
  templateUrl: './room-payments.component.html',
  styleUrl: './room-payments.component.scss'
})
export class RoomPaymentsComponent {
  showPayments = signal<boolean>(false);
  newPaymentId = NEW_PAYMENT_ID;

  expandButton: IButton = {
    icon: 'expand_more',
    action: () => this.showPayments.update(val => !val),
    valueFn: () => this.showPayments(),
    class: 'square border-less',
    statesMapFn: () => new Map([
      [true, { stateClass: '', icon: 'expand_less' }],
      [false, { stateClass: '', icon: 'expand_more' }],
    ]),
  }

  constructor(public stateService: StateService, private apiService: ApiService){}

  createMember(newMember: string){
    this.apiService.createMember(this.stateService.roomId(), newMember);
  }

  toggleMembers(){
    this.showPayments.update(val => !val)
  }

}
