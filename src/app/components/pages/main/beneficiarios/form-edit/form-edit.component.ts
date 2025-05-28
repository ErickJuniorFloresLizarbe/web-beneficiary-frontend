import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-edit.component.html',
  styleUrl: './form-edit.component.css'
})
export class FormEditComponent {

  @Input() isModalVisible: boolean = false;
  @Input() isHealthModalVisible: boolean = false;

  @Input() selectedEducation: any = {};
  @Input() selectedHealth: any = {};

  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() saveEducationEvent = new EventEmitter<any>();

  @Output() closeHealthModalEvent = new EventEmitter<void>(); // CORREGIDO
  @Output() saveHealthEvent = new EventEmitter<any>(); // CORREGIDO

  closeModal(): void {
    this.closeModalEvent.emit();
  }

  saveChanges(): void {
    this.saveEducationEvent.emit(this.selectedEducation);
  }

  closeHealthModal(): void {
    this.closeHealthModalEvent.emit();
  }

  saveHealthChanges(): void {
    this.saveHealthEvent.emit(this.selectedHealth);
  }
}
