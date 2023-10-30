import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CryptoSummaryComponent } from './crypto-summary.component';

describe('CryptoSummaryComponent', () => {
  let component: CryptoSummaryComponent;
  let fixture: ComponentFixture<CryptoSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CryptoSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CryptoSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
