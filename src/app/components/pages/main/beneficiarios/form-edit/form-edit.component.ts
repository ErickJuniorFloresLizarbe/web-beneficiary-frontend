import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-form-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-edit.component.html',
  styleUrl: './form-edit.component.css'
})
export class FormEditComponent {

  public errors: string[] = [];
  public errores: string[] = [];

  // VALIDACION PARA ACTUALIZAR Y CREAR UN NUEVO DATO EN EDUCATION
  saveChanges(): void {
    this.errors = [];

    const namePattern = /^[A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s]+$/;
    const gradePattern = /^[1-9](ro|do|to)$/;

    if (!this.selectedEducation.schollName || !namePattern.test(this.selectedEducation.schollName)) {
      this.errors.push("Institución inválida: solo texto permitido.");
    }

    if (!this.selectedEducation.degreeStudy || !namePattern.test(this.selectedEducation.degreeStudy)) {
      this.errors.push("Nivel de estudio inválido: solo texto permitido.");
    }

    if (!this.selectedEducation.gradeBook || !gradePattern.test(this.selectedEducation.gradeBook)) {
      this.errors.push("Grado inválido: formato permitido '1ro', '2do', '5to', etc.");
    }

    if (
      this.selectedEducation.gradeAverage === undefined ||
      this.selectedEducation.gradeAverage === null ||
      isNaN(this.selectedEducation.gradeAverage) ||
      this.selectedEducation.gradeAverage < 0 ||
      this.selectedEducation.gradeAverage > 20
    ) {
      this.errors.push("Promedio inválido: debe ser un número entre 0 y 20.");
    }

    if (!this.selectedEducation.fullNotebook) {
      this.errors.push("Debe seleccionar una opción para Cuaderno Completo.");
    }

    if (!this.selectedEducation.assistance) {
      this.errors.push("Debe seleccionar una opción para Asistencia.");
    }

    if (!this.selectedEducation.tutorials) {
      this.errors.push("Debe seleccionar una opción para Tutoriales.");
    }

    if (!this.selectedEducation.entryDate) {
      this.errors.push("Debe seleccionar una Fecha.");
    }

    if (this.errors.length > 0) {
      return;
    }




    Swal.fire({
      title: "Esta seguro?",
      text: "desea guardar los cambios",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, guardar!"
    }).then((result) => {
      if (result.isConfirmed) {
        this.saveEducationEvent.emit(this.selectedEducation);
        Swal.fire({
          title: "Exito!",
          text: "se guardo correctamente!",
          icon: "success"
        });
      }
    });
  }

  // VALIDACION PARA ACTUALIZAR Y CREAR UN NUEVO DATO EN HEALTH
  saveHealthChanges(): void {

    this.errores = [];

    if (!this.selectedHealth.vaccine) {
      this.errores.push("Debe seleccionar una opción para Vacuna.");
    }

    if (!this.selectedHealth.vph) {
      this.errores.push("Debe seleccionar una opción para VPH.");
    }

    if (!this.selectedHealth.influenza) {
      this.errores.push("Debe seleccionar una opción para Influenza.");
    }

    if (!this.selectedHealth.deworming) {
      this.errores.push("Debe seleccionar una opción para Desparasitación.");
    }

    if (!this.selectedHealth.hemoglobin) {
      this.errores.push("Debe seleccionar una opción para Hemoglobina.");
    }


    if (this.errores.length > 0) {
      return;
    }

    Swal.fire({
      title: "Esta seguro?",
      text: "desea guardar los cambios",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, guardar!"
    }).then((result) => {
      if (result.isConfirmed) {
        this.saveHealthEvent.emit(this.selectedHealth);
        Swal.fire({
          title: "Exito!",
          text: "se guardo correctamente!",
          icon: "success"
        });
      }
    });

  }

  @Input() isModalVisible: boolean = false;
  @Input() isHealthModalVisible: boolean = false;

  @Input() selectedEducation: any = {};
  @Input() selectedHealth: any = {};

  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() saveEducationEvent = new EventEmitter<any>();

  @Output() closeHealthModalEvent = new EventEmitter<void>();
  @Output() saveHealthEvent = new EventEmitter<any>();

  closeModal(): void {
    this.closeModalEvent.emit();
    this.errors = []
  }

  closeHealthModal(): void {
    this.closeHealthModalEvent.emit();
    this.errores = []
  }

}
