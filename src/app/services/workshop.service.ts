import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../environments/environments';
import { AuthService } from '../auth/services/auth.service';
import { WorkshopRequestDto, WorkshopResponseDto } from '../interfaces/workshop';

@Injectable({ providedIn: 'root' })
export class WorkshopService {
  // URL base para acceder al microservicio de talleres
  private workshopUrl = `${environment.ms_workshop}/api/workshops`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * 🔐 Obtiene el token del AuthService y construye los headers con Authorization
   */
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

  /**
   * 📄 Obtener todos los talleres (activos e inactivos)
   */
  listAll(): Observable<WorkshopResponseDto[]> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<WorkshopResponseDto[]>(`${this.workshopUrl}/list`, { headers })
      )
    );
  }

  /**
   * ✅ Obtener talleres activos (state = 'A')
   */
  getActiveWorkshops(): Observable<WorkshopResponseDto[]> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<WorkshopResponseDto[]>(`${this.workshopUrl}/active`, { headers })
      )
    );
  }

  /**
   * ❌ Obtener talleres inactivos (state = 'I')
   */
  getInactiveWorkshops(): Observable<WorkshopResponseDto[]> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<WorkshopResponseDto[]>(`${this.workshopUrl}/inactive`, { headers })
      )
    );
  }

  /**
   * 🔎 Obtener un taller por su ID
   */
  getWorkshopById(id: number): Observable<WorkshopResponseDto> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<WorkshopResponseDto>(`${this.workshopUrl}/${id}`, { headers })
      )
    );
  }

  /**
   * ➕ Crear un nuevo taller
   */
  create(workshop: WorkshopRequestDto): Observable<WorkshopResponseDto> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.post<WorkshopResponseDto>(`${this.workshopUrl}/create`, workshop, { headers })
      )
    );
  }

  /**
   * ✏️ Actualizar un taller existente por ID
   */
  update(id: number, workshop: WorkshopRequestDto): Observable<WorkshopResponseDto> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<WorkshopResponseDto>(`${this.workshopUrl}/update/${id}`, workshop, { headers })
      )
    );
  }

  /**
   * ♻️ Restaurar o reactivar un taller (cambia su estado a 'A')
   */
  restore(id: number): Observable<WorkshopResponseDto> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<WorkshopResponseDto>(`${this.workshopUrl}/activate/${id}`, {}, { headers })
      )
    );
  }

  /**
   * 💤 Baja lógica del taller (cambia su estado a 'I')
   */
  disable(id: number): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.delete<void>(`${this.workshopUrl}/deactive/${id}`, { headers })
      )
    );
  }

  /**
   * 🗑️ Eliminar permanentemente un taller
   */
  delete(id: number): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.delete<void>(`${this.workshopUrl}/delete/${id}`, { headers })
      )
    );
  }
}
