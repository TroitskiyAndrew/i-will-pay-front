import { Component, computed, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { NEW_PAYMENT_ID } from '../../constants/constants';
import { IButton } from '../../models/models';
import { ButtonComponent } from "../button/button.component";
import { PaymentComponent } from "../payment/payment.component";
import { StateButtonComponent } from "../state-button/state-button.component";
import { CommonModule } from '@angular/common';
import { DebtComponent } from "../debt/debt.component";

@Component({
  selector: 'app-room-debts',
  imports: [CommonModule, StateButtonComponent,  DebtComponent],
  templateUrl: './room-debts.component.html',
  styleUrl: './room-debts.component.scss'
})
export class RoomDebtsComponent {

  balance = computed(() => this.stateService.totalState().balance);
  debts = computed(()=> this.stateService.roomStatesMap().get(this.stateService.roomId())?.debts || [])
  expandButton: IButton = {
    icon: 'expand_more',
    action: () => {},
    class: 'square border-less',
    statesMapFn: () => new Map([
      [true, { stateClass: '', icon: 'keyboard_arrow_down' }],
      [false, { stateClass: '', icon: 'keyboard_arrow_left' }],
    ]),
  }

  constructor(public stateService: StateService, private apiService: ApiService){}

  toggleDebts(){
    this.stateService.showDebts.update(val => !val)
  }
}
