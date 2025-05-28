import { Injectable } from "@angular/core";
import {
  CanActivate,
  CanMatch,
  Route,
  Router,
  UrlSegment,
  UrlTree,
  ActivatedRouteSnapshot,
} from "@angular/router";
import { AuthService } from "../services/auth.service";
import { Observable, map, switchMap, take, of } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate, CanMatch {
  constructor(private authService: AuthService, private router: Router) { }

  // 🔒 Para rutas protegidas (uso normal)
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | boolean | UrlTree {
    const isLoginRoute = route.routeConfig?.path === 'login';

    if (isLoginRoute) {
      // ⚠️ Bloqueamos el acceso a /login si ya está autenticado
      return this.canActivateIfNotAuthenticated();
    }

    const expectedRole = route.data?.["role"];
    return this.checkAccess(expectedRole);
  }

  // 🔒 Para rutas hijas (lazy modules, canMatch)
  canMatch(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> {
    const expectedRole = route.data?.["role"];
    return this.checkAccess(expectedRole);
  }

  // 🔐 Redirige a dashboard si ya estás autenticado e intentas ir a /login
  private canActivateIfNotAuthenticated(): boolean | UrlTree {
    const isLoggedIn = this.authService.hasToken();
    if (isLoggedIn) {
      return this.router.createUrlTree(['/dashboard']);
    }
    return true; // permite acceso a /login si no está logeado
  }

  // ✅ Revisa si está autenticado y si cumple con el rol esperado (si aplica)
  private checkAccess(expectedRole?: string): Observable<boolean | UrlTree> {
    return this.authService.isAuthenticated().pipe(
      take(1),
      switchMap((isAuthenticated) => {
        if (!isAuthenticated) {
          return of(this.router.createUrlTree(["/login"]));
        }

        if (!expectedRole) {
          return of(true);
        }

        const userRole = this.authService.getRole();
        if (userRole === expectedRole) {
          return of(true);
        } else {
          return of(this.router.createUrlTree(["/dashboard"])); // redirige si no tiene el rol
        }
      })
    );
  }
}
