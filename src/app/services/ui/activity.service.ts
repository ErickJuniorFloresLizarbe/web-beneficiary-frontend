import { environment } from './../../../environments/environments';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { BehaviorSubject, from, Observable, switchMap } from 'rxjs';

export interface ActivityDto {
    imagen: string;
    nombre: string;
    modulo: string;
    accion: string;
    fecha?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ActivityService {
    private apiUrl = `${environment.ms_activity}/audit/log`;

    private activityUpdatedSubject = new BehaviorSubject<void>(undefined);
    activityUpdated$ = this.activityUpdatedSubject.asObservable();

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

    /**
     * 🔹 Registrar actividad y emitir notificación
     */
    logActivity(activity: ActivityDto): void {
        this.withAuthHeaders().subscribe(headers => {
            this.http.post(this.apiUrl, activity, { headers }).subscribe({
                next: () => {
                    console.log('✅ Actividad registrada');
                    this.activityUpdatedSubject.next(); // 👈 Notificar a los observadores
                },
                error: (err) => console.error('❌ Error al registrar actividad', err)
            });
        });
    }

    /**
     * 🔍 Listar todas las actividades
     */
    getAllActivities(): Observable<ActivityDto[]> {
        return this.withAuthHeaders().pipe(
            switchMap(headers => {
                return this.http.get<ActivityDto[]>(this.apiUrl, { headers });
            })
        );
    }
}
