import type { Routes } from '@angular/router';
export const captureMonitorRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', title: 'Avance de captura | IECM', loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
  { path: 'actas', title: 'Consulta de actas | IECM', loadComponent: () => import('./pages/actas/actas.page').then(m => m.ActasPage) },
];
