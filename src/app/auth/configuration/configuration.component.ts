import { Component, OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms"
import { Router, RouterModule } from "@angular/router"
import { AngularFireAuth } from "@angular/fire/compat/auth"
import firebase from "firebase/compat/app"
import Swal from "sweetalert2"
import { AuthService } from "../services/auth.service"
import { trigger, transition, style, animate } from "@angular/animations"

@Component({
  selector: "app-configuration",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./configuration.component.html",
  styleUrls: ["./configuration.component.css"],
  animations: [
    trigger("fadeInOut", [
      transition(":enter", [
        style({ opacity: 0, transform: "translateY(10px)" }),
        animate("300ms ease-out", style({ opacity: 1, transform: "translateY(0)" })),
      ]),
      transition(":leave", [animate("200ms ease-in", style({ opacity: 0, transform: "translateY(10px)" }))]),
    ]),
  ],
})
export class ConfigurationComponent implements OnInit {
  emailForm: FormGroup
  passwordForm: FormGroup

  emailSuccess = false
  passwordSuccess = false

  submittingEmail = false
  submittingPassword = false

  showCurrentPassword = false
  showNewPassword = false
  showConfirmPassword = false

  activeTab = "email"

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private afAuth: AngularFireAuth,
    private authService: AuthService,
  ) {
    this.emailForm = this.fb.group(
      {
        currentEmail: [{ value: "", disabled: true }],
        newEmail: ["", [Validators.required, Validators.email]],
        confirmEmail: ["", [Validators.required, Validators.email]],
      },
      { validators: this.emailsMatchValidator },
    )

    this.passwordForm = this.fb.group(
      {
        newPassword: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", [Validators.required]],
      },
      { validators: this.passwordsMatchValidator },
    )
  }

  ngOnInit(): void {
    this.afAuth.currentUser.then((user) => {
      if (user?.email) {
        this.emailForm.patchValue({ currentEmail: user.email })
      }
    })
  }

  emailsMatchValidator(group: FormGroup) {
    const newEmail = group.get("newEmail")?.value
    const confirmEmail = group.get("confirmEmail")?.value
    return newEmail === confirmEmail ? null : { emailsNotMatch: true }
  }

  passwordsMatchValidator(group: FormGroup) {
    const newPassword = group.get("newPassword")?.value
    const confirmPassword = group.get("confirmPassword")?.value
    return newPassword === confirmPassword ? null : { passwordsNotMatch: true }
  }

  onSubmitEmail() {
    if (this.emailForm.valid) {
      this.submittingEmail = true
      const newEmail = this.emailForm.get("newEmail")?.value

      this.afAuth.currentUser.then((user) => {
        if (user && user.email) {
          Swal.fire({
            title: "Confirma tu contraseña actual",
            input: "password",
            inputPlaceholder: "Contraseña actual",
            inputAttributes: {
              autocapitalize: "off",
              autocorrect: "off",
            },
            showCancelButton: true,
            confirmButtonText: "Continuar",
            confirmButtonColor: "#4F46E5",
            cancelButtonText: "Cancelar",
            showLoaderOnConfirm: true,
            preConfirm: (password) => {
              const credential = firebase.auth.EmailAuthProvider.credential(user.email!, password)
              return user
                .reauthenticateWithCredential(credential)
                .then(() => true)
                .catch(() => {
                  Swal.showValidationMessage("❌ Contraseña incorrecta")
                  return false
                })
            },
          }).then((result) => {
            if (result.isConfirmed) {
              this.authService.changeEmail(newEmail).subscribe({
                next: async () => {
                  this.submittingEmail = false
                  this.emailSuccess = true
                  this.emailForm.reset()
                  this.emailForm.patchValue({ currentEmail: newEmail })

                  await Swal.fire({
                    title: "Correo actualizado",
                    text: "Por seguridad debes volver a iniciar sesión con tu nuevo correo.",
                    icon: "success",
                    confirmButtonText: "Ir al login",
                    confirmButtonColor: "#4F46E5",
                  })

                  this.authService.logout() // te redirige al login
                },
                error: (err) => {
                  this.submittingEmail = false
                  Swal.fire({
                    title: "Error",
                    text: err.message || "Error al actualizar el correo",
                    icon: "error",
                    confirmButtonColor: "#4F46E5",
                  })
                },
              })
            } else {
              this.submittingEmail = false
            }
          })
        }
      })
    } else {
      Object.keys(this.emailForm.controls).forEach((key) => {
        this.emailForm.get(key)?.markAsTouched()
      })
    }
  }

  onSubmitPassword() {
    if (this.passwordForm.valid) {
      this.submittingPassword = true
      const newPassword = this.passwordForm.get("newPassword")?.value

      this.afAuth.currentUser.then((user) => {
        if (user && user.email) {
          Swal.fire({
            title: "Confirma tu contraseña actual",
            input: "password",
            inputPlaceholder: "Contraseña actual",
            inputAttributes: {
              autocapitalize: "off",
              autocorrect: "off",
            },
            inputValidator: (value) => {
              if (!value) {
                return "⚠️ Debes ingresar tu contraseña actual"
              }
              return null
            },
            showCancelButton: true,
            confirmButtonText: "Continuar",
            confirmButtonColor: "#4F46E5",
            cancelButtonText: "Cancelar",
            showLoaderOnConfirm: true,
            preConfirm: (currentPassword) => {
              const credential = firebase.auth.EmailAuthProvider.credential(user.email!, currentPassword)
              return user
                .reauthenticateWithCredential(credential)
                .then(() => true)
                .catch(() => {
                  Swal.showValidationMessage("❌ Contraseña incorrecta")
                  return false
                })
            },
          }).then((result) => {
            if (result.isConfirmed) {
              this.authService.changePassword(newPassword).subscribe({
                next: async () => {
                  this.submittingPassword = false
                  this.passwordSuccess = true
                  this.passwordForm.reset()

                  await Swal.fire({
                    title: "Contraseña actualizada",
                    text: "Por seguridad debes volver a iniciar sesión.",
                    icon: "success",
                    confirmButtonText: "Ir al login",
                    confirmButtonColor: "#4F46E5",
                  })

                  this.authService.logout() // cierra sesión y redirige
                },
                error: (err) => {
                  this.submittingPassword = false
                  Swal.fire({
                    title: "Error",
                    text: err.message || "Error al cambiar la contraseña",
                    icon: "error",
                    confirmButtonColor: "#4F46E5",
                  })
                },
              })
            } else {
              this.submittingPassword = false
            }
          })
        }
      })
    } else {
      Object.keys(this.passwordForm.controls).forEach((key) => {
        this.passwordForm.get(key)?.markAsTouched()
      })
    }
  }

  togglePasswordVisibility(field: string) {
    if (field === "current") this.showCurrentPassword = !this.showCurrentPassword
    if (field === "new") this.showNewPassword = !this.showNewPassword
    if (field === "confirm") this.showConfirmPassword = !this.showConfirmPassword
  }

  volverAlDashboard() {
    this.router.navigate(["/dashboard"])
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab
  }

  getPasswordStrength(): { text: string; color: string } {
    const password = this.passwordForm.get("newPassword")?.value || ""

    if (!password) {
      return { text: "No especificada", color: "text-gray-400" }
    }

    if (password.length < 6) {
      return { text: "Débil", color: "text-red-500" }
    }

    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length

    if (password.length >= 8 && strength >= 3) {
      return { text: "Fuerte", color: "text-green-500" }
    } else if (password.length >= 6 && strength >= 2) {
      return { text: "Media", color: "text-yellow-500" }
    } else {
      return { text: "Débil", color: "text-red-500" }
    }
  }
}
