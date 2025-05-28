import { Component, inject, OnInit } from "@angular/core"
import { Attendance } from "../../../../interfaces/attendance"
import { AttendanceService } from "../../../../services/attendance.service"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { IssueService } from "./../../../../services/issue.service"
import { WorkshopService } from "../../../../services/workshop.service"
import { PersonaService } from "../../../../services/person.service"
import { forkJoin } from "rxjs"
import { AttendanceModalComponent } from "./attendance-modal/attendance-modal.component"

@Component({
  selector: "app-attendance",
  standalone: true,
  imports: [CommonModule, FormsModule, AttendanceModalComponent],
  templateUrl: "./attendance.component.html",
  styleUrl: "./attendance.component.css",
})
export class AttendanceComponent implements OnInit {
  private attendanceService = inject(AttendanceService)
  isModalOpen = false
  isEditMode = false
  attendanceList: Attendance[] = []
  attendance: Attendance[] = []
  filteredAttendance: Attendance[] = []
  isLoadingAttendance = true
  currentDateTime = ""
  issueList: any[] = []
  workshops: any[] = []
  personList: any[] = []
  previewImage: string | null = null // Para mostrar la vista previa de la imagen
  imageFile: File | null = null
  selectedPerson: any = null
  editAttendance: Attendance | null = null
  filteredIssues: any[] = [] // Temas filtrados según el taller seleccionado
  selectedWorkshopId = 0 // ID del taller seleccionado
  selectedIssueId = 0
  filteredPersons: any[] = []; // Lista filtrada de personas según el taller seleccionado

  attendanceForm: Attendance = {
    id: 0,
    issueId: 0,
    personId: 0,
    entryTime: "",
    justificationDocument: "",
    record: "",
    state: "",
  }

  constructor(
    private issueService: IssueService,
    private personService: PersonaService,
    private workshopService: WorkshopService,
  ) { }

  ngOnInit(): void {
    this.getAttendances()
    this.getIssues()
    this.getPersons()
    this.setCurrentDateTime()
  }

  getAttendances(): void {
    this.isLoadingAttendance = true
    forkJoin({
      persons: this.personService.getPersons(),
      issues: this.issueService.getActiveIssues(),
      attendances: this.attendanceService.getAttendances(),
      workshops: this.workshopService.getActiveWorkshops(),
    }).subscribe(
      ({ persons, issues, attendances, workshops }) => {
        this.personList = persons
        this.issueList = issues
        this.workshops = workshops

        this.attendance = attendances.map((att: any) => {
          const issue = issues.find((t) => t.id === att.issueId)
          const person = persons.find((p) => p.idPerson === att.personId)
          const workshop = workshops.find((w) => w.id === issue?.workshopId)

          return {
            ...att,
            issueName: issue ? issue.name : "No asignado",
            workshopName: workshop ? workshop.name : "No asignado",
            personName: person ? person.name : "No encontrado",
          }
        })

        this.filteredAttendance = [...this.attendance]
        this.filteredIssues = [...this.issueList]

        // ✅ Ahora que todos los datos están cargados, puedes filtrar correctamente
        this.filterPersonsByWorkshop()

        this.isLoadingAttendance = false
      },
      (error) => {
        console.error("Error retrieving attendance data:", error)
        this.isLoadingAttendance = false
      },
    )
  }


  getIssues(): void {
    this.issueService.getActiveIssues().subscribe({
      next: (data) => {
        console.log("Loaded Issues:", data) // Verificar la carga de issues
        this.issueList = data
        this.filteredIssues = [...this.issueList] // Inicialmente, mostrar todos los temas
      },
      error: (err) => {
        console.error("Error fetching issues:", err)
      },
    })
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

  loadData(): void {
    forkJoin({
      persons: this.personService.getPersons(),
      issues: this.issueService.getActiveIssues(),
      attendances: this.attendanceService.getAttendances(),
    }).subscribe(
      ({ persons, issues, attendances }) => {
        this.personList = persons
        this.issueList = issues

        this.attendanceList = attendances.map((att: any) => {
          const issue = this.issueList.find((t) => t.id === att.issueId)
          const person = this.personList.find((p) => p.idPerson === att.personId)
          return {
            ...att,
            issueName: issue ? issue.name : "No asignado",
            personName: person ? person.name : "⚠️ No encontrado",
          }
        })
      },
      (error) => {
        console.error("Error cargando datos:", error)
      },
    )
  }

  openModal(): void {
    this.isEditMode = false
    this.attendanceForm = {
      id: 0,
      issueId: 0,
      personId: 0,
      entryTime: this.getCurrentDateTime(), // ✅ Se asigna con el formato correcto
      record: "A",
      justificationDocument: "",
      state: "A",
    }
    this.isModalOpen = true
  }

  closeModal(): void {
    this.isModalOpen = false
  }

  setCurrentDateTime(): void {
    const now = new Date()
    const formattedDate = now.toISOString().slice(0, 16) // ✅ Formato correcto `YYYY-MM-DDTHH:mm`
    this.currentDateTime = formattedDate
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

  openEditModal(attendance: Attendance): void {
    this.isEditMode = true
    this.attendanceForm = { ...attendance } // Cargar la asistencia en el formulario
    this.isModalOpen = true
  }

  openEditModalForAttendance(issueId: number, personId: number): void {
    // Limpiar la vista previa y la imagen cargada antes de abrir el modal
    this.previewImage = null // Limpiar la vista previa
    this.imageFile = null // Limpiar el archivo de imagen

    // Buscar si existe un registro de asistencia para el tema y persona
    const attendanceRecord = this.attendance.find((att) => att.issueId === issueId && att.personId === personId)

    // Si el registro ya existe, se abre en modo edición
    if (attendanceRecord) {
      // Solo permitir edición si el estado es 'F' (falta) o 'T' (tarde)
      if (attendanceRecord.record === "F" || attendanceRecord.record === "T") {
        this.isEditMode = true // Establecemos el modo de edición
        this.attendanceForm = { ...attendanceRecord } // Cargamos los datos del registro en el formulario

        // Si hay un archivo de justificación, mostramos la vista previa
        if (attendanceRecord.justificationDocument && attendanceRecord.justificationDocument !== "N/A") {
          this.previewImage = `path_to_images_folder/${attendanceRecord.justificationDocument}` // Asumiendo que la imagen está en un folder accesible
        }

        this.isModalOpen = true // Abrimos el modal para editar
      } else {
        // Si el estado no es 'F' ni 'T', no permitimos la edición
        alert('No se puede editar esta asistencia, el record es "A" o "J"')
        return
      }
    } else {
      // Si no existe el registro, se crea uno nuevo
      this.isEditMode = false // Establecemos el modo de creación
      this.attendanceForm = {
        id: 0, // El ID será 0, ya que el backend lo asignará cuando se guarde.
        issueId,
        personId,
        entryTime: this.getCurrentDateTime(),
        record: "A", // Cambiado a 'A' por defecto
        justificationDocument: "",
        state: "A", // Estado por defecto, Activo
      }
      this.isModalOpen = true // Abrimos el modal para agregar un nuevo registro
    }
  }

  getAttendanceStatus(issueId: number, personId: number): string {
    const attendanceRecord = this.attendance.find((att) => att.issueId === issueId && att.personId === personId)

    if (attendanceRecord) {
      return attendanceRecord.record // Devuelve el estado (A, F, T, J)
    }

    return "none" // Si no hay registro, retorna 'none' para mostrar '-'
  }

  getIssueScheduledTime(issueId: number): string | null {
    const issue = this.issueList.find((t) => t.id === issueId)
    return issue ? issue.scheduledTime : null
  }

  filterAttendance(): void {
    if (this.filteredIssues.length === 0) {
      console.log("No issues found for the selected workshop.")
    }

    // Filtrar las asistencias basadas en los issues filtrados
    this.filteredAttendance = this.attendance.filter((attendance) => {
      return this.filteredIssues.some((issue) => issue.id === attendance.issueId)
    })

    console.log("Filtered Attendance:", this.filteredAttendance) // Verifica las asistencias filtradas
  }

  filterIssuesByWorkshop(): void {
    if (this.selectedWorkshopId === 0) {
      // Mostrar todos los issues si se selecciona "Todos los talleres"
      this.filteredIssues = [...this.issueList];
    } else {
      // Filtrar los issues que pertenecen al taller seleccionado
      this.filteredIssues = this.issueList.filter(issue => issue.workshopId === this.selectedWorkshopId);
    }

    // También filtrar las personas en función del taller seleccionado
    this.filterPersonsByWorkshop();

    // Y luego actualizar las asistencias mostradas
    this.filterAttendance();
  }



  onModalClosed(): void {
    this.isModalOpen = false
    this.getAttendancesAndFilter()
  }

  onAttendanceSaved(attendance: Attendance): void {
    console.log("Asistencia guardada:", attendance)
    this.isModalOpen = false
    this.getAttendancesAndFilter()
  }

  getAttendancesAndFilter(): void {
    this.getAttendances()
    setTimeout(() => {
      this.filterIssuesByWorkshop()
    }, 100) // Esperamos a que se actualicen los datos antes de filtrar
  }

  // Este método se llama cuando el usuario selecciona un taller
  filterPersonsByWorkshop(): void {
    const selectedWorkshopIdNumber = Number(this.selectedWorkshopId);

    if (selectedWorkshopIdNumber === 0) {
      this.filteredPersons = [...this.personList];
      this.filteredIssues = [...this.issueList];
      return;
    }

    const selectedWorkshop = this.workshops.find(
      (workshop) => Number(workshop.id) === selectedWorkshopIdNumber
    );

    if (selectedWorkshop && selectedWorkshop.personId) {
      const personIdsInWorkshop: number[] = selectedWorkshop.personId
        .split(',')
        .map((id: string): number => parseInt(id.trim(), 10))
        .filter((id: number): boolean => !isNaN(id));
      // Aseguramos que son IDs válidos

      this.filteredPersons = this.personList.filter((person) =>
        personIdsInWorkshop.includes(person.idPerson)
      );

      this.filteredIssues = this.issueList.filter(
        (issue) => Number(issue.workshopId) === selectedWorkshopIdNumber
      );
    } else {
      this.filteredPersons = [];
      this.filteredIssues = [];
    }

    console.log("Filtered Persons:", this.filteredPersons);
    console.log("Filtered Issues:", this.filteredIssues);
  }

}
