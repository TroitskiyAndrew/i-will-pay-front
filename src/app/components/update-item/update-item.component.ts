import { Component, computed, effect, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IButton } from '../../models/models';
import { ButtonComponent } from "../button/button.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-item',
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './update-item.component.html',
  styleUrl: './update-item.component.scss'
})
export class UpdateItemComponent {
  control = new FormControl<string | number>('', {nonNullable: true, validators: [Validators.required]});
  newValue = output<string | number>();
  controlChange = toSignal(this.control.valueChanges);
  createButton: IButton = {
    icon: 'check',
    action: () => {
      this.newValue.emit(this.control.getRawValue());
      this.control.setValue('')
    },
    disabled: computed(() => {
      this.controlChange()
      return this.control.invalid
    }),
    class: 'square'
  }
  value = input<string | number>('');
  type = computed(() => {
    return typeof this.value() === 'string' ? 'text' : 'number'
  })
  cancelButton: IButton = {
    icon: 'cancel',
    action: () => {
      this.newValue.emit('');
      this.control.setValue('')
    },
    disabled: signal(false),
    class: 'square'
  }

  constructor(){
    effect(() => {
      this.control.setValue(this.value())
    })
  }
}
