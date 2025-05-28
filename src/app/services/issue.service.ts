import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../environments/environments';
import { AuthService } from '../auth/services/auth.service';
import { Issue } from '../interfaces/issue';

@Injectable({
  providedIn: 'root'
})
export class IssueService {
  private issueUrl = `${environment.ms_issue}/tema`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

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

  getIssues(): Observable<Issue[]> {
    return this.withAuthHeaders().pipe(
      switchMap(headers => this.http.get<Issue[]>(`${this.issueUrl}/all`, { headers }))
    );
  }

  getIssueById(id: number): Observable<Issue> {
    return this.withAuthHeaders().pipe(
      switchMap(headers => this.http.get<Issue>(`${this.issueUrl}/${id}`, { headers }))
    );
  }

  createIssue(issue: Issue): Observable<Issue> {
    return this.withAuthHeaders().pipe(
      switchMap(headers => this.http.post<Issue>(`${this.issueUrl}/create`, issue, { headers }))
    );
  }

  updateIssue(id: number, issue: Issue): Observable<Issue> {
    return this.withAuthHeaders().pipe(
      switchMap(headers => this.http.put<Issue>(`${this.issueUrl}/update/${id}`, issue, { headers }))
    );
  }

  activateIssue(id: number): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers => this.http.put<void>(`${this.issueUrl}/activate/${id}`, {}, { headers }))
    );
  }

  deactivateIssue(id: number): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers => this.http.delete<void>(`${this.issueUrl}/deactivate/${id}`, { headers }))
    );
  }

  deleteIssue(id: number): Observable<void> {
    return this.withAuthHeaders().pipe(
      switchMap(headers => this.http.delete<void>(`${this.issueUrl}/delete/${id}`, { headers }))
    );
  }

  getActiveIssues(): Observable<Issue[]> {
    return this.withAuthHeaders().pipe(
      switchMap(headers => this.http.get<Issue[]>(`${this.issueUrl}/active`, { headers }))
    );
  }
}
