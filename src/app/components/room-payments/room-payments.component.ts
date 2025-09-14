import { Component, computed, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { NEW_PAYMENT_ID } from '../../constants/constants';
import { IButton } from '../../models/models';
import { ButtonComponent } from "../button/button.component";
import { PaymentComponent } from "../payment/payment.component";
import { StateButtonComponent } from "../state-button/state-button.component";
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-room-payments',
  imports: [ButtonComponent, PaymentComponent, StateButtonComponent, CommonModule],
  templateUrl: './room-payments.component.html',
  styleUrl: './room-payments.component.scss'
})
export class RoomPaymentsComponent {

  newPaymentId = NEW_PAYMENT_ID;

  expandButton: IButton = {
    icon: 'expand_more',
    action: () => this.stateService.showPayments.update(val => !val),
    valueFn: () => this.stateService.showPayments(),
    class: 'square border-less',
    statesMapFn: () => new Map([
      [true, { stateClass: '', icon: 'keyboard_arrow_down' }],
      [false, { stateClass: '', icon: 'keyboard_arrow_left' }],
    ]),
  }

  warningButton: IButton = {
    icon: 'question_mark',
    action: () => {},
    class: 'square square--small border-less stroke-content yellow-content',
    show: computed(() => this.stateService.roomStatesMap().get(this.stateService.roomId())?.unchecked || false),
    disabled: signal(true),
  }
  errorButton: IButton = {
    icon: 'error_outline',
    action: () => {},
    show: computed(() => this.stateService.roomStatesMap().get(this.stateService.roomId())?.hasUnsharedPayment || false),
    class: 'square square--small border-less red-content',
    disabled: signal(true),
  }

  constructor(public stateService: StateService, private apiService: ApiService){}

  createMember(newMember: string){
    this.apiService.createMember(this.stateService.roomId(), newMember);
  }

  toggleMembers(){
    this.stateService.showPayments.update(val => !val)
  }

}
