import { Component, effect, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-new-item',
  imports: [ReactiveFormsModule, MatIconModule, MatButtonModule],
  templateUrl: './new-item.component.html',
  styleUrl: './new-item.component.scss'
})
export class NewItemComponent {
  control = new FormControl('', {nonNullable: true, validators: [Validators.required]});
  newItem = output<string>();
  controlChange = toSignal(this.control.valueChanges)

  createMember(){
    if(this.control.invalid){
      return;
    }
    this.newItem.emit(this.control.getRawValue());
    this.control.setValue('')
  }

  constructor(){
    effect(() => {
      const newValue = this.controlChange();
      console.log(newValue)
    })
  }
}
