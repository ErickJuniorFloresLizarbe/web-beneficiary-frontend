import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

export interface Profile {
  profileImage?: string;
  name: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  cellPhone: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(10px)' }))
      ])
    ])
  ]
})
export class ProfileComponent implements OnInit {
  profile: Profile = {} as Profile;
  editableProfile: Profile = {} as Profile;
  documentTypes = ["DNI", "Pasaporte", "Cédula", "Otro"];
  editMode = false;
  loading = true;
  activeTab = 'personal';

  // Para animación de guardado
  isSaving = false;

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.loading = true;
    this.authService.getLoggedUserInfo().subscribe({
      next: (data) => {
        this.profile = data;
        this.editableProfile = { ...data };
        this.loading = false;
      },
      error: (err) => {
        Swal.fire({
          title: "Error",
          text: "❌ Ocurrió un error al obtener tu perfil",
          icon: "error",
          confirmButtonColor: '#4F46E5'
        });
        this.loading = false;
      }
    });
  }

  volverAlDashboard(): void {
    this.router.navigate(["/dashboard"]);
  }

  toggleEditMode(): void {
    if (this.editMode) {
      this.saveChanges();
    } else {
      this.editableProfile = { ...this.profile };
      this.editMode = true;
    }
  }

  saveChanges(): void {
    this.isSaving = true;

    const payload = {
      name: this.editableProfile.name,
      lastName: this.editableProfile.lastName,
      documentType: this.editableProfile.documentType,
      documentNumber: this.editableProfile.documentNumber,
      cellPhone: this.editableProfile.cellPhone,
      profileImage: this.editableProfile.profileImage
    };

    this.authService.updateMyProfile(payload).subscribe({
      next: (res) => {
        this.profile = { ...this.editableProfile };
        this.editMode = false;
        this.isSaving = false;

        Swal.fire({
          title: "Perfil actualizado",
          text: "✅ Tus datos se guardaron correctamente",
          icon: "success",
          confirmButtonColor: '#4F46E5'
        });
      },
      error: (err) => {
        this.isSaving = false;
        Swal.fire({
          title: "Error",
          text: "❌ Ocurrió un error al guardar los cambios",
          icon: "error",
          confirmButtonColor: '#4F46E5'
        });
      }
    });
  }

  cancelEdit(): void {
    this.editableProfile = { ...this.profile };
    this.editMode = false;
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: "Error",
          text: "La imagen no debe superar los 5MB",
          icon: "error",
          confirmButtonColor: '#4F46E5'
        });
        return;
      }

      // Validar tipo
      if (!file.type.match('image.*')) {
        Swal.fire({
          title: "Error",
          text: "El archivo debe ser una imagen",
          icon: "error",
          confirmButtonColor: '#4F46E5'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.editableProfile.profileImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getRoleName(): string {
    const role = Array.isArray(this.profile.role) ? this.profile.role[0] : this.profile.role;
    return role?.toUpperCase() === 'ADMIN' ? 'Administrador' : 'Usuario';
  }
  
  getRoleClass(): string {
    const role = Array.isArray(this.profile.role) ? this.profile.role[0] : this.profile.role;
    const normalized = role?.toUpperCase();
  
    return normalized === 'ADMIN'
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  }
  
  onImageError(event: Event): void {
    const element = event.target as HTMLImageElement;
    const name = this.editMode ? this.editableProfile.name : this.profile.name;
    const lastName = this.editMode ? this.editableProfile.lastName : this.profile.lastName;
    element.src = `https://ui-avatars.com/api/?name=${name}+${lastName}&background=random&color=fff&size=128`;
  }

}
