import { Component, computed, effect, input, output, signal } from '@angular/core';
import { StateService } from '../../services/state.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IPayment, IShare, SocketAction, SocketMessage } from '../../models/models';
import { SocketService } from '../../services/socket.service';
import { MemberShareComponent } from "../member-share/member-share.component";
import { ApiService } from '../../services/api.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, filter, skip } from 'rxjs';

@Component({
  selector: 'app-payment',
  imports: [ReactiveFormsModule, MemberShareComponent],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss'
})
export class PaymentComponent {
  paymentId = input<string>('');
  payment = computed(() => this.stateService.paymentsMap().get(this.paymentId()));
  paymentForm = new FormGroup({
    amount: new FormControl(0, { nonNullable: true, validators: [Validators.min(0.01)] }),
    comment: new FormControl('', { nonNullable: true }),
    date: new FormControl(new Date(), { nonNullable: true, validators: [Validators.required] })
  });
  defaultSharesMap = new Map<string, IShare>();
  triggerSharesMap = signal(0);
  paymentStatesMap = new Map();

  sharesMap = computed(() => {
    if (!this.triggerSharesMap()) {
      return new Map();
    }
    const userId = this.stateService.user().id
    const payment = this.payment()
    const members = this.stateService.members()
    const map = new Map<string, IShare>();
    const shareIds = this.stateService.shareIdsMapBaPayment().get(payment?.id || '') || [];
    const sharesMap = this.stateService.sharesMap();
    const sharesMapByMember = shareIds.reduce<Map<string, IShare>>((res, shareId) => {
      const share = sharesMap.get(shareId);
      if (share) {
        res.set(share.userId, share)
      }
      return res;
    }, new Map());
    members.forEach(member => {
      map.set(member.id, sharesMapByMember.get(member.userId) || this.defaultSharesMap.get(member.id)!)
    });
    const amountValue = this.amountChange()
    const shares = [...map.values()];
    if (amountValue === undefined) {
      return map;
    }
    let amount = amountValue;
    const sharesForSplit: IShare[] = [];
    shares.forEach(share => {
      if (share.amount !== null) {
        const oldBalance = share.balance;
        share.balance = share.amount;
        share.share = null;
        amount -= share.balance;
        if (oldBalance !== share.balance) {
          if (share.paymentPayer === userId) {
            share.confirmedByPayer = true;
          }
          if ([share.userId, share.payer].includes(userId)) {
            share.confirmedByUser = true;
          }
        }
      } else if (share.share) {
        sharesForSplit.push(share);
      }
    });

    let amountCents = Math.round((amount + Number.EPSILON) * 100)
    const shareAmount = Math.ceil((amountCents / sharesForSplit.reduce((res, share) => res += share.share!, 0)));
    sharesForSplit.forEach(share => {
      const oldBalance = share.balance;
      let newBalance = Math.min(shareAmount * share.share!, amountCents);
      newBalance = Math.max(newBalance, 0)
      amountCents -= newBalance;
      share.balance = newBalance / 100;
      if (oldBalance !== share.balance) {
        if (share.paymentPayer === userId) {
          share.confirmedByPayer = true;
        }
        if ([share.userId, share.payer].includes(userId)) {
          share.confirmedByUser = true;
        }
      }
    })

    const paymentState = this.paymentStatesMap.get(payment?.id || '')
    if (paymentState) {
      const isPayer = payment?.payer === this.stateService.user().id;
      let newBalance = 0
      if (isPayer) {
        newBalance = shares.reduce((res, share) => share.payer !== this.stateService.user().id ? res += share.balance : res, 0) || amountValue;
      } else {
        newBalance = shares.reduce((res, share) => share.payer === this.stateService.user().id ? res += share.balance : res, 0);
      }
      paymentState.balance = Math.round(newBalance * 100) / 100
      setTimeout(() => this.stateService.paymentStatesMap.update(paymentStatesMap => new Map([...paymentStatesMap.entries(), [payment!.id, { ...paymentState }]])), 100);
    }
    return map;

  })
  amountChange = toSignal(this.paymentForm.controls.amount.valueChanges)
  shared = computed(() => [...this.sharesMap().values()].reduce((res, share) => res += share.balance, 0));

  done = output<number>()

  constructor(public stateService: StateService, private socketService: SocketService, private apiService: ApiService) {
    effect(() => {
      const payment = this.payment()
      if (payment) {
        this.paymentForm.controls.amount.setValue(payment.amount)
        this.paymentForm.controls.comment.setValue(payment.comment)
        this.paymentForm.controls.date.setValue(this.getDate(payment.date))
      }
    })
    effect(() => {
      // if (this.defaultSharesMap.size) {
      //   return;
      // }
      const memberIds = this.stateService.memberIds();
      let newMembers = 0
      memberIds.forEach(memberId => {
        if (this.defaultSharesMap.has(memberId)){
          return;
        }
        newMembers++
        const member = this.stateService.membersMap().get(memberId)!
        this.defaultSharesMap.set(memberId, { id: '', paymentId: '', roomId: '', userId: member.userId, payer: member.payer, paymentPayer: '', share: null, amount: null, balance: 0, confirmedByPayer: true, confirmedByUser: false })
      })
      this.triggerSharesMap.update(val => val + newMembers)
    })
    effect(() => {
      this.paymentStatesMap = this.stateService.paymentStatesMap();
    })
  }

  getPayment(): Omit<IPayment, 'id'> {
    const payment = this.payment();
    return {
      ...this.paymentForm.getRawValue(),
      roomId: payment?.roomId || this.stateService.roomId(),
      payer: payment?.payer || this.stateService.user().id,
      photos: [],
      date: this.getDateString(this.paymentForm.controls.date.getRawValue()),
      shared: this.shared(),
    }
  }

  getDateString(dateString: Date): string {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}/${year}`
  }
  getDate(date: string): Date {
    const [day, month, year] = date.split('/').map(n => Number(n))
    return new Date(year, month - 1, day);
  }

  onShareChanged() {
    this.triggerSharesMap.update(val => ++val);
  }

  async savePayment() {
    const memberIds = this.stateService.memberIds();
    const shares = memberIds.map((memberId) => {
      const member = this.stateService.membersMap().get(memberId)!;
      const share = this.sharesMap().get(memberId)!;
      return {
        ...share,
        userId: member.userId,
        payer: member.payer,
      }
    })
    const paymentId = this.paymentId();
    const payment = this.getPayment();
    this.done.emit(Math.random());
    if (paymentId) {
      await this.apiService.updatePayment({ id: paymentId, ...payment }, shares)
    } else {
      this.stateService.paymentStatesMap.update(paymentStatesMap => new Map([...paymentStatesMap.entries(), [paymentId, {balance: 0,  unchecked: false, amount: 0}]]))
      await this.apiService.createPayment(payment, shares)
    }

  }
}
