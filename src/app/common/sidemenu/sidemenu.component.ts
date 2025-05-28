import { Component, OnInit, HostListener, Output, EventEmitter } from '@angular/core';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MENU_ITEMS } from '../../utils/menu-items';
import { AuthService } from '../../auth/services/auth.service';
import { ThemeService } from '../../services/ui/theme.service';
import { SidebarService } from '../../services/ui/sidebar.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-sidemenu',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './sidemenu.component.html',
  styleUrls: ['./sidemenu.component.css']
})
export class SidemenuComponent implements OnInit {
  dropdownIndex: number | null = null;
  subDropdownIndex: Map<number, number | null> = new Map();
  grandSubDropdownIndex: Map<number, Map<number, number | null>> = new Map();

  menuItems = MENU_ITEMS;
  isSidebarCollapsed = new BehaviorSubject<boolean>(false);
  isSidebarCollapsed$ = this.isSidebarCollapsed.asObservable();
  isMobile = false;
  isMobileMenuOpen = false;
  darkMode$ = this.themeService.darkMode$;

  @Output() toggleMobileMenu = new EventEmitter<boolean>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService,
    private sidebarService: SidebarService
  ) { }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    const userRole = this.authService.getRole(); // viene desde localStorage

    // ✅ Si no es ADMIN, filtramos el ítem "Usuarios"
    if (userRole !== 'ADMIN') {
      this.menuItems = this.menuItems.filter(item => item.title !== 'Usuarios');
    }

    // Verificar si hay una preferencia guardada para el sidebar
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState) {
      this.isSidebarCollapsed.next(savedState === 'true');
    }

    this.checkScreenSize();

    // Suscribirse al estado del sidebar móvil
    this.sidebarService.mobileSidebarOpen$.subscribe(isOpen => {
      this.isMobileMenuOpen = isOpen;
    });
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile && !this.isSidebarCollapsed.value) {
      this.isSidebarCollapsed.next(true);
    }
  }

  toggleSidebar(): void {
    const newState = !this.isSidebarCollapsed.value;
    this.isSidebarCollapsed.next(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  }

  toggleMobileSidebar(state?: boolean): void {
    this.sidebarService.toggleMobileSidebar(state);
  }

  toggleDropdown(index: number): void {
    if (this.isSidebarCollapsed.value && !this.isMobile) {
      // Si está colapsado, expandir primero
      this.isSidebarCollapsed.next(false);
      setTimeout(() => {
        this.dropdownIndex = this.dropdownIndex === index ? null : index;
      }, 150);
    } else {
      this.dropdownIndex = this.dropdownIndex === index ? null : index;
    }
  }

  toggleSubDropdown(parentIndex: number, childIndex: number): void {
    const current = this.subDropdownIndex.get(parentIndex);
    this.subDropdownIndex.set(parentIndex, current === childIndex ? null : childIndex);
  }

  toggleGrandSubDropdown(parentIndex: number, childIndex: number, grandChildIndex: number): void {
    if (!this.grandSubDropdownIndex.has(parentIndex)) {
      this.grandSubDropdownIndex.set(parentIndex, new Map());
    }
    const subMap = this.grandSubDropdownIndex.get(parentIndex)!;
    const current = subMap.get(childIndex);
    subMap.set(childIndex, current === grandChildIndex ? null : grandChildIndex);
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  logout(): void {
    this.authService.logout(); // cierre de sesión
  }
}