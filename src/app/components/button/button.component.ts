import { ChangeDetectorRef, Component, computed, effect, ElementRef, EnvironmentInjector, HostListener, inject, input, OnDestroy, OnInit, Renderer2, runInInjectionContext, signal } from '@angular/core';
import { IButton } from '../../models/models';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  imports: [MatIconModule, MatButtonModule, CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent implements OnInit {
  public button = input<IButton>({ icon: '', action: () => { }, disabled: signal(false) });
  public stopEvent = input<boolean>(true);
  public context = input<{}>({});
  public contextItems = input<{}[]>([]);
  public value = input<unknown>(null)
  public stateClass = input('');
  public icon = input('');
  public content = input('');
  public hover = input(false);
  // @ts-ignore
  public hoverValue = computed(() => this.button().commonAction && (this.hover() || (this.button().selected && this.button().selected())));
  public iconValue = computed(() => this.icon() || this.button().icon);
  public contentValue = computed(() => this.content() || this.button().content || '');
  public disabled = computed(() => {
    const button = this.button()
    let disable = button.disabled ? button.disabled() : false;
    if(button.disabledFn){
      disable = button.disabledFn()
    }
    return disable
  });
  public classValue = computed(() => [this.button().class, this.stateClass(), this.hoverValue() ? 'hover' : ''].filter(Boolean).join(' '));
  triggerShow = signal(0);
  showValue = computed(() => {
    this.triggerShow();
    const button = this.button();
    if (button.show && !button.show()) {
      return false;
    }
    let value = this.value();
    if (button.showFn && !button.showFn({ context: this.context(), value })) {
      return false
    }
    return true;
  })

  constructor(private injector: EnvironmentInjector, private el: ElementRef, private renderer: Renderer2) {
    effect(() => {
      const button = this.button();
      if( (button.showFn && !button.showFn) || (button.show && !button.show())){
        this.renderer.setStyle(this.el.nativeElement, 'position', 'absolute');
      } else{
        this.renderer.removeStyle(this.el.nativeElement, 'position')
      }
    })
  }

  ngOnInit(): void {

  }


  async handleClick(event: MouseEvent) {
    if(this.stopEvent()){
      event.stopPropagation();
    }
    // if (this.loadingService.loading()) {
    //   return;
    // }
    const context = this.context() as { id: string, selected: boolean };
    const contextItems = context.selected ?  this.contextItems() as { id: string }[] : [context];
    const button = this.button();
    const permissionPromise = button.actionPermission;

    let value = this.value();
    if (button.actionValue) {
      value = await runInInjectionContext(this.injector, button.actionValue.bind(null));
    }

    if (permissionPromise) {
      const permission = await permissionPromise({ mainItem: context, value }, contextItems);
      if (!permission) {
        return;
      }
    }

    if (button.commonAction && contextItems.length && contextItems.map(item => item.id).includes(context.id)) {
      await Promise.all(contextItems.map(
        contextItem => context.id === contextItem.id ?
          Promise.resolve() :
          runInInjectionContext(this.injector, button.action.bind(null, { context: contextItem, mainItem: context, value }))
      )
      )

    }

    await runInInjectionContext(this.injector, button.action.bind(null, { context, value }));

    const afterAction = button.afterAction;
    if (afterAction) (
      afterAction(contextItems.length ? contextItems : [context])
    )
    this.triggerShow.update(val => ++val);

  }

}
