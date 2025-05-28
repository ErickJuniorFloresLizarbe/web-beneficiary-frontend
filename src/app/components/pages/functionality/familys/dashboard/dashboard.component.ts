import { Component, OnInit, Renderer2 } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { FamilyService } from '../../../../../services/family.service';
import { Family } from '../../../../../interfaces/familiaDto';
import { Person } from '../../../../../interfaces/person';
import { PersonaService } from '../../../../../services/person.service';
import { FormulariofamiliaComponent } from '../formulariofamilia/formulariofamilia.component';
import { FormulariopersonaComponent } from '../formularioPerson/formulariopersona.component';
import { VistaComponent } from '../vista/vista.component';
import { FamilyExcelService } from '../../../../../report/familyExcel.service';
import { FamilyPdfService } from '../../../../../report/familyPdf.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FormulariofamiliaComponent,
    FormulariopersonaComponent,
    VistaComponent,
  ],
  providers: [FamilyService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  displayed: Family[] = [];
  family: Family[] = [];
  filtered: Family[] = [];
  familyMembers: Person[] = [];
  selectedFamilyId: number | undefined;
  selectedFamily: Family | undefined;
  familySelected: Family | null = null;
  newFamily: Family = this.initializeFamily();
  isCreateFamilyModalOpen = false;
  isViewModalOpen = false;
  isEditModalOpen = false;
  isConfirmModalOpen = false;
  isFamilyMembersModalOpen = false;
  isFamilyInfoModalOpen = false;
  isPersonFormOpen = false;
  currentPage = 1;
  itemsPerPage = 5;
  total = 0;
  totalPages = 0;
  searchText = '';
  filterOption = 'Apellido';
  showFilterOptions = false;
  isActive: boolean = true;
  darkMode: boolean = false;
  formSubmitted: boolean = false; // Nueva propiedad para controlar si el formulario ha sido enviado

  // Dashboard metrics
  activeFamiliesCount: number = 0;
  inactiveFamiliesCount: number = 0;
  totalMembersCount: number = 0;

  constructor(
    private familyService: FamilyService,
    private personaService: PersonaService,
    private familyExcelService: FamilyExcelService,
    private familyPdfService: FamilyPdfService,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    this.loadFamily();
    this.loadDashboardMetrics();
  }

  loadDashboardMetrics(): void {
    // Get active families count
    this.familyService.getFamiliesActive().subscribe((data: Family[]) => {
      this.activeFamiliesCount = data.length
    })

    // Get inactive families count
    this.familyService.getFamiliesInactive().subscribe((data: Family[]) => {
      this.inactiveFamiliesCount = data.length
    })

    // Get total members count
    this.personaService.getPersons().subscribe((data: Person[]) => {
      this.totalMembersCount = data.length
    })
  }

  loadFamily(): void {
    (this.isActive
      ? this.familyService.getFamiliesActive()
      : this.familyService.getFamiliesInactive()
    ).subscribe(
      (data: Family[]) => {
        this.family = data.sort((a, b) => a.id - b.id);
        this.total = data.length;
        this.totalPages = Math.ceil(this.total / this.itemsPerPage);
        this.updateFiltered();
      },
      (error) => {
        console.error('❌ Error fetching family ');
      }
    );
  }

  toggleActiveStatus(): void {
    this.loadFamily();
  }

  updateFiltered(): void {
    const allFiltered = this.family.filter((family) => {
      if (this.filterOption === 'Apellido') {
        return family.lastName
          .toLowerCase()
          .includes(this.searchText.toLowerCase());
      } else {
        return family.direction
          .toLowerCase()
          .includes(this.searchText.toLowerCase());
      }
    });

    this.total = allFiltered.length;
    this.totalPages = Math.ceil(this.total / this.itemsPerPage);
    this.currentPage = 1;

    this.filtered = allFiltered;

    this.updateDisplayed();
  }

  updateDisplayed(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayed = this.filtered.slice(startIndex, endIndex);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayed();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayed();
    }
  }

  toggleFilterOption(): void {
    this.showFilterOptions = !this.showFilterOptions;
  }

  setFilterOption(option: string): void {
    this.filterOption = option;
    this.showFilterOptions = false;
    this.updateFiltered();
  }

  getFormattedDate(dateString?: string): string {
    if (!dateString) return '---'; // Handle null or undefined
    const date = new Date(dateString);

    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day} - ${month} - ${year}`;
  }

  eliminarFamilia(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la familia de forma lógica.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.familyService.deleteFamily(id).subscribe(
          () => {
            Swal.fire('Eliminado', 'La familia ha sido eliminada.', 'success');
            this.loadFamily();
            this.loadDashboardMetrics();
          },
          (error) => {
            console.error('Error al eliminar la familia:', error);
            Swal.fire(
              'Error',
              'Ocurrió un error al eliminar la familia.',
              'error'
            );
          }
        );
      }
    });
  }

  reactivarFamilia(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción reactivará la familia.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, reactivar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.familyService.activeFamily(id).subscribe(
          () => {
            Swal.fire(
              'Reactivado',
              'La familia ha sido reactivada.',
              'success'
            );
            this.loadFamily();
            this.loadDashboardMetrics();
          },
          (error) => {
            console.error('Error al reactivar la familia:', error);
            Swal.fire(
              'Error',
              'Ocurrió un error al reactivar la familia.',
              'error'
            );
          }
        );
      }
    });
  }

  openViewModal(familyId: number): void {
    this.selectedFamilyId = familyId;
    this.isConfirmModalOpen = true;
  }

  viewMembers(): void {
    if (this.selectedFamilyId) {
      this.personaService.getPersonsByFamilyId(this.selectedFamilyId).subscribe(
        (members: Person[]) => {
          this.familyMembers = members;
          this.isViewModalOpen = true;
          this.isConfirmModalOpen = false;
        },
        (error) => {
          console.error('Error fetching family members', error);
          this.isConfirmModalOpen = false;
          Swal.fire(
            'Error',
            'No se pudieron cargar los miembros de la familia.',
            'error'
          );
        }
      );
    }
  }

  viewFamilyInfo(): void {
    if (this.selectedFamilyId) {
      this.familyService
        .getFamilyInformationById(this.selectedFamilyId)
        .subscribe(
          (family: Family) => {
            this.familySelected = family;
            this.isFamilyInfoModalOpen = true;
            this.isConfirmModalOpen = false;
          },
          (error) => {
            console.error('Error fetching family details', error);
            this.isConfirmModalOpen = false;
          }
        );
    }
  }

  onPersonFormClosed() {
    this.isPersonFormOpen = false;
    this.isFamilyInfoModalOpen = true;
    this.loadDashboardMetrics();
  }

  openCreateFamilyModal(): void {
    this.isCreateFamilyModalOpen = true;
    this.newFamily = this.initializeFamily();
    this.formSubmitted = false; // Reiniciar el estado de envío del formulario
  }

  // Nuevo método para validar y crear familia
  validateAndCreateFamily(form: NgForm): void {
    this.formSubmitted = true; // Marcar el formulario como enviado

    if (form.invalid) {
      // Si el formulario es inválido, mostrar mensaje de error
      Swal.fire({
        title: 'Formulario incompleto',
        text: 'Por favor, completa todos los campos requeridos antes de guardar.',
        icon: 'warning',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    // Si el formulario es válido, proceder con la creación
    this.createFamily();
  }

  createFamily(): void {
    this.familyService
      .createFamily(this.newFamily)
      .subscribe((family: Family) => {
        this.isCreateFamilyModalOpen = false;
        this.loadFamily();
        this.loadDashboardMetrics();
        this.resetNewFamily();
        this.familySelected = family;

        this.isPersonFormOpen = true;
        Swal.fire('Éxito', 'Familia creada exitosamente.', 'success');
      });
  }

  initializeFamily(): Family {
    return {
      id: 0,
      lastName: '',
      direction: '',
      reasibAdmission: '',
      numberMembers: 0,
      numberChildren: 0,
      familyType: '',
      socialProblems: '',
      weeklyFrequency: '',
      feedingType: '',
      safeType: '',
      familyDisease: '',
      treatment: '',
      diseaseHistory: '',
      medicalExam: '',
      tenure: '',
      status: 'A',
      basicService: {
        waterService: '',
        servDrain: '',
        servLight: '',
        servCable: '',
        servGas: '',
        area: '',
        referenceLocation: '',
        residue: '',
        publicLighting: '',
        security: '',
        material: '',
        feeding: '',
        economic: '',
        spiritual: '',
        socialCompany: '',
        guideTip: '',
      },
      housingDetails: {
        typeOfHousing: '',
        housingMaterial: '',
        housingSecurity: '',
        homeEnvironment: 0,
        bedroomNumber: 0,
        habitability: '',
        numberRooms: 0,
        numberOfBedrooms: 0,
        habitabilityBuilding: '',
      },
    };
  }

  resetFamilyForm(): void {
    this.familySelected = null;
  }

  resetNewFamily(): void {
    this.newFamily = this.initializeFamily();
    this.formSubmitted = false; // Reiniciar el estado de envío del formulario
  }

  closeCreateFamilyModal(): void {
    this.isCreateFamilyModalOpen = false;
    this.resetNewFamily();
  }

  closeFamilyInfoModal(): void {
    this.isFamilyInfoModalOpen = false;
    this.loadFamily();
    this.loadDashboardMetrics();
    this.selectedFamily = undefined;
    this.resetFamilyForm();
  }

  cancelView(): void {
    this.isConfirmModalOpen = false;
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedFamily = undefined;
  }

  exportToExcel(): void {
    this.familyService.getFamiliesActive().subscribe({
      next: (families) => {
        this.personaService.getPersons().subscribe({
          next: (persons: Person[]) => {
            this.familyExcelService.exportCombined(families, persons);
          },
          error: (err: any) => {
            console.error('Error al obtener personas para Excel:', err);
          }
        });
      },
      error: (err: any) => {
        console.error('Error al exportar a Excel:', err);
      }
    });
  }

  exportToPdf(): void {
    this.familyService.getFamiliesActive().subscribe({
      next: (families) => {
        this.personaService.getPersons().subscribe({
          next: (persons: Person[]) => {
            // Generate consolidated report with all families
            this.familyPdfService.generateConsolidatedReport(families, persons);
          },
          error: (err: any) => {
            console.error('Error al obtener personas para PDF:', err);
            Swal.fire(
              'Error',
              'Ocurrió un error al generar el informe PDF.',
              'error'
            );
          }
        });
      },
      error: (err: any) => {
        console.error('Error al obtener familias para PDF:', err);
        Swal.fire(
          'Error',
          'Ocurrió un error al generar el informe PDF.',
          'error'
        );
      }
    });
  }

  exportSingleFamilyToPdf(familyId: number): void {
    this.familyService.getFamilyInformationById(familyId).subscribe({
      next: (family: Family) => {
        this.personaService.getPersonsByFamilyId(familyId).subscribe({
          next: (members: Person[]) => {
            // Generate detailed report for a specific family
            this.familyPdfService.generateDetailedFamilyReport(family, members);
          },
          error: (err: any) => {
            console.error('Error al obtener miembros de la familia para PDF:', err);
            Swal.fire(
              'Error',
              'Ocurrió un error al generar el informe PDF de la familia.',
              'error'
            );
          }
        });
      },
      error: (err: any) => {
        console.error('Error al obtener información de la familia para PDF:', err);
        Swal.fire(
          'Error',
          'Ocurrió un error al generar el informe PDF de la familia.',
          'error'
        );
      }
    });
  }
}
