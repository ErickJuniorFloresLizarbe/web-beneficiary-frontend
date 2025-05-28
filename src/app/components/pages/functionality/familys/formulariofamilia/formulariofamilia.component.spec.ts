import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulariofamiliaComponent } from './formulariofamilia.component';

describe('FormulariofamiliaComponent', () => {
  let component: FormulariofamiliaComponent;
  let fixture: ComponentFixture<FormulariofamiliaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulariofamiliaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormulariofamiliaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
