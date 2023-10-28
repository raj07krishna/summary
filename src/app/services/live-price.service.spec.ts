import { TestBed } from '@angular/core/testing';

import { LivePriceService } from './live-price.service';

describe('LivePriceService', () => {
  let service: LivePriceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LivePriceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
