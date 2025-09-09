import { TestBed } from '@angular/core/testing';

import { TelegrammService } from './telegramm.service';

describe('TelegrammService', () => {
  let service: TelegrammService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TelegrammService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
