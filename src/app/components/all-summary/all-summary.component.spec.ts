import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSummaryComponent } from './all-summary.component';

describe('AllSummaryComponent', () => {
  let component: AllSummaryComponent;
  let fixture: ComponentFixture<AllSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
