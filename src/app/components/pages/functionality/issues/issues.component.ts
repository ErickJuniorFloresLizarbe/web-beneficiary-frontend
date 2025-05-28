import { Component, inject, OnInit } from '@angular/core';
import { WorkshopService } from '../../../../services/workshop.service';
import { IssueService } from './../../../../services/issue.service';
import { Issue } from '../../../../interfaces/issue';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IssueModalComponent } from './issue-modal/issue-modal.component';
import { finalize } from 'rxjs/operators';


@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [CommonModule, FormsModule, IssueModalComponent],
  templateUrl: './issues.component.html',
  styleUrl: './issues.component.css'
})
export class IssuesComponent implements OnInit{
  dateError: boolean = false;
  private issueService = inject(IssueService);
  isModalOpen: boolean = false;
  issue: Issue[] = [];
  filteredIssues: Issue[] = [];
  isLoading: boolean = true;
  isActive: boolean = true;
  isEditMode = false;
  workshops: any[] = [];
  items: any[] = [];
  selectedWorkshopName: string = '';
  // Filtros
  nameFilter: string = '';
  descriptionFilter: string = '';
  // Variables para paginación
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalItems: number = 0;

  editSupplier: Issue | null = null;
  issueForm: Issue = { id: 0, name: '', workshopId: 0, scheduledTime: '', state: 'A' };
  openModalForCreate() {
    this.isEditMode = false;
    this.issueForm = {
      id: 0,
      name: '',
      workshopId: 0,
      scheduledTime: '',
      state: 'A'
    };
    this.isModalOpen = true;
  }
  constructor(
    private workshopService: WorkshopService
  ) { }

  ngOnInit(): void {
    this.getIssues();
    this.getActiveWorkshops();

    this.items.sort((a, b) => a.name.localeCompare(b.name));
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

  // Cambiar el estado del switcher y actualizar la lista filtrada
  toggleStatus(): void {
    this.filterIssues(); // Refrescar la lista filtrada
  }

  activateIssue(id: number | undefined): void {
    if (id !== undefined) {
      this.issueService.activateIssue(id).subscribe({
        next: () => {
          this.getIssues();
        },
        error: (err) => {
          console.error('Error activating supplier:', err);
        }
      });
    } else {
      console.error('Invalid supplier ID');
    }
  }

  inactivateIssue(id: number | undefined): void {
    if (id !== undefined) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción desactivará el tema.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          this.issueService.deactivateIssue(id).subscribe({
            next: () => {
              this.getIssues(); // Refrescar la lista
              Swal.fire({
                title: 'Éxito',
                text: 'El tema ha sido desactivado correctamente.',
                icon: 'success',
                confirmButtonText: 'Aceptar',
              });
            },
            error: (err) => {
              console.error('Error inactivating issue:', err);
              Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al desactivar el tema.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
              });
            },
          });
        }
      });
    } else {
      console.error('Invalid issue ID');
    }
  }

  // Abrir el modal en modo agregar
  openModal(): void {
    this.isEditMode = false;
    this.issueForm = { id: 0, name: '', workshopId: 0, scheduledTime: this.getCurrentDateTime(), state: 'A' };
    this.isModalOpen = true;
  }

  editSupplierDetails(issue: Issue): void {
    this.isEditMode = true;
    this.issueForm = { ...issue };
    this.isModalOpen = true;

    // Verifica que el workshopId esté siendo asignado correctamente
    console.log(this.issueForm.workshopId);  // Debe tener un valor válido
  }

  // Cerrar el modal
  closeModal(): void {
    this.isModalOpen = false;
  }


  addIssue(): void {
    if (this.issueForm.id === 0) {
      this.issueForm.id = undefined; // O eliminar la propiedad id
    }

    this.issueService.createIssue(this.issueForm).pipe(
      finalize(() => {
        this.closeModal(); // ✅ cerrar modal después de actualizar
      })
    ).subscribe({
      next: () => {
        this.getIssues(); // ⚠️ esto es async
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


  // Ajusta el tipo de datos a un array de objetos con id y name
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



  exportToPDFGrouped(): void {
    const doc = new jsPDF();
    const groupedIssues = this.groupIssuesByWorkshop();
    let yOffset = 20;

    doc.text('Lista de Temas Agrupados por Taller', 20, yOffset);
    yOffset += 10;

    for (const [workshopName, issues] of Object.entries(groupedIssues)) {
      doc.text(`Taller: ${workshopName}`, 20, yOffset);
      yOffset += 10;

      issues.forEach((issue, index) => {
        doc.text(`${index + 1}. ${issue.name} - ${issue.state}`, 30, yOffset);
        yOffset += 10;
      });

      yOffset += 10; // Espaciado entre talleres
    }

    doc.save('temas_por_taller.pdf');
  }


  exportToXLSGrouped(): void {
    const groupedIssues = this.groupIssuesByWorkshop();
    const wb = XLSX.utils.book_new();

    for (const [workshopName, issues] of Object.entries(groupedIssues)) {
      const ws = XLSX.utils.json_to_sheet(
        issues.map((issue) => ({
          Nombre: issue.name,
          Estado: issue.state,
        }))
      );

      XLSX.utils.book_append_sheet(wb, ws, workshopName.substring(0, 31)); // Limitar a 31 caracteres
    }

    XLSX.writeFile(wb, 'temas_por_taller.xlsx');
  }


  exportToCSVGrouped(): void {
    const groupedIssues = this.groupIssuesByWorkshop();
    let csvContent = 'Taller,Nombre,Estado\n';

    for (const [workshopName, issues] of Object.entries(groupedIssues)) {
      csvContent += `Taller: ${workshopName}\n`; // Encabezado del taller
      issues.forEach((issue) => {
        csvContent += `${workshopName},${issue.name},${issue.state}\n`;
      });
      csvContent += '\n'; // Espaciado entre talleres
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'temas_por_taller.csv';
    a.click();
  }

  groupIssuesByWorkshop(): Record<string, Issue[]> {
    return this.filteredIssues.reduce((grouped, issue) => {
      const workshopName = issue.workshopName || 'Sin Taller'; // Nombre del taller
      if (!grouped[workshopName]) {
        grouped[workshopName] = [];
      }
      grouped[workshopName].push(issue);
      return grouped;
    }, {} as Record<string, Issue[]>);
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

  get totalPages(): number {
    return Math.ceil(this.filteredIssues.length / this.itemsPerPage);
  }

  // Método para obtener los registros para la página actual
  get paginatedIssues(): Issue[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredIssues.slice(start, end);
  }


  // Método para cambiar de página
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return; // Asegurarse de que la página esté dentro del rango
    this.currentPage = page;
  }

  onModalClosed(): void {
    this.isModalOpen = false;
  }

  onIssueSaved(issue: Issue): void {
    console.log('Asistencia guardada:', issue);
    this.isModalOpen = false;
  }

  handleCloseModal() {
    this.isModalOpen = false;
  }

  handleSaveIssue(issue: Issue) {
    // lógica para guardar el tema
    this.isModalOpen = false;
  }
}
