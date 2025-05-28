import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { AuthService } from "../../auth/services/auth.service";
import { ThemeService } from "../../services/ui/theme.service";
import { SidebarService } from "../../services/ui/sidebar.service";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.css"],
})
export class NavbarComponent implements OnInit {
  isAuthenticated = false;
  userName: string = "";
  userEmail: string = "";
  userRoles: string[] = [];
  roleDisplayName: string = "";
  profileImage: string | null = null;
  isUserMenuOpen = false;
  isMobileMenuOpen = false;
  isMobileSidebarOpen = false;
  darkMode$ = this.themeService.darkMode$;
  isMobile = false;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private sidebarService: SidebarService
  ) {}

  ngOnInit() {
    this.isAuthenticated = this.authService.hasToken();
    this.checkScreenSize();
    window.addEventListener("resize", this.checkScreenSize.bind(this));

    if (this.isAuthenticated) {
      const userInfo = localStorage.getItem("userInfo");

      if (userInfo) {
        const user = JSON.parse(userInfo);
        this.userName = user.name;
        this.userEmail = user.email;
        this.profileImage = user.profileImage;
        this.userRoles = Array.isArray(user.role) ? user.role : [user.role];

        // Mostrar nombre del rol
        const role = Array.isArray(user.role) ? user.role[0] : user.role;
        const normalizedRole = role?.toUpperCase();
        this.roleDisplayName =
          normalizedRole === "ADMIN" ? "Administrador" : "Usuario";
      }

      // Actualiza desde backend
      this.authService.getLoggedUserInfo().subscribe({
        next: (user) => {
          this.userName = user.name;
          this.userEmail = user.email;
          this.profileImage = user.profileImage;
          this.userRoles = Array.isArray(user.role) ? user.role : [user.role];

          // Mostrar nombre del rol (actualización)
          const role = Array.isArray(user.role) ? user.role[0] : user.role;
          const normalizedRole = role?.toUpperCase();
          this.roleDisplayName =
            normalizedRole === "ADMIN" ? "Administrador" : "Usuario";

          localStorage.setItem("userInfo", JSON.stringify(user));
        },
        error: (err) => {
          console.error("❌ Error al obtener el usuario:", err.message);
        },
      });
    }

    this.sidebarService.mobileSidebarOpen$.subscribe((isOpen) => {
      this.isMobileSidebarOpen = isOpen;
    });
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleMobileSidebar(): void {
    this.sidebarService.toggleMobileSidebar();
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  logout() {
    this.authService.logout();
  }

  truncateText(text: string | null | undefined, maxLength: number): string {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  }

  closeMenu() {
    this.isUserMenuOpen = false;
    this.isMobileMenuOpen = false;
  }
}
