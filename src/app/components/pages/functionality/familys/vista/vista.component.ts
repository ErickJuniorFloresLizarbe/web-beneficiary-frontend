import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonaService } from '../../../../../services/person.service';
import { Person } from '../../../../../interfaces/person';
import { FormulariopersonaComponent } from '../formularioPerson/formulariopersona.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vista',
  standalone: true,
  imports: [CommonModule, FormulariopersonaComponent],
  templateUrl: './vista.component.html',
  styleUrl: './vista.component.css'
})
export class VistaComponent implements OnInit {
  @Input() familyId: number | undefined;
  @Input() members: Person[] = [];
  @Output() closeModal = new EventEmitter<void>();

  currentPage: number = 1;
  membersPerPage: number = 3;
  pagedMembers: Person[] = [];
  pages: number[] = [];
  showPersonForm: boolean = false;

  constructor(private personaService: PersonaService) {}

  onClose(): void {
    this.closeModal.emit();
  }

  ngOnInit(): void {
    this.loadFamilyMembers();
  }

  loadFamilyMembers(): void {
    if (this.familyId) {
      this.personaService.getPersonsByFamilyId(this.familyId).subscribe({
        next: (persons) => {
          // Usando idPerson en lugar de id para ordenar
          this.members = persons.sort((a, b) => (a.idPerson || 0) - (b.idPerson || 0));
          this.paginate();
        },
        error: (error) => {
          console.error('Error al cargar miembros de la familia:', error);
        }
      });
    }
  }

  paginate(): void {
    if (this.members.length > 0) {
      const totalPages = Math.ceil(this.members.length / this.membersPerPage);
      this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
      this.updatePagedMembers();
    }
  }

  updatePagedMembers(): void {
    if (this.members.length > 0) {
      this.pagedMembers = this.members.slice(
        (this.currentPage - 1) * this.membersPerPage,
        this.currentPage * this.membersPerPage
      );
    }
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.updatePagedMembers();
  }

  openAddMemberForm(): void {
    this.showPersonForm = true;
  }

  onPersonFormClosed(): void {
    this.showPersonForm = false;
  }

  onPersonsCreated(persons: Person[]): void {
    // Recargar los miembros de la familia después de crear nuevas personas
    this.loadFamilyMembers();
    this.showPersonForm = false;
  }

  getFormattedDate(dateString: string | Date): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} - ${month} - ${year}`;
  }

  deletePerson(idPerson: number): void {
    console.log('ID de la persona a eliminar:', idPerson); // Verifica el ID
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará lógicamente a la persona.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.personaService.logicallyDeletePerson(idPerson).subscribe({
          next: (response) => {
            console.log('Persona eliminada lógicamente:', response);
            Swal.fire({
              title: 'Eliminado!',
              text: 'La persona ha sido eliminada correctamente.',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            }).then(() => {
              this.loadFamilyMembers();
            });
          },
          error: (error) => {
            console.error('Error al eliminar la persona:', error);
            Swal.fire({
              title: 'Error!',
              text: 'Ocurrió un error al eliminar la persona.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        });
      }
    });
  }

}
