import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { Person } from '../interfaces/person';
import { environment } from '../../environments/environments';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PersonaService {

  private personUrl = `${environment.ms_person}/api/v1/person`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private withAuthHeaders(): Observable<HttpHeaders> {
    return from(this.authService.getToken()).pipe(
      switchMap((token) => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        });
        return from([headers]);
      })
    );
  }

  getPersons(): Observable<Person[]> {
    return this.withAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<Person[]>(`${this.personUrl}/active`, { headers })
      )
    );
  }

  getInactivePersons(): Observable<Person[]> {
    return this.withAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<Person[]>(`${this.personUrl}/inactive`, { headers })
      )
    );
  }

  createPersons(persons: Person[]): Observable<Person[]> {
    return this.withAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.post<Person[]>(this.personUrl, persons, { headers })
      )
    );
  }

  updatePerson(idPerson: number, person: Person): Observable<Person> {
    return this.withAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<Person>(`${this.personUrl}/${idPerson}`, person, { headers })
      )
    );
  }

  getPersonsByFamilyId(familyIdFamily: number): Observable<Person[]> {
    return this.withAuthHeaders().pipe(
      switchMap((headers) =>
        this.http
          .get<Person[]>(`${this.personUrl}/family/${familyIdFamily}`, { headers })
          .pipe(map((response) => response || []))
      )
    );
  }

  // Métodos adicionales según el controlador REST

  logicallyDeletePerson(idPerson: number): Observable<Person> {
    return this.withAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.patch<Person>(`${this.personUrl}/delete/${idPerson}`, {}, { headers })
      )
    );
  }

  reactivatePerson(idPerson: number): Observable<Person> {
    return this.withAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.patch<Person>(`${this.personUrl}/active/${idPerson}`, {}, { headers })
      )
    );
  }
}
