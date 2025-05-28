import { Component, OnInit, HostListener } from "@angular/core"
import { RouterOutlet, RouterModule, Router, NavigationEnd } from "@angular/router"
import { CommonModule } from "@angular/common"
import { NavbarComponent } from "./common/navbar/navbar.component"
import { SidemenuComponent } from "./common/sidemenu/sidemenu.component"
import { filter } from "rxjs/operators"
import { AuthService } from "./auth/services/auth.service"
import { SidebarService } from "./services/ui/sidebar.service"

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, NavbarComponent, SidemenuComponent],
  template: `
    <!-- Pantalla de carga mientras se verifica la autenticación -->
    <div *ngIf="isInitializing" class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Layout para páginas de autenticación (sin sidebar ni navbar) -->
    <div *ngIf="!isInitializing && isAuthPage" class="min-h-screen bg-gray-100">
      <router-outlet></router-outlet>
    </div>

    <!-- Layout principal con navbar (sidebar opcional) -->
    <div *ngIf="!isInitializing && !isAuthPage" class="flex h-screen w-screen bg-slate-100 text-black antialiased selection:bg-blue-600 selection:text-white">
      <app-sidemenu class="relative" *ngIf="!hideSidebar"></app-sidemenu>
      <div class="flex flex-col flex-grow overflow-y-auto">
        <app-navbar></app-navbar>
        <div class="dark:bg-gray-900">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
})
export class AppComponent implements OnInit {
  title = "nphDashboard"
  isAuthPage = true
  isInitializing = true
  hideSidebar = false

  constructor(
    private router: Router,
    private authService: AuthService,
    private sidebarService: SidebarService
  ) { }

  ngOnInit() {
    this.checkAuthAndInitialize()

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects
      this.isAuthPage = this.isAuthRoute(url)
      this.hideSidebar = this.shouldHideSidebar(url)
    })
  }

  @HostListener("document:click", ["$event"])
  onClick(event: MouseEvent) {
    // lógica para cerrar menús (opcional)
  }

  private checkAuthAndInitialize(): void {
    const isAuthenticated = this.authService.hasToken()
    const currentUrl = this.router.url

    this.isAuthPage = this.isAuthRoute(currentUrl)
    this.hideSidebar = this.shouldHideSidebar(currentUrl)

    if (!isAuthenticated) {
      this.isAuthPage = true
      this.hideSidebar = false
      if (!this.isAuthRoute(currentUrl)) {
        this.router.navigate(["/login"])
      }
    }

    setTimeout(() => {
      this.isInitializing = false
    }, 300)
  }

  private isAuthRoute(url: string): boolean {
    return url.includes("/login") || url.includes("/register") || url.includes("/forgot-password")
  }

  private shouldHideSidebar(url: string): boolean {
    return url.startsWith("/perfil") || url.startsWith("/configuracion")
  }
}