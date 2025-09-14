import { Component, computed, input, signal } from '@angular/core';
import { IButton, IDebt } from '../../models/models';
import { StateService } from '../../services/state.service';
import { CommonModule } from '@angular/common';
import { UpdateItemComponent } from "../update-item/update-item.component";
import { ButtonComponent } from "../button/button.component";
import { ApiService } from '../../services/api.service';
import { getDate, getDateString } from '../../utils/utils';

@Component({
  selector: 'app-debt',
  imports: [CommonModule, UpdateItemComponent, ButtonComponent],
  templateUrl: './debt.component.html',
  styleUrl: './debt.component.scss'
})
export class DebtComponent {
  debt = input<IDebt>({ owner: '', debtor: '', amount: 0 });
  isOwner = computed(() => this.debt().owner === this.stateService.user().id)
  name = computed(() => {
    const debt = this.debt();
    const userId = this.isOwner() ? debt.debtor : debt.owner;
    return this.stateService.membersMapByUser().get(userId)?.name || ''
  })
  amount = computed(() => this.debt().amount)

  editDebtMode = signal(false);
  editDebtButton: IButton = {
    icon: 'check',
    action: () => this.editDebtMode.set(true),
    show: this.isOwner,
    class: 'square'
  }

  constructor(private stateService: StateService, private apiService: ApiService) { }

  editDebt(amount: string | number) {
    if (!amount) {
      this.editDebtMode.set(false);
      return
    }
    amount = Number(amount)
    this.editDebtMode.set(false);
    const debt = this.debt();
    this.apiService.createPayment({
      roomId: this.stateService.roomId(),
      payer: debt.debtor,
      amount,
      shared: amount,
      comment: '',
      photos: [],
      date: getDateString(getDate('')),
      debt: true,
    }, [{
      paymentId: '',
      roomId: '',
      paymentPayer: '',
      userId: this.stateService.user().id,
      payer: this.stateService.user().id,
      share: 1,
      amount: null,
      balance: amount,
      confirmedByPayer: true,
      confirmedByUser: true
    }])
  }
}
