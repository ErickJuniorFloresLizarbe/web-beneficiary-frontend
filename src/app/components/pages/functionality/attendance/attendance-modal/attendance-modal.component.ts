import { Component, EventEmitter, Input,  OnInit, Output } from "@angular/core"
import  { AttendanceService } from "../../../../../services/attendance.service"
import  { Attendance } from "../../../../../interfaces/attendance"
import { forkJoin } from "rxjs"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import  { IssueService } from "./../../../../../services/issue.service"
import  { PersonaService } from "../../../../../services/person.service"
import  { WorkshopService } from "../../../../../services/workshop.service"

@Component({
  selector: "app-attendance-modal",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./attendance-modal.component.html",
  styleUrl: "./attendance-modal.component.css",
})
export class AttendanceModalComponent implements OnInit {
  isLoadingAttendance = true
  filteredIssues: any[] = []
  issueList: any[] = []
  workshops: any[] = []
  attendance: Attendance[] = []
  filteredAttendance: Attendance[] = []
  personList: any[] = []
  attendanceList: any[] = []
  previewImage: string | null = null
  imageFile: File | null = null

  // Variables para manejar la selección directamente
  selectedPersonId = 0
  selectedIssueId = 0
  selectedRecord = "A"
  entryTime = ""
  justificationDocument = ""
  state = "A"

  @Input() attendanceForm: Attendance = {
    id: 0,
    issueId: 0,
    personId: 0,
    entryTime: "",
    justificationDocument: "",
    record: "A",
    state: "A",
  }

  @Input() isModalOpen = false
  @Input() isEditMode = false
  @Output() closeModalEvent = new EventEmitter<void>()
  @Output() saveAttendanceEvent = new EventEmitter<Attendance>()

  constructor(
    private attendanceService: AttendanceService,
    private issueService: IssueService,
    private personService: PersonaService,
    private workshopService: WorkshopService,
  ) {}

  ngOnInit(): void {
    this.loadData()
  }

  ngOnChanges(): void {
    if (this.isModalOpen) {
      // Inicializamos los valores desde el attendanceForm
      this.selectedIssueId = this.attendanceForm.issueId || 0
      this.selectedPersonId = this.attendanceForm.personId || 0
      this.entryTime = this.attendanceForm.entryTime || this.getCurrentDateTime()
      this.selectedRecord = this.attendanceForm.record || "A"
      this.justificationDocument = this.attendanceForm.justificationDocument || ""
      this.state = this.attendanceForm.state || "A"
    }
  }

  close(): void {
    this.closeModalEvent.emit()
  }

  closeModal(): void {
    this.closeModalEvent.emit()
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

  saveAttendance(): void {
    // Verificar que personId no sea 0
    if (!this.selectedPersonId || this.selectedPersonId === 0) {
      console.error("Error: personId es 0 o no válido")
      alert("Por favor, seleccione una persona")
      return
    }

    // Verificar que issueId no sea 0
    if (!this.selectedIssueId || this.selectedIssueId === 0) {
      console.error("Error: issueId es 0 o no válido")
      alert("Por favor, seleccione un tema")
      return
    }

    // Aseguramos que entryTime tenga un valor
    if (!this.entryTime) {
      this.entryTime = this.getCurrentDateTime()
    }

    // Construcción del objeto a enviar
    const attendanceToSend: Attendance = {
      issueId: this.selectedIssueId,
      personId: this.selectedPersonId,
      entryTime: this.entryTime,
      record: this.selectedRecord,
      justificationDocument: this.justificationDocument?.trim() || "N/A",
      state: this.state || "A",
    }

    console.log("Objeto a enviar:", attendanceToSend)

    if (this.isEditMode && this.attendanceForm.id) {
      // ✅ Modo edición: Actualizar asistencia existente
      this.attendanceService.updateAttendance(this.attendanceForm.id, attendanceToSend).subscribe(
        (response) => {
          console.log("✅ Asistencia actualizada:", response)
          this.saveAttendanceEvent.emit(response)
          this.closeModalEvent.emit()
        },
        (error) => {
          console.error("❌ Error al actualizar asistencia:", error)
          alert("Error al actualizar la asistencia")
        },
      )
    } else {
      // ✅ Modo creación: Guardar nueva asistencia (sin id, el backend lo genera)
      this.attendanceService.saveAttendance(attendanceToSend).subscribe(
        (response) => {
          console.log("✅ Asistencia guardada:", response)
          this.saveAttendanceEvent.emit(response)
          this.closeModalEvent.emit()
        },
        (error) => {
          console.error("❌ Error al guardar asistencia:", error)
          alert("Error al guardar la asistencia")
        },
      )
    }
  }

  getCurrentDateTime(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0") // Asegurar dos dígitos
    const day = String(now.getDate()).padStart(2, "0")
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")

    return `${year}-${month}-${day}T${hours}:${minutes}:00` // ✅ Incluye los segundos ":00"
  }

  loadData(): void {
    forkJoin({
      persons: this.personService.getPersons(),
      issues: this.issueService.getActiveIssues(),
      attendances: this.attendanceService.getAttendances(),
    }).subscribe(
      ({ persons, issues, attendances }) => {
        this.personList = persons
        this.issueList = issues

        console.log("Personas cargadas:", persons)

        this.attendanceList = attendances.map((att: any) => {
          const issue = this.issueList.find((t) => t.id === att.issueId)
          // IMPORTANTE: Usamos idPerson en lugar de id
          const person = this.personList.find((p) => p.idPerson === att.personId)
          return {
            ...att,
            issueName: issue ? issue.name : "No asignado",
            personName: person ? person.name : "⚠️ No encontrado",
          }
        })

        this.isLoadingAttendance = false
      },
      (error) => {
        console.error("Error cargando datos:", error)
        this.isLoadingAttendance = false
      },
    )
  }

  onFileChange(event: any): void {
    const file = event.target.files[0]
    if (file) {
      // Usamos FileReader para crear una URL de vista previa de la imagen
      const reader = new FileReader()
      reader.onload = (e: any) => {
        this.previewImage = e.target.result // Asignamos la URL para mostrarla como vista previa
      }
      reader.readAsDataURL(file) // Leemos la imagen como URL de datos
      this.imageFile = file // Almacenamos el archivo seleccionado
    }
  }
}
