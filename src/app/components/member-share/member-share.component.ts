import { Component, computed, effect, inject, Injector, input, output, signal } from '@angular/core';
import { IShare } from '../../models/models';
import { StateService } from '../../services/state.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, skip } from 'rxjs';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-member-share',
  imports: [MatCheckbox, ReactiveFormsModule, MatIconModule, MatButtonModule],
  templateUrl: './member-share.component.html',
  styleUrl: './member-share.component.scss'
})
export class MemberShareComponent {

  memberId = input<string>('');
  sharesMap = input<Map<string, IShare>>(new Map());
  share = computed(() => this.sharesMap().get(this.memberId()));
  lastShare?: IShare;
  member = computed(() => this.stateService.membersMap().get(this.memberId()));
  changeShare = output<number>();
  activeControl = new FormControl(false, { nonNullable: true });
  shareControl = new FormControl(0, { nonNullable: true, validators: Validators.min(0) });
  balanceControl = new FormControl(0, { nonNullable: true });
  shareControlChanged = toSignal(this.shareControl.valueChanges.pipe(debounceTime(300)))
  activeControlChanged = toSignal(this.activeControl.valueChanges.pipe(debounceTime(300)))
  balanceControlChanged = toSignal(this.balanceControl.valueChanges.pipe(debounceTime(300)));

  constructor(private stateService: StateService) {
    effect(() => {
      const share = this.shareControlChanged() || 0
      const updatedShare = this.lastShare;
      if (!updatedShare) {
        return;
      }
      if (share == 0) {
        updatedShare.share = null
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
      updatedShare.balance = balance
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
  }

  changeShareValue(change: number){
    const newValue = (this.lastShare?.share || 0 ) + change;
    if(newValue >= 0){
      this.shareControl.setValue(newValue)
    }

  }
}
