import { ActivityService } from './../../services/ui/activity.service';
import { Component, Inject, PLATFORM_ID, OnInit, OnDestroy } from "@angular/core"
import { CommonModule, isPlatformBrowser } from "@angular/common"
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import { Router, RouterModule } from "@angular/router"
import { AuthService } from "../services/auth.service"
import Swal from "sweetalert2"

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup
  forgotForm: FormGroup
  showPassword = false
  isLoading = false
  isSending = false
  private isBrowser: boolean
  private audio: HTMLAudioElement | null = null
  musicStarted = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private activityService: ActivityService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId)

    // Limpiar token si ya estaba
    if (this.isBrowser && localStorage.getItem("authToken")) {
      localStorage.removeItem("authToken")
    }

    // Login form
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // Forgot password form
    this.forgotForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.audio = new Audio("assets/audio/intro_1.mp3")
      this.audio.volume = 0.3
      this.audio.loop = true

      // Intentar reproducir automáticamente sin botón visible
      this.audio
        .play()
        .then(() => {
          console.log("✅ Música reproducida automáticamente")
        })
        .catch((error) => {
          console.warn("⚠️ El navegador bloqueó la reproducción automática. Esperando interacción del usuario...")
          // Esperar primer clic en cualquier parte
          const tryPlayOnUserInteraction = () => {
            this.audio
              ?.play()
              .then(() => {
                console.log("✅ Música activada tras interacción")
                document.removeEventListener("click", tryPlayOnUserInteraction)
              })
              .catch((err) => {
                console.error("❌ No se pudo iniciar la música:", err)
              })
          }

          document.addEventListener("click", tryPlayOnUserInteraction, { once: true })
        })
    }
  }

  ngOnDestroy(): void {
    // Detener la música cuando se destruye el componente
    if (this.audio) {
      this.audio.pause()
      this.audio = null
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true
      const { email, password, rememberMe } = this.loginForm.value

      this.authService.login(email, password).subscribe({
        next: (userInfo) => {
          // Detener la música al iniciar sesión exitosamente
          if (this.audio) {
            this.audio.pause()
            this.audio = null
          }

          // Si rememberMe está activado, guardar preferencia
          if (rememberMe && this.isBrowser) {
            localStorage.setItem("rememberedEmail", email)
          } else if (this.isBrowser) {
            localStorage.removeItem("rememberedEmail")
          }

          // Registrar la actividad de inicio de sesión
          this.logLoginActivity(userInfo)

          this.router.navigate(["/dashboard"])
          this.isLoading = false
        },
        error: (error) => {
          this.isLoading = false
          Swal.fire({
            icon: "error",
            title: "Error de acceso",
            text: "Correo o contraseña incorrectos",
            confirmButtonColor: "#DD172A",
          })
        },
      })
    } else {
      this.loginForm.markAllAsTouched()
    }
  }

  // Método para registrar la actividad de inicio de sesión
  logLoginActivity(userInfo: any): void {
    if (!userInfo && this.isBrowser) {
      const storedUserInfo = localStorage.getItem("userInfo");
      if (storedUserInfo) {
        userInfo = JSON.parse(storedUserInfo);
      }
    }

    // 🛡️ Seguridad: Salir si no hay info válida
    if (!userInfo) {
      console.warn("No se pudo registrar actividad: información de usuario no disponible");
      return;
    }

    const activity = {
      imagen: userInfo.photoURL || userInfo.profileImage || "/placeholder.svg?height=40&width=40",
      nombre:
        userInfo.name && userInfo.lastName
          ? `${userInfo.name} ${userInfo.lastName}`
          : userInfo.displayName || userInfo.name || userInfo.email || "Usuario",
      modulo: "Sistema",
      accion: "Ingreso al sistema",
    };

    this.activityService.logActivity(activity);
  }

  sendResetLink() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched()
      return
    }

    this.isSending = true
    const email = this.forgotForm.get("email")?.value

    this.authService.sendResetPasswordEmail(email).subscribe({
      next: () => {
        this.isSending = false
        Swal.fire({
          icon: "success",
          title: "Correo enviado",
          text: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
          confirmButtonColor: "#DD172A",
        })
        document.getElementById("closeModalBtn")?.click()
      },
      error: (err) => {
        this.isSending = false
        Swal.fire({
          icon: "warning",
          title: "Correo no encontrado",
          text: err.error?.error || "El correo ingresado no está registrado.",
          confirmButtonColor: "#DD172A",
        })
      },
    })
  }

  startMusic(): void {
    if (this.audio && !this.musicStarted) {
      this.audio
        .play()
        .then(() => {
          this.musicStarted = true
        })
        .catch((err) => {
          console.log("Error al reproducir música:", err)
        })
    }
  }
}
