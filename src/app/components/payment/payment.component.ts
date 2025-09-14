import { Component, computed, effect, input, output, signal } from '@angular/core';
import { StateService } from '../../services/state.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IButton, IPayment, IShare, SocketAction, SocketMessage } from '../../models/models';
import { SocketService } from '../../services/socket.service';
import { MemberShareComponent } from "../member-share/member-share.component";
import { ApiService } from '../../services/api.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, filter, skip } from 'rxjs';
import { getNewPayment, NEW_PAYMENT_ID } from '../../constants/constants';
import { ButtonComponent } from "../button/button.component";
import { CommonModule } from '@angular/common';
import { StateButtonComponent } from "../state-button/state-button.component";
import { getDate, getDateString } from '../../utils/utils';

@Component({
  selector: 'app-payment',
  imports: [ReactiveFormsModule, MemberShareComponent, ButtonComponent, CommonModule, StateButtonComponent],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss'
})
export class PaymentComponent {
  paymentId = input<string>(NEW_PAYMENT_ID);
  payment = computed(() => this.stateService.paymentsMap().get(this.paymentId()));
  payerName = computed(() => this.stateService.membersMapByUser().get(this.payment()?.payer || '')?.name || '')
  state = computed(() => this.stateService.paymentStatesMap().get(this.paymentId()))
  balance = computed(() => this.state()?.balance || 0);
  color = computed(() => {
    if(this.payment()?.debt){
      return ''
    }
    return this.balance() < 0 ? 'red' : 'green';
  })
  amount = computed(() => this.state()?.amount || 0);
  comment = computed(() => {
    const payment = this.payment();
    if(!payment){
      return '';
    }
    if(payment.debt){
      const isPayer = payment.payer === this.stateService.user().id;
      if(isPayer){
        const share = [...this.sharesMap().values()][0];
        const member = this.stateService.membersMapByUser().get(share.payer)
        return `Отдал деньги ${member?.name || ''}`
      }
     return `Получил деньги от ${this.payerName()}`
    } else {
      return this.payment()?.comment || ''
    }
  });
  date = computed(() => this.payment()?.date || '');
  editModeInput = input(false);
  _editMode = signal(false);
  editMode = computed(() => this.editModeInput() || this._editMode());
  canEdit = computed(() => {
    return this.editMode() && (this.editModeInput() || this.payment()?.payer === this.stateService.user().id)
  })

  paymentForm = new FormGroup({
    amount: new FormControl(0, { nonNullable: true, validators: [Validators.min(0.01), Validators.required] }),
    comment: new FormControl('', { nonNullable: true }),
    date: new FormControl(new Date().toISOString().substring(0, 10), { nonNullable: true, validators: [Validators.required] })
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
        if(share.balance !== share.amount){
          this.updateConfirmation(payment, share, userId)
        }
        share.balance = share.amount;
        share.share = null;
        amount -= share.balance;
      } else if (share.share) {
        sharesForSplit.push(share);
      } else {
        this.updateConfirmation(payment, share, userId)

      }
    });

    let amountCents = Math.round((amount + Number.EPSILON) * 100)
    const shareAmount = Math.ceil((amountCents / sharesForSplit.reduce((res, share) => res += share.share!, 0)));
    sharesForSplit.forEach(share => {
      let newBalance = Math.min(shareAmount * share.share!, amountCents);
      newBalance = Math.max(newBalance, 0)
      amountCents -= newBalance;
      newBalance = newBalance / 100
      if(share.balance !== newBalance){
        this.updateConfirmation(payment, share, userId)
      }
      share.balance = newBalance;
    })

    const paymentState = this.paymentStatesMap.get(payment?.id || '')
    if (paymentState) {
      const isPayer = payment?.payer === this.stateService.user().id;
      let newBalance = 0
      if (isPayer) {
        newBalance = shares.reduce((res, share) => share.payer !== this.stateService.user().id ? res += share.balance : res, 0) || amountValue;
      } else {
        newBalance = shares.reduce((res, share) => share.payer === this.stateService.user().id ? res -= share.balance : res, 0);
      }
      paymentState.balance = Math.round(newBalance * 100) / 100;
      setTimeout(() => this.stateService.paymentStatesMap.update(paymentStatesMap => new Map([...paymentStatesMap.entries(), [payment!.id, { ...paymentState }]])), 100);
    }
    return map;

  })

  updateConfirmation(payment: IPayment | undefined, share: IShare, userId: string){
    if(userId === payment?.payer){
      share.confirmedByPayer = true;
    } else {
      share.confirmedByPayer = false;
    }
    if([share.payer, share.userId].includes(userId)){
      share.confirmedByUser = true;
    } else {
      share.confirmedByUser = false;
    }
  }
  amountChange = toSignal(this.paymentForm.controls.amount.valueChanges)
  formChange = toSignal(this.paymentForm.valueChanges)
  shared = computed(() => [...this.sharesMap().values()].reduce((res, share) => res += share.balance, 0));
  done = output<{payment: IPayment, shares: IShare[]}>()

  constructor(public stateService: StateService, private socketService: SocketService, private apiService: ApiService) {
    effect(() => {
      const payment = this.payment()
      if (payment) {
        this.paymentForm.controls.amount.setValue(payment.amount)
        this.paymentForm.controls.comment.setValue(payment.comment)
        this.paymentForm.controls.date.setValue(getDate(payment.date))
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
        this.defaultSharesMap.set(memberId, { id: '', paymentId: this.payment()?.id || '', roomId: '', userId: member.userId, payer: member.payer, paymentPayer: this.payment()?.payer || '', share: null, amount: null, balance: 0, confirmedByPayer: true, confirmedByUser: false })
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
      date: getDateString(this.paymentForm.controls.date.getRawValue()),
      shared: this.shared(),
    }
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
    this._editMode.set(false)
    if (paymentId === NEW_PAYMENT_ID) {
      this.stateService.paymentStatesMap.update(paymentStatesMap => new Map([...paymentStatesMap.entries(), [paymentId, {balance: 0,  unchecked: false, amount: 0}]]))
      await this.apiService.createPayment(payment, shares)
    } else {
      await this.apiService.updatePayment({ id: paymentId, ...payment }, shares)
    }

    this.stateService.newPayment = getNewPayment(this.stateService.user().id);
    this.stateService.createPaymentMode.set(false);
  }



  warningButton: IButton = {
    icon: 'question_mark',
    action: () => {},
    class: 'square square--small border-less stroke-content yellow-content',
    show: computed(() => this.state()?.unchecked || false),
    disabled: signal(true),
  }
  errorButton: IButton = {
    icon: 'error_outline',
    action: () => {},
    show: computed(() => {
      const payment = this.payment();
      if(!payment){
        return false;
      }
      return payment.payer === this.stateService.user().id &&  payment.amount !== payment.shared
    }),
    class: 'square square--small border-less red-content',
    disabled: signal(true),
  }
  expandButton: IButton = {
    icon: 'expand_more',
    action: () => {this._editMode.update(val => {
      if(val){
        this.stateService.payments.update(payments => [...payments]);
      }
      return !val
    })},

    class: 'square border-less',
    show: computed(() => !this.editModeInput()),
    statesMapFn: () => new Map([
      [true, { stateClass: '', icon: 'keyboard_arrow_down' }],
      [false, { stateClass: '', icon: 'keyboard_arrow_left' }],
    ]),
  }

  saveButton: IButton = {
    icon: '',
    content: 'сохранить',
    action: () => this.savePayment(),
    class: '',
    disabled: computed(() => {
      this.formChange()
      return this.paymentForm.invalid
    })
  }

  cancelButton: IButton = {
    icon: '',
    content: 'отмена',
    action: () => {
      this.stateService.createPaymentMode.set(false)
      this._editMode.set(false);
      this.stateService.payments.update(payments => [...payments]);
    },
    class: '',
  }

  finish(){
    this._editMode.update(val => !val)
  }
}
