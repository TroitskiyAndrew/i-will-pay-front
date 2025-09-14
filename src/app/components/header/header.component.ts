import { Component, computed, signal } from '@angular/core';
import { StateService } from '../../services/state.service';
import { ButtonComponent } from "../button/button.component";
import { IButton, IRoomState } from '../../models/models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [ButtonComponent, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  state = computed(() => {
    const roomStatesMap = this.stateService.roomStatesMap();
    return [...roomStatesMap.values()].reduce<Omit<IRoomState, 'debts'>>((res, state) => {
      if(state.unchecked){
        res.unchecked = true;
      }
      if(state.hasUnsharedPayment){
        res.hasUnsharedPayment = true;
      }
      res.balance += state.balance;
      return res;
    }, {balance: 0, unchecked: false, hasUnsharedPayment: false});

  });
  unchecked = computed(() => this.state().unchecked || false);
  hasUnsharedPayment = computed(() => this.state().hasUnsharedPayment || false);
  balance = computed(() => this.state().balance);

  warningButton: IButton = {
    icon: 'question_mark',
    action: () => {},
    class: 'square square--small border-less stroke-content yellow-content',
    show: computed(() => this.unchecked()),
    disabled: signal(true),
  }
  errorButton: IButton = {
    icon: 'error_outline',
    action: () => {},
    show: computed(() => this.hasUnsharedPayment()),
    class: 'square square--small border-less red-content',
    disabled: signal(true),
  }
  homeButton: IButton = {
    icon: 'person',
    action: () => this.stateService.roomId.set(''),
    class: 'square square--small border-less',
    disabled: signal(false),
  }

  constructor(public stateService: StateService){}

}
