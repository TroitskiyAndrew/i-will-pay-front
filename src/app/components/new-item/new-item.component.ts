import { Component, effect, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from "../button/button.component";
import { IButton } from '../../models/models';

@Component({
  selector: 'app-new-item',
  imports: [ReactiveFormsModule, MatIconModule, MatButtonModule, ButtonComponent],
  templateUrl: './new-item.component.html',
  styleUrl: './new-item.component.scss'
})
export class NewItemComponent {
  control = new FormControl('', {nonNullable: true, validators: [Validators.required]});
  newItem = output<string>();
  controlChange = toSignal(this.control.valueChanges);
  createButton: IButton = {
    icon: 'add',
    action: () => {
      if(this.control.invalid){
        return;
      }
      this.newItem.emit(this.control.getRawValue());
      this.control.setValue('')
    },
    disabled: signal(false),
    class: 'square'
  }
}
