import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, throwError, tap } from 'rxjs';
import { Session } from '../interfaces/session';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class SessionService { 
  private apiUrl = `${environment.ms_tranformation}/session`; 

  constructor(private http: HttpClient) { }

  getSessionsByStatus(status: string): Observable<Session[]> { 
    return this.http.get<Session[]>(`${this.apiUrl}/status/${status}`).pipe(
      tap(data => console.log('Sessions fetched by status:', data)),
      catchError(this.handleError)
    );
  }

  getSessionById(id: number): Observable<Session> {
    return this.http.get<Session>(`${this.apiUrl}/listar/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createSession(session: Session): Observable<Session> { 
    return this.http.post<Session>(`${this.apiUrl}/create`, session).pipe(
      tap(response => console.log('Create session response:', response)),
      catchError(this.handleError)
    );
  }

  updateSession(id: number, session: Session): Observable<Session> { 
    return this.http.put<Session>(`${this.apiUrl}/actualizar/${id}`, session).pipe(
      tap(response => console.log('Update session response:', response)),
      catchError(this.handleError)
    );
  }

  deleteSession(id: number): Observable<void> { 
    return this.http.put(`${this.apiUrl}/eliminar/${id}`, {}, { responseType: 'text' }).pipe(
      map(() => {
        console.log('Session deactivated successfully');
      }),
      catchError(this.handleError)
    );
  }
  
  restoreSession(id: number): Observable<void> { 
    return this.http.put(`${this.apiUrl}/restore/${id}`, {}, { responseType: 'text' }).pipe(
      map(() => {
        console.log('Session restored successfully');
      }),
      catchError(this.handleError)
    );
  }
  
  private handleError(error: HttpErrorResponse) {
    console.error('API Error occurred:', error);
    
    let errorMsg = '';
    if (error.error instanceof ErrorEvent) {
      errorMsg = `Error: ${error.error.message}`;
    } else {
      errorMsg = `Código: ${error.status}, Mensaje: ${error.error?.message || error.statusText}`;
    }
    
    console.error(errorMsg);
    return throwError(() => new Error(errorMsg));
  }
}