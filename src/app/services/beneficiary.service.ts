// service/beneficiarios.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { BeneficiaryDTO, EducationDTO, HealthDTO } from '../interfaces/beneficiaryDTO';
import { environment } from '../../environments/environments';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class BeneficiaryService {
  private apiUrl = `${environment.ms_beneficiario}/api/persons`;

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

  // DEVUELVE A TODOS LOS BENEFICIARIOS ACTIVOS - INACTIVOS
  getPersonsByTypeKinshipAndState(typeKinship: string, state: string): Observable<BeneficiaryDTO[]> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<BeneficiaryDTO[]>(`${this.apiUrl}/filter?typeKinship=${typeKinship}&state=${state}`, { headers })
      )
    );
  }

  // DEVUELVE A LOS APADRINADOS ACTIVOS - INACTIVOS
  getPersonsBySponsoredAndState(sponsored: string, state: string): Observable<BeneficiaryDTO[]> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<BeneficiaryDTO[]>(`${this.apiUrl}/filter-sponsored?sponsored=${sponsored}&state=${state}`, { headers })
      )
    );
  }

  // DEVUELVE LOS DATOS (PERSONAL - EDUCACION - SALUD) DE LOS BENEFICIARIOS Y APADRINADOS 
  getPersonByIdWithDetails(id: number): Observable<BeneficiaryDTO> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<BeneficiaryDTO>(`${this.apiUrl}/${id}/details`, { headers })
      )
    );
  }

  // CAMBIA EL ESTADO A INACTIVO DE LOS BENEFICIARIOS Y APADRINADOS 
  deletePerson(id: number): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.delete<void>(`${this.apiUrl}/${id}/delete`, { headers })
      )
    );
  }

  // CAMBIA EL ESTADO A ACTIVO DE LOS BENEFICIARIOS Y APADRINADOS 
  restorePerson(id: number): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<void>(`${this.apiUrl}/${id}/restore`, {}, { headers })
      )
    );
  }

  // ACTUALIZA LOS DATOS PERSONALES DE LOS BENEFICIARIOS Y APADRINADOS 
  updatePersonData(id: number, person: BeneficiaryDTO): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<void>(`${this.apiUrl}/${id}/update-person`, person, { headers })
      )
    );
  }

  //CORRIGE LOS DATOS (EDUCACION - SALUD) DE LOS BENEFICIARIOS Y APADRINADOS 
  correctEducationAndHealth(id: number, educationData: any): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<void>(`${this.apiUrl}/${id}/correct-education-health`, educationData, { headers })
      )
    );
  }

  //ACTUALIZA LOS DATOS DE (SALUD - EDUCACION) DE LOS BENEFICIARIOS Y APADRINADOS 
  updatePerson(id: number, person: BeneficiaryDTO): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<void>(`${this.apiUrl}/${id}/update`, person, { headers })
      )
    );
  }

  // REGISTRA UN NUEVO APADRINADO O BENEFICIARIO
  registerPerson(person: BeneficiaryDTO): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.post<void>(`${this.apiUrl}/register`, person, { headers })
      )
    );
  }

  // DEVUEVE EL CALCULO PARA MOSTRAR EN DASHBOARD
  getBeneficiariosStats(): Observable<any> {
    return forkJoin([
      this.getPersonsByTypeKinshipAndState('HIJO', 'A'), // Beneficiarios Activos
      this.getPersonsByTypeKinshipAndState('HIJO', 'I'), // Beneficiarios Inactivos
      this.getPersonsBySponsoredAndState('NO', 'A'), // No Apadrinados Activos
      this.getPersonsBySponsoredAndState('NO', 'I'), // No Apadrinados Inactivos
      this.getPersonsBySponsoredAndState('SI', 'A'), // Apadrinados Activos
      this.getPersonsBySponsoredAndState('SI', 'I'), // Apadrinados Inactivos
    ]).pipe(
      map(([activos, inactivos, noApadrinadosActivos, noApadrinadosInactivos, apadrinadosActivos, apadrinadosInactivos]) => {
        // Filtrar solo los HIJOS de los resultados obtenidos
        const hijosActivos = activos.filter(person => person.typeKinship === 'HIJO');
        const hijosInactivos = inactivos.filter(person => person.typeKinship === 'HIJO');
        const hijosNoApadrinadosActivos = noApadrinadosActivos.filter(person => person.typeKinship === 'HIJO');
        const hijosNoApadrinadosInactivos = noApadrinadosInactivos.filter(person => person.typeKinship === 'HIJO');
        const hijosApadrinadosActivos = apadrinadosActivos.filter(person => person.typeKinship === 'HIJO');
        const hijosApadrinadosInactivos = apadrinadosInactivos.filter(person => person.typeKinship === 'HIJO');

        return {
          totalBeneficiarios: hijosActivos.length + hijosInactivos.length,
          beneficiariosActivos: hijosActivos.length,
          beneficiariosInactivos: hijosInactivos.length,
          totalNoApadrinados: hijosNoApadrinadosActivos.length + hijosNoApadrinadosInactivos.length,
          totalApadrinados: hijosApadrinadosActivos.length + hijosApadrinadosInactivos.length,
        };
      })
    );
  }
}