import { Component, computed, input, signal } from '@angular/core';
import { StateService } from '../../services/state.service';
import { MatIconModule } from '@angular/material/icon';
import { PaymentComponent } from "../payment/payment.component";

@Component({
  selector: 'app-payment-button',
  imports: [MatIconModule, PaymentComponent],
  templateUrl: './payment-button.component.html',
  styleUrl: './payment-button.component.scss'
})
export class PaymentButtonComponent {
  paymentId = input<string>('');
  payment = computed(() => this.stateService.paymentsMap().get(this.paymentId()))
  state = computed(() => this.stateService.paymentStatesMap().get(this.paymentId()))
  balance = computed(() => this.state()?.balance || 0)
  showShares = signal(false);

  constructor(public stateService: StateService){}

  toggleShares(){
    this.showShares.update(val => !val)
  }
}
