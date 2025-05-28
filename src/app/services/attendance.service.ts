import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, from, switchMap } from "rxjs";
import { AuthService } from "../auth/services/auth.service";
import { environment } from "../../environments/environments";
import { Attendance } from "../interfaces/attendance";

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.ms_attendance}/asistencia`;

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

  getAttendances(): Observable<Attendance[]> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<Attendance[]>(`${this.apiUrl}/list`, { headers })
      )
    );
  }

  getAttendanceById(id: number): Observable<Attendance> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get<Attendance>(`${this.apiUrl}/${id}`, { headers })
      )
    );
  }

  saveAttendance(attendance: Attendance): Observable<Attendance> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.post<Attendance>(`${this.apiUrl}/create`, attendance, { headers })
      )
    );
  }

  updateAttendance(id: number, attendance: Attendance): Observable<Attendance> {
    return this.withAuthHeaders().pipe(
      switchMap(headers =>
        this.http.put<Attendance>(`${this.apiUrl}/update/${id}`, attendance, { headers })
      )
    );
  }
}
