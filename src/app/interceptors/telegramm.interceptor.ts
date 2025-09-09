import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { TelegrammService } from '../services/telegramm.service';

const HEADER_NAME = 'X-Telegram-Init-Data';

export const initDataInterceptor: HttpInterceptorFn = (req, next) => {
  const tg = inject(TelegrammService);
  const initData = tg.initData;

  // если пусто — не трогаем запрос
  if (!initData) return next(req);

  // пример: добавлять всегда
  const cloned = req.clone({
    setHeaders: { [HEADER_NAME]: initData }
  });

  return next(cloned);
};
