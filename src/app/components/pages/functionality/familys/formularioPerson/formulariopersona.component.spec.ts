import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulariopersonaComponent } from './formulariopersona.component';

describe('FormulariopersonaComponent', () => {
  let component: FormulariopersonaComponent;
  let fixture: ComponentFixture<FormulariopersonaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulariopersonaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormulariopersonaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
