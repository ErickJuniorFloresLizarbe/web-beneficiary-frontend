import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { Family } from '../../../../../interfaces/familiaDto';
import { FamilyService } from '../../../../../services/family.service';

@Component({
  selector: 'app-formulariofamilia',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './formulariofamilia.component.html',
  styleUrls: ['./formulariofamilia.component.css'],
})
export class FormulariofamiliaComponent {
  @Input() familyToEdit: Family | null = null
  @Output() familyCreated = new EventEmitter<Family>()
  @Output() formClosed = new EventEmitter<void>()

  family: Family = this.initializeFamily()
  familyId: number | null = null
  currentSection = 0

  // Nombres para las secciones del menu
  sections = [
    { title: "Informa. Familiar", icon: "👨‍👩‍👧‍👦" },
    { title: "Entorno Comunitar.", icon: "🏘️" },
    { title: "Composi. Familiar", icon: "👥" },
    { title: "Salud Familiar", icon: "🏥" },
    { title: "Distrib. Vivienda", icon: "🏠" },
    { title: "Autonomía Laboral", icon: "💼" },
    { title: "Vida Social", icon: "🤝" },
  ]

  constructor(
    private familyService: FamilyService,
  ) {}

  ngOnChanges() {
    if (this.familyToEdit) {
      this.family = { ...this.familyToEdit }
      this.familyId = this.family.id
    } else {
      this.family = this.initializeFamily()
      this.familyId = null
    }
  }

  nextSection() {
    // Verificar si hay campos requeridos sin completar en la sección actual
    const currentForm = document.querySelector("form")
    const currentSectionElement = currentForm?.querySelector(`[ngSwitchCase="${this.currentSection}"]`)
    const requiredFields = currentSectionElement?.querySelectorAll("select[required], input[required]")

    let allFieldsValid = true
    let firstInvalidField: HTMLElement | null = null

    requiredFields?.forEach((field) => {
      const inputField = field as HTMLInputElement | HTMLSelectElement
      if (!inputField.value) {
        allFieldsValid = false
        inputField.classList.add("border-red-500")
        if (!firstInvalidField) {
          firstInvalidField = inputField
        }
      } else {
        inputField.classList.remove("border-red-500")
      }
    })

    if (allFieldsValid) {
      if (this.currentSection < this.sections.length - 1) {
        this.currentSection++
      }
    } else {
      // Mostrar mensaje de error y hacer scroll al primer campo inválido
      Swal.fire({
        title: "Campos incompletos",
        text: "Por favor, completa todos los campos requeridos en esta sección antes de continuar.",
        icon: "warning",
        confirmButtonText: "Entendido",
      })
    }
  }

  previousSection() {
    if (this.currentSection > 0) {
      this.currentSection--
    }
  }

  // Método para crear y mandar datos (Crear e Actualizar)
  initializeFamily(): Family {
    return {
      id: 0,
      lastName: "",
      direction: "",
      reasibAdmission: "",
      numberMembers: 0,
      numberChildren: 0,
      familyType: "",
      socialProblems: "",
      weeklyFrequency: "",
      feedingType: "",
      safeType: "",
      familyDisease: "",
      treatment: "",
      diseaseHistory: "",
      medicalExam: "",
      tenure: "",
      status: "A",
      basicService: {
        waterService: "",
        servDrain: "",
        servLight: "",
        servCable: "",
        servGas: "",
        area: "",
        referenceLocation: "",
        residue: "",
        publicLighting: "",
        security: "",
        material: "",
        feeding: "",
        economic: "",
        spiritual: "",
        socialCompany: "",
        guideTip: "",
      },
      housingDetails: {
        typeOfHousing: "",
        housingMaterial: "",
        housingSecurity: "",
        homeEnvironment: 0,
        bedroomNumber: 0,
        habitability: "",
        numberRooms: 0,
        numberOfBedrooms: 0,
        habitabilityBuilding: "",
      },
    }
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      // Verificar si todos los campos requeridos están completos
      const allRequiredFields = document.querySelectorAll("form select[required], form input[required]")
      let allFieldsValid = true
      let firstInvalidField: HTMLElement | null = null

      allRequiredFields.forEach((field) => {
        const inputField = field as HTMLInputElement | HTMLSelectElement
        if (!inputField.value) {
          allFieldsValid = false
          inputField.classList.add("border-red-500")
          if (!firstInvalidField) {
            firstInvalidField = inputField
          }
        } else {
          inputField.classList.remove("border-red-500")
        }
      })

      if (!allFieldsValid) {
        Swal.fire({
          title: "Formulario incompleto",
          text: "Por favor, completa todos los campos requeridos antes de guardar.",
          icon: "warning",
          confirmButtonText: "Entendido",
        })

        // Navegar a la sección que contiene el primer campo inválido
        if (firstInvalidField) {
          const sectionElement = this.findParentSectionElement(firstInvalidField)
          if (sectionElement) {
            const sectionIndex = Number.parseInt(sectionElement.getAttribute("ngSwitchCase") || "0")
            this.currentSection = sectionIndex
            setTimeout(() => {
              firstInvalidField?.scrollIntoView({ behavior: "smooth", block: "center" })
            }, 100)
          }
        }

        return
      }

      if (this.familyId) {
        // Existing update logic...
        this.familyService.updateFamily(this.familyId, this.family).subscribe(
          (response) => {
            console.log("Familia editada:", response)
            this.familyCreated.emit(response)
            Swal.fire({
              title: "Éxito!",
              text: "Registro editado exitosamente!",
              icon: "success",
              confirmButtonText: "Aceptar",
            }).then(() => {
              this.resetForm()
              this.closeForm()
            })
          },
          (error) => {
            console.error("Error al editar la familia:", error)
            Swal.fire({
              title: "Error!",
              text: "Ocurrió un error al editar el registro.",
              icon: "error",
              confirmButtonText: "Aceptar",
            })
          },
        )
      } else {
        // Create new family
        this.familyService.createFamily(this.family).subscribe({
          next: (response) => {
            console.log("Familia creada:", response)
          },
          error: (error) => {
            console.error("Error al crear la familia:", error)
            Swal.fire({
              title: "Error!",
              text: "Ocurrió un error al crear el registro.",
              icon: "error",
              confirmButtonText: "Aceptar",
            })
          },
        })
      }
    } else {
      console.log("Formulario no válido")
      Swal.fire({
        title: "Formulario incompleto",
        text: "Por favor, completa todos los campos requeridos antes de guardar.",
        icon: "warning",
        confirmButtonText: "Entendido",
      })
    }
  }

  // Método auxiliar para encontrar la sección padre de un elemento
  private findParentSectionElement(element: HTMLElement): HTMLElement | null {
    let current: HTMLElement | null = element
    while (current) {
      if (current.hasAttribute("ngSwitchCase")) {
        return current
      }
      current = current.parentElement
    }
    return null
  }

  // Método de reseteo y cierre de formulario
  resetForm() {
    this.family = this.initializeFamily()
    this.familyId = null

    // Eliminar clases de error de todos los campos
    const allFields = document.querySelectorAll("form select, form input")
    allFields.forEach((field) => {
      ;(field as HTMLElement).classList.remove("border-red-500")
    })
  }

  closeForm() {
    this.resetForm()
    this.formClosed.emit()
  }
}
