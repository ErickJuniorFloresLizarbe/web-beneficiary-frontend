import { Component, OnInit } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { TransformationService } from '../../../../services/transformation.service';
import { FamilyService } from '../../../../services/family.service';
import { Transformation } from '../../../../interfaces/transformation';
import { Family } from '../../../../interfaces/familiaDto';
import { Goal } from '../../../../interfaces/goal';

@Component({
  selector: 'app-transformation',
  templateUrl: './transformation.component.html',
  styleUrls: ['./transformation.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class TransformationComponent implements OnInit {
  transformationsMap: Record<number, Transformation[]> = {};
  familiesMap: Record<number, string> = {};
  familiesList: Family[] = [];
  sortedTransformations: Transformation[] = [];
  goalsList: Goal[] = [];
  isLoading = true;
  familiesWithoutTransformations: Family[] = [];
  familyTransformations: { family: string; id: number; transformations: Transformation[] }[] = [];

  constructor(
    private transformationService: TransformationService,
    private familyService: FamilyService
  ) {}

  ngOnInit(): void {
    this.loadAllGoals();
    this.loadAllFamilies();
  }

  private loadAllGoals(): void {
    this.transformationService.getAllGoals().subscribe({
      next: (goals: Goal[]) => {
        this.goalsList = goals;
        console.log('Goals cargados:', this.goalsList);
      },
      error: (err: any) => console.error('Error cargando goals:', err),
    });
  }

  private loadAllFamilies(): void {
    this.familyService.getFamiliesActive().subscribe({
      next: (families: Family[]) => {
        this.familiesList = families;
        console.log('Familias cargadas:', this.familiesList);
        this.familiesMap = families.reduce((map, family) => {
          if (family.id !== undefined) {
            map[family.id] = family.lastName;
          }
          return map;
        }, {} as Record<number, string>);

        this.loadTransformationsWithGoals();
      },
      error: (err: any) => {
        console.error('Error cargando familias:', err);
        this.isLoading = false;
        Swal.fire('Error', 'No se pudieron cargar las familias', 'error');
      },
    });
  }

  private loadTransformationsWithGoals(): void {
  this.isLoading = true;
  this.transformationService.getAllTransformations().subscribe({
    next: (transformations: Transformation[]) => {
      console.log('Transformaciones cargadas:', transformations);
      this.transformationsMap = {};

      transformations.forEach(transformation => {
        if (transformation.family && transformation.family.id !== undefined) {
          const familyId = transformation.family.id;
          if (!this.transformationsMap[familyId]) {
            this.transformationsMap[familyId] = [];
          }
          this.transformationsMap[familyId].push(transformation);
        }
      });

      this.sortedTransformations = transformations
        .filter(t => t.family && t.family.id !== undefined)
        .sort((a, b) =>
          (this.familiesMap[a.family.id!] || '').localeCompare(
            this.familiesMap[b.family.id!] || ''
          )
        );

      this.assignGoalsToTransformations();
      this.updateFamiliesWithoutTransformations();
      this.groupTransformationsByFamily();
      this.isLoading = false;
    },
    error: (err: any) => {
      console.error('Error cargando transformaciones:', err);
      this.isLoading = false;
      Swal.fire('Error', 'No se pudieron cargar las transformaciones', 'error');
    },
  });
}

  private groupTransformationsByFamily(): void {
    this.familyTransformations = [];

    Object.keys(this.transformationsMap).forEach(familyId => {
      const id = parseInt(familyId);
      const familyName = this.familiesMap[id] || 'Sin apellido';

      this.familyTransformations.push({
        family: familyName,
        id: id,
        transformations: this.transformationsMap[id].sort((a, b) => {
          const dateA = a.lastUpdateDate ? new Date(a.lastUpdateDate).getTime() : 0;
          const dateB = b.lastUpdateDate ? new Date(b.lastUpdateDate).getTime() : 0;
          return dateB - dateA;
        })
      });
    });

    this.familyTransformations.sort((a, b) => a.family.localeCompare(b.family));
    console.log('Transformaciones de familia agrupadas:', this.familyTransformations);
  }

  private updateFamiliesWithoutTransformations(): void {
    const familyIdsWithTransformations = new Set(
      Object.keys(this.transformationsMap).map(id => parseInt(id))
    );

    this.familiesWithoutTransformations = this.familiesList.filter(
      family => family.id !== undefined && !familyIdsWithTransformations.has(family.id)
    );

    console.log('Familias sin transformaciones:', this.familiesWithoutTransformations);
  }

  private assignGoalsToTransformations(): void {
    Object.values(this.transformationsMap).forEach(transformations => {
      transformations.forEach(transformation => {
        if (transformation.goal?.id) {
          const goal = this.goalsList.find(g => g.id === transformation.goal.id);
          if (goal) {
            transformation.goal = goal;
          }
        }
      });
    });
  }

  addTransformationForFamily(familyId: number | undefined): void {
    if (familyId === undefined) {
      Swal.fire('Error', 'ID de familia no válido', 'error');
      return;
    }
    
    if (this.goalsList.length === 0) {
      Swal.fire('Error', 'No hay goals disponibles para asignar', 'error');
      return;
    }
    
    // Obtener el nombre de la familia para mostrar en el título
    const familyName = this.familiesMap[familyId] || 'Familia';
    
    // Variables para la edición
    let selectedGoal: Goal | null = null;
    let isEditingMode = false;
    
    const goalOptions = this.goalsList.map(goal =>
      `<option value="${goal.id}">${goal.name || 'Goal sin nombre'}</option>`
    ).join('');
    
    // Conseguir sesiones disponibles (asumimos que están en la estructura de goal.session)
    let availableSessions: any[] = [];
    this.goalsList.forEach(goal => {
      if (goal.session && !availableSessions.some(s => s.id === goal.session.id)) {
        availableSessions.push(goal.session);
      }
    });
    
    const sessionOptions = availableSessions.map(session =>
      `<option value="${session.id}">${session.name || 'Sesión sin nombre'}</option>`
    ).join('');
    
    Swal.fire({
      title: `<i class="bi bi-plus-circle-fill text-primary me-2"></i>Agregar Meta para ${familyName}`,
      html: `
        <div class="container p-0">
          <!-- Tab de navegación -->
          <ul class="nav nav-tabs mb-3" id="transformationTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" id="select-tab" data-bs-toggle="tab" data-bs-target="#select-content" 
              type="button" role="tab" aria-controls="select-content" aria-selected="true">
                <i class="bi bi-search me-2"></i>Seleccionar Meta
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="edit-tab" data-bs-toggle="tab" data-bs-target="#edit-content" 
              type="button" role="tab" aria-controls="edit-content" aria-selected="false">
                <i class="bi bi-pencil-square me-2"></i>Editar Detalles
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="session-tab" data-bs-toggle="tab" data-bs-target="#session-content" 
              type="button" role="tab" aria-controls="session-content" aria-selected="false">
                <i class="bi bi-calendar-event me-2"></i>Sesión
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="settings-tab" data-bs-toggle="tab" data-bs-target="#settings-content" 
              type="button" role="tab" aria-controls="settings-content" aria-selected="false">
                <i class="bi bi-gear me-2"></i>Configuración
              </button>
            </li>
          </ul>
          
          <div class="tab-content" id="transformationTabsContent">
            <!-- Tab 1: Selección de Goal -->
            <div class="tab-pane fade show active" id="select-content" role="tabpanel" aria-labelledby="select-tab">
              <div class="form-group mb-3">
                <label for="goalSelect" class="form-label fw-bold text-primary">
                  <i class="bi bi-bullseye me-2"></i>Seleccionar Meta Existente:
                </label>
                <div class="input-group shadow-sm">
                  <span class="input-group-text bg-primary text-white">
                    <i class="bi bi-search"></i>
                  </span>
                  <select id="goalSelect" class="form-select border-0 py-2">
                    <option value="">-- Seleccione una meta --</option>
                    ${goalOptions}
                  </select>
                </div>
                <div class="form-check mt-2">
                  <input class="form-check-input" type="checkbox" id="createNewGoal">
                  <label class="form-check-label" for="createNewGoal">
                    Crear nueva meta personalizada
                  </label>
                </div>
              </div>
              
              <!-- Panel de vista previa -->
              <div id="goalPreview" class="card border-0 shadow-sm mb-3 d-none animate__animated animate__fadeIn">
                <div class="card-header bg-primary text-white">
                  <h5 class="mb-0 d-flex align-items-center">
                    <i class="bi bi-eye me-2"></i>Vista Previa de la Meta
                  </h5>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-12">
                      <div class="p-2 rounded bg-light">
                        <small class="text-muted d-block mb-1">Nombre:</small>
                        <p id="previewName" class="fw-bold mb-0"></p>
                      </div>
                    </div>
                    <div class="col-12">
                      <div class="p-2 rounded bg-light">
                        <small class="text-muted d-block mb-1">Indicador:</small>
                        <p id="previewIndicator" class="mb-0"></p>
                      </div>
                    </div>
                    <div class="col-12">
                      <div class="p-2 rounded bg-light">
                        <small class="text-muted d-block mb-1">Objetivo:</small>
                        <p id="previewObjective" class="mb-0"></p>
                      </div>
                    </div>
                    <div class="col-12">
                      <div class="p-2 rounded bg-light">
                        <small class="text-muted d-block mb-1">Situación actual:</small>
                        <p id="previewSituation" class="mb-0"></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="d-flex justify-content-between mt-3">
                <button id="prevBtn1" class="btn btn-outline-secondary" disabled>
                  <i class="bi bi-chevron-left me-2"></i>Anterior
                </button>
                <button id="nextBtn1" class="btn btn-primary">
                  Siguiente<i class="bi bi-chevron-right ms-2"></i>
                </button>
              </div>
            </div>
            
            <!-- Tab 2: Editar detalles de la Goal -->
            <div class="tab-pane fade" id="edit-content" role="tabpanel" aria-labelledby="edit-tab">
              <form id="goalEditForm">
                <div class="mb-3">
                  <label for="goalName" class="form-label fw-bold text-primary">
                    <i class="bi bi-tag me-2"></i>Nombre de la Meta:
                  </label>
                  <input type="text" class="form-control shadow-sm" id="goalName" placeholder="Ingrese nombre de la meta" required>
                </div>
                
                <div class="mb-3">
                  <label for="goalIndicator" class="form-label fw-bold text-primary">
                    <i class="bi bi-graph-up me-2"></i>Indicador:
                  </label>
                  <input type="text" class="form-control shadow-sm" id="goalIndicator" placeholder="Ingrese el indicador">
                </div>
                
                <div class="mb-3">
                  <label for="goalObjective" class="form-label fw-bold text-primary">
                    <i class="bi bi-bullseye me-2"></i>Objetivo:
                  </label>
                  <textarea class="form-control shadow-sm" id="goalObjective" rows="2" placeholder="Ingrese el objetivo"></textarea>
                </div>
                
                <div class="mb-3">
                  <label for="goalSituation" class="form-label fw-bold text-primary">
                    <i class="bi bi-clipboard-data me-2"></i>Situación Actual:
                  </label>
                  <textarea class="form-control shadow-sm" id="goalSituation" rows="2" placeholder="Describa la situación actual"></textarea>
                </div>
              </form>
              
              <div class="d-flex justify-content-between mt-3">
                <button id="prevBtn2" class="btn btn-outline-secondary">
                  <i class="bi bi-chevron-left me-2"></i>Anterior
                </button>
                <button id="nextBtn2" class="btn btn-primary">
                  Siguiente<i class="bi bi-chevron-right ms-2"></i>
                </button>
              </div>
            </div>
            
            <!-- Tab 3: Selección de Sesión -->
            <div class="tab-pane fade" id="session-content" role="tabpanel" aria-labelledby="session-tab">
              <div class="form-group mb-3">
                <label for="sessionSelect" class="form-label fw-bold text-primary">
                  <i class="bi bi-calendar-event me-2"></i>Seleccionar Sesión:
                </label>
                <div class="input-group shadow-sm">
                  <span class="input-group-text bg-primary text-white">
                    <i class="bi bi-list-check"></i>
                  </span>
                  <select id="sessionSelect" class="form-select border-0 py-2">
                    <option value="">-- Seleccione una sesión --</option>
                    ${sessionOptions}
                  </select>
                </div>
              </div>
              
              <!-- Vista previa de la sesión -->
              <div id="sessionPreview" class="card border-0 shadow-sm mb-3 d-none animate__animated animate__fadeIn">
                <div class="card-header bg-primary text-white">
                  <h5 class="mb-0 d-flex align-items-center">
                    <i class="bi bi-info-circle me-2"></i>Detalles de la Sesión
                  </h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <small class="text-muted d-block mb-1">Nombre de la Sesión:</small>
                    <p id="sessionName" class="fw-bold mb-0"></p>
                  </div>
                  <div>
                    <small class="text-muted d-block mb-1">Descripción:</small>
                    <div id="sessionDescription" class="p-2 bg-light rounded"></div>
                  </div>
                </div>
              </div>
              
              <div class="d-flex justify-content-between mt-3">
                <button id="prevBtn3" class="btn btn-outline-secondary">
                  <i class="bi bi-chevron-left me-2"></i>Anterior
                </button>
                <button id="nextBtn3" class="btn btn-primary">
                  Siguiente<i class="bi bi-chevron-right ms-2"></i>
                </button>
              </div>
            </div>
            
            <!-- Tab 4: Configuración -->
            <div class="tab-pane fade" id="settings-content" role="tabpanel" aria-labelledby="settings-tab">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="durationSelect" class="form-label fw-bold text-primary">
                      <i class="bi bi-calendar-range me-2"></i>Duración:
                    </label>
                    <div class="input-group shadow-sm">
                      <span class="input-group-text bg-primary text-white">
                        <i class="bi bi-clock"></i>
                      </span>
                      <select id="durationSelect" class="form-select border-0 py-2">
                        ${[1,2,3,4,5,6,7,8,9,10,11,12].map(i =>
                          `<option value="${i.toString().padStart(2, '0')} meses">
                            ${i.toString().padStart(2, '0')} meses
                          </option>`
                        ).join('')}
                      </select>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="statusSelect" class="form-label fw-bold text-primary">
                      <i class="bi bi-check-circle me-2"></i>Estado Inicial:
                    </label>
                    <div class="input-group shadow-sm">
                      <span class="input-group-text bg-primary text-white">
                        <i class="bi bi-flag"></i>
                      </span>
                      <select id="statusSelect" class="form-select border-0 py-2">
                        <option value="P">Pendiente</option>
                        <option value="E">En Progreso</option>
                        <option value="C">Completado</option>
                        <option value="X">Cancelado</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Fecha de inicio -->
              <div class="mb-3">
                <label for="startDate" class="form-label fw-bold text-primary">
                  <i class="bi bi-calendar me-2"></i>Fecha de Inicio:
                </label>
                <input type="date" class="form-control shadow-sm" id="startDate">
              </div>
              
              <!-- Resumen -->
              <div class="card border-0 shadow-sm mb-3">
                <div class="card-header bg-primary text-white">
                  <h5 class="mb-0 d-flex align-items-center">
                    <i class="bi bi-file-earmark-text me-2"></i>Resumen
                  </h5>
                </div>
                <div class="card-body">
                  <div class="alert alert-light">
                    <p><i class="bi bi-people me-2"></i><strong>Familia:</strong> <span id="summaryFamily">${familyName}</span></p>
                    <p><i class="bi bi-bullseye me-2"></i><strong>Meta:</strong> <span id="summaryGoal">Por seleccionar</span></p>
                    <p><i class="bi bi-calendar-event me-2"></i><strong>Sesión:</strong> <span id="summarySession">Por seleccionar</span></p>
                    <p><i class="bi bi-clock me-2"></i><strong>Duración:</strong> <span id="summaryDuration">01 meses</span></p>
                    <p><i class="bi bi-check-circle me-2"></i><strong>Estado:</strong> <span id="summaryStatus">Pendiente</span></p>
                  </div>
                </div>
              </div>
              
              <div class="d-flex justify-content-between mt-3">
                <button id="prevBtn4" class="btn btn-outline-secondary">
                  <i class="bi bi-chevron-left me-2"></i>Anterior
                </button>
                <button id="finishBtn" class="btn btn-success">
                  <i class="bi bi-check-circle me-2"></i>Guardar Transformación
                </button>
              </div>
            </div>
          </div>
        </div>
      `,
      width: 800,
      showCancelButton: true,
      showConfirmButton: false,
      cancelButtonText: '<i class="bi bi-x-circle me-2"></i>Cancelar',
      cancelButtonColor: '#e53935',
      customClass: {
        cancelButton: 'btn btn-danger'
      },
      focusConfirm: false,
      didOpen: () => {
        // Aplicar estilos adicionales a SweetAlert
        const modal = Swal.getPopup();
        if (modal) {
          modal.style.borderRadius = '1rem';
          modal.style.padding = '1rem';
        }
        
        // Función para activar tab
        const activateTab = (tabId: string) => {
          // Evitamos usar bootstrap.Tab directamente - usamos el API del DOM en su lugar
          const tabToActivate = document.querySelector(`#${tabId}`) as HTMLElement;
          if (tabToActivate) {
            // Usar el método click para activar la pestaña en lugar de bootstrap.Tab
            tabToActivate.click();
          }
        };
        
        // Manejar evento de selección de goal
        const goalSelect = document.getElementById('goalSelect') as HTMLSelectElement;
        const goalPreview = document.getElementById('goalPreview');
        const createNewGoalCheckbox = document.getElementById('createNewGoal') as HTMLInputElement;
        
        // Actualizar resumen cuando cambie la duración
        const durationSelect = document.getElementById('durationSelect') as HTMLSelectElement;
        durationSelect.addEventListener('change', () => {
          const summaryDuration = document.getElementById('summaryDuration');
          if (summaryDuration) {
            summaryDuration.textContent = durationSelect.value;
          }
        });
        
        // Actualizar resumen cuando cambie el estado
        const statusSelect = document.getElementById('statusSelect') as HTMLSelectElement;
        statusSelect.addEventListener('change', () => {
          const summaryStatus = document.getElementById('summaryStatus');
          if (summaryStatus) {
            summaryStatus.textContent = this.getStatusText(statusSelect.value);
          }
        });
        
        // Manejar cambio en checkbox de nueva meta
        createNewGoalCheckbox.addEventListener('change', () => {
          if (createNewGoalCheckbox.checked) {
            goalSelect.disabled = true;
            goalPreview?.classList.add('d-none');
            isEditingMode = true;
          } else {
            goalSelect.disabled = false;
            isEditingMode = false;
            if (goalSelect.value) {
              goalPreview?.classList.remove('d-none');
            }
          }
        });
        
        goalSelect.addEventListener('change', () => {
          const selectedGoalId = parseInt(goalSelect.value);
          if (!selectedGoalId) {
            goalPreview?.classList.add('d-none');
            selectedGoal = null;
            return;
          }
          
          selectedGoal = this.goalsList.find(g => g.id === selectedGoalId) || null;
          if (selectedGoal) {
            // Actualizar vista previa
            const previewName = document.getElementById('previewName');
            const previewIndicator = document.getElementById('previewIndicator');
            const previewObjective = document.getElementById('previewObjective');
            const previewSituation = document.getElementById('previewSituation');
            
            if (previewName) previewName.textContent = selectedGoal.name || 'No definido';
            if (previewIndicator) previewIndicator.textContent = selectedGoal.indicator || 'No definido';
            if (previewObjective) previewObjective.textContent = selectedGoal.objective || 'No definido';
            if (previewSituation) previewSituation.textContent = selectedGoal.currentSituation || 'No definido';
            
            // También pre-cargar los datos en el formulario de edición
            const goalNameInput = document.getElementById('goalName') as HTMLInputElement;
            const goalIndicatorInput = document.getElementById('goalIndicator') as HTMLInputElement;
            const goalObjectiveInput = document.getElementById('goalObjective') as HTMLTextAreaElement;
            const goalSituationInput = document.getElementById('goalSituation') as HTMLTextAreaElement;
            
            if (goalNameInput) goalNameInput.value = selectedGoal.name || '';
            if (goalIndicatorInput) goalIndicatorInput.value = selectedGoal.indicator || '';
            if (goalObjectiveInput) goalObjectiveInput.value = selectedGoal.objective || '';
            if (goalSituationInput) goalSituationInput.value = selectedGoal.currentSituation || '';
            
            // Actualizar resumen
            const summaryGoal = document.getElementById('summaryGoal');
            if (summaryGoal) summaryGoal.textContent = selectedGoal.name || 'No definido';
            
            // Mostrar vista previa
            goalPreview?.classList.remove('d-none');
          }
        });
        
        // Manejar evento de selección de sesión
        const sessionSelect = document.getElementById('sessionSelect') as HTMLSelectElement;
        const sessionPreview = document.getElementById('sessionPreview');
        
        sessionSelect.addEventListener('change', () => {
          const selectedSessionId = parseInt(sessionSelect.value);
          if (!selectedSessionId) {
            sessionPreview?.classList.add('d-none');
            const summarySession = document.getElementById('summarySession');
            if (summarySession) summarySession.textContent = 'Por seleccionar';
            return;
          }
          
          const selectedSession = availableSessions.find(s => s.id === selectedSessionId);
          if (selectedSession) {
            // Actualizar vista previa de la sesión
            const sessionName = document.getElementById('sessionName');
            const sessionDescription = document.getElementById('sessionDescription');
            
            if (sessionName) sessionName.textContent = selectedSession.name || 'No definido';
            if (sessionDescription) sessionDescription.textContent = selectedSession.description || 'No hay descripción disponible';
            
            // Actualizar resumen
            const summarySession = document.getElementById('summarySession');
            if (summarySession) summarySession.textContent = selectedSession.name || 'No definido';
            
            // Mostrar vista previa
            sessionPreview?.classList.remove('d-none');
          }
        });
        
        // Botones de navegación
        // Navegación Tab 1
        const nextBtn1 = document.getElementById('nextBtn1');
        if (nextBtn1) {
          nextBtn1.addEventListener('click', () => {
            if (createNewGoalCheckbox.checked || selectedGoal) {
              activateTab('edit-tab');
            } else {
              Swal.showValidationMessage('Por favor seleccione una meta o marque la opción para crear una nueva');
            }
          });
        }
        
        // Navegación Tab 2
        const prevBtn2 = document.getElementById('prevBtn2');
        if (prevBtn2) {
          prevBtn2.addEventListener('click', () => {
            activateTab('select-tab');
          });
        }
        
        const nextBtn2 = document.getElementById('nextBtn2');
        if (nextBtn2) {
          nextBtn2.addEventListener('click', () => {
            const nameInput = document.getElementById('goalName') as HTMLInputElement;
            if (!nameInput || !nameInput.value.trim()) {
              Swal.showValidationMessage('El nombre de la meta es obligatorio');
              return;
            }
            
            // Actualizar información del resumen
            const summaryGoal = document.getElementById('summaryGoal');
            if (summaryGoal) summaryGoal.textContent = nameInput.value;
            
            // Pasar a la siguiente pestaña
            activateTab('session-tab');
          });
        }
        
        // Navegación Tab 3
        const prevBtn3 = document.getElementById('prevBtn3');
        if (prevBtn3) {
          prevBtn3.addEventListener('click', () => {
            activateTab('edit-tab');
          });
        }
        
        const nextBtn3 = document.getElementById('nextBtn3');
        if (nextBtn3) {
          nextBtn3.addEventListener('click', () => {
            activateTab('settings-tab');
          });
        }
        
        // Navegación Tab 4
        const prevBtn4 = document.getElementById('prevBtn4');
        if (prevBtn4) {
          prevBtn4.addEventListener('click', () => {
            activateTab('session-tab');
          });
        }
        
        // Configurar la fecha actual como valor por defecto
        const today = new Date();
        const startDateEl = document.getElementById('startDate') as HTMLInputElement;
        if (startDateEl) {
          startDateEl.value = today.toISOString().split('T')[0];
        }
        
        // Botón para finalizar/guardar
        const finishBtn = document.getElementById('finishBtn');
        if (finishBtn) {
          finishBtn.addEventListener('click', () => {
            // Recopilar toda la información
            const nameInput = document.getElementById('goalName') as HTMLInputElement;
            if (!nameInput || !nameInput.value.trim()) {
              Swal.showValidationMessage('El nombre de la meta es obligatorio');
              return;
            }
            
            // Obtener los valores de los campos
            const name = (document.getElementById('goalName') as HTMLInputElement)?.value || '';
            const indicator = (document.getElementById('goalIndicator') as HTMLInputElement)?.value || '';
            const objective = (document.getElementById('goalObjective') as HTMLTextAreaElement)?.value || '';
            const situation = (document.getElementById('goalSituation') as HTMLTextAreaElement)?.value || '';
            const sessionId = parseInt((document.getElementById('sessionSelect') as HTMLSelectElement)?.value || '0');
            const duration = (document.getElementById('durationSelect') as HTMLSelectElement)?.value || '01 meses';
            const status = (document.getElementById('statusSelect') as HTMLSelectElement)?.value || 'P';
            const startDateValue = (document.getElementById('startDate') as HTMLInputElement)?.value;
            const startDate = startDateValue ? new Date(startDateValue) : new Date();
            
            // Encontrar la sesión seleccionada
            const selectedSession = sessionId ? availableSessions.find(s => s.id === sessionId) : null;
            
            // Crear el objeto de transformación
            const newTransformation: Transformation = {
              id: 0,
              firstPlanDate: startDate,
              lastUpdateDate: new Date(),
              duration: duration,
              status: status,
              goal: {
                id: selectedGoal ? selectedGoal.id : 0, // Usar 0 para nueva goal
                name: name,
                indicator: indicator,
                objective: objective,
                currentSituation: situation,
                session: selectedSession || null
              } as Goal,
              family: {
                id: familyId
              } as Family
            };
            
            console.log('Objeto de transformación a enviar:', newTransformation);
            
            // Llamada a la API
            Swal.fire({
              title: '<i class="bi bi-hourglass-split me-2 text-primary"></i>Creando transformación...',
              html: '<div class="d-flex align-items-center gap-3"><div class="spinner-border text-primary" role="status"></div><p class="mb-0">Guardando los datos, por favor espere...</p></div>',
              allowOutsideClick: false,
              showConfirmButton: false,
              didOpen: () => {
                Swal.showLoading();
                
                this.transformationService.createTransformation(newTransformation).subscribe({
                  next: (createdTransformation: Transformation) => {
                    console.log('Transformación creada exitosamente:', createdTransformation);
                    
                    // Preguntar si desea agregar otra
                    Swal.fire({
                      icon: 'success',
                      title: '<i class="bi bi-check-circle me-2 text-success"></i>¡Transformación creada!',
                      html: '<p>La transformación ha sido agregada correctamente a la familia <strong>' + familyName + '</strong></p>',
                      showCancelButton: true,
                      confirmButtonColor: '#43a047',
                      cancelButtonColor: '#3085d6',
                      confirmButtonText: 'Agregar otra meta',
                      cancelButtonText: 'Finalizar',
                      customClass: {
                        popup: 'animate__animated animate__fadeInUp',
                        confirmButton: 'btn btn-success',
                        cancelButton: 'btn btn-primary'
                      }
                    }).then((result) => {
                      if (result.isConfirmed) {
                        // Llamar de nuevo a la función para agregar otra meta
                        this.addTransformationForFamily(familyId);
                      } else {
                        // Recargar datos
                        this.loadTransformationsWithGoals();
                      }
                    });
                  },
                  error: (err: any) => {
                    console.error('Error creando transformación:', err);
                    Swal.fire({
                      icon: 'error',
                      title: '<i class="bi bi-exclamation-triangle me-2 text-danger"></i>Error',
                      html: `<p>No se pudo agregar la transformación:</p><p class="text-danger">${err.message || 'Error desconocido'}</p>`,
                      confirmButtonColor: '#e53935',
                      confirmButtonText: 'Entendido',
                      customClass: {
                        popup: 'animate__animated animate__shakeX',
                        confirmButton: 'btn btn-danger'
                      }
                    });
                  }
                });
              }
            });
          });
        }
      }
    }).then((result) => {
      if (result.isDismissed) {
        // Cancelado, recargar de todos modos para asegurarse de que los datos estén actualizados
        this.loadTransformationsWithGoals();
      }
    });
  }
  viewGoalDetails(transformation: Transformation): void {
    if (!transformation.goal) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay Goal Asociado',
        text: 'Esta transformación no tiene un goal registrado.',
      });
      return;
    }

    Swal.fire({
      title: 'Detalles del Goal',
      html: `
        <p><strong>Nombre:</strong> ${transformation.goal.name || 'No definido'}</p>
        <p><strong>Indicador:</strong> ${transformation.goal.indicator || 'No definido'}</p>
        <p><strong>Objetivo:</strong> ${transformation.goal.objective || 'No definido'}</p>
        <p><strong>Situación:</strong> ${transformation.goal.currentSituation || 'No definido'}</p>
        <p><strong>Plan de Acción:</strong> ${transformation.goal.session ? transformation.goal.session.description : 'No definido'}</p>
        <p><strong>Tiempo:</strong> ${transformation.duration || 'No definido'}</p>
        <p><strong>Estado:</strong> ${this.getStatusText(transformation.status) || 'No definido'}</p>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
    });
  }

  updateTransformation(transformation: Transformation): void {
    if (!transformation.id) {
      Swal.fire('Error', 'No se puede actualizar una transformación sin ID', 'error');
      return;
    }

    transformation.lastUpdateDate = new Date();

    const updateTransformation = {
      id: transformation.id,
      firstPlanDate: transformation.firstPlanDate,
      lastUpdateDate: transformation.lastUpdateDate,
      duration: transformation.duration,
      status: transformation.status,
      goal: {
        id: transformation.goal?.id
      },
      family: {
        id: transformation.family?.id
      }
    };

    console.log('Objeto de transformación a actualizar:', updateTransformation);

    Swal.fire({
      title: 'Actualizando transformación...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();

        if (transformation.family && transformation.family.id) {
          this.transformationService.updateTransformation(transformation.id, updateTransformation as Transformation).subscribe({
            next: (updatedTransformation) => {
              console.log('Transformación actualizada exitosamente:', updatedTransformation);
              Swal.fire({
                icon: 'success',
                title: 'Actualizado',
                text: 'La transformación ha sido actualizada correctamente'
              });
              this.loadTransformationsWithGoals();
            },
            error: (err: any) => {
              console.error('Error actualizando transformación:', err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `No se pudo actualizar la transformación: ${err.message || 'Error desconocido'}`
              });
            }
          });
        } else {
          Swal.fire('Error', 'La transformación no tiene una familia válida asignada', 'error');
        }
      }
    });
  }

 // Reemplazar la función viewDetails existente con esta versión mejorada
// Reemplazar la función viewDetails existente con esta versión corregida
viewDetails(transformation: Transformation): void {
  if (!transformation.goal) {
    Swal.fire({
      icon: 'warning',
      title: 'No hay Goal Asociado',
      text: 'Esta transformación no tiene un goal registrado.',
    });
    return;
  }

  const firstPlanDate = transformation.firstPlanDate ? new Date(transformation.firstPlanDate) : null;
  const lastUpdateDate = transformation.lastUpdateDate ? new Date(transformation.lastUpdateDate) : null;

  // Formatear fechas manualmente para evitar problema con locale es-ES
  const formatDateManually = (date: Date | null): string => {
    if (!date) return 'No definido';
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };

  const sessionDetails = transformation.goal.session ?
    `
    <div class="card mt-3 border-primary">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0"><i class="bi bi-calendar-check me-2"></i>Detalles de la Sesión</h5>
      </div>
      <div class="card-body">
        <div class="mb-2">
          <strong><i class="bi bi-tag me-1"></i>Nombre:</strong>
          ${transformation.goal.session.name || 'No definido'}
        </div>
        <div>
          <strong><i class="bi bi-file-text me-1"></i>Descripción:</strong>
          <p class="mt-2 p-2 bg-light rounded">${transformation.goal.session.description || 'No hay descripción disponible.'}</p>
        </div>
      </div>
    </div>
    ` :
    `
    <div class="alert alert-info mt-3">
      <i class="bi bi-info-circle me-2"></i>No hay información de sesión disponible para esta goal.
    </div>
    `;

  Swal.fire({
    title: '<i class="bi bi-diagram-3 me-2"></i>DETALLES DE LA META',
    width: '800px',
    html: `
      <div class="details-container">
        <div class="card mb-3 shadow-sm">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0"><i class="bi bi-people me-2"></i>Información General</h5>
          </div>
          <div class="card-body">
            <table class="table table-bordered">
              <tr>
                <td style="width: 40%"><strong><i class="bi bi-house-door me-1"></i>Familia</strong></td>
                <td class="fw-bold text-primary">${transformation.family ? (this.familiesMap[transformation.family.id] || 'No asignado') : 'No asignado'}</td>
              </tr>
              <tr>
                <td><strong><i class="bi bi-calendar-plus me-1"></i>Fecha de primer plan</strong></td>
                <td>${formatDateManually(firstPlanDate)}</td>
              </tr>
              <tr>
                <td><strong><i class="bi bi-calendar-check me-1"></i>Fecha de última actualización</strong></td>
                <td>${formatDateManually(lastUpdateDate)}</td>
              </tr>
            </table>
          </div>
        </div>

        <div class="card mb-3 shadow-sm">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0"><i class="bi bi-bullseye me-2"></i>GOAL ${transformation.goal.id || 1}</h5>
          </div>
          <div class="card-body">
            <table class="table table-bordered">
              <tr>
                <td style="width: 40%"><strong><i class="bi bi-bookmark me-1"></i>Nombre</strong></td>
                <td class="fw-bold">${transformation.goal.name || 'No definido'}</td>
              </tr>
              <tr>
                <td><strong><i class="bi bi-graph-up me-1"></i>Indicador</strong></td>
                <td>${transformation.goal.indicator || 'No definido'}</td>
              </tr>
              <tr>
                <td><strong><i class="bi bi-chat-square-text me-1"></i>Situación actual</strong></td>
                <td>${transformation.goal.currentSituation || 'No definido'}</td>
              </tr>
              <tr>
                <td><strong><i class="bi bi-flag me-1"></i>Objetivo</strong></td>
                <td>${transformation.goal.objective || 'No definido'}</td>
              </tr>
              <tr>
                <td><strong><i class="bi bi-clock me-1"></i>Tiempo</strong></td>
                <td>${transformation.duration || 'No definido'}</td>
              </tr>
              <tr>
                <td><strong><i class="bi bi-check-circle me-1"></i>Estado</strong></td>
                <td>
                  <span class="badge ${this.getStatusClass(transformation.status)}">
                    ${this.getStatusText(transformation.status) || 'No definido'}
                  </span>
                </td>
              </tr>
            </table>
          </div>
        </div>

        ${sessionDetails}
      </div>
    `,
    showCloseButton: true,
    confirmButtonText: 'Cerrar',
    customClass: {
      container: 'swal-wide',
      popup: 'swal-tall'
    }
  });
}
  
  cancelTransformation(transformation: Transformation): void {
    if (!transformation.id) {
      Swal.fire('Error', 'No se puede cancelar una transformación sin ID', 'error');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: "¿Deseas cancelar esta transformación?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver'
    }).then((result) => {
      if (result.isConfirmed) {
        const updateData = {
          ...transformation,
          status: 'X',
          lastUpdateDate: new Date()
        };

        Swal.fire({
          title: 'Cancelando transformación...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();

            this.transformationService.updateTransformation(transformation.id, updateData).subscribe({
              next: () => {
                console.log('Transformación cancelada exitosamente');
                Swal.fire({
                  icon: 'success',
                  title: 'Cancelado',
                  text: 'La transformación ha sido cancelada correctamente'
                });
                this.loadTransformationsWithGoals();
              },
              error: (err) => {
                console.error('Error cancelando transformación:', err);
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: `No se pudo cancelar la transformación: ${err.message || 'Error desconocido'}`
                });
              }
            });
          }
        });
      }
    });
  }

  deleteTransformation(transformation: Transformation): void {
    if (!transformation.id) {
      Swal.fire('Error', 'No se puede eliminar una transformación sin ID', 'error');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminando transformación...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();

            this.transformationService.logicalDelete(transformation.id).subscribe({
              next: () => {
                console.log('Transformación eliminada lógicamente exitosamente');
                Swal.fire({
                  icon: 'success',
                  title: 'Eliminado',
                  text: 'La transformación ha sido eliminada correctamente'
                });
                this.loadTransformationsWithGoals();
              },
              error: (err) => {
                console.error('Error eliminando transformación:', err);
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: `No se pudo eliminar la transformación: ${err.message || 'Error desconocido'}`
                });
              }
            });
          }
        });
      }
    });
  }

  viewAllTransformations(familyId: number): void {
    const transformations = this.transformationsMap[familyId] || [];
    const familyName = this.familiesMap[familyId] || 'Sin nombre';

    if (transformations.length === 0) {
      Swal.fire('Información', `${familyName} no tiene planes de transformación registrados`, 'info');
      return;
    }

    const transformationsHtml = transformations.map((t, index) => {
      const status = this.getStatusText(t.status);
      const statusClass = this.getStatusClass(t.status);

      return `
        <div class="card mb-3">
          <div class="card-header d-flex justify-content-between align-items-center ${statusClass}">
            <h5 class="mb-0">Goal: ${t.goal?.name || 'Sin nombre'}</h5>
            <span class="badge bg-${statusClass === 'bg-success' ? 'success' : statusClass === 'bg-warning' ? 'warning' : statusClass === 'bg-danger' ? 'danger' : 'info'}">${status}</span>
          </div>
          <div class="card-body">
            <p><strong>Indicador:</strong> ${t.goal?.indicator || 'No definido'}</p>
            <p><strong>Duración:</strong> ${t.duration || 'No definido'}</p>
            <p><strong>Inicio:</strong> ${t.firstPlanDate ? new Date(t.firstPlanDate).toLocaleDateString() : 'No definido'}</p>
            <p><strong>Última actualización:</strong> ${t.lastUpdateDate ? new Date(t.lastUpdateDate).toLocaleDateString() : 'No definido'}</p>
          </div>
        </div>
      `;
    }).join('');

    Swal.fire({
      title: `Planes de Transformación - ${familyName}`,
      html: `
        <div style="max-height: 70vh; overflow-y: auto;">
          ${transformationsHtml}
        </div>
      `,
      width: '800px',
      confirmButtonText: 'Cerrar'
    });
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'Pending': 'Pendiente',
      'Achieved': 'Logrado',
      'Not achieved': 'No logrado',
      'P': 'Pendiente',
      'E': 'En Progreso',
      'C': 'Completado',
      'X': 'Cancelado',
      'I': 'Inactivo'
    };
    return statusMap[status] || 'Desconocido';
  }

  getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'Pending': 'bg-info text-white',
      'Achieved': 'bg-success text-white',
      'Not achieved': 'bg-danger text-white',
      'P': 'bg-info text-white',
      'E': 'bg-warning text-dark',
      'C': 'bg-success text-white',
      'X': 'bg-danger text-white',
      'I': 'bg-secondary text-white'
    };
    return classMap[status] || '';
  }

  formatDate(date: Date): string {
    return formatDate(date, 'dd MMM yyyy', 'es-ES');
  }

  parseDate(dateString: string): Date {
    return new Date(dateString);
  }
}
