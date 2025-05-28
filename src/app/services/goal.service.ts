import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError, tap } from 'rxjs';
import { Goal } from '../interfaces/goal';
import { Session } from '../interfaces/session';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private apiUrl = `${environment.ms_goal}/goal`;

  constructor(private http: HttpClient) {}

  getAllGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>(`${this.apiUrl}/`).pipe(
      tap(data => console.log('Goals fetched:', data)),
      catchError(this.handleError)
    );
  }

  getGoalById(id: number): Observable<Goal> {
    return this.http.get<Goal>(`${this.apiUrl}/listar/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.apiUrl}/sessions`).pipe(
      tap(data => console.log('Sessions fetched:', data)),
      catchError(this.handleError)
    );
  }

  createGoal(goal: Goal): Observable<Goal> {
    const { id, ...goalWithoutId } = goal;

    const payload = {
      ...goalWithoutId,
      session: goal.session ? { id: goal.session.id } : null
    };

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    return this.http.post<Goal>(`${this.apiUrl}/create`, payload, { headers }).pipe(
      tap(response => console.log('Create goal response:', response)),
      catchError(this.handleError)
    );
  }

  updateGoal(id: number, goal: Goal): Observable<Goal> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const payload = {
      id: id,
      name: goal.name,
      indicator: goal.indicator,
      objective: goal.objective,
      currentSituation: goal.currentSituation,
      status: goal.status,
      session: goal.session ? { id: goal.session.id } : null
    };

    console.log('Updating goal with payload:', payload);

    return this.http.put<Goal>(`${this.apiUrl}/actualizar/${id}`, payload, { headers }).pipe(
      tap(response => console.log('Update goal response:', response)),
      catchError(this.handleError)
    );
  }

  desactivarGoal(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.put(
      `${this.apiUrl}/eliminar-logico/${id}`,
      {},
      { headers, responseType: 'text' }
    ).pipe(
      tap(() => console.log('Goal deactivated successfully')),
      catchError(this.handleError)
    );
  }

  restoreGoal(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.put(
      `${this.apiUrl}/restore/${id}`,
      {},
      { headers, responseType: 'text' }
    ).pipe(
      tap(() => console.log('Goal restored successfully')),
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