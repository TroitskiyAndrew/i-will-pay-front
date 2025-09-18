import { Component, computed, effect, signal } from '@angular/core';
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
  imports: [ PaymentComponent, StateButtonComponent, CommonModule],
  templateUrl: './room-payments.component.html',
  styleUrl: './room-payments.component.scss'
})
export class RoomPaymentsComponent {

  filterByWarnings = signal(false);
  filterByErrors = signal(false);

  newPaymentId = NEW_PAYMENT_ID;

  expandButton: IButton = {
    icon: 'expand_more',
    action: () => {},
    class: 'square border-less',
    statesMapFn: () => new Map([
      [true, { stateClass: '', icon: 'keyboard_arrow_down' }],
      [false, { stateClass: '', icon: 'keyboard_arrow_left' }],
    ]),
  }
  showWarning = computed(() => this.stateService.roomStatesMap().get(this.stateService.roomId())?.unchecked || false)
  warningButton: IButton = {
    icon: 'question_mark',
    action: () => {
      if(this.stateService.showPayments()){
        this.filterByWarnings.update(val => !val)
      }
    },
    class: 'square square--small border-less stroke-content',
    show: this.showWarning,
    disabled: signal(false),
    statesMapFn: () => new Map([
      [false, { stateClass: 'black-content', icon: 'question_mark' }],
      [true, { stateClass: 'yellow-content', icon: 'question_mark' }],
    ]),
  }
  showError = computed(() => this.stateService.roomStatesMap().get(this.stateService.roomId())?.hasUnsharedPayment || false);
  errorButton: IButton = {
    icon: 'error_outline',
    action: () => {
      if(this.stateService.showPayments()){
        this.filterByErrors.update(val => !val)
      }
    },
    show: this.showError,
    class: 'square square--small border-less',
    disabled: signal(false),
    statesMapFn: () => new Map([
      [false, { stateClass: 'black-content', icon: 'error_outline' }],
      [true, { stateClass: 'red-content', icon: 'error_outline' }],
    ]),
  }
  displayPayments = computed(() => {
    const filterByWarnings = this.filterByWarnings();
    const filterByErrors =  this.filterByErrors();
    const paymentIds = this.stateService.paymentIds();
    const filtered =  paymentIds.filter(paymentId => {
      const payment = this.stateService.paymentsMap().get(paymentId);
      if(payment?.roomId !== this.stateService.roomId()){
        return false
      }
      const state = this.stateService.paymentStatesMap().get(paymentId);
      if(filterByWarnings && state?.unchecked){
        return true;
      }
      if(filterByErrors && payment?.amount !== payment?.shared){
        return true;
      }
      if(filterByWarnings || filterByErrors) {
        return false
      }
      return true
    });
    return filtered;
  })


  constructor(public stateService: StateService, private apiService: ApiService){
    effect(() => {
      const state = this.stateService.roomStatesMap().get(this.stateService.roomId());
      this.filterByWarnings.set(state?.unchecked || false);
      this.filterByErrors.set(state?.hasUnsharedPayment || false);

    })
  }

  createMember(newMember: string){
    this.apiService.createMember(this.stateService.roomId(), newMember);
  }

  toggleRooms(){
    this.stateService.showPayments.update(val => !val)
  }

}
