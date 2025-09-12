import { Component, computed, input } from '@angular/core';
import { StateService } from '../../services/state.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-room-button',
  imports: [MatIconModule],
  templateUrl: './room-button.component.html',
  styleUrl: './room-button.component.scss'
})
export class RoomButtonComponent {

  roomId = input<string>('');
  room = computed(() => this.stateService.roomsMap().get(this.roomId()))
  state = computed(() => this.stateService.roomStatesMap().get(this.roomId()))

  constructor(private stateService: StateService){}

}
