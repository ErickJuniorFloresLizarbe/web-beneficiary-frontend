import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { GoalService } from '../../../../services/goal.service';
import { Goal } from '../../../../interfaces/goal';
import Swal from 'sweetalert2';
import { Session } from '../../../../interfaces/session';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-goal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './goal.component.html',
  styleUrls: ['./goal.component.css']
})
export class GoalComponent implements OnInit {
  goals: Goal[] = [];
  activeGoals: Goal[] = [];
  inactiveGoals: Goal[] = [];
  filteredActiveGoals: Goal[] = [];
  filteredInactiveGoals: Goal[] = [];
  sessions: Session[] = [];
  goalForm!: FormGroup;
  editingGoal: Goal | null = null;
  goalToDelete: Goal | null = null;
  modalInstance: any;
  deleteModalInstance: any;
  searchTerm: string = '';

  constructor(private fb: FormBuilder, private goalService: GoalService) { }

  ngOnInit(): void {
    this.goalForm = this.fb.group({
      name: ['', Validators.required],
      indicator: ['', Validators.required],
      objective: ['', Validators.required],
      currentSituation: ['', Validators.required],
      status: ['A', Validators.required],
      session: [null, Validators.required]
    });

    this.loadGoals();
    this.loadSessions();

    document.addEventListener('DOMContentLoaded', () => {
      this.initModals();
    });
  }

  initModals(): void {
    const modalElement = document.getElementById('goalModal');
    if (modalElement) {
      this.modalInstance = new (window as any).bootstrap.Modal(modalElement);
      modalElement.addEventListener('hidden.bs.modal', () => {
        this.resetForm();
      });
    }

    const deleteModalElement = document.getElementById('deleteModal');
    if (deleteModalElement) {
      this.deleteModalInstance = new (window as any).bootstrap.Modal(deleteModalElement);
    }
  }

  loadGoals(): void {
    this.goalService.getAllGoals().subscribe({
      next: (data: Goal[]) => {
        this.goals = data;
        this.activeGoals = this.goals.filter(goal => goal.status === 'A');
        this.inactiveGoals = this.goals.filter(goal => goal.status === 'I');
        this.filterGoals();
      },
      error: (err) => {
        console.error('Error cargando goals:', err);
        Swal.fire('Error', 'No se pudieron cargar las goals', 'error');
      }
    });
  }

  loadSessions(): void {
    this.goalService.getSessions().subscribe({
      next: (data: Session[]) => {
        this.sessions = data;
      },
      error: (err) => {
        console.error('Error cargando sesiones:', err);
        Swal.fire('Error', 'No se pudieron cargar las sesiones', 'error');
      }
    });
  }

  filterGoals(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredActiveGoals = [...this.activeGoals];
      this.filteredInactiveGoals = [...this.inactiveGoals];
      return;
    }

    this.filteredActiveGoals = this.activeGoals.filter(goal =>
      goal.name.toLowerCase().includes(term) ||
      goal.indicator.toLowerCase().includes(term) ||
      goal.objective.toLowerCase().includes(term) ||
      goal.currentSituation.toLowerCase().includes(term) ||
      goal.session?.name.toLowerCase().includes(term)
    );

    this.filteredInactiveGoals = this.inactiveGoals.filter(goal =>
      goal.name.toLowerCase().includes(term) ||
      goal.indicator.toLowerCase().includes(term) ||
      goal.objective.toLowerCase().includes(term) ||
      goal.currentSituation.toLowerCase().includes(term) ||
      goal.session?.name.toLowerCase().includes(term)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterGoals();
  }

  prepareForNewGoal(): void {
    this.resetForm();
    this.editingGoal = null;
  }

  editGoal(goal: Goal): void {
    this.goalForm.patchValue({
      name: goal.name,
      indicator: goal.indicator,
      objective: goal.objective,
      currentSituation: goal.currentSituation,
      status: goal.status,
      session: this.sessions.find(ses => ses.id === goal.session?.id) || null
    });
    this.editingGoal = { ...goal }; // Create a copy to avoid reference issues
  }

  createOrUpdateGoal(): void {
    if (this.goalForm.invalid) {
      Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
      return;
    }

    const selectedSession = this.goalForm.get('session')?.value;
    if (!selectedSession) {
      Swal.fire('Error', 'Debe seleccionar una sesión válida.', 'error');
      return;
    }

    const goalData: Goal = {
      id: this.editingGoal?.id,
      name: this.goalForm.get('name')?.value,
      indicator: this.goalForm.get('indicator')?.value,
      objective: this.goalForm.get('objective')?.value,
      currentSituation: this.goalForm.get('currentSituation')?.value,
      status: this.editingGoal ? this.editingGoal.status : 'A',
      session: selectedSession
    };

    if (this.editingGoal && this.editingGoal.id) {
      this.goalService.updateGoal(this.editingGoal.id, goalData).subscribe({
        next: (updatedGoal) => {
          const index = this.goals.findIndex(m => m.id === updatedGoal.id);
          if (index !== -1) {
            this.goals[index] = updatedGoal;
            this.activeGoals = this.goals.filter(m => m.status === 'A');
            this.inactiveGoals = this.goals.filter(m => m.status === 'I');
            this.filterGoals();
          }
          Swal.fire('Éxito', 'Goal actualizada correctamente', 'success');
          this.closeModal();
        },
        error: (err) => {
          console.error('Error al actualizar goal:', err);
          Swal.fire('Error', 'No se pudo actualizar la goal. Por favor, intente de nuevo.', 'error');
        }
      });
    } else {
      this.goalService.createGoal(goalData).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Goal creada correctamente', 'success');
          this.loadGoals();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error al crear goal:', err);
          Swal.fire('Error', 'No se pudo crear la goal.', 'error');
        }
      });
    }
  }

  prepareDeletion(goal: Goal): void {
    this.goalToDelete = goal;
    if (this.deleteModalInstance) {
      this.deleteModalInstance.show();
    } else {
      const deleteModalElement = document.getElementById('deleteModal');
      if (deleteModalElement) {
        this.deleteModalInstance = new (window as any).bootstrap.Modal(deleteModalElement);
        this.deleteModalInstance.show();
      }
    }
  }

  confirmDelete(): void {
    if (this.goalToDelete && this.goalToDelete.id) {
      this.goalService.desactivarGoal(this.goalToDelete.id).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Goal desactivada correctamente', 'success');
          this.loadGoals(); // Actualizar la lista
          this.closeDeleteModal();
        },
        error: (error) => {
          console.error('Error al desactivar goal:', error);
          Swal.fire('Error', 'No se pudo desactivar la goal', 'error');
          this.closeDeleteModal();
        }
      });
    }
  }

  restoreGoal(goal: Goal): void {
    if (!goal.id) {
      Swal.fire('Error', 'ID de goal no válido', 'error');
      return;
    }

    Swal.fire({
      title: 'Confirmar Activación',
      text: `¿Está seguro que desea activar la goal "${goal.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.goalService.restoreGoal(goal.id!).subscribe({
          next: () => {
            Swal.fire('Éxito', 'Goal activada correctamente', 'success');
            this.loadGoals();
          },
          error: (err) => {
            console.error('Error al activar goal:', err);
            Swal.fire('Error', 'No se pudo activar la goal.', 'error');
          }
        });
      }
    });
  }

  exportPDF(): void {
    const doc = new jsPDF();
    const tableColumn = ["Nombre", "Indicador", "Objetivo", "Situación Actual", "Sesión"];
    const tableRows: any[] = [];

    const targetGoals = document.querySelector('.tab-pane.active') === document.getElementById('active')
      ? this.filteredActiveGoals
      : this.filteredInactiveGoals;

    targetGoals.forEach(goal => {
      const goalData = [
        goal.name,
        goal.indicator,
        goal.objective,
        goal.currentSituation,
        goal.session?.name || 'Sin sesión'
      ];
      tableRows.push(goalData);
    });

    const title = document.querySelector('.tab-pane.active') === document.getElementById('active')
      ? 'Goals Activas'
      : 'Goals Inactivas';

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      margin: { top: 30 }
    });

    doc.text(title, 14, 15);
    doc.save(`goals_${title.toLowerCase().replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

    Swal.fire('Éxito', `${title} exportadas a PDF correctamente`, 'success');
  }

  exportExcel(): void {
    const targetGoals = document.querySelector('.tab-pane.active') === document.getElementById('active')
      ? this.filteredActiveGoals
      : this.filteredInactiveGoals;

    const title = document.querySelector('.tab-pane.active') === document.getElementById('active')
      ? 'Goals_Activas'
      : 'Goals_Inactivas';

    const worksheet = XLSX.utils.json_to_sheet(targetGoals.map(goal => ({
      Nombre: goal.name,
      Indicador: goal.indicator,
      Objetivo: goal.objective,
      Situación_Actual: goal.currentSituation,
      Sesión: goal.session?.name || 'Sin sesión',
      Descripción: goal.session?.description || 'Sin descripción'
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    XLSX.writeFile(workbook, `${title}_${new Date().toISOString().split('T')[0]}.xlsx`);

    Swal.fire('Éxito', `${title.replace('_', ' ')} exportadas a Excel correctamente`, 'success');
  }

  exportCSV(): void {
    const targetGoals = document.querySelector('.tab-pane.active') === document.getElementById('active')
      ? this.filteredActiveGoals
      : this.filteredInactiveGoals;

    const title = document.querySelector('.tab-pane.active') === document.getElementById('active')
      ? 'Goals_Activas'
      : 'Goals_Inactivas';

    const headers = ['Nombre,Indicador,Objetivo,Situación Actual,Sesión,Descripción\n'];
    const csvData = targetGoals.map(goal =>
      `${goal.name},${goal.indicator},${goal.objective},${goal.currentSituation},${goal.session?.name || 'Sin sesión'},${goal.session?.description || 'Sin descripción'}`
    );

    const csvContent = headers.concat(csvData).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire('Éxito', `${title.replace('_', ' ')} exportadas a CSV correctamente`, 'success');
  }

  resetForm(): void {
    this.goalForm.reset({ status: 'A' });
    this.editingGoal = null;
  }

  closeModal(): void {
    if (this.modalInstance) this.modalInstance.hide();
  }

  closeDeleteModal(): void {
    if (this.deleteModalInstance) this.deleteModalInstance.hide();
    this.goalToDelete = null;
  }
}
