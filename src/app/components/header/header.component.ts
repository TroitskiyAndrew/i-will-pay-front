import { Component, computed, signal } from '@angular/core';
import { StateService } from '../../services/state.service';
import { ButtonComponent } from "../button/button.component";
import { IButton } from '../../models/models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [ButtonComponent, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  roomState = computed(() => {
    const roomStatesMap = this.stateService.roomStatesMap();
    return roomStatesMap.get(this.stateService.roomId())
  });
  unchecked = computed(() => this.roomState()?.unchecked || false);
  hasUnsharedPayment = computed(() => this.roomState()?.hasUnsharedPayment || false);
  balance = computed(() => {
    if(this.roomState()){
      return this.roomState()!.balance || 0
    } else {
      const states = [...this.stateService.roomStatesMap().values()];
      return states.reduce((res, state) => res += state.balance, 0)
    }
  });

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
    show: computed(() => Boolean(this.stateService.roomId())),
    class: 'square square--small border-less',
    disabled: signal(false),
  }

  constructor(public stateService: StateService){}

}
