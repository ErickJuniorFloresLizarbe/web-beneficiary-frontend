import { ActivityService } from './../../../services/ui/activity.service';
import { ThemeService } from "../../../services/ui/theme.service"
import { CommonModule } from "@angular/common"
import { Component, OnInit } from "@angular/core"
import { RouterModule } from "@angular/router"
import { SessionService } from "../../../services/session.service"
import { ReportService } from "../../../services/report.service"
import { IssueService } from "../../../services/issue.service"
import { TransformationService } from "../../../services/transformation.service"
import { GoalService } from "../../../services/goal.service"
import { WorkshopService } from "../../../services/workshop.service"
import { FamilyService } from "../../../services/family.service"
import { BeneficiaryService } from "../../../services/beneficiary.service"
import { AttendanceService } from "../../../services/attendance.service"
import { catchError, of, finalize } from "rxjs"

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.css",
})
export class DashboardComponent implements OnInit {
  darkMode$ = this.themeService.darkMode$

  // Datos para las tarjetas del dashboard basados en la navegación
  dashboardCards = [
    {
      title: "Familias",
      count: 0,
      icon: "home",
      route: "/modulo-familias/familias",
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/10",
      borderColor: "border-amber-200 dark:border-amber-800",
      textColor: "text-amber-700 dark:text-amber-300",
      description: "Gestión de familias registradas",
      status: "loading", // functional, inactive, loading
      loading: true,
    },
    {
      title: "Beneficiarios",
      count: 0,
      icon: "user-plus",
      route: "/modulo-beneficiarios/beneficiarios",
      color: "from-purple-500 to-violet-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/10",
      borderColor: "border-purple-200 dark:border-purple-800",
      textColor: "text-purple-700 dark:text-purple-300",
      description: "Administración de beneficiarios",
      status: "loading",
      loading: true,
    },
    {
      title: "Asistencias",
      count: 0,
      icon: "clipboard-check",
      route: "/modulo-asistencias/asistencias",
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/10",
      borderColor: "border-blue-200 dark:border-blue-800",
      textColor: "text-blue-700 dark:text-blue-300",
      description: "Control de asistencias",
      status: "loading",
      loading: true,
    },
    {
      title: "Talleres",
      count: 0,
      icon: "hammer",
      route: "/modulo-talleres/talleres",
      color: "from-rose-500 to-pink-600",
      bgColor: "bg-rose-50 dark:bg-rose-900/10",
      borderColor: "border-rose-200 dark:border-rose-800",
      textColor: "text-rose-700 dark:text-rose-300",
      description: "Gestión de talleres",
      status: "loading",
      loading: true,
    },
    {
      title: "Transformación",
      count: 0,
      icon: "sparkles",
      route: "/modulo-tranformacion/transformacion",
      color: "from-fuchsia-500 to-purple-600",
      bgColor: "bg-fuchsia-50 dark:bg-fuchsia-900/10",
      borderColor: "border-fuchsia-200 dark:border-fuchsia-800",
      textColor: "text-fuchsia-700 dark:text-fuchsia-300",
      description: "Seguimiento de transformación",
      status: "loading",
      loading: true,
    },
    {
      title: "Metas",
      count: 0,
      icon: "target",
      route: "/modulo-metas/metas",
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/10",
      borderColor: "border-cyan-200 dark:border-cyan-800",
      textColor: "text-cyan-700 dark:text-cyan-300",
      description: "Control de metas",
      status: "loading",
      loading: true,
    },
    {
      title: "Temas",
      count: 0,
      icon: "book-open",
      route: "/modulo-temas/temas",
      color: "from-lime-500 to-green-600",
      bgColor: "bg-lime-50 dark:bg-lime-900/10",
      borderColor: "border-lime-200 dark:border-lime-800",
      textColor: "text-lime-700 dark:text-lime-300",
      description: "Gestión de temas",
      status: "loading",
      loading: true,
    },
    {
      title: "Reportes",
      count: 0,
      icon: "file-text",
      route: "/modulo-reportes/reportes",
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/10",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      textColor: "text-emerald-700 dark:text-emerald-300",
      description: "Generación de reportes",
      status: "loading",
      loading: true,
    },
    {
      title: "Sesiones",
      count: 0,
      icon: "calendar-clock",
      route: "/modulo-sesiones/sesiones",
      color: "from-sky-500 to-blue-600",
      bgColor: "bg-sky-50 dark:bg-sky-900/10",
      borderColor: "border-sky-200 dark:border-sky-800",
      textColor: "text-sky-700 dark:text-sky-300",
      description: "Programación de sesiones",
      status: "loading",
      loading: true,
    },
  ]

  // Módulos recientes para acceso rápido (actualizado según solicitud)
  recentModules = [
    {
      title: "Familias",
      icon: "home",
      route: "/modulo-familias/familias",
      color: "bg-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-900/10",
      textColor: "text-amber-700 dark:text-amber-300",
      lastAccessed: "Hace 2 horas",
      count: 0,
      loading: true,
    },
    {
      title: "Beneficiarios",
      icon: "user-plus",
      route: "/modulo-beneficiarios/beneficiarios",
      color: "bg-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/10",
      textColor: "text-purple-700 dark:text-purple-300",
      lastAccessed: "Hace 1 día",
      count: 0,
      loading: true,
    },
    {
      title: "Asistencias",
      icon: "clipboard-check",
      route: "/modulo-asistencias/asistencias",
      color: "bg-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/10",
      textColor: "text-blue-700 dark:text-blue-300",
      lastAccessed: "Hace 3 horas",
      count: 0,
      loading: true,
    },
    {
      title: "Transformación",
      icon: "sparkles",
      route: "/modulo-tranformacion/transformacion",
      color: "bg-fuchsia-500",
      bgColor: "bg-fuchsia-50 dark:bg-fuchsia-900/10",
      textColor: "text-fuchsia-700 dark:text-fuchsia-300",
      lastAccessed: "Hace 5 días",
      count: 0,
      loading: true,
    },
    {
      title: "Reportes",
      icon: "file-text",
      route: "/modulo-reportes/reportes",
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/10",
      textColor: "text-emerald-700 dark:text-emerald-300",
      lastAccessed: "Hace 2 días",
      count: 0,
      loading: true,
    },
  ]

  // Historial de actividades recientes
  activityHistory: any[] = []

  // Añadir nuevas propiedades y métodos para el filtrado
  showFilterMenu = false
  selectedModules: string[] = []
  filteredHistory: any[] = []
  activityLoading = true

  constructor(
    private themeService: ThemeService,
    private sessionService: SessionService,
    private reportService: ReportService,
    private issueService: IssueService,
    private transformationService: TransformationService,
    private goalService: GoalService,
    private workshopService: WorkshopService,
    private familyService: FamilyService,
    private beneficiaryService: BeneficiaryService,
    private attendanceService: AttendanceService,
    private activityService: ActivityService,
  ) { }

  ngOnInit(): void {
    const cameFromLogin = history.state?.fromLogin === true
  
    // 🔁 Escuchar actualizaciones de actividad en tiempo real
    this.activityService.activityUpdated$.subscribe(() => {
      this.loadActivityHistory();
    });
  
    // Cargar historial de forma inicial
    this.loadActivityHistory();
  
    // Iniciar estado de carga de tarjetas
    this.dashboardCards.forEach((card) => {
      card.status = "loading";
      card.loading = true;
    });
  
    // Cargar datos con retraso simulado
    setTimeout(() => {
      this.loadDashboardData();
    }, 1000);
  }

  // Método para cargar todos los datos del dashboard
  loadDashboardData(): void {
    // Cargar cada módulo por separado para manejar errores individualmente
    this.loadFamiliesData()
    this.loadBeneficiariesData()
    this.loadAttendancesData()
    this.loadWorkshopsData()
    this.loadTransformationsData()
    this.loadGoalsData()
    this.loadIssuesData()
    this.loadReportsData()
    this.loadSessionsData()
    this.loadActivityHistory();
  }

  // Método para actualizar una tarjeta específica
  updateCardData(title: string, count: number, status: string): void {
    console.log(`Actualizando tarjeta ${title}: count=${count}, status=${status}`)

    // Actualizar la tarjeta principal
    const card = this.dashboardCards.find((card) => card.title === title)
    if (card) {
      card.count = count
      card.status = status
      card.loading = false
    }

    // Actualizar también en los módulos recientes si corresponde
    const recentModule = this.recentModules.find((module) => module.title === title)
    if (recentModule) {
      recentModule.count = count
      recentModule.loading = false
    }
  }

  // Métodos para cargar datos de cada entidad
  loadFamiliesData(): void {
    this.familyService
      .getFamiliesActive()
      .pipe(
        catchError((error) => {
          console.error("Error al cargar familias:", error)
          this.updateCardData("Familias", 0, "inactive")
          return of([])
        }),
        finalize(() => {
          // Si no se ha actualizado el estado, marcarlo como inactivo
          const card = this.dashboardCards.find((card) => card.title === "Familias")
          if (card && card.loading) {
            this.updateCardData("Familias", 0, "inactive")
          }
        }),
      )
      .subscribe((families) => {
        if (families && families.length > 0) {
          this.updateCardData("Familias", families.length, "functional")
        } else {
          this.updateCardData("Familias", 0, "functional")
        }
      })
  }

  loadBeneficiariesData(): void {
    this.beneficiaryService
      .getPersonsByTypeKinshipAndState("HIJO", "A")
      .pipe(
        catchError((error) => {
          console.error("Error al cargar beneficiarios:", error)
          this.updateCardData("Beneficiarios", 0, "inactive")
          return of([])
        }),
        finalize(() => {
          const card = this.dashboardCards.find((card) => card.title === "Beneficiarios")
          if (card && card.loading) {
            this.updateCardData("Beneficiarios", 0, "inactive")
          }
        }),
      )
      .subscribe((beneficiaries) => {
        if (beneficiaries && beneficiaries.length > 0) {
          this.updateCardData("Beneficiarios", beneficiaries.length, "functional")
        } else {
          this.updateCardData("Beneficiarios", 0, "functional")
        }
      })
  }

  loadAttendancesData(): void {
    this.attendanceService
      .getAttendances()
      .pipe(
        catchError((error) => {
          console.error("Error al cargar asistencias:", error)
          this.updateCardData("Asistencias", 0, "inactive")
          return of([])
        }),
        finalize(() => {
          const card = this.dashboardCards.find((card) => card.title === "Asistencias")
          if (card && card.loading) {
            this.updateCardData("Asistencias", 0, "inactive")
          }
        }),
      )
      .subscribe((attendances) => {
        if (attendances && attendances.length > 0) {
          this.updateCardData("Asistencias", attendances.length, "functional")
        } else {
          this.updateCardData("Asistencias", 0, "functional")
        }
      })
  }

  loadWorkshopsData(): void {
    this.workshopService
      .getActiveWorkshops()
      .pipe(
        catchError((error) => {
          console.error("Error al cargar talleres:", error)
          this.updateCardData("Talleres", 0, "inactive")
          return of([])
        }),
        finalize(() => {
          const card = this.dashboardCards.find((card) => card.title === "Talleres")
          if (card && card.loading) {
            this.updateCardData("Talleres", 0, "inactive")
          }
        }),
      )
      .subscribe((workshops) => {
        if (workshops && workshops.length > 0) {
          this.updateCardData("Talleres", workshops.length, "functional")
        } else {
          this.updateCardData("Talleres", 0, "functional")
        }
      })
  }

  loadTransformationsData(): void {
    this.transformationService
      .getAllTransformations()
      .pipe(
        catchError((error) => {
          console.error("Error al cargar transformaciones:", error)
          this.updateCardData("Transformación", 0, "inactive")
          return of([])
        }),
        finalize(() => {
          const card = this.dashboardCards.find((card) => card.title === "Transformación")
          if (card && card.loading) {
            this.updateCardData("Transformación", 0, "inactive")
          }
        }),
      )
      .subscribe((transformations) => {
        // Filtrar solo las transformaciones activas (status = 'A')
        const activeTransformations = transformations.filter((t) => t.status === "E")
        if (activeTransformations && activeTransformations.length > 0) {
          this.updateCardData("Transformación", activeTransformations.length, "functional")
        } else {
          this.updateCardData("Transformación", 0, "functional")
        }
      })
  }

  loadGoalsData(): void {
    this.goalService
      .getAllGoals()
      .pipe(
        catchError((error) => {
          console.error("Error al cargar metas:", error)
          this.updateCardData("Metas", 0, "inactive")
          return of([])
        }),
        finalize(() => {
          const card = this.dashboardCards.find((card) => card.title === "Metas")
          if (card && card.loading) {
            this.updateCardData("Metas", 0, "inactive")
          }
        }),
      )
      .subscribe((goals) => {
        // Filtrar solo las metas activas (status = 'A')
        const activeGoals = goals.filter((g) => g.status === "A")
        if (activeGoals && activeGoals.length > 0) {
          this.updateCardData("Metas", activeGoals.length, "functional")
        } else {
          this.updateCardData("Metas", 0, "functional")
        }
      })
  }

  loadIssuesData(): void {
    this.issueService
      .getActiveIssues()
      .pipe(
        catchError((error) => {
          console.error("Error al cargar temas:", error)
          this.updateCardData("Temas", 0, "inactive")
          return of([])
        }),
        finalize(() => {
          const card = this.dashboardCards.find((card) => card.title === "Temas")
          if (card && card.loading) {
            this.updateCardData("Temas", 0, "inactive")
          }
        }),
      )
      .subscribe((issues) => {
        if (issues && issues.length > 0) {
          this.updateCardData("Temas", issues.length, "functional")
        } else {
          this.updateCardData("Temas", 0, "functional")
        }
      })
  }

  // Modificar la función loadReportsData() para asegurar que los errores se manejen correctamente
  loadReportsData(): void {
    // Marcar como cargando inicialmente
    const card = this.dashboardCards.find((card) => card.title === "Reportes")
    if (card) {
      card.status = "loading"
      card.loading = true
    }

    // Variable para rastrear si hubo un error
    let hasError = false

    this.reportService
      .listReportsByFilter(undefined, "A")
      .pipe(
        catchError((error) => {
          console.error("Error al cargar reportes:", error)
          // Marcar como inactivo inmediatamente cuando hay un error
          this.updateCardData("Reportes", 0, "inactive")
          hasError = true // Marcar que hubo un error
          return of([]) // Devolver un array vacío para continuar el flujo
        }),
      )
      .subscribe({
        next: (reports) => {
          // Solo actualizar si NO hubo un error previo
          if (!hasError) {
            if (reports && reports.length > 0) {
              this.updateCardData("Reportes", reports.length, "functional")
            } else {
              this.updateCardData("Reportes", 0, "functional")
            }
          }
        },
        error: (err) => {
          // Este bloque es una capa adicional de seguridad para capturar errores
          console.error("Error no capturado en reportes:", err)
          this.updateCardData("Reportes", 0, "inactive")
          hasError = true
        },
        complete: () => {
          // Si todavía está en estado de carga y hubo un error, asegurarse de que siga como inactivo
          if (card && card.loading && hasError) {
            this.updateCardData("Reportes", 0, "inactive")
          }
        },
      })
  }

  // Modificar también las otras funciones de carga para usar el mismo patrón
  loadSessionsData(): void {
    // Marcar como cargando inicialmente
    const card = this.dashboardCards.find((card) => card.title === "Sesiones")
    if (card) {
      card.status = "loading"
      card.loading = true
    }

    this.sessionService
      .getSessionsByStatus("A")
      .pipe(
        catchError((error) => {
          console.error("Error al cargar sesiones:", error)
          // Marcar como inactivo inmediatamente cuando hay un error
          this.updateCardData("Sesiones", 0, "inactive")
          return of([]) // Devolver un array vacío para continuar el flujo
        }),
      )
      .subscribe({
        next: (sessions) => {
          if (sessions && sessions.length > 0) {
            this.updateCardData("Sesiones", sessions.length, "functional")
          } else {
            this.updateCardData("Sesiones", 0, "functional")
          }
        },
        error: (err) => {
          // Este bloque es una capa adicional de seguridad para capturar errores
          console.error("Error no capturado en sesiones:", err)
          this.updateCardData("Sesiones", 0, "inactive")
        },
        complete: () => {
          // Si todavía está en estado de carga, marcarlo como inactivo
          if (card && card.loading) {
            this.updateCardData("Sesiones", 0, "inactive")
          }
        },
      })
  }

  // Método para mostrar/ocultar el menú de filtro
  toggleFilterMenu(): void {
    this.showFilterMenu = !this.showFilterMenu
  }

  // Método para refrescar el historial
  refreshHistory(): void {
    // Limpiar filtros
    this.clearFilters()
    // Recargar datos desde el servicio
    this.loadActivityHistory()
  }

  // Método para obtener módulos únicos del historial
  getUniqueModules(): string[] {
    return [...new Set(this.activityHistory.map((item) => item.module))]
  }

  // Método para verificar si un módulo está seleccionado
  isModuleSelected(module: string): boolean {
    return this.selectedModules.includes(module)
  }

  // Método para alternar la selección de un módulo
  toggleModuleFilter(module: string): void {
    if (this.selectedModules.includes(module)) {
      this.selectedModules = this.selectedModules.filter((m) => m !== module)
    } else {
      this.selectedModules.push(module)
    }
  }

  // Método para limpiar todos los filtros
  clearFilters(): void {
    this.selectedModules = []
    this.filteredHistory = [...this.activityHistory]
    this.showFilterMenu = false
  }

  // Método para aplicar los filtros seleccionados
  applyFilters(): void {
    if (this.selectedModules.length === 0) {
      this.filteredHistory = [...this.activityHistory]
    } else {
      this.filteredHistory = this.activityHistory.filter((item) => this.selectedModules.includes(item.module))
    }
    this.showFilterMenu = false
  }

  // Método para calcular el ancho del progreso basado en el conteo
  getProgressWidth(count: number): string {
    // Normaliza el conteo para que el ancho sea proporcional
    const maxCount = 300
    const percentage = Math.min((count / maxCount) * 100, 100)
    return `${percentage}%`
  }

  // Método para obtener el color del indicador de estado
  getStatusColor(status: string): string {
    switch (status) {
      case "functional":
        return "bg-green-500"
      case "inactive":
        return "bg-red-500"
      case "loading":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  // Método para obtener el texto del indicador de estado
  getStatusText(status: string): string {
    switch (status) {
      case "functional":
        return "Funcional"
      case "inactive":
        return "Inactivo"
      case "loading":
        return "Cargando"
      default:
        return "Desconocido"
    }
  }

  // Método para cargar el historial de actividades
  loadActivityHistory(): void {
    this.activityLoading = true;
  
    this.activityService
      .getAllActivities()
      .pipe(
        catchError((error) => {
          console.error("Error al cargar historial de actividades:", error);
          this.activityLoading = false;
          return of([]);
        })
      )
      .subscribe({
        next: (activities) => {
          this.activityHistory = activities.map((activity) => {
            const moduleColor = this.getModuleColor(activity.modulo);
            const formattedDate = this.formatFriendlyDate(activity.fecha);
  
            return {
              userName: activity.nombre,
              userAvatar: activity.imagen || "/placeholder.svg?height=40&width=40",
              action: activity.accion,
              module: activity.modulo,
              timestamp: formattedDate,
              color: `bg-${moduleColor}-500`,
              bgColor: `bg-${moduleColor}-50 dark:bg-gray-700/10`,
              textColor: `text-${moduleColor}-700 dark:text-${moduleColor}-300`,
            };
          });
  
          this.filteredHistory = [...this.activityHistory];
          this.activityLoading = false;
        },
        error: () => {
          this.activityLoading = false;
        },
      });
  }

  // Método para obtener el color basado en el módulo
  getModuleColor(module: string): string {
    const moduleColors: Record<string, string> = {
      Familias: "amber",
      Beneficiarios: "purple",
      Asistencias: "blue",
      Talleres: "rose",
      Transformación: "fuchsia",
      Metas: "cyan",
      Temas: "lime",
      Reportes: "emerald",
      Sesiones: "sky",
      Usuarios: "orange",
      Sistema: "indigo",
    }

    return moduleColors[module] || "gray"
  }

  // Método para formatear fechas de manera amigable
  formatFriendlyDate(dateString: string | undefined): string {
    if (!dateString) return "Fecha no disponible"

    // Convertir la cadena de fecha a un objeto Date
    const date = new Date(dateString)

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) return dateString

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Formatear la hora (12 horas con AM/PM)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? "PM" : "AM"
    const formattedHours = hours % 12 || 12 // Convertir 0 a 12
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes
    const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`

    // Comprobar si es hoy
    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    ) {
      return `Hoy, ${timeString}`
    }

    // Comprobar si es ayer
    if (
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate()
    ) {
      return `Ayer, ${timeString}`
    }

    // Para fechas más antiguas, mostrar la fecha completa
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]

    return `${date.getDate()}/${months[date.getMonth()]}/${date.getFullYear()} ${timeString}`
  }
}
