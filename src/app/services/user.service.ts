import { AuthService } from "../auth/services/auth.service";
import { environment } from "../../environments/environments";
import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, from, of, throwError } from "rxjs";
import { catchError, map, switchMap, timeout } from "rxjs/operators";
import { User } from "../interfaces/user.interface";

@Injectable({
    providedIn: "root",
})
export class UserService {
    private userAdmin = `${environment.ms_user}/api/admin/users`;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getHeaders(): Observable<HttpHeaders> {
        return from(this.authService.getToken()).pipe(
            map((token) =>
                new HttpHeaders({
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                })
            )
        );
    }

    getUserById(id: number): Observable<User | null> {
        return this.getHeaders().pipe(
            switchMap((headers) =>
                this.http.get<User>(`${this.userAdmin}/${id}`, { headers }).pipe(
                    timeout(15000),
                    catchError((error) => {
                        console.error(`Error al obtener usuario con ID ${id}:`, error);
                        return of(null);
                    })
                )
            )
        );
    }

    createUser(user: User): Observable<User> {
        return this.getHeaders().pipe(
            switchMap((headers) =>
                this.http.post<User>(this.userAdmin, user, { headers }).pipe(
                    timeout(15000),
                    catchError((error) => {
                        console.error("❌ Error al crear usuario en backend:", error);
                        return throwError(() => new Error("Error al guardar el usuario."));
                    })
                )
            )
        );
    }

    getAllUsers(): Observable<User[]> {
        return this.getHeaders().pipe(
            switchMap((headers) =>
                this.http.get<User[]>(this.userAdmin, { headers }).pipe(
                    timeout(15000),
                    catchError((error) => {
                        console.error("Error al obtener usuarios:", error);
                        return of([]);
                    })
                )
            )
        );
    }

    updateUser(user: User): Observable<User> {
        return this.getHeaders().pipe(
            switchMap((headers) =>
                this.http.put<User>(`${this.userAdmin}/${user.id}`, user, { headers }).pipe(
                    timeout(15000),
                    catchError((error) => {
                        console.error("Error al actualizar usuario:", error);
                        return throwError(() => new Error("No se pudo actualizar."));
                    })
                )
            )
        );
    }

    deleteUser(id: number): Observable<void> {
        return this.getHeaders().pipe(
            switchMap((headers) =>
                this.http.delete<void>(`${this.userAdmin}/${id}`, { headers })
            )
        );
    }

    getUserByEmail(email: string): Observable<User | null> {
        return this.getHeaders().pipe(
            switchMap((headers) =>
                this.http.get<User>(`${this.userAdmin}/email/${email}`, { headers }).pipe(
                    timeout(15000),
                    catchError((error) => {
                        console.error("Error al obtener usuario por email:", error);
                        return of(null);
                    })
                )
            )
        );
    }
}
