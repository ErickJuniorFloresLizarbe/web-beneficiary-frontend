import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { WorkshopRequestDto, WorkshopResponseDto } from '../../../../../interfaces/workshop';
import { WorkshopService } from '../../../../../services/workshop.service';
import { PersonaService } from '../../../../../services/person.service';

@Component({
  selector: 'app-workshop-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workshop-modal.component.html',
  styleUrls: ['./workshop-modal.component.css']
})
export class WorkshopModalComponent implements OnInit {
  @Input() workshop: WorkshopResponseDto | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  selectedPersonId = 0
  personList: any[] = []
  selectedPersonIds: number[] = [];
  

  // Formulario interno
  formData: {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    observation: string;
  } = {
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(),
      observation: '',
    };

  // Calendario
  showStartDateCalendar = false;
  showEndDateCalendar = false;
  currentMonth = new Date();
  months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  constructor(private workshopService: WorkshopService,
    private personService: PersonaService,
  ) { }

  toggleSelection(id: number): void {
    const index = this.selectedPersonIds.indexOf(id);
    if (index > -1) {
      this.selectedPersonIds.splice(index, 1); // deselecciona
    } else {
      this.selectedPersonIds.push(id); // selecciona
    }
  }

  ngOnInit(): void {
    this.getPersons();
  
    if (this.workshop) {
      this.formData = {
        name: this.workshop.name,
        description: this.workshop.description || '',
        startDate: new Date(this.workshop.startDate),
        endDate: new Date(this.workshop.endDate),
        observation: this.workshop.observation || ''
      };
  
      // ✅ Inicializar personas seleccionadas si vienen en el taller
      if (this.workshop.personId) {
        this.selectedPersonIds = this.workshop.personId
          .split(',')
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id));
      }
    }
  }
  

  getPersons(): void {
    this.personService.getPersons().subscribe(
      (response) => {
        this.personList = response
      },
      (error) => {
        console.error("Error retrieving persons:", error)
      },
    )
  }

  onPersonChange(event: any): void {
    // Obtenemos el valor directamente del evento
    const selectElement = event.target as HTMLSelectElement
    const selectedValue = selectElement.value

    console.log("Valor seleccionado del dropdown:", selectedValue)

    // Convertimos a número
    this.selectedPersonId = Number(selectedValue)
    console.log("ID de persona seleccionada (convertido):", this.selectedPersonId)
  }

  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = this.months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} / ${month} / ${year}`;
  }

  toggleCalendar(type: 'start' | 'end') {
    this.showStartDateCalendar = type === 'start' ? !this.showStartDateCalendar : false;
    this.showEndDateCalendar = type === 'end' ? !this.showEndDateCalendar : false;
  }

  selectDate(day: number, type: 'start' | 'end') {
    const selected = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), day);
    if (type === 'start') {
      this.formData.startDate = selected;
      this.showStartDateCalendar = false;
    } else {
      this.formData.endDate = selected;
      this.showEndDateCalendar = false;
    }
  }

  previousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
  }

  generateCalendarDays(month: Date): number[] {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const startIndex = (firstDay + 6) % 7;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    return Array.from({ length: startIndex + daysInMonth }, (_, i) =>
      i < startIndex ? 0 : i - startIndex + 1
    );
  }

  isDateDisabled(day: number, type: 'end' | 'start'): boolean {
    if (type === 'end' && this.formData.startDate) {
      const start = this.formData.startDate;
      const end = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), day);
      return end < start;
    }
    return false;
  }

  isFormValid(): boolean {
    return !!(this.formData.name && this.formData.startDate && this.formData.endDate);
  }

  // 👉 Convierte Date a string 'YYYY-MM-DD'
  toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  onSubmit(): void {
    const dto: WorkshopRequestDto = {
      name: this.formData.name,
      description: this.formData.description,
      startDate: this.toDateString(this.formData.startDate),
      endDate: this.toDateString(this.formData.endDate),
      observation: this.formData.observation,
      personId: this.selectedPersonIds.join(','), // ✅ importante
      state: this.workshop?.state || 'A'
    };
  
    if (this.workshop) {
      this.workshopService.update(this.workshop.id, dto).subscribe({
        next: () => {
          Swal.fire('Actualizado', 'El taller fue actualizado correctamente.', 'success');
          this.save.emit();
          this.close.emit();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo actualizar el taller.', 'error');
        }
      });
    } else {
      this.workshopService.create(dto).subscribe({
        next: () => {
          Swal.fire('Creado', 'El taller fue creado correctamente.', 'success');
          this.save.emit();
          this.close.emit();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo crear el taller.', 'error');
        }
      });
    }
  }
  

  onCancel(): void {
    this.close.emit();
  }
}
