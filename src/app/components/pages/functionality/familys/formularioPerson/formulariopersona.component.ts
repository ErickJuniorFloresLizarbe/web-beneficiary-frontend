import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Person } from '../../../../../interfaces/person';
import { PersonaService } from '../../../../../services/person.service';

@Component({
  selector: 'app-formulariopersona',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './formulariopersona.component.html',
})
export class FormulariopersonaComponent implements OnChanges {
  @Input() personToEdit: Person | null = null;
  @Input() familyId: number | undefined;
  @Output() personsCreated = new EventEmitter<Person[]>();
  @Output() formClosed = new EventEmitter<void>();

  persons: Person[] = [];
  currentPerson: Person = this.initializePerson();
  isSubmitting = false;
  showForm = true;
  editingIndex: number = -1;

  constructor(private personaService: PersonaService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['familyId']) {
      console.log('ID de familia recibido:', this.familyId);
    }
    if (changes['personToEdit'] && changes['personToEdit'].currentValue) {
      this.handlePersonToEdit();
    }
  }

  handlePersonToEdit() {
    if (this.personToEdit) {
      this.currentPerson = { ...this.personToEdit };
      this.showForm = true;
      // Check if this person is already in our list
      const existingIndex = this.persons.findIndex(
        (p) =>
          p.documentNumber === this.personToEdit?.documentNumber &&
          p.typeDocument === this.personToEdit?.typeDocument
      );

      if (existingIndex >= 0) {
        this.editingIndex = existingIndex;
      } else {
        this.editingIndex = -1;
      }
    }
  }

  // Inicializacion de los datos
  initializePerson(): Person {
    return {
      name: '',
      surname: '',
      age: 0,
      birthdate: '',
      typeDocument: '',
      documentNumber: '',
      typeKinship: '',
      sponsored: 'NO',
      state: 'A',
      familyIdFamily: this.familyId ? this.familyId : 0,
    };
  }

  showAddPersonForm() {
    this.showForm = true;
    this.currentPerson = this.initializePerson();
    this.editingIndex = -1;
  }

  addPersonAndContinue() {
    if (this.isCurrentPersonValid()) {
      if (this.editingIndex >= 0) {
        // If we're editing, replace the person at the index
        this.persons[this.editingIndex] = { ...this.currentPerson };
        this.editingIndex = -1;
      } else {
        this.currentPerson.familyIdFamily = this.familyId || 0;
        // Otherwise add as a new person
        this.persons.push({ ...this.currentPerson });
      }
      this.currentPerson = this.initializePerson();
      // Keep the form open for adding another person
    }
  }

  isCurrentPersonValid(): boolean {
    return (
      this.currentPerson.name?.trim() !== '' &&
      this.currentPerson.surname?.trim() !== '' &&
      this.currentPerson.age > 0 &&
      this.currentPerson.birthdate?.trim() !== '' &&
      this.currentPerson.typeDocument?.trim() !== '' &&
      this.currentPerson.documentNumber?.trim() !== '' &&
      this.currentPerson.typeKinship?.trim() !== ''
    );
  }

  finishAndSave() {
    if (this.persons.length === 0) {
      return;
    }

    // Imprimir el ID de la familia que se está guardando
    console.log('ID de la familia:', this.familyId);

    this.isSubmitting = true;
    this.personaService.createPersons(this.persons).subscribe({
      next: (response) => {
        console.log('Personas creadas exitosamente:', response);
        this.personsCreated.emit(response);
        this.closeForm();
        setTimeout(() => {
          this.openFamilyForm();
        }, 3000);
      },
      error: (error) => {
        console.error('Error al crear las personas:', error);
        alert(
          'Ocurrió un error al crear las personas. Por favor, verifica los datos e intenta nuevamente.'
        );
        this.isSubmitting = false;
      },
    });
  }

  // Metodo para editar datos e enviar
  editPerson(index: number) {
    this.currentPerson = { ...this.persons[index] };
    this.editingIndex = index;
    this.showForm = true;
  }

  removePerson(index: number) {
    this.persons.splice(index, 1);
  }

  // Metodo para cierre y añadido de personas
  openFamilyForm() {
    this.formClosed.emit();
  }

  cancelForm() {
    if (this.persons.length > 0) {
      this.showForm = false;
    }
    this.currentPerson = this.initializePerson();
    this.editingIndex = -1;
  }

  closeForm() {
    this.formClosed.emit();
  }

  // Nuevo método para calcular la edad automáticamente
  calculateAge() {
    if (this.currentPerson.birthdate) {
      const today = new Date();
      const birthDate = new Date(this.currentPerson.birthdate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      this.currentPerson.age = age;
    }
  }
}
