import { Component, computed, input, signal } from '@angular/core';
import { StateService } from '../../services/state.service';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from "../button/button.component";
import { IButton } from '../../models/models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-room-button',
  imports: [CommonModule, MatIconModule, ButtonComponent],
  templateUrl: './room-button.component.html',
  styleUrl: './room-button.component.scss'
})
export class RoomButtonComponent {

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
    show: computed(() => this.state()?.hasUnsharedPayment || false),
    class: 'square square--small border-less red-content',
    disabled: signal(true),
  }

  roomId = input<string>('');
  room = computed(() => this.stateService.roomsMap().get(this.roomId()))
  state = computed(() => this.stateService.roomStatesMap().get(this.roomId()))

  constructor(private stateService: StateService){}

}
