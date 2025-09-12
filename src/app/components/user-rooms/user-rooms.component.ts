import { Component } from '@angular/core';
import { StateService } from '../../services/state.service';
import { RoomButtonComponent } from '../room-button/room-button.component';
import { NewItemComponent } from '../new-item/new-item.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-user-rooms',
  imports: [RoomButtonComponent, NewItemComponent],
  templateUrl: './user-rooms.component.html',
  styleUrl: './user-rooms.component.scss'
})
export class UserRoomsComponent {

  constructor(public stateService: StateService, private apiService: ApiService){}

  createRoom(newRoom: string){
    this.apiService.createRoom(newRoom);
  }

}
