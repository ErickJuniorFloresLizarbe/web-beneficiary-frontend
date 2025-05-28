// service/beneficiarios.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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