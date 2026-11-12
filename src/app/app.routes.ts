import type { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', loadChildren: () => import('./features/capture-monitor/capture-monitor.routes').then(m => m.captureMonitorRoutes) },
  { path: '**', title: 'Página no encontrada | IECM', loadComponent: () => import('./shared/ui/not-found/not-found.page').then(m => m.NotFoundPage) },
];
