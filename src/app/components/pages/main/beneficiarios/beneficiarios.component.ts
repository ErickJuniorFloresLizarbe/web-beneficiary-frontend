import { Component, OnInit } from '@angular/core';
import { BeneficiaryService } from '../../../../services/beneficiary.service';
import { BeneficiaryDTO } from '../../../../interfaces/beneficiaryDTO';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormEditComponent } from '../beneficiarios/form-edit/form-edit.component';
import { PdfService } from '../../../../report/beneciaryPdf.service';


@Component({
  standalone: true,
  selector: 'app-beneficiarios',
  templateUrl: './beneficiarios.component.html',
  imports: [CommonModule, FormsModule, FormEditComponent],
})
export class BeneficiariosComponent implements OnInit {

  //ATRIBUTOS USADOS PARA LAS FUNCIONES 
  beneficiarios: BeneficiaryDTO[] = [];
  selectedBeneficiario: BeneficiaryDTO | null = null;
  isEditing: boolean = false;
  selectedEducation: any = null;
  isEditingEducation: boolean = false;
  selectedHealth: any = null;
  isEditingHealth: boolean = false;
  estadoActual: string = 'A';
  estadoApadrinamiento: string = 'NO';
  tipoParentesco: string = 'HIJO';
  isModalVisible: boolean = false;
  isHealthModalVisible: boolean = false;
  beneficiariosFiltrados: BeneficiaryDTO[] = [];
  searchTerm: string = '';
  showBeneficiarioDetails: boolean = true;
  // Variables de paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  filtroActivo: boolean = false; 

  mensajeBeneficiarios: string = 'Vista de los Beneficiarios';
  mensajeBeneficiariosEstado: string = 'Activos';
  
  beneficiariosStats: any = {
    totalBeneficiarios: 0,
    totalNoApadrinados: 0,
    totalApadrinados: 0,
    beneficiariosActivos: 0,
    beneficiariosInactivos: 0
  };


  constructor(private BeneficiaryService: BeneficiaryService, private pdfService: PdfService) { }

  
  ngOnInit(): void {
    this.cargarBeneficiarios();
    this.cargarEstadisticasBeneficiarios();
  }
  
  cargarEstadisticasBeneficiarios(): void {
    // Llamar a la API inicialmente
    this.BeneficiaryService.getBeneficiariosStats().subscribe(stats => {
      this.beneficiariosStats = stats;
    });

    // Configurar un intervalo para recargar estadísticas cada 10 segundos
    setInterval(() => {
      this.BeneficiaryService.getBeneficiariosStats().subscribe(stats => {
        this.beneficiariosStats = stats;
      });
    }, 5000); // 10000 milisegundos = 10 segundos
  }

  //ITEMS DE FILAS DE LA TABLA 10 15 20
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPages) {
      this.currentPage = pagina;
      this.filtrarBeneficiarios(this.currentPage);
    }
  }
  
  //CAMBIO DE PAGINA EN TABLA
  cambiarItemsPorPagina(cantidad: number): void {
    this.itemsPerPage = cantidad;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.beneficiarios.length / this.itemsPerPage);
    this.filtrarBeneficiarios();
  }
  
  // FUNCION PARA PAGINAR RESULTADOS DEL FILTRO
  private paginarResultados(resultados: any[], page: number): void {
    this.totalPages = Math.ceil(resultados.length / this.itemsPerPage);
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.beneficiariosFiltrados = resultados.slice(start, end);
  }

  // FILTRO DE BENEFICIARIOS USANDO LA FUNCION DE PAGINAR RESULADO
  filtrarBeneficiarios(page: number = this.currentPage): void {
    let resultados = this.beneficiarios;

    if (this.searchTerm) {
      const lowerCaseSearch = this.searchTerm.toLowerCase();
      resultados = resultados.filter(b =>
        b.name.toLowerCase().includes(lowerCaseSearch) ||
        b.surname.toLowerCase().includes(lowerCaseSearch) ||
        b.documentNumber.toLowerCase().includes(lowerCaseSearch)
      );
    }

    this.paginarResultados(resultados, page);
  }

  // FILTRO DE BENEFICIARIOS JOVENES - USANDO LA FUNCION DE PAGINAR RESULADO
  filtrarBeneficiariosJovenes(page: number = this.currentPage): void {
    let resultados = this.beneficiarios;

    // Si el filtro está activo, lo desactivamos y mostramos todos los resultados
    if (this.filtroActivo) {
      this.filtroActivo = false;
      this.paginarResultados(this.beneficiarios, page);
      return;
    }

    // Aplicamos el filtro
    if (this.searchTerm) {
      const lowerCaseSearch = this.searchTerm.toLowerCase();
      resultados = resultados.filter(b =>
        b.age.toString().toLowerCase().includes(lowerCaseSearch)
      );
    }

    resultados = resultados.filter(b => b.age >= 18);

    this.filtroActivo = true; // Activamos el estado del filtro
    this.paginarResultados(resultados, page);
  }

  //BOTON DE PARA LISTAR APADRINADO
  cambiarApadrinamientoSi(): void {
      this.estadoApadrinamiento = 'SI';
      this.mensajeBeneficiarios = 'Vista de los Apadrinados'; // Cambia el mensaje aquí
      this.cargarBeneficiarios();
  }

  //BOTON DE PARA LISTAR BENEFICIARIO 
  cambiarApadrinamientoNo(): void {
      this.estadoApadrinamiento = 'NO';
      this.mensajeBeneficiarios = 'Vista de los Beneficiarios'; // Cambia el mensaje aquí
      this.cargarBeneficiarios();
  }

  // METODO PARA FORMATEAR FECHA
  formatBirthdate(dateString: string): string {
      if (!dateString) {
          return 'Fecha no válida'; // O cualquier otro valor predeterminado que desees
      }

      const dateParts = dateString.split('-'); // suponiendo formato 'YYYY-MM-DD'
      if (dateParts.length !== 3) {
          return 'Fecha no válida'; // Manejo de error si el formato es incorrecto
      }

      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // meses de 0 a 11
      const day = parseInt(dateParts[2], 10);
      const date = new Date(year, month, day); // crea en la zona local sin hora
      const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
      return date.toLocaleDateString('es-PE', options).replace(/\s/g, ' - ');
  }

  //LISTA DE ESTADO ACTIVO Y INACTIVO
  cambiarEstadoActivo(): void {
    this.estadoActual = 'A';
    this.mensajeBeneficiariosEstado = 'Activos';
    this.cargarBeneficiarios();
  }

  //LISTA DE ESTADO ACTIVO Y INACTIVO
  cambiarEstadoInactivo(): void {
    this.estadoActual = 'I';
    this.mensajeBeneficiariosEstado = 'Inactivos';
    this.cargarBeneficiarios();
  }

  //LISTADO DE BENEFICIARIOS Y APADRINADOS
  cargarBeneficiarios(): void {
    const ordenar = (a: any, b: any) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }) ||
      a.surname.localeCompare(b.surname, 'es', { sensitivity: 'base' });

    const setBeneficiarios = (data: BeneficiaryDTO[]) => {
      this.beneficiarios = data.sort(ordenar);
      this.currentPage = 1;
      this.filtrarBeneficiarios();
    };

    if (this.estadoApadrinamiento === 'SI') {
      this.BeneficiaryService
        .getPersonsBySponsoredAndState(this.estadoApadrinamiento, this.estadoActual)
        .subscribe(setBeneficiarios);
    } else {
      this.BeneficiaryService
        .getPersonsByTypeKinshipAndState(this.tipoParentesco, this.estadoActual)
        .subscribe(setBeneficiarios);
    }
  }


  //BOTON DE ELIMINAR Y RESTAURAR BENEFICIARIO Y APADRINADO
  toggleEstado(beneficiario: BeneficiaryDTO): void {
    if (beneficiario.state === 'A') {
      this.BeneficiaryService.deletePerson(beneficiario.idPerson).subscribe(() => {
        beneficiario.state = 'I';
      });
    } else {
      this.BeneficiaryService.restorePerson(beneficiario.idPerson).subscribe(() => {
        beneficiario.state = 'A';
      });
    }
  }

  //FUNCIÓN DE VISTA DE DETALLES DE BENEFICIARIO POR ID  
  verDetalles(id: number): void {
    this.BeneficiaryService.getPersonByIdWithDetails(id).subscribe(data => {
      this.selectedBeneficiario = data;
      this.isEditing = false;
    });
  }

  //FUNCION PARA DESCARGAR EN PDF DE CADA USUARIO
  descargarPdf(beneficiarioId: number | null): void {
    if (beneficiarioId !== null) {
      this.BeneficiaryService.getPersonByIdWithDetails(beneficiarioId).subscribe(
        (data) => {
          this.pdfService.generateBeneficiarioPdf(data);
        },
        (error) => {
          console.error('Error al obtener los detalles del beneficiario:', error);
        }
      );
    } else {
      console.error('No se ha seleccionado ningún beneficiario');
    }
  }

  //ABRE EL MODAL PARA HACER LA ACTUALIZACION DE BENEFICIARIO Y APADRINADO
  editarBeneficiario(beneficiario: BeneficiaryDTO): void {
    this.selectedBeneficiario = { ...beneficiario };
    this.isEditing = true;
  }

  //GUARDAMOS LOS CAMBIOS DE LA ACTUALIZACION DE LOS BENEFICIARIO Y APADRINADO
  guardarCambios(): void {
    if (this.selectedBeneficiario) {
      const id = this.selectedBeneficiario.idPerson;
      this.BeneficiaryService.updatePersonData(id, this.selectedBeneficiario).subscribe({
        next: () => {
          alert('Beneficiario actualizado correctamente');
          this.cargarBeneficiarios();
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al actualizar beneficiario', error);
          alert('Error al actualizar el beneficiario');
        }
      });
    }
  }

  //CIERRA EL MODAL DE LA ACTUALIZACION DE BENEFICIARIO Y APADRINADO
  cerrarModal(): void {
    this.selectedBeneficiario = null;
    this.isEditing = false;
  }

  //ABRE EL MODAL PARA HACER LA CORRECION DE EDUCATION
  editarEducacion(edu: any): void {
    this.selectedEducation = { ...edu };
    this.isEditingEducation = true;
  }

  //GUARDAMOS LOS CAMBIOS DE LA CORRECION DE EDUCATION
  guardarEducacion(): void {
    if (this.selectedBeneficiario && this.selectedEducation) {
      const id = this.selectedBeneficiario.idPerson;
      const payload = {
        idPerson: id,
        education: [this.selectedEducation]
      };

      console.log('Payload enviado a la API:', payload);

      this.BeneficiaryService.correctEducationAndHealth(id, payload).subscribe({
        next: () => {
          alert('Educación actualizada correctamente');
          this.cargarBeneficiarios();
          this.verDetalles(id);
          this.cerrarModalEducacion();
        },
        error: (error) => {
          console.error('Error al actualizar educación', error);
          alert('Error al actualizar la educación');
        }
      });
    }
  }

  //CIERRA EL MODAL DE LA CORRECION DE EDUCATION
  cerrarModalEducacion(): void {
    this.selectedEducation = null;
    this.isEditingEducation = false;
  }

  //ABRE EL MODAL PARA HACER CORRECION DE SALUD
  editarSalud(health: any): void {
    this.selectedHealth = { ...health };
    this.isEditingHealth = true;
  }

  //GUARDAMOS LOS CAMBIOS DE LA CORRECION DE SALUD
  guardarSalud(): void {
    if (this.selectedBeneficiario && this.selectedHealth) {
      const id = this.selectedBeneficiario.idPerson;
      const healthId = this.selectedHealth.idHealth; // Asegúrate de tener el idHealth existente

        // Crea el payload sin un nuevo idHealth
        const payload = {
            idPerson: id,
            health: [{
                idHealth: healthId, // Incluye el idHealth existente
                // Agrega aquí los demás datos que deseas actualizar
                ...this.selectedHealth // Esto incluye otros atributos de selectedHealth
            }]
        };

      console.log('Payload enviado a la API:', payload);

      this.BeneficiaryService.correctEducationAndHealth(id, payload).subscribe({
        next: () => {
          alert('Salud actualizada correctamente');
          this.cargarBeneficiarios();
          this.verDetalles(id);
          this.cerrarModalSalud();
        },
        error: (error) => {
          console.error('Error al actualizar salud', error);
          alert('Error al actualizar la salud');
        }
      });
    }
  }

  //CIERRA EL MODAL DE LA CORRECION DE SALUD
  cerrarModalSalud(): void {
    this.selectedHealth = null;
    this.isEditingHealth = false;
  }

  //ABRE MODAL PARA ACTUALIZA LA EDUCATION Y GENERA NUEVO ID
  openModal(beneficiario: BeneficiaryDTO): void {
    this.selectedBeneficiario = beneficiario;
    this.isModalVisible = true;
    this.showBeneficiarioDetails = false;

    // CARGA LA EDUCACIÓN CON MAYOR idEducation
    this.BeneficiaryService.getPersonByIdWithDetails(beneficiario.idPerson).subscribe(data => {
      const educations = data.education || [];

      if (educations.length > 0) {
        // Ordenar de mayor a menor y tomar la primera (última educación)
        const lastEducation = [...educations].sort((a, b) => b.idEducation - a.idEducation)[0];

        // Crear copia sin idEducation (para que al guardar cree una nueva)
        this.selectedEducation = {
          ...lastEducation,
          idEducation: 0,
          entryDate: new Date().toISOString().split('T')[0], // Fecha actual en formato yyyy-MM-dd
        };
      } else {
        // Si no hay educación previa, crear una nueva vacía
        this.selectedEducation = {
          idEducation: 0,
          degreeStudy: '',
          gradeBook: '',
          gradeAverage: 0,
          fullNotebook: '',
          assistance: '',
          schollName: '',
          entryDate: new Date().toISOString().split('T')[0],
          tutorials: '',
          personId: beneficiario.idPerson,
        };
      }
    });
  }


  //CIERRA, REFRESCA Y MUESTRA EL MODAL DEL BENFICIARIO ACTUALIZADO EN EDUCATION
  closeModal(): void {
    this.isModalVisible = false;
    this.showBeneficiarioDetails = true;

    if (this.selectedBeneficiario) {
      this.BeneficiaryService.getPersonByIdWithDetails(this.selectedBeneficiario.idPerson).subscribe(updatedBeneficiario => {
        this.selectedBeneficiario = updatedBeneficiario;
        this.selectedEducation = updatedBeneficiario.education[0] || {};
        this.selectedHealth = updatedBeneficiario.health[0] || {};
        this.isEditing = false;
      });
    }
  }

  //GUARDA Y CIERRA EL BENEFICIARIO ACTULIZADO EN EDUCATION
  saveEducation(updatedEducation: any): void {
    if (!this.selectedBeneficiario) return;

    // Clonamos la educación y eliminamos idEducation
    const { idEducation, ...educationWithoutId } = updatedEducation;

    const educationToSave = {
      ...educationWithoutId,
      personId: this.selectedBeneficiario.idPerson
    };

    const updatedData: BeneficiaryDTO = {
      ...this.selectedBeneficiario,
      education: [educationToSave]
    };

    this.BeneficiaryService.updatePerson(this.selectedBeneficiario.idPerson, updatedData).subscribe(() => {
      this.closeModal();
      this.cargarBeneficiarios();
    });
  }

  //ABRE MODAL PARA EDITAR SALUD Y GENERA NUEVO ID
  openHealthModal(beneficiario: BeneficiaryDTO): void {
    this.selectedBeneficiario = beneficiario;
    this.isHealthModalVisible = true;
    this.showBeneficiarioDetails = false;

    this.BeneficiaryService.getPersonByIdWithDetails(beneficiario.idPerson).subscribe(data => {
      const healthRecords = data.health || [];

      if (healthRecords.length > 0) {
        // Obtener el último registro de salud por idHealth (si lo tienes, si no, usar otro criterio como personId)
        const lastHealth = [...healthRecords].sort((a, b) => b.idHealth - a.idHealth)[0];

        // Crear una copia sin ID para generar uno nuevo al guardar
        this.selectedHealth = {
          ...lastHealth,
          idHealth: 0,
          applicationDate: new Date().toISOString().split('T')[0], // Fecha actual
        };
      } else {
        // Si no hay datos previos, crear un objeto nuevo vacío
        this.selectedHealth = {
          vaccine: '',
          vph: '',
          influenza: '',
          deworming: '',
          hemoglobin: '',
          applicationDate: new Date().toISOString().split('T')[0],
          condicionBeneficiary: '',
          personId: beneficiario.idPerson
        };
      }
    });
  }

  //CIERRA, REFRESCA Y MUESTRA EL MODAL DEL BENFICIARIO ACTUALIZADO EN EDUCATION
  closeHealthModal(): void {
    this.isHealthModalVisible = false;
    this.showBeneficiarioDetails = true;

    if (this.selectedBeneficiario) {
      this.BeneficiaryService.getPersonByIdWithDetails(this.selectedBeneficiario.idPerson).subscribe(updatedBeneficiario => {
        this.selectedBeneficiario = updatedBeneficiario;
        this.selectedEducation = updatedBeneficiario.education[0] || {};
        this.selectedHealth = updatedBeneficiario.health[0] || {};
        this.isEditing = false;
      });
    }
  }

    
  //GUARDA Y CIERRA EL BENEFICIARIO ACTULIZADO EN SALUD
  saveHealthChanges(updatedHealth: any): void {
    if (!this.selectedBeneficiario) return;

    // Clonamos la educación y eliminamos idEducation
    const { idHealth, ...healthWithoutId } = updatedHealth;

    // Elimina cualquier campo innecesario si hace falta, como un idHealth
    const healthToSave = {
      ...healthWithoutId,
      personId: this.selectedBeneficiario.idPerson
    };

    const updatedData: BeneficiaryDTO = {
      ...this.selectedBeneficiario,
      health: [healthToSave]
    };

    this.BeneficiaryService.updatePerson(this.selectedBeneficiario.idPerson, updatedData).subscribe(() => {
      this.closeHealthModal();
      this.cargarBeneficiarios();
    });
  }


}

