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

  private apiUrlEducation = `${environment.ms_beneficiario_education}/education`;
  private apiUrlHealt = `${environment.ms_beneficiario_health}/health`;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.GetEducation();
    this.GetHealth();
  }

   public GetEducation(): Observable<EducationDTO[]> {
     console.log ('llamado a la api education')
     return this.http.get<EducationDTO []>(this.apiUrlEducation);
   }

   public GetHealth(): Observable<HealthDTO[]> {
     console.log ('llamado a la api health')
     return this.http.get<HealthDTO []>(this.apiUrlHealt);
   }

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

  getPersonsByTypeKinshipAndState(typeKinship: string, state: string): Observable<BeneficiaryDTO[]> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<BeneficiaryDTO[]>(`${this.apiUrl}/filter?typeKinship=${typeKinship}&state=${state}`, { headers })
      )
    );
  }

    // CALCULO PARA MOSTRAR EN DASHBOARD
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

  getPersonsBySponsoredAndState(sponsored: string, state: string): Observable<BeneficiaryDTO[]> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<BeneficiaryDTO[]>(`${this.apiUrl}/filter-sponsored?sponsored=${sponsored}&state=${state}`, { headers })
      )
    );
  }

  getPersonByIdWithDetails(id: number): Observable<BeneficiaryDTO> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<BeneficiaryDTO>(`${this.apiUrl}/${id}/details`, { headers })
      )
    );
  }

  deletePerson(id: number): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.delete<void>(`${this.apiUrl}/${id}/delete`, { headers })
      )
    );
  }

  restorePerson(id: number): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<void>(`${this.apiUrl}/${id}/restore`, {}, { headers })
      )
    );
  }

  updatePersonData(id: number, person: BeneficiaryDTO): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<void>(`${this.apiUrl}/${id}/update-person`, person, { headers })
      )
    );
  }

  correctEducationAndHealth(id: number, educationData: any): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<void>(`${this.apiUrl}/${id}/correct-education-health`, educationData, { headers })
      )
    );
  }

  updatePerson(id: number, person: BeneficiaryDTO): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<void>(`${this.apiUrl}/${id}/update`, person, { headers })
      )
    );
  }

  registerPerson(person: BeneficiaryDTO): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.post<void>(`${this.apiUrl}/register`, person, { headers })
      )
    );
  }
}