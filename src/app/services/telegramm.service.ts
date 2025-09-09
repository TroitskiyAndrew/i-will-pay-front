import { Injectable } from '@angular/core';

declare global { interface Window { Telegram?: any } }

@Injectable({
  providedIn: 'root'
})
export class TelegrammService {
  private tg = (window as any)?.Telegram?.WebApp;
  /** Сырая строка, которую НУЖНО отправлять на бэкенд */
  readonly initData: string = this.tg?.initData || '';

  /** Неподписанные данные — можно показать в UI, но не доверять */
  readonly user = this.tg?.initDataUnsafe?.user ?? null;

  constructor() {
    try { this.tg?.ready?.(); this.tg?.expand?.(); } catch { }
  }
}
