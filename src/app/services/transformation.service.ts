import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError, tap } from 'rxjs';
import { Transformation } from '../interfaces/transformation';
import { Goal } from '../interfaces/goal';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class TransformationService {
  private apiUrl = `${environment.ms_tranformation}/Transformation`;
  private goalApiUrl = `${environment.ms_tranformation}/goal`;

  constructor(private http: HttpClient) {}

  getAllTransformations(): Observable<Transformation[]> {
    return this.http.get<Transformation[]>(`${this.apiUrl}/`).pipe(
      tap(data => console.log('Transformations fetched:', data)),
      catchError(this.handleError)
    );
  }

  getTransformationById(id: number): Observable<Transformation> {
    return this.http.get<Transformation>(`${this.apiUrl}/listar/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createTransformation(transformation: Transformation): Observable<Transformation> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    const simplifiedTransformation = {
      firstPlanDate: transformation.firstPlanDate,
      lastUpdateDate: transformation.lastUpdateDate,
      duration: transformation.duration,
      status: transformation.status,
      goal: { id: transformation.goal?.id },
      family: { id: transformation.family?.id }
    };
    
    console.log('Sending transformation:', simplifiedTransformation);
    
    return this.http.post<Transformation>(`${this.apiUrl}/crear`, simplifiedTransformation, { headers }).pipe(
      tap(response => console.log('Create transformation response:', response)),
      catchError(this.handleError)
    );
  }  

  updateTransformation(id: number, transformation: Transformation): Observable<Transformation> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    const simplifiedTransformation = {
      id: transformation.id,
      firstPlanDate: transformation.firstPlanDate,
      lastUpdateDate: transformation.lastUpdateDate,
      duration: transformation.duration,
      status: transformation.status,
      goal: { id: transformation.goal?.id },
      family: { id: transformation.family?.id }
    };
    
    return this.http.put<Transformation>(`${this.apiUrl}/actualizar/${id}`, simplifiedTransformation, { headers }).pipe(
      tap(response => console.log('Update transformation response:', response)),
      catchError(this.handleError)
    );
  }

  logicalDelete(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/eliminar-logico/${id}`, {}).pipe(
      tap(response => console.log('Logical delete response:', response)),
      catchError(this.handleError)
    );
  }

  deleteTransformation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`).pipe(
      tap(() => console.log('Delete transformation complete')),
      catchError(this.handleError)
    );
  }

  getAllGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>(`${this.goalApiUrl}/`).pipe(
      tap(data => console.log('Goals fetched:', data)),
      catchError(this.handleError)
    );
  }

  getGoalById(id: number): Observable<Goal> {
    return this.http.get<Goal>(`${this.goalApiUrl}/listar/${id}`).pipe(
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