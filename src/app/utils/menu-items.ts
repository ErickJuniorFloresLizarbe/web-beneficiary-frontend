// menu.model.ts

export interface MenuItem {
  title: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
  role?: string[];
}
export const MENU_ITEMS: MenuItem[] = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: "layout-dashboard",
  },
  {
    title: "Principal",
    icon: "grid",
    children: [
      { title: "Usuarios", path: "/usuarios", icon: "users", role: ["ADMIN"] },
      { title: "Beneficiarios", path: "/modulo-beneficiarios/beneficiarios", icon: "user-plus" },
      { title: "Talleres", path: "/modulo-talleres/talleres", icon: "hammer" },
      { title: "Metas", path: "/modulo-metas/metas", icon: "target" },
      { title: "Sesiones", path: "/modulo-sesiones/sesiones", icon: "calendar-clock" },
    ],
  },
  {
    title: "Funcionalidades",
    icon: "layers",
    children: [
      { title: "Familias", path: "/modulo-familias/familias", icon: "home" },
      { title: "Transformación", path: "/modulo-tranformacion/transformacion", icon: "sparkles" },
      { title: "Asistencias", path: "/modulo-asistencias/asistencias", icon: "clipboard-check" },
      { title: "Temas", path: "/modulo-temas/temas", icon: "book-open" },
      { title: "Reportes", path: "/modulo-reportes/reportes", icon: "bar-chart-3" },
    ],
  },
];