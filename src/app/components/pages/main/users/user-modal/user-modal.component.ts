import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, AfterViewInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import Swal from "sweetalert2"
import { User } from "../../../../../interfaces/user.interface"

@Component({
    selector: "app-user-modal",
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: "./user-modal.component.html",
    styleUrls: ["./user-modal.component.css"],
})
export class UserModalComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() user: User | null = null
    @Output() formSubmit = new EventEmitter<User>()
    @Output() formCancel = new EventEmitter<void>()

    userForm!: FormGroup
    isEditing = false
    isSubmitting = false
    showPassword = false
    profilePreview: string | null = null

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        this.createForm()
    }

    ngAfterViewInit(): void {
        if (this.user && this.user.id && this.userForm) {
            setTimeout(() => {
                this.updateFormWithUserData()
            })
        }
    }

    updateFormWithUserData(): void {
        if (!this.user) return

        this.userForm.reset()

        this.userForm.patchValue({
            id: this.user.id,
            name: this.user.name,
            lastName: this.user.lastName,
            documentType: this.user.documentType,
            documentNumber: this.user.documentNumber,
            cellPhone: this.user.cellPhone,
            email: this.user.email,
            role: this.user.role[0] || "USER",
            firebaseUid: this.user.firebaseUid || "",
            profileImage: this.user.profileImage || "",
            password: "********",
        })

        this.profilePreview = this.user.profileImage || null

        this.userForm.get("email")?.disable()
        this.userForm.get("password")?.disable()
        this.userForm.get("password")?.clearValidators()
        this.userForm.get("password")?.updateValueAndValidity()

        this.isEditing = true
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["user"] && changes["user"].currentValue && this.userForm) {
            if (this.user && this.user.id) {
                this.updateFormWithUserData()
            } else {
                this.isEditing = false
                this.profilePreview = null
                this.userForm.reset()

                this.userForm.get("email")?.enable()
                this.userForm.get("password")?.enable()
                this.userForm.get("password")?.setValidators([Validators.required, Validators.minLength(6)])
                this.userForm.get("password")?.updateValueAndValidity()
            }
        }
    }

    createForm(): void {
        this.userForm = this.fb.group({
            id: [null],
            name: ["", [Validators.required, Validators.pattern(/^[A-Z][a-zA-Z0-9 ]*$/)]],
            lastName: ["", [Validators.required, Validators.pattern(/^([A-Z][a-z]*)(\s[A-Z][a-z]*)*$/)]],
            documentType: ["DNI", Validators.required],
            documentNumber: ["", [Validators.required, Validators.pattern(/^\d+$/), this.documentNumberValidator()]],
            cellPhone: ["", [Validators.required, Validators.pattern(/^\d{9}$/)]],
            email: ["", [Validators.required, Validators.email]],
            password: ["", [Validators.minLength(6)]],
            role: ["USER", Validators.required],
            firebaseUid: [""],
            profileImage: [""],
        })

        this.userForm.get("documentType")?.valueChanges.subscribe(() => {
            this.userForm.get("documentNumber")?.updateValueAndValidity()
        })
    }

    documentNumberValidator() {
        return (control: any) => {
            const type = this.userForm?.get("documentType")?.value
            const value = control.value
            if (type === "DNI" && value?.length !== 8) return { invalidLength: true }
            if (type === "CNE" && (value?.length < 8 || value?.length > 20)) return { invalidLength: true }
            return null
        }
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword
    }

    onImageSelected(event: any): void {
        const file: File = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const img = new Image();
            img.src = e.target.result;

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 300;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7); // calidad 70%

                // Verificamos tamaño en KB
                const base64Length = compressedBase64.length - (compressedBase64.indexOf(",") + 1);
                const sizeInKB = (4 * Math.ceil(base64Length / 3)) / 1024;

                if (sizeInKB > 200) {
                    Swal.fire({
                        icon: "warning",
                        title: "Imagen demasiado grande",
                        text: `La imagen comprimida aún pesa ${Math.round(sizeInKB)} KB. Por favor, usa una imagen más ligera.`,
                        confirmButtonText: "Entendido",
                    });
                    return;
                }

                this.profilePreview = compressedBase64;
                this.userForm.patchValue({ profileImage: compressedBase64 });

                Swal.fire({
                    icon: "success",
                    title: "Imagen cargada",
                    text: `La imagen se ha cargado correctamente (${Math.round(sizeInKB)} KB).`,
                    timer: 1500,
                    showConfirmButton: false,
                });
            };
        };

        reader.readAsDataURL(file);
    }

    // Reemplaza el método onSubmit() existente con este código:\
    onSubmit()
        : void {
        if (this.userForm.valid) {
            this.isSubmitting = true

            const formValue = this.userForm.getRawValue()
            formValue.role = [formValue.role.toUpperCase()]

            if (this.isEditing) {
                // Eliminamos la contraseña para no enviarla si estamos editando
                delete formValue.password

                // Lógica para manejar la imagen de perfil
                if (!this.profilePreview && !this.user?.profileImage) {
                    // Si no hay vista previa y no había imagen original
                    formValue.profileImage = ""
                } else if (!this.profilePreview && this.user?.profileImage) {
                    // Si no hay vista previa pero había una imagen original, eso significa que queremos eliminarla
                    formValue.profileImage = ""
                } else if (this.profilePreview && this.profilePreview === this.user?.profileImage) {
                    // Si la vista previa es exactamente igual a la imagen original, no enviar nada
                    delete formValue.profileImage
                }
                // En cualquier otro caso, se enviará la nueva imagen base64
            }

            this.formSubmit.emit(formValue)
            this.isSubmitting = false

            Swal.fire({
                icon: "success",
                title: "¡Éxito!",
                text: this.isEditing ? "Usuario actualizado correctamente" : "Usuario creado correctamente",
                timer: 2000,
                showConfirmButton: false,
                timerProgressBar: true,
            })
        } else {
            this.userForm.markAllAsTouched()
        }
    }

    onCancel(): void {
        this.formCancel.emit()
    }

    capitalizeFirstLetter(event: any): void {
        const input = event.target
        if (input.value.length > 0) {
            input.value = input.value.charAt(0).toUpperCase() + input.value.slice(1)
        }
    }

    capitalizeEachWord(event: any): void {
        const input = event.target
        const words = input.value.split(" ")
        const capitalized = words.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        input.value = capitalized.join(" ")
    }
}
