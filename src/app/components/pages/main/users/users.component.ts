import { ActivityService } from './../../../../services/ui/activity.service';
import { AuthService } from "./../../../../auth/services/auth.service"
import { Component, OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { FormsModule } from "@angular/forms"
import { UserService } from "../../../../services/user.service"
import { User } from "../../../../interfaces/user.interface"
import { UserModalComponent } from "./user-modal/user-modal.component"
import Swal from "sweetalert2"

@Component({
    selector: "app-users",
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, UserModalComponent],
    templateUrl: "./users.component.html",
    styleUrls: ["./users.component.css"],
})
export class UsersComponent implements OnInit {
    users: User[] = []
    filteredUsers: User[] = []
    selectedUser: User | null = null
    isFormVisible = false
    isEditing = false
    isAdmin = false
    isLoading = true
    error: string | null = null
    searchTerm = ""

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private activityService: ActivityService,
    ) { }

    ngOnInit(): void {
        this.authService.isAdmin().subscribe({
            next: (isAdmin) => {
                this.isAdmin = isAdmin
                this.loadAllUsers()
            },
            error: (error) => {
                this.isAdmin = false
                this.loadAllUsers()
            },
        })
    }

    loadAllUsers(): void {
        this.isLoading = true
        this.userService.getAllUsers().subscribe({
            next: (users) => {
                this.users = users
                this.filteredUsers = [...users]
                this.isLoading = false
            },
            error: (error) => {
                this.error = "Error al cargar los usuarios. Por favor, verifique que el servidor backend esté en ejecución."
                this.users = []
                this.filteredUsers = []
                this.isLoading = false
            },
        })
    }

    openForm(user?: User): void {
        this.isFormVisible = true
        this.isEditing = !!user

        if (user && user.id) {
            // Set loading state
            this.isLoading = true

            this.userService.getUserById(user.id).subscribe({
                next: (fetchedUser) => {
                    if (fetchedUser) {
                        // Create a new object to ensure change detection
                        this.selectedUser = {
                            id: fetchedUser.id!,
                            name: fetchedUser.name || "",
                            lastName: fetchedUser.lastName || "",
                            documentType: fetchedUser.documentType || "DNI",
                            documentNumber: fetchedUser.documentNumber || "",
                            cellPhone: fetchedUser.cellPhone || "",
                            email: fetchedUser.email || "",
                            firebaseUid: fetchedUser.firebaseUid,
                            role: fetchedUser.role || ["USER"],
                            profileImage: fetchedUser.profileImage || "",
                        }
                    }
                    this.isLoading = false
                },
                error: (err) => {
                    this.selectedUser = null
                    this.isLoading = false
                    alert("Error al cargar los datos del usuario")
                },
            })
        } else {
            this.selectedUser = {
                name: "",
                lastName: "",
                documentType: "DNI",
                documentNumber: "",
                cellPhone: "",
                email: "",
                password: "",
                role: ["USER"],
                profileImage: "",
            }
        }
    }

    closeForm(): void {
        this.isFormVisible = false
        this.selectedUser = null
    }

    saveUser(user: User): void {
        if (this.isEditing) {
            this.userService.updateUser(user).subscribe({
                next: () => {
                    // Log activity for user update
                    this.logUserActivity("editó", user)

                    this.loadAllUsers()
                    this.closeForm()
                },
                error: (error) => {
                    alert("Error al actualizar el usuario.")
                },
            })
        } else {
            this.userService.createUser(user).subscribe({
                next: () => {
                    // Log activity for user creation
                    this.logUserActivity("creó", user)

                    this.loadAllUsers()
                    this.closeForm()
                },
                error: (error) => {
                    alert("Error al crear el usuario.")
                },
            })
        }
    }

    deleteUser(id: number): void {
        const userToDelete = this.users.find((u) => u.id === id)
        const fullName = userToDelete ? `${userToDelete.name} ${userToDelete.lastName}` : "el usuario"

        Swal.fire({
            title: `¿Eliminar a ${fullName}?`,
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                this.userService.deleteUser(id).subscribe({
                    next: () => {
                        // Log activity for user deletion
                        if (userToDelete) {
                            this.logUserActivity("eliminó", userToDelete)
                        }

                        this.users = this.users.filter((u) => u.id !== id)
                        this.filteredUsers = this.filterUsers(this.searchTerm)

                        Swal.fire({
                            icon: "success",
                            title: "¡Eliminado!",
                            text: "El usuario ha sido eliminado correctamente.",
                            timer: 2000,
                            showConfirmButton: false,
                            timerProgressBar: true,
                        })
                    },
                    error: (error) => {
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: "Hubo un problema al eliminar el usuario.",
                        })
                    },
                })
            }
        })
    }

    onSearch(term: string): void {
        this.searchTerm = term
        this.filteredUsers = this.filterUsers(term)
    }

    filterUsers(term: string): User[] {
        const lowerTerm = term.toLowerCase().trim()
        return this.users.filter((user) =>
            (user.name + " " + user.lastName + " " + user.email + " " + user.documentNumber)
                .toLowerCase()
                .includes(lowerTerm),
        )
    }

    // Método para registrar actividad de usuarios
    private logUserActivity(action: string, user: User): void {
        // Obtener información del usuario actual
        this.authService.getLoggedUserInfo().subscribe({
            next: (currentUser) => {
                // Crear objeto de actividad
                const activity = {
                    imagen: currentUser?.profileImage || "/placeholder.svg?height=40&width=40",
                    nombre: `${currentUser?.name || ""} ${currentUser?.lastName || ""}`.trim() || currentUser?.email || "Usuario",
                    modulo: "Usuarios",
                    accion: `${action} al usuario ${user.name} ${user.lastName} (${user.email})`,
                }

                // Registrar la actividad
                this.activityService.logActivity(activity)
            },
            error: () => {
                // En caso de error, intentar con información básica
                const activity = {
                    imagen: "/placeholder.svg?height=40&width=40",
                    nombre: "Usuario del sistema",
                    modulo: "Usuarios",
                    accion: `${action} al usuario ${user.name} ${user.lastName} (${user.email})`,
                }

                this.activityService.logActivity(activity)
            },
        })
    }
}
