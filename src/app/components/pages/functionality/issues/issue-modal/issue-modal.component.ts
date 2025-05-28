import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Issue } from '../../../../../interfaces/issue';
import { IssueService } from '../../../../../services/issue.service';
import { WorkshopService } from '../../../../../services/workshop.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-issue-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './issue-modal.component.html',
  styleUrl: './issue-modal.component.css'
})
export class IssueModalComponent implements OnInit{
  workshops: any[] = [];
  dateError: boolean = false;
  isLoading: boolean = true;
  issue: Issue[] = [];
  filteredIssues: Issue[] = [];
  isActive: boolean = true;
  selectedWorkshopName: string = '';
  // Filtros
  nameFilter: string = '';
  @Input() issueForm: Issue = {
      id: 0,
      name: '',
      workshopId: 0,
      scheduledTime: '',
      state: ''
    };

  @Input() isModalOpen: boolean = false;
  @Input() isEditMode: boolean = false;
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() saveIssueEvent = new EventEmitter<Issue>();

  close(): void {
    this.closeModalEvent.emit();  // Emitimos el evento para cerrar el modal
  }

  closeModal(): void {
    this.closeModalEvent.emit(); // ✅ Notifica al padre que debe cerrar el modal
  }


  save(): void {
    if (this.issueForm) {
      this.saveIssueEvent.emit(this.issueForm);  // Emitimos el formulario para guardarlo
    }
  }

  constructor(private issueService: IssueService,
      private workshopService: WorkshopService,
    ) { }

    ngOnInit(): void {
      this.getIssues();
      this.getActiveWorkshops();
    }

  getIssues(): void {
      this.isLoading = true;
      this.issueService.getIssues().subscribe({
        next: (data) => {
          this.issue = data;
          // Obtenemos los IDs de los workshops asociados a los issues
          const workshopRequests = this.issue.map((issue) =>
            this.workshopService.getWorkshopById(issue.workshopId)
          );
          // Ejecutamos todas las peticiones simultáneamente
          forkJoin(workshopRequests).subscribe({
            next: (workshops: { name: string | undefined; }[]) => {
              // Asignamos el nombre del taller a cada issue
              this.issue.forEach((issue, index) => {
                issue.workshopName = workshops[index].name;
              });
              this.filterIssues();
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Error fetching workshops:', err);
              this.isLoading = false;
            },
          });
        },
        error: (err) => {
          console.error('Error fetching issues:', err);
          this.isLoading = false;
        },
      });
    }

    filterIssues(): void {
      this.filteredIssues = this.issue.filter(issue => {
        const matchesStatus = issue.state === (this.isActive ? 'A' : 'I'); // Filtrar por estado
        const matchesName = issue.name
          .toLowerCase()
          .includes(this.nameFilter.toLowerCase()); // Filtrar por nombre del tema
        const matchesWorkshop =
          this.selectedWorkshopName === '' || issue.workshopName === this.selectedWorkshopName; // Filtrar por nombre del taller

        return matchesStatus && matchesName && matchesWorkshop;
      });
    }

  updateSupplier(): void {
      if (this.issueForm.id) {
        this.issueService.updateIssue(this.issueForm.id, this.issueForm).subscribe({
          next: () => {
            this.getIssues(); // Refrescar la lista
            this.closeModal(); // Cerrar el modal
            // Mostrar alerta de éxito
            Swal.fire({
              title: '¡Éxito!',
              text: 'El tema se actualizó correctamente.',
              icon: 'success',
              confirmButtonText: 'Aceptar',
            });
          },
          error: (err) => {
            console.error('Error updating supplier:', err);
            Swal.fire({
              title: 'Error',
              text: 'Hubo un problema al actualizar el tema.',
              icon: 'error',
              confirmButtonText: 'Aceptar',
            });
          }
        });
      }
    }

  addIssue(): void {
      if (this.issueForm.id === 0) {
        this.issueForm.id = undefined; // O eliminar la propiedad id
      }

      this.issueService.createIssue(this.issueForm).subscribe({
        next: () => {
          this.getIssues(); // Refrescar la lista
          this.closeModal(); // Cerrar el modal
          Swal.fire({
            title: 'Éxito',
            text: 'El tema ha sido agregado correctamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
          });
        },
        error: (err: any) => {
          console.error('Error adding supplier:', err);
          Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al agregar el tema.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
          });
        }

      });
    }

    getActiveWorkshops(): void {
      this.workshopService.getActiveWorkshops().subscribe({
        next: (data) => {
          this.workshops = data;  // ✅ Ya viene con { id, name }
          console.log(this.workshops);  // 🔍 Verificar que la lista de talleres sea correcta
        },
        error: (err) => {
          console.error('Error fetching workshops:', err);
        },
      });
    }

    validateDateTime(event: any): void {
      const inputDate = new Date(event.target.value);
      const currentDate = new Date();

      if (inputDate < currentDate) {
        this.dateError = true;  // Mostrar el mensaje de error si la fecha es inválida
        this.issueForm.scheduledTime = this.getCurrentDateTime();  // Restablecer a la fecha actual
      } else {
        this.dateError = false;  // Ocultar el mensaje de error si la fecha es válida
      }
    }

    getCurrentDateTime(): string {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Asegurarse de que tiene dos dígitos
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}`; // Formato `YYYY-MM-DDTHH:mm`
    }


}
