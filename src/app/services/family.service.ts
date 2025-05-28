import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environments';
import { AuthService } from '../auth/services/auth.service';
import { Family } from '../interfaces/familiaDto';

@Injectable({
  providedIn: 'root',
})
export class FamilyService {
  getPersons() {
    throw new Error('Method not implemented.');
  }

  private familyUrl = `${environment.ms_family}/api/v1/families`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private withAuthHeaders(): Observable<HttpHeaders> {
    return from(this.authService.getToken()).pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        });
        return from([headers]);
      })
    );
  }

  // Obtener familias activas familyUrl
  getFamiliesActive(sortBy: string = 'id'): Observable<Family[]> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<Family[]>(`${this.familyUrl}/active`, { headers })
      )
    );
  }

  // Obtener familias inactivas
  getFamiliesInactive(sortBy: string = 'id'): Observable<Family[]> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<Family[]>(`${this.familyUrl}/inactive`, { headers })
      )
    );
  }

  // Obtener Infrmacion de familia por ID  familyUrl
  getFamilyInformationById(id: number): Observable<Family> {
    return this.withAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<Family>(`${this.familyUrl}/${id}`, { headers })
      )
    );
  }

  // Crear nueva familia familyUrl
  createFamily(family: Family): Observable<Family> {
    return this.withAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.post<Family>(this.familyUrl, family, { headers })
      )
    );
  }

  // Actualizar familia familyUrl
  updateFamily(id: number, family: Family): Observable<Family> {
    return this.withAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<Family>(`${this.familyUrl}/${id}`, family, { headers })
      )
    );
  }

  // Eliminar familia familyUrl
  deleteFamily(id: number): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<void>(`${this.familyUrl}/delete/${id}`, {}, { headers })
      )
    );
  }

  // Activar familia familyUrl
  activeFamily(id: number): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.put<void>(`${this.familyUrl}/active/${id}`, {}, { headers })
      )
    );
  }
}
