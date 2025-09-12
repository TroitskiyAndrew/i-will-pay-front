import { Component, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { PaymentButtonComponent } from "../payment-button/payment-button.component";

@Component({
  selector: 'app-room-payments',
  imports: [PaymentButtonComponent],
  templateUrl: './room-payments.component.html',
  styleUrl: './room-payments.component.scss'
})
export class RoomPaymentsComponent {
  showMembers = signal<boolean>(false)

  constructor(public stateService: StateService, private apiService: ApiService){}

  createMember(newMember: string){
    this.apiService.createMember(this.stateService.roomId(), newMember);
  }

  toggleMembers(){
    this.showMembers.update(val => !val)
  }

}
