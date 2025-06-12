import { Component, OnInit } from '@angular/core';
import { BeneficiaryService } from '../../../../services/beneficiary.service';
import { BeneficiaryDTO } from '../../../../interfaces/beneficiaryDTO';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormEditComponent } from '../beneficiarios/form-edit/form-edit.component';
import { PdfService } from '../../../../report/beneciaryPdf.service';
import Swal from 'sweetalert2';


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

  // PANEL DE DATA DE LOS HIJOS
  beneficiariosStats: any = {
    totalBeneficiarios: 0,
    totalNoApadrinados: 0,
    totalApadrinados: 0,
    beneficiariosActivos: 0,
    beneficiariosInactivos: 0,
    totalBeneficiariosJovenes: 0
  };

  //VALIDACION DE CORRECTION DE DATO
  errores: string[] = [];
  public errors: string[] = [];
  public errHealth: string[] = [];

  constructor(private BeneficiaryService: BeneficiaryService, private pdfService: PdfService) { }

  ngOnInit(): void {
    this.cargarBeneficiarios();
    this.cargarEstadisticasBeneficiarios();
  }
  
  // CARGA LA DATA DEL PANEL DE INFORMACION
  cargarEstadisticasBeneficiarios(): void {
    this.BeneficiaryService.getBeneficiariosStats().subscribe(stats => {
      this.beneficiariosStats = stats;
    });

    setInterval(() => {
      this.BeneficiaryService.getBeneficiariosStats().subscribe(stats => {
        this.beneficiariosStats = stats;
      });
    }, 5000);
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
          Swal.fire({
            title: "Eliminado!",
            text: "La persona " + beneficiario.name + " fue desactivada",
            icon: "success"
          });
    } else {
           this.BeneficiaryService.restorePerson(beneficiario.idPerson).subscribe(() => {
            beneficiario.state = 'A';
          });
          Swal.fire({
            title: "Restaurado!",
            text: "La persona " + beneficiario.name + " fue reactivada",
            icon: "success"
          });
    }
  }


  //FUNCIÓN DE VISTA DE DETALLES DE BENEFICIARIO POR ID  
  verDetalles(id: number): void {
    this.BeneficiaryService.getPersonByIdWithDetails(id).subscribe(
      {
        next: (data) => {
          this.selectedBeneficiario = data;
          this.isEditing = false;
        },
        error: (err) => {

          Swal.fire({
            title: "Importante",
            text: "Por favor, espera un momento...",
            icon: "warning"
          });
        },
      }

    );
  }
  
  //FUNCION PARA DESCARGAR EN PDF DE CADA USUARIO
  descargarPdf(beneficiarioId: number | null): void {
    Swal.fire({
      title: "seguro?",
      text: "desea generar pdf",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, guardar!"
    }).then((result) => {
      if (result.isConfirmed) {
        if (beneficiarioId !== null) {
          this.BeneficiaryService.getPersonByIdWithDetails(beneficiarioId).subscribe(
            async (data) => {
              await this.pdfService.generateBeneficiarioPdf(data);
               Swal.fire({
                title: "Actualizado!",
                text: "Beneficiario actualizado correctamente",
                icon: "success"
              });
            },
            (error) => {
              console.error('Error al obtener los detalles del beneficiario:', error);
            }
          );
        } else {
          console.error('No se ha seleccionado ningún beneficiario');
        }
      }
    });

  }

  //ABRE EL MODAL PARA HACER LA ACTUALIZACION DE BENEFICIARIO Y APADRINADO
  editarBeneficiario(beneficiario: BeneficiaryDTO): void {
    this.selectedBeneficiario = { ...beneficiario };
    this.isEditing = true;
  }

  //GUARDAMOS LOS CAMBIOS DE LA ACTUALIZACION DE LOS BENEFICIARIO Y APADRINADO
  async guardarCambios(): Promise<void> {

    const errores = await this.validacionPersona();

    if (errores.length > 0) {
      this.errores = errores;
      return;
    }

    this.errores=[];

    Swal.fire({
      title: "Esta seguro?",
      text: "Desea actualizar los datos ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "cancelar",
      confirmButtonText: "Si, actualizar!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (this.selectedBeneficiario) {
          const id = this.selectedBeneficiario.idPerson;
          this.BeneficiaryService.updatePersonData(id, this.selectedBeneficiario).subscribe({
            next: async () => {
              Swal.fire({
                title: "Actualizado!",
                text: "Beneficiario actualizado correctamente",
                icon: "success"
              });
              await this.cargarBeneficiarios();
              this.cerrarModal();
            },
            error: (error) => {
              console.error('Error al actualizar beneficiario', error);
              Swal.fire({
                title: "Error!",
                text: "Nose pudo actualzar los datos",
                icon: "error"
              });
            }
          });
        }
      }
    });

  }

  // VALIACION AL FORMULARIO DE ACTUALIZACION BENEFICIARIO Y APADRINADO
  validacionPersona(): string[] {
    let errores: string[] = [];

    if (this.selectedBeneficiario) {

      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.selectedBeneficiario.name || '')) {
        errores.push('El nombre es invalido');
      }

      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.selectedBeneficiario.surname || '')) {
        errores.push('El apellido es invalido');
      }

      if (this.selectedBeneficiario.age == null || this.selectedBeneficiario.age < 0) {
        errores.push('La edad es inválida');
      }

      const fechaNacimiento = new Date(this.selectedBeneficiario.birthdate);
      const hoy = new Date();
      if (fechaNacimiento > hoy) {
        errores.push('La fecha de nacimiento no puede ser futura');
      }

      if (!this.selectedBeneficiario.typeDocument) {
        errores.push('Seleccione un tipo de documento');
      }

      if (this.selectedBeneficiario.typeDocument === 'DNI') {
        if (!/^\d{8}$/.test(this.selectedBeneficiario.documentNumber || '')) {
          errores.push('El DNI debe tener 8 dígitos');
        }
      } else if (this.selectedBeneficiario.typeDocument === 'CNE') {
        if (!/^\d{15}$/.test(this.selectedBeneficiario.documentNumber || '')) {
          errores.push('El CNE debe tener 15 dígitos');
        }
      } else {
        errores.push('Tipo de documento invalido');
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.selectedBeneficiario.typeKinship || '')) {
        errores.push('El parentesco es invalido');
      }
      if (!this.selectedBeneficiario.sponsored ||
        (this.selectedBeneficiario.sponsored !== 'SI' && this.selectedBeneficiario.sponsored !== 'NO')) {
        errores.push('Debe seleccionar si esta apadrinado');
      }

    } else {
      errores.push('No hay datos para validar');
    }

    return errores;
  }

  //CIERRA EL MODAL DE LA ACTUALIZACION DE BENEFICIARIO Y APADRINADO
  cerrarModal(): void {
    this.selectedBeneficiario = null;
    this.isEditing = false;
    this.errores= [];
  }

  //ABRE EL MODAL PARA HACER LA CORRECION DE EDUCATION
  editarEducacion(edu: any): void {
    this.selectedEducation = { ...edu };
    this.isEditingEducation = true;
  }

  //GUARDAMOS LOS CAMBIOS DE LA CORRECION DE EDUCATION
  guardarEducacion(): void {

    this.errors = [];

    const namePattern = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;
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
      text: "Desea actualizar los datos educacion ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "cancelar",
      confirmButtonText: "Si, actualizar!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (this.selectedBeneficiario && this.selectedEducation) {
          const id = this.selectedBeneficiario.idPerson;
          const payload = {
            idPerson: id,
            education: [this.selectedEducation]
          };
          console.log('Payload enviado a la API:', payload);
          this.BeneficiaryService.correctEducationAndHealth(id, payload).subscribe({
            next: () => {
              Swal.fire({
                title: "Exito!",
                text: "datos educacion actualizado correctamente",
                icon: "success"
              });
              this.cargarBeneficiarios();
              this.verDetalles(id);
              this.cerrarModalEducacion();
            },
            error: (error) => {

              Swal.fire({
                title: "Error!",
                text: "No se actualizar los datos de educacion",
                icon: "error"
              });
              console.error('Error al actualizar educación', error);
              alert('Error al actualizar la educación');
            }
          });
        }

      }
    });


  }

  //CIERRA EL MODAL DE LA CORRECION DE EDUCATION
  cerrarModalEducacion(): void {
    this.selectedEducation = null;
    this.isEditingEducation = false;
    this.errors= [];
  }

  //ABRE EL MODAL PARA HACER CORRECION DE SALUD
  editarSalud(health: any): void {
    this.selectedHealth = { ...health };
    this.isEditingHealth = true;
  }

  //GUARDAMOS LOS CAMBIOS DE LA CORRECION DE SALUD
  guardarSalud(): void {
    this.errHealth = [];

    if (!this.selectedHealth.vaccine) {
      this.errHealth.push("Debe seleccionar una opción para Vacuna.");
    }

    if (!this.selectedHealth.vph) {
      this.errHealth.push("Debe seleccionar una opción para VPH.");
    }

    if (!this.selectedHealth.influenza) {
      this.errHealth.push("Debe seleccionar una opción para Influenza.");
    }

    if (!this.selectedHealth.deworming) {
      this.errHealth.push("Debe seleccionar una opción para Desparasitación.");
    }

    if (!this.selectedHealth.hemoglobin) {
      this.errHealth.push("Debe seleccionar una opción para Hemoglobina.");
    }


    if (this.errHealth.length > 0) {
      return;
    }

    Swal.fire({
      title: "Esta seguro?",
      text: "Desea actualizar los datos salud ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      cancelButtonText: "cancelar",
      confirmButtonText: "Si, actualizar!"
    }).then(async (result) => {
      if (result.isConfirmed) {
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
              this.cargarBeneficiarios();
              Swal.fire({
                title: "Exito!",
                text: "datos salud actualizado correctamente",
                icon: "success"
              });
              this.verDetalles(id);
              this.cerrarModalSalud();
            },
            error: (error) => {
              console.error('Error al actualizar salud', error);

              Swal.fire({
                title: "Error!",
                text: "No se actualizar los datos de salud",
                icon: "error"
              });
            }
          });
        }

      }
    });

  }

  //CIERRA EL MODAL DE LA CORRECION DE SALUD
  cerrarModalSalud(): void {
    this.selectedHealth = null;
    this.isEditingHealth = false;
    this.errHealth = []
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

