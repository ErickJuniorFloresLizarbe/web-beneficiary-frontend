import { ActivityService } from './../../../../../services/ui/activity.service';
import { ImageProcessingService } from "./../../../../../services/ui/image-processing.service"
import { SupabaseService } from "./../../../../../services/ui/supabase.service"
import { ReportService } from "../../../../../services/report.service"
import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges } from "@angular/core"
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from "@angular/forms"
import { RouterModule } from "@angular/router"
import { CommonModule } from "@angular/common"
import Swal from "sweetalert2"
import {
  ImageUrl,
  ReportDto,
  ReportWithWorkshopsDto,
  ReportWorkshopDto,
  WorkshopKafkaEventDto,
} from "../../../../../interfaces/report.interface"
import { QuillModule } from "ngx-quill"
import { AuthService } from "../../../../../auth/services/auth.service"

export function dateRangeValidator(): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const workshopDateStart = formGroup.get("workshopDateStart")?.value
    const workshopDateEnd = formGroup.get("workshopDateEnd")?.value
    if (!workshopDateStart || !workshopDateEnd) return null
    const start = new Date(workshopDateStart)
    const end = new Date(workshopDateEnd)
    return end < start ? { invalidDateRange: true } : null
  }
}

@Component({
  selector: "app-report-modal",
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, RouterModule, QuillModule],
  templateUrl: "./report-modal.component.html",
  styleUrl: "./report-modal.component.css",
})
export class ReportModalComponent implements OnInit {
  @Input() reportData: ReportDto | ReportWithWorkshopsDto | null = null
  @Input() isVisible = false
  @Output() close = new EventEmitter<void>()
  @Output() saved = new EventEmitter<ReportWithWorkshopsDto>()

  allWorkshops: WorkshopKafkaEventDto[] = []
  workshopSuggestions: WorkshopKafkaEventDto[][] = []
  showSuggestions: boolean[] = []

  reportForm: FormGroup
  isEditMode = false
  isSubmitting = false
  scheduleFileName = ""
  scheduleFile: File | null = null
  schedulePreview = ""

  workshopImages: ImageUrl[][] = []

  showImageViewer = false
  currentWorkshopImages: ImageUrl[] = []
  currentImageIndex = 0
  currentImageUrl = ""

  showScheduleViewer = false
  availableYears: number[] = []

  months = [
    { value: "01", label: "Ene" },
    { value: "02", label: "Feb" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Abr" },
    { value: "05", label: "May" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Ago" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dic" },
  ]

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private supabaseService: SupabaseService,
    private imageProcessingService: ImageProcessingService,
    private activityService: ActivityService,
    private authService: AuthService,
  ) {
    this.reportForm = this.createReportForm()
    this.generateYearOptions()
  }

  ngOnInit(): void {
    this.loadWorkshops()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["reportData"] && changes["reportData"].currentValue) {
      this.populateForm(changes["reportData"].currentValue)
    }
  }

  loadWorkshops() {
    this.reportService.listWorkshopCache("A").subscribe((data) => {
      this.allWorkshops = data
    })
  }

  onWorkshopNameInput(index: number) {
    const inputValue = this.workshopsArray.at(index).get("workshopName")?.value || ""
    const matches = this.allWorkshops.filter((w) => w.name.toLowerCase().includes(inputValue.toLowerCase()))
    this.workshopSuggestions[index] = matches
    this.showSuggestions[index] = true
  }

  hideAutocompleteDelayed(index: number) {
    setTimeout(() => {
      this.showSuggestions[index] = false
    }, 200)
  }

  selectWorkshopSuggestion(index: number, workshops: WorkshopKafkaEventDto) {
    const group = this.workshopsArray.at(index)
    group.patchValue({
      workshopName: workshops.name,
      workshopId: workshops.id,
      workshopDateStart: workshops.dateStart,
      workshopDateEnd: workshops.dateEnd,
    })
    group.get("workshopDateStart")?.disable()
    group.get("workshopDateEnd")?.disable()
    this.workshopSuggestions[index] = []
    this.showSuggestions[index] = false
  }

  onWorkshopNameBlur(index: number): void {
    const group = this.workshopsArray.at(index)
    const currentName = group.get("workshopName")?.value
    const selectedWorkshop = this.allWorkshops.find((w) => w.name.toLowerCase() === currentName.toLowerCase())

    if (selectedWorkshop) {
      // Taller válido, completar datos y desactivar fechas
      group.patchValue({
        workshopId: selectedWorkshop.id,
        workshopDateStart: selectedWorkshop.dateStart,
        workshopDateEnd: selectedWorkshop.dateEnd,
      })

      group.get("workshopDateStart")?.disable()
      group.get("workshopDateEnd")?.disable()
    } else {
      // Nombre libre: limpiar ID y permitir fechas
      group.patchValue({
        workshopId: null,
      })

      group.get("workshopDateStart")?.enable()
      group.get("workshopDateEnd")?.enable()
    }
  }

  createReportForm(): FormGroup {
    return this.fb.group({
      id: [null],
      year: [null, Validators.required],
      trimester: [null, Validators.required],
      description: ["", Validators.required],
      schedule: [""],
      workshops: this.fb.array([]),
    })
  }

  get workshopsArray(): FormArray {
    return this.reportForm.get("workshops") as FormArray
  }

  createWorkshopFormGroup(workshops: ReportWorkshopDto | null = null): FormGroup {
    return this.fb.group(
      {
        workshopId: [workshops?.workshopId ?? null],
        workshopName: [workshops?.workshopName ?? "", Validators.required],
        description: [workshops?.description ?? ""],
        workshopDateStart: [workshops?.workshopDateStart ?? "", Validators.required],
        workshopDateEnd: [workshops?.workshopDateEnd ?? "", Validators.required],
        imageUrl: [workshops?.imageUrl ?? []],
      },
      { validators: dateRangeValidator() },
    )
  }

  addWorkshop(): void {
    this.workshopsArray.push(this.createWorkshopFormGroup())
    this.workshopImages.push([])
    this.workshopSuggestions.push([])
    this.showSuggestions.push(false)

    setTimeout(() => {
      const items = document.querySelectorAll(".workshops-item")
      if (items.length) items[items.length - 1].scrollIntoView({ behavior: "smooth", block: "center" })
    }, 100)
  }
  generateYearOptions(): void {
    const currentYear = new Date().getFullYear()
    this.availableYears = []
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      this.availableYears.push(i)
    }
  }

  resetForm(): void {
    this.reportForm = this.createReportForm()
    this.workshopImages = []
    this.scheduleFileName = ""
    this.scheduleFile = null
    this.schedulePreview = ""
  }

  populateForm(reportDataInput: ReportWithWorkshopsDto | ReportDto): void {
    this.isEditMode = true

    let report: ReportDto
    let workshops: ReportWorkshopDto[] = []

    if ("report" in reportDataInput) {
      report = reportDataInput.report
      workshops = reportDataInput.workshops || []
    } else {
      report = reportDataInput
    }

    this.reportForm.patchValue({
      id: report.id,
      year: report.year,
      trimester: report.trimester,
      description: report.description,
      schedule: report.schedule,
    })

    if (report.schedule) {
      this.scheduleFileName = "Cronograma existente.jpg"
      this.schedulePreview = this.getImagePreview(report.schedule)
    }

    this.workshopsArray.clear()
    this.workshopImages = []

    workshops.forEach((w, index) => {
      this.workshopsArray.push(this.createWorkshopFormGroup(w))
      this.workshopImages[index] = []

      if (w.imageUrl?.length > 0) {
        w.imageUrl.forEach((url: string, imgIndex: number) => {
          this.workshopImages[index].push({
            file: null,
            preview: this.getImagePreview(url),
            name: `Imagen ${imgIndex + 1}`,
          })
        })
      }
    })
  }

  // Convierte una URL o base64 en una URL visualizable
  getImagePreview(imageData: string): string {
    // Si es una URL completa
    if (imageData.startsWith("http")) {
      return imageData
    }

    // Si ya es un data URL
    if (imageData.startsWith("data:image")) {
      return imageData
    }

    // Si es base64 sin el prefijo data:image
    if (
      imageData.startsWith("iVBOR") ||
      imageData.startsWith("ASUN") ||
      imageData.includes("/9j/") ||
      imageData.includes("+/9k=")
    ) {
      return `data:image/png;base64,${imageData}`
    }

    // Si no podemos determinar el formato, usamos un placeholder
    return "/assets/placeholder-image.png"
  }

  removeWorkshop(index: number): void {
    Swal.fire({
      title: "¿Está seguro?",
      text: "¿Desea eliminar este taller?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.workshopsArray.removeAt(index)
        this.workshopImages.splice(index, 1)
      }
    })
  }

  // MÉTODO ACTUALIZADO: Procesa la imagen del cronograma
  async onScheduleFileChange(event: any): Promise<void> {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]

      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        Swal.fire({
          title: "Error",
          text: "El cronograma debe ser una imagen (JPG, PNG, etc.)",
          icon: "error",
          confirmButtonText: "Aceptar",
        })
        event.target.value = ""
        return
      }

      // Mostrar indicador de carga
      Swal.fire({
        title: "Procesando imagen",
        text: "Convirtiendo y optimizando...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      try {
        // Procesar la imagen con el servicio
        const processedImage = await this.imageProcessingService.processImage(file)

        this.scheduleFile = processedImage.file
        this.scheduleFileName = processedImage.name
        this.schedulePreview = processedImage.preview

        Swal.close()
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: "Ocurrió un error al procesar la imagen",
          icon: "error",
          confirmButtonText: "Aceptar",
        })
      }
    } else {
      this.scheduleFile = null
      this.scheduleFileName = ""
      this.schedulePreview = ""
    }

    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    event.target.value = ""
  }

  viewSchedule(): void {
    if (this.schedulePreview) {
      this.showScheduleViewer = true
    }
  }

  closeScheduleViewer(): void {
    this.showScheduleViewer = false
  }

  // MÉTODO ACTUALIZADO: Procesa las imágenes de los talleres
  async onImageFileChange(event: any, workshopIndex: number): Promise<void> {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Inicializar el array si no existe
    if (!this.workshopImages[workshopIndex]) {
      this.workshopImages[workshopIndex] = []
    }

    // Validar que todos sean imágenes
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith("image/")) {
        Swal.fire({
          title: "Error",
          text: "Solo se permiten archivos de imagen (JPG, PNG, etc.)",
          icon: "error",
          confirmButtonText: "Aceptar",
        })
        event.target.value = ""
        return
      }
    }

    // Mostrar indicador de carga
    Swal.fire({
      title: "Procesando imágenes",
      text: "Convirtiendo y optimizando...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    try {
      // Procesar todas las imágenes seleccionadas
      const processedImages = await this.imageProcessingService.processMultipleImages(Array.from(files))

      // Agregar cada imagen procesada
      processedImages.forEach((processedImage) => {
        this.workshopImages[workshopIndex].push(processedImage)
      })

      Swal.close()
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Ocurrió un error al procesar las imágenes",
        icon: "error",
        confirmButtonText: "Aceptar",
      })
    }

    // Limpiar el input para permitir seleccionar los mismos archivos nuevamente
    event.target.value = ""
  }

  removeImage(workshopIndex: number, imageIndex: number): void {
    this.workshopImages[workshopIndex].splice(imageIndex, 1)
  }

  // Métodos para el visor de imágenes
  openImageViewer(workshopIndex: number, imageIndex: number): void {
    this.currentWorkshopImages = this.workshopImages[workshopIndex]
    this.currentImageIndex = imageIndex
    this.currentImageUrl = this.currentWorkshopImages[imageIndex].preview
    this.showImageViewer = true
  }

  closeImageViewer(): void {
    this.showImageViewer = false
  }

  viewImage(index: number): void {
    this.currentImageIndex = index
    this.currentImageUrl = this.currentWorkshopImages[index].preview
  }

  prevImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--
      this.currentImageUrl = this.currentWorkshopImages[this.currentImageIndex].preview
    }
  }

  nextImage(): void {
    if (this.currentImageIndex < this.currentWorkshopImages.length - 1) {
      this.currentImageIndex++
      this.currentImageUrl = this.currentWorkshopImages[this.currentImageIndex].preview
    }
  }

  // Método para formatear fechas en formato DD/MMM/YYYY
  formatDate(dateString: string): string {
    if (!dateString) return ""

    const [year, month, day] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day) // mes en base 0

    const dayStr = String(date.getDate()).padStart(2, "0")
    const monthStr = this.months[date.getMonth()].label
    const yearStr = date.getFullYear()

    return `${dayStr}/${monthStr}/${yearStr}`
  }

  // Método para obtener el mes y día según el trimestre seleccionado
  getDateRangeForTrimester(trimester: string, year: number): { startMonth: string; endMonth: string } {
    switch (trimester) {
      case "Enero-Marzo":
        return { startMonth: "01", endMonth: "03" }
      case "Abril-Junio":
        return { startMonth: "04", endMonth: "06" }
      case "Julio-Septiembre":
        return { startMonth: "07", endMonth: "09" }
      case "Octubre-Diciembre":
        return { startMonth: "10", endMonth: "12" }
      default:
        return { startMonth: "01", endMonth: "12" }
    }
  }

  // Actualizar fechas de talleres cuando cambia el trimestre o año
  updateWorkshopDates(): void {
    const year = this.reportForm.get("year")?.value
    const trimester = this.reportForm.get("trimester")?.value

    if (year && trimester) {
      const { startMonth, endMonth } = this.getDateRangeForTrimester(trimester, year)

      // Actualizar las fechas de inicio y fin de cada taller
      for (let i = 0; i < this.workshopsArray.length; i++) {
        const workshops = this.workshopsArray.at(i) as FormGroup

        // Solo actualizar si no tienen fechas o si están fuera del trimestre
        if (!workshops.get("workshopDateStart")?.value || !workshops.get("workshopDateEnd")?.value) {
          workshops.patchValue({
            workshopDateStart: `${year}-${startMonth}-01`,
            workshopDateEnd: `${year}-${endMonth}-${new Date(year, Number.parseInt(endMonth), 0).getDate()}`,
          })
        }
      }
    }
  }

  validateWorkshopImages(): boolean {
    let valid = true

    // Verificar que cada taller tenga al menos una imagen
    for (let i = 0; i < this.workshopsArray.length; i++) {
      if (!this.workshopImages[i] || this.workshopImages[i].length === 0) {
        Swal.fire({
          title: "Error de validación",
          text: `El taller #${i + 1} debe tener al menos una imagen`,
          icon: "error",
          confirmButtonText: "Aceptar",
        })
        valid = false
        break
      }
    }

    return valid
  }

  // Add a new method to check if the schedule should be shown
  shouldShowSchedule(): boolean {
    return this.reportForm.get("trimester")?.value === "Enero-Marzo"
  }

  // Add a method to check for duplicate year/trimester combinations
  async checkDuplicateReport(): Promise<boolean> {
    const year = this.reportForm.get("year")?.value
    const trimester = this.reportForm.get("trimester")?.value

    if (!year || !trimester) {
      return false // No tiene sentido verificar duplicado sin ambos datos
    }

    if (this.isEditMode && this.reportData) {
      const currentReport = "report" in this.reportData ? this.reportData.report : this.reportData
      if (currentReport.year === year && currentReport.trimester === trimester) {
        return false // No es duplicado, es el mismo
      }
    }

    const exists = await this.reportService.checkReportExists(year, trimester).toPromise()
    return exists ?? false // Garantiza que siempre retorna boolean
  }

  // Modify the saveReport method to include the duplicate check
  async saveReport(): Promise<void> {
    if (this.reportForm.invalid) {
      this.markFormGroupTouched(this.reportForm)
      Swal.fire({
        title: "Formulario incompleto",
        text: "Por favor complete todos los campos requeridos",
        icon: "warning",
        confirmButtonText: "Aceptar",
      })
      return
    }

    // Check for duplicate year/trimester combinations
    if (!this.isEditMode) {
      const isDuplicate = await this.checkDuplicateReport()
      if (isDuplicate) {
        Swal.fire({
          title: "Reporte duplicado",
          text: "Ya existe un reporte para el año y trimestre seleccionados",
          icon: "error",
          confirmButtonText: "Aceptar",
        })
        return
      }
    }

    let fechasInvalidas = false
    for (let i = 0; i < this.workshopsArray.length; i++) {
      const workshop = this.workshopsArray.at(i) as FormGroup
      if (workshop.errors?.["invalidDateRange"]) {
        fechasInvalidas = true
        break
      }
    }

    if (fechasInvalidas) {
      Swal.fire({
        title: "Fechas inválidas",
        text: "La fecha de fin debe ser posterior a la de inicio.",
        icon: "error",
        confirmButtonText: "Aceptar",
      })
      return
    }

    if (!this.validateWorkshopImages()) return

    this.isSubmitting = true

    // Mostrar solo "Guardando..."
    Swal.fire({
      title: this.isEditMode ? "Editando reporte..." : "Guardando reporte...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    try {
      const formValue = this.reportForm.value

      // Asegurarse de que la descripción se envía como HTML
      const description = formValue.description

      let scheduleUrl = formValue.schedule
      if (this.scheduleFile) {
        const uploaded = await this.supabaseService.uploadImage(this.scheduleFile, "reports/schedules")
        if (uploaded) scheduleUrl = uploaded
      }

      const workshops: ReportWorkshopDto[] = []

      for (let i = 0; i < this.workshopsArray.length; i++) {
        const group = this.workshopsArray.at(i)
        const images = this.workshopImages[i]

        const urls: string[] = []
        for (const img of images) {
          if (img.file) {
            const url = await this.supabaseService.uploadImage(img.file, "reports/workshops")
            if (url) urls.push(url)
          } else {
            urls.push(img.preview) // ya es URL
          }
        }

        workshops.push({
          ...group.value,
          imageUrl: urls,
        })
      }

      const reportPayload: ReportWithWorkshopsDto = {
        report: {
          id: formValue.id,
          year: formValue.year,
          trimester: formValue.trimester,
          description: description, // Asegurarse de que se envía como HTML
          schedule: scheduleUrl,
          status: "A",
        },
        workshops,
      }

      const save$ = this.isEditMode
        ? this.reportService.updateReportById(reportPayload.report.id, reportPayload)
        : this.reportService.newReport(reportPayload)

      save$.subscribe(
        (res) => {
          this.isSubmitting = false
          Swal.fire({
            title: this.isEditMode ? "¡Reporte editado!" : "¡Guardado correctamente!",
            icon: "success",
            confirmButtonText: "Aceptar",
          })
          this.saved.emit(res)
          this.closeModal()
        },
        (err) => {
          this.isSubmitting = false
          Swal.fire({
            title: "Error",
            text: "Ocurrió un error al guardar el reporte.",
            icon: "error",
            confirmButtonText: "Aceptar",
          })
        },
      )
    } catch (err) {
      this.isSubmitting = false
      Swal.fire({
        title: "Error",
        text: "Ocurrió un error inesperado.",
        icon: "error",
        confirmButtonText: "Aceptar",
      })
    }
  }

  prepareReportData(): ReportWithWorkshopsDto {
    const formValue = this.reportForm.value
    const workshops = formValue.workshops.map((workshops: any, index: number) => {
      const imageUrls = this.workshopImages[index].map((img) => {
        if (!img.file) {
          if (img.preview.startsWith("data:image")) {
            return img.preview.split(",")[1] // Extraer solo la parte base64
          }
          return img.preview
        }

        // Para archivos nuevos, usar la preview que ya está en base64
        if (img.preview.startsWith("data:image")) {
          return img.preview.split(",")[1] // Extraer solo la parte base64
        }
        return img.preview
      })

      return {
        ...workshops,
        imageUrl: imageUrls,
      }
    })

    // Preparar el cronograma
    let scheduleData = formValue.schedule
    if (this.scheduleFile && this.schedulePreview) {
      // Extraer solo la parte base64 del data URL
      scheduleData = this.schedulePreview.startsWith("data:image")
        ? this.schedulePreview.split(",")[1]
        : this.schedulePreview
    }

    // Preparar el reporte completo en la estructura esperada por el backend
    const reportData: ReportWithWorkshopsDto = {
      report: {
        id: formValue.id,
        year: formValue.year,
        trimester: formValue.trimester,
        description: formValue.description,
        schedule: scheduleData,
        status: "A", // ✅ CORRECTO
      },
      workshops: workshops,
    }
    return reportData
  }

  handleSaveSuccess(response: any): void {
    this.isSubmitting = false
    Swal.fire({
      title: "¡Éxito!",
      text: "El reporte ha sido guardado correctamente",
      icon: "success",
      confirmButtonText: "Aceptar",
    })
    // Emitir evento de guardado exitoso
    this.saved.emit(response)
    // Cerrar el modal
    this.closeModal()
  }

  handleSaveError(error: any): void {
    this.isSubmitting = false
    Swal.fire({
      title: "Error",
      text: "Ocurrió un error al guardar el reporte. Por favor, intente nuevamente.",
      icon: "error",
      confirmButtonText: "Aceptar",
    })
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched()

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control)
      } else if (control instanceof FormArray) {
        control.controls.forEach((ctrl) => {
          if (ctrl instanceof FormGroup) {
            this.markFormGroupTouched(ctrl)
          } else {
            ctrl.markAsTouched()
          }
        })
      }
    })
  }

  closeModal(): void {
    this.close.emit()
    this.reportForm.reset()
    this.workshopImages = []
    this.workshopSuggestions = []
    this.showSuggestions = []

    // Eliminar todos los controles del formArray para evitar residuos
    while (this.workshopsArray.length !== 0) {
      this.workshopsArray.removeAt(0)
    }

    this.scheduleFileName = ""
    this.schedulePreview = ""
    this.showImageViewer = false
    this.showScheduleViewer = false

    this.isVisible = false
    this.isEditMode = false
  }

  // Añadir este método para validar las fechas de un taller específico cuando cambian
  validateWorkshopDates(index: number): void {
    const workshopForm = this.workshopsArray.at(index) as FormGroup

    // Forzar la validación del grupo completo
    workshopForm.updateValueAndValidity()
  }
}
