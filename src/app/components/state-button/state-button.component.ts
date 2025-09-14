import { Component, computed, effect, ElementRef, input, OnDestroy, OnInit, Renderer2, signal } from '@angular/core';
import { FilterValue, IButton, IButtonState } from '../../models/models';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-state-button',
  imports: [ButtonComponent],
  templateUrl: './state-button.component.html',
  styleUrl: './state-button.component.scss',
})
export class StateButtonComponent implements OnInit, OnDestroy {
  button = input<IButton>({
    icon: '',
    action: () => { },

  });
  stopEvent = input<boolean>(true);
  triggerValue = signal<number>(0)
  value = input<FilterValue>(undefined);
  computedValue = computed(() => {
    this.triggerValue();
    const valueFn = this.button().valueFn;
    if(valueFn){
      return valueFn()
    }
    return this.value();
  });
  context = input({});
  contextItems = input<{}[]>([]);
  hover = input(false);
  stateTrigger = input(1);
  state = computed(() => this.button().statesMapFn!().get(this.computedValue()) ?? { stateClass: '', icon: '', content: '', hint: undefined });
  stateClass = computed(() => `${this.state().stateClass} state`);
  icon = computed(() => this.state().icon || this.button().icon || '');
  content = computed(() => this.state().content || '');
  multiMode = signal<boolean>(false)
  states = computed(() => {
    const button = this.button();
    if(!button.statesMapFn || !button.statesMapFn() ){
      return [];
    }
    return [...button.statesMapFn().entries()];
  })

  constructor(private el: ElementRef, private renderer: Renderer2){
    effect(() => {
      const context = this.context() as {selected: boolean};
      const button = this.button();
      if(context.selected && button.multiMode ){
        this.multiMode.set(button.multiMode())
      }
    })
    effect(() => {
      const button = this.button();
      if( (button.showFn && !button.showFn) || (button.show && !button.show())){
        this.renderer.setStyle(this.el.nativeElement, 'position', 'absolute');
      } else{
        this.renderer.removeStyle(this.el.nativeElement, 'position')
      }
    })
  }

  ngOnInit() {
    this.el.nativeElement.addEventListener('click', this.onClickCapture.bind(this), { capture: true });
  }

  onClickCapture(event: Event){
    const button = this.button();
    if(this.multiMode() || !button.multiMode){
      return;
    } else{
      this.multiMode.set(true);
      const context = this.context() as {selected: boolean}
      if(context.selected){
        button.multiMode.set(true);
      }
      event.stopPropagation();
      document.addEventListener('click', this.closeMultiBarFn, { capture: true })
    }
  }

  closeMultiBarFn = this.closeMultiBar.bind(this)

  closeMultiBar(event: Event){
    const target = event.target as Node;
    if (!this.el.nativeElement.contains(target)) {
      this.multiMode.set(false);
      const button = this.button()
      button.multiMode?.set(false)
      event.stopImmediatePropagation()
    }
    document.removeEventListener('click', this.closeMultiBarFn, { capture: true })
  }

  handleClick(event: Event, value?: FilterValue) {
    const button = this.button();
    button.valueAfterMulti = value;
    if(button.multiMode){
      this.multiMode.set(false);
      button.multiMode.set(false);
    }
    this.triggerValue.update(val => ++val)
    if(this.stopEvent()){
      event.stopPropagation();
    }
  }

  ngOnDestroy() {
    this.el.nativeElement.removeEventListener('click', this.onClickCapture, { capture: true });
  }
}
