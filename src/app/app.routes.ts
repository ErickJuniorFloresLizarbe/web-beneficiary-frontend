import { Routes } from "@angular/router";
import { AuthGuard } from "./auth/guards/auth.guard";
import { ProfileComponent } from "./auth/profile/profile.component";
import { ConfigurationComponent } from "./auth/configuration/configuration.component";

export const routes: Routes = [
  // 🔹 Rutas de autenticación (No requieren autenticación)
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    data: { public: true },
  },

  // 🔹 Rutas protegidas
  {
    path: "",
    canMatch: [AuthGuard],
    children: [
      {
        path: "dashboard",
        title: "Dashboard General",
        loadComponent: () =>
          import("./components/pages/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent
          ),
      },

      /**
        ====================================================================================
        ================================== TRANSACCIONAL ===================================
        ====================================================================================
      **/

      // 📌 Módulo de familia (Team 01)
      {
        path: "modulo-familias",
        canMatch: [AuthGuard],
        children: [
          {
            path: "familias",
            title: "Gestionar Familias",
            loadComponent: () =>
              import("./components/pages/functionality/familys/dashboard/dashboard.component").then(
                (m) => m.DashboardComponent
              ),
          },
        ],
      },


      // 📌 Módulo de Reportes  (Team 05)
      {
        path: "modulo-reportes",
        canMatch: [AuthGuard],
        children: [
          {
            path: "reportes",
            title: "Gestion Reportes",
            loadComponent: () =>
              import("./components/pages/functionality/reports/reports.component").then(
                (m) => m.ReportsComponent
              ),
          },
        ],
      },
      // 📌 Módulo de transformacion ( Team 04 )
      {
        path: "modulo-tranformacion",
        canMatch: [AuthGuard],
        children: [
          {
            path: "transformacion",
            title: "Gestionar Transformación",
            loadComponent: () =>
              import("./components/pages/functionality/transformation/transformation.component").then(
                (m) => m.TransformationComponent
              ),
          },
        ],
      },

      // 📌 Módulo de asistencia (Team 03)
      {
        path: "modulo-asistencias",
        canMatch: [AuthGuard],
        children: [
          {
            path: "asistencias",
            title: "Gestionar Asistencias",
            loadComponent: () =>
              import("./components/pages/functionality/attendance/attendance.component").then(
                (m) => m.AttendanceComponent
              ),
          },
        ],
      },

      // 📌 Módulo de temas (Team 03)
      {
        path: "modulo-temas",
        canMatch: [AuthGuard],
        children: [
          {
            path: "temas",
            title: "Gestionar Temas",
            loadComponent: () =>
              import("./components/pages/functionality/issues/issues.component").then(
                (m) => m.IssuesComponent
              ),
          },
        ],
      },

      /**
      ====================================================================================
      ================================== MAESTROS ===================================
      ====================================================================================
      **/

      // 📌 Módulo de Usuarios (solo para ADMIN)
      {
        path: "usuarios",
        canMatch: [AuthGuard],
        data: { role: "ADMIN" }, // 👈 Rol requerido
        title: "Gestión de Usuarios",
        loadComponent: () =>
          import("./components/pages/main/users/users.component").then(
            (m) => m.UsersComponent
          ),
      },

      // 📌 Módulo de beneficiarios (Team 02)
      {
        path: "modulo-beneficiarios",
        canMatch: [AuthGuard],
        children: [
          {
            path: "beneficiarios",
            title: "Gestionar Beneficiarios",
            loadComponent: () =>
              import("./components/pages/main/beneficiarios/beneficiarios.component").then(
                (m) => m.BeneficiariosComponent
              ),
          },
        ],
      },

      // 📌 Módulo de metas  (Team 04)
      {
        path: "modulo-metas",
        canMatch: [AuthGuard],
        children: [
          {
            path: "metas",
            title: "Gestionar metas",
            loadComponent: () =>
              import("./components/pages/main/goal/goal.component").then(
                (m) => m.GoalComponent
              ),
          },
        ],
      },

      // 📌 Módulo de sesiones de metas  (Team 04)
      {
        path: "modulo-sesiones",
        canMatch: [AuthGuard],
        children: [
          {
            path: "sesiones",
            title: "Gestionar  Sesiones",
            loadComponent: () =>
              import("./components/pages/main/session/session.component").then(
                (m) => m.SessionComponent
              ),
          },
        ],
      },

      // 📌 Módulo de talleres   (Team 03)
      {
        path: "modulo-talleres",
        canMatch: [AuthGuard],
        children: [
          {
            path: "talleres",
            title: "Gestion talleres",
            loadComponent: () =>
              import("./components/pages/main/workshops/workshops.component").then(
                (m) => m.WorkshopsComponent

              ),
          },
        ],
      },

      /**
        ====================================================================================
        ================================== USUARIOS ===================================
        ====================================================================================
      **/

      // 📌 Módulo de perfil
      {
        path: 'perfil',
        component: ProfileComponent,
        canActivate: [AuthGuard]
      },
      // 📌 Módulo de configuracion
      {
        path: 'configuracion',
        component: ConfigurationComponent,
        canActivate: [AuthGuard]
      }

    ],
  },

  // 🔹 Redirecciones
  {
    path: "",
    redirectTo: "login",
    pathMatch: "full",
  },
  {
    path: "**",
    redirectTo: "login",
  },
];
