import { Component, OnInit, TemplateRef, ViewChild } from "@angular/core"
import { FormGroup, FormBuilder, Validators } from "@angular/forms"
import { SessionService } from "../../../../services/session.service"
import { Session } from "../../../../interfaces/session"
import { ReactiveFormsModule } from "@angular/forms"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import Swal from "sweetalert2"

  // Extend jsPDF with autoTable plugin
  ; (jsPDF as any).autoTable = autoTable

@Component({
  selector: "app-session",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: "./session.component.html",
  styleUrls: ["./session.component.css"],
})
export class SessionComponent implements OnInit {
  @ViewChild("modalContent") modalContent!: TemplateRef<any>
  sessionForm!: FormGroup
  sessions: Session[] = []
  filteredSessions: Session[] = []
  viewStatus: "A" | "I" = "A"
  isEditMode = false
  currentSessionId: number | null = null
  searchTerm = ""
  isLoading = false
  isModalOpen = false

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
  ) {
    this.initForm()
  }

  ngOnInit(): void {
    this.loadSessions()
  }

  initForm(): void {
    this.sessionForm = this.fb.group({
      id: [null],
      name: ["", [Validators.required, Validators.maxLength(100)]],
      description: ["", [Validators.required, Validators.maxLength(500)]],
      status: ["A"],
    })
  }

  loadSessions(): void {
    this.isLoading = true
    this.sessions = [] // Limpiar el array previo
    this.filteredSessions = [] // Limpiar el array previo

    this.sessionService.getSessionsByStatus(this.viewStatus).subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          this.sessions = data
          this.filteredSessions = [...this.sessions]
        } else {
          console.warn("La respuesta del servidor no es un array:", data)
          this.sessions = []
          this.filteredSessions = []
        }
        this.isLoading = false
      },
      error: (error) => {
        console.error("Error al cargar sesiones", error)
        this.showAlert("error", "Error al cargar las sesiones: " + this.getErrorMessage(error))
        this.sessions = []
        this.filteredSessions = []
        this.isLoading = false
      },
    })
  }

  toggleViewStatus(): void {
    this.viewStatus = this.viewStatus === "A" ? "I" : "A"
    this.searchTerm = "" // Limpiar búsqueda al cambiar de pestaña
    this.loadSessions() // Recargar las sesiones con el nuevo estado
  }

  openModal(): void {
    this.resetForm() // Reset the form before opening
    this.isModalOpen = true
  }

  closeModal(): void {
    this.isModalOpen = false
  }

  getSessionForEdit(id: number): void {
    this.isLoading = true
    this.sessionService.getSessionById(id).subscribe({
      next: (data) => {
        this.isEditMode = true
        this.currentSessionId = id
        this.sessionForm.patchValue(data) // Ensure data structure matches form controls
        this.isModalOpen = true
        this.isLoading = false
      },
      error: (error) => {
        console.error("Error al obtener la sesión", error)
        this.showAlert("error", "No se pudo cargar la sesión: " + this.getErrorMessage(error))
        this.isLoading = false
      },
    })
  }

  onSubmit(): void {
    if (this.sessionForm.valid) {
      const sessionData = this.sessionForm.value
      this.isLoading = true

      if (this.isEditMode && this.currentSessionId !== null) {
        this.sessionService.updateSession(this.currentSessionId, sessionData).subscribe({
          next: () => {
            this.showAlert("success", "Sesión actualizada correctamente")
            this.resetForm()
            this.loadSessions()
            this.closeModal()
            this.isLoading = false
          },
          error: (err) => {
            console.error("Error al actualizar:", err)
            this.showAlert("error", "Error al actualizar: " + this.getErrorMessage(err))
            this.isLoading = false
          },
        })
      } else {
        this.sessionService.createSession(sessionData).subscribe({
          next: () => {
            this.showAlert("success", "Sesión creada correctamente")
            this.resetForm()
            this.loadSessions()
            this.closeModal()
            this.isLoading = false
          },
          error: (err) => {
            console.error("Error al crear:", err)
            this.showAlert("error", "Error al crear: " + this.getErrorMessage(err))
            this.isLoading = false
          },
        })
      }
    } else {
      this.validateAllFormFields(this.sessionForm)
    }
  }

  private getErrorMessage(error: any): string {
    if (error.status === 404) return "La sesión no existe"
    if (error.status === 400) return "Datos inválidos"
    if (error.error && error.error.message) return error.error.message
    return "Error del servidor"
  }

  deleteSession(id: number): void {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Deseas eliminar esta sesión?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true
        this.sessionService.deleteSession(id).subscribe({
          next: () => {
            this.showAlert("success", "Sesión desactivada correctamente")
            this.loadSessions() // Recarga las sesiones activas
            this.isLoading = false
          },
          error: (error) => {
            console.error("Error al desactivar:", error)
            this.showAlert("error", "Error al desactivar: " + this.getErrorMessage(error))
            this.isLoading = false
          },
        })
      }
    })
  }

  restoreSession(id: number): void {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Deseas restaurar esta sesión?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true
        this.sessionService.restoreSession(id).subscribe({
          next: () => {
            this.showAlert("success", "Sesión restaurada correctamente")
            this.loadSessions() // Recargar las sesiones activas
            this.isLoading = false
          },
          error: (error) => {
            console.error("Error al restaurar la sesión", error)
            this.showAlert("error", "Error al restaurar la sesión: " + this.getErrorMessage(error))
            this.isLoading = false
          },
        })
      }
    })
  }

  resetForm(): void {
    this.isEditMode = false
    this.currentSessionId = null
    this.sessionForm.reset({ status: "A" })
    this.closeModal()
  }

  searchSessions(): void {
    if (!this.searchTerm.trim()) {
      this.filteredSessions = [...this.sessions]
      return
    }

    const term = this.searchTerm.toLowerCase().trim()
    this.filteredSessions = this.sessions.filter(
      (session) =>
        session.id.toString().includes(term) ||
        session.name.toLowerCase().includes(term) ||
        session.description.toLowerCase().includes(term),
    )
  }

  clearSearch(): void {
    this.searchTerm = ""
    this.filteredSessions = [...this.sessions]
  }

  validateAllFormFields(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field)
      if (control instanceof FormGroup) {
        this.validateAllFormFields(control)
      } else {
        control?.markAsTouched({ onlySelf: true })
      }
    })
  }

  showAlert(type: "success" | "error" | "info", text: string): void {
    Swal.fire({
      icon: type,
      title: type === "success" ? "Éxito" : type === "error" ? "Error" : "Información",
      text: text,
      timer: 5000,
      timerProgressBar: true,
      showConfirmButton: false,
    })
  }

  exportToPDF(): void {
    try {
      if (this.filteredSessions.length === 0) {
        this.showAlert("info", "No hay datos para exportar")
        return
      }

      const data = this.prepareDataForExport()
      const doc = new jsPDF()

      doc.setFontSize(18)
      doc.text("Listado de Sesiones", 14, 22)

      doc.setFontSize(11)
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30)
      doc.text(`Estado: ${this.viewStatus === "A" ? "Activas" : "Inactivas"}`, 14, 36)

      const tableColumn = ["ID", "Nombre", "Descripción", "Estado"]
      const tableRows = data.map((session) => [session.id, session.name, session.description, session.status])
        ; (doc as any).autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 40,
          styles: {
            fontSize: 10,
            cellPadding: 3,
            overflow: "linebreak",
          },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 50 },
            2: { cellWidth: 80 },
            3: { cellWidth: 30 },
          },
          headStyles: {
            fillColor: [66, 139, 202],
            textColor: [255, 255, 255],
          },
        })

      const filename = `Sesiones_${this.viewStatus === "A" ? "Activas" : "Inactivas"}.pdf`
      doc.save(filename)
      this.showAlert("success", "Archivo PDF descargado correctamente")
    } catch (error) {
      console.error("Error al exportar a PDF:", error)
      this.showAlert("error", "Error al generar el archivo PDF: " + error)
    }
  }

  exportToExcel(): void {
    try {
      const data = this.prepareDataForExport()
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sesiones")

      const maxWidth = 50
      const columns = Object.keys(data[0] || {})
      const colWidths = columns.map((col) =>
        Math.min(maxWidth, Math.max(col.length, ...data.map((row) => row[col]?.toString().length || 0))),
      )

      worksheet["!cols"] = colWidths.map((width) => ({ width }))

      XLSX.writeFile(
        workbook,
        `Sesiones_${this.viewStatus === "A" ? "Activas" : "Inactivas"}_${new Date().toISOString().split("T")[0]}.xlsx`,
      )
      this.showAlert("success", "Archivo Excel descargado correctamente")
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      this.showAlert("error", "Error al generar el archivo Excel")
    }
  }

  exportToCSV(): void {
    try {
      const data = this.prepareDataForExport()
      const replacer = (key: string, value: any) => (value === null ? "" : value)
      const header = Object.keys(data[0] || {})
      const csv = data.map((row) => header.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(","))
      csv.unshift(header.join(","))
      const csvArray = csv.join("\r\n")

      const blob = new Blob([csvArray], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.setAttribute("hidden", "")
      a.setAttribute("href", url)
      a.setAttribute(
        "download",
        `Sesiones_${this.viewStatus === "A" ? "Activas" : "Inactivas"}_${new Date().toISOString().split("T")[0]}.csv`,
      )
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      this.showAlert("success", "Archivo CSV descargado correctamente")
    } catch (error) {
      console.error("Error al exportar a CSV:", error)
      this.showAlert("error", "Error al generar el archivo CSV")
    }
  }

  private prepareDataForExport(): any[] {
    return this.filteredSessions.map((session) => ({
      id: session.id,
      name: session.name,
      description: session.description,
      status: session.status === "A" ? "Activo" : "Inactivo",
    }))
  }
}
