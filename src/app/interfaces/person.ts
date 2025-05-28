// person.ts
export interface Person {
  idPerson?: number;  // Opcional ya que se auto-genera en el backend
  name: string;
  surname: string;
  age: number;
  birthdate: string;
  typeDocument: string;
  documentNumber: string;
  typeKinship: string;
  sponsored: string;
  state: string;
  familyIdFamily: number;
}
