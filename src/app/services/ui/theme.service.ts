import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private darkMode = new BehaviorSubject<boolean>(true); // Por defecto modo oscuro
    darkMode$ = this.darkMode.asObservable();

    constructor() {
        // Verificar preferencia guardada
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            this.setDarkMode(false);
        }
    }

    toggleDarkMode(): void {
        this.setDarkMode(!this.darkMode.value);
    }

    setDarkMode(isDark: boolean): void {
        this.darkMode.next(isDark);

        // Aplicar clase al documento
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }
}