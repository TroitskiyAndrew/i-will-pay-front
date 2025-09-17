import { Component, computed, effect, inject, Injector, input, output, signal } from '@angular/core';
import { IButton, IShare } from '../../models/models';
import { StateService } from '../../services/state.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, skip } from 'rxjs';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ButtonComponent } from "../button/button.component";
import { ApiService } from '../../services/api.service';
import { StateButtonComponent } from "../state-button/state-button.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-member-share',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule, ButtonComponent, StateButtonComponent],
  templateUrl: './member-share.component.html',
  styleUrl: './member-share.component.scss'
})
export class MemberShareComponent {

  memberId = input<string>('');
  isFirst = input(false);
  showAccept = input(false);
  sharesMap = input<Map<string, IShare>>(new Map());
  share = computed(() => this.sharesMap().get(this.memberId()));
  isPayer = computed(() => {
    const share = this.share();
    if(!share){
      return false;
    }
    return [share.payer, share.userId].includes(this.stateService.user().id)
  })
  disableMoneyInputs = computed(() => {
    const share = this.share()
    return !share || ![share.paymentPayer, share.payer, share.userId].includes(this.stateService.user().id);
  })
  isUnchecked = computed(() => {
    const share = this.sharesMap().get(this.memberId());
    if(share == null){
      return false;
    }
    const userId = this.stateService.user().id;
    if(userId === share?.paymentPayer && !share.confirmedByPayer){
      return true;
    }
    if([share.payer, share.userId].includes(userId) && !share.confirmedByUser){
      return true;
    }
    return false;
  })
  lastShare?: IShare;
  member = computed(() => this.stateService.membersMap().get(this.memberId()));
  changeShare = output<number>();
  activeControl = new FormControl(false, { nonNullable: true });
  shareControl = new FormControl(0, { nonNullable: true, validators: Validators.min(0) });
  balanceControl = new FormControl(0, { nonNullable: true });
  shareControlChanged = toSignal(this.shareControl.valueChanges.pipe(debounceTime(300)))
  activeControlChanged = toSignal(this.activeControl.valueChanges.pipe(debounceTime(300)))
  balanceControlChanged = toSignal(this.balanceControl.valueChanges.pipe(debounceTime(300)));

  decreaseShareButton: IButton = {
    icon: 'horizontal_rule',
    class: 'square',
    action: () => this.changeShareValue(-1),
    disabled: this.disableMoneyInputs
  }
  increaseShareButton: IButton = {
    icon: 'add',
    class: 'square',
    action: () => this.changeShareValue(1),
    disabled: this.disableMoneyInputs
  }
  acceptButton: IButton = {
    icon: 'check',
    class: 'square',
    action: () => {
      if (!this.isUnchecked()){
        return;
      }
      const share = this.share()!;
      const userId = this.stateService.user()!.id;
      if(share.paymentPayer === userId && !share.confirmedByPayer){
        share.confirmedByPayer = true;
      }
      if([share.payer, share.userId].includes(userId) && !share.confirmedByUser){
        share.confirmedByUser = true
      }
      this.apiService.updateShare(share)
    },
  }
  activeButton: IButton = {
    icon: 'check_box',
    class: 'square',
    action: () => {this.activeControl.setValue(!this.activeControl.getRawValue())},
    disabled: computed(() => this.share()?.paymentPayer !== this.stateService.user().id),
    statesMapFn: () => new Map([
      [false, { stateClass: 'border-less', icon: 'check_box_outline_blank' }],
      [true, { stateClass: 'border-less', icon: 'check_box' }],
    ]),
  }

  constructor(public stateService: StateService, private apiService: ApiService) {
    effect(() => {
      const share = this.shareControlChanged() || 0
      const updatedShare = this.lastShare;
      if (!updatedShare) {
        return;
      }
      if (share === 0) {
        updatedShare.share = this.stateService.user().id === updatedShare.paymentPayer ? null : 0;
        updatedShare.amount = null
        updatedShare.balance = 0
      }
      if (share > 0) {
        updatedShare.share = share
        updatedShare.amount = null
      }
      this.changeShare.emit(Math.random())
    })
    effect(() => {
      const active = this.activeControlChanged() || false;
      const updatedShare = this.lastShare;
      if (!updatedShare) {
        return;
      }

      if (active) {
        updatedShare.share = 0;
      }
      if (active === false) {
        updatedShare.share = null
        updatedShare.amount = null
        updatedShare.balance = 0
      }
      this.changeShare.emit(Math.random())
    })
    effect(() => {
      const balance = this.balanceControlChanged() || 0
      const updatedShare = this.lastShare;
      if (!updatedShare) {
        return;
      }


      updatedShare.share = null
      updatedShare.amount = balance
      this.changeShare.emit(Math.random())
    })
    effect(() => {
      const share = this.sharesMap().get(this.memberId());
      this.lastShare = share;
      if (share) {
        this.activeControl.setValue(share.share !== null || share.amount !== null, { emitEvent: false })
        this.shareControl.setValue(share.share || 0, { emitEvent: false })
        this.balanceControl.setValue(share.balance || 0, { emitEvent: false })
      }
    })
    effect(() => {
      // if(this.disableMoneyInputs()){
      //   // this.balanceControl.disable()
      // }
    })
  }

  changeShareValue(change: number){
    const newValue = (this.lastShare?.share || 0 ) + change;
    if(newValue >= 0){
      this.shareControl.setValue(newValue)
    }

  }
}
