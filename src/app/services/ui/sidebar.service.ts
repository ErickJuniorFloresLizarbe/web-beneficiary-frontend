import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SidebarService {
    private mobileSidebarOpen = new BehaviorSubject<boolean>(false);
    mobileSidebarOpen$ = this.mobileSidebarOpen.asObservable();

    constructor() { }

    toggleMobileSidebar(isOpen?: boolean): void {
        if (isOpen !== undefined) {
            this.mobileSidebarOpen.next(isOpen);
        } else {
            this.mobileSidebarOpen.next(!this.mobileSidebarOpen.value);
        }
    }
}
