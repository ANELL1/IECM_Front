import { Component, computed, input } from '@angular/core';
export type ProgressStatus = 'rojo' | 'amarillo' | 'verde' | 'sin_datos';
@Component({ selector: 'app-status-badge', standalone: true, template: '<span class="badge" [class]="status()"><span class="dot" aria-hidden="true"></span>{{ label() }}</span>', styles: `
.badge { box-shadow: var(--elevation-1); display: inline-flex; align-items: center; gap: .4rem; padding: .25rem .65rem; border-radius: 2rem; font-size: .75rem; font-weight: 600; white-space: nowrap; border: 1px solid transparent; }
.dot { width: .4rem; height: .4rem; border-radius: 50%; background: currentColor; }
.rojo { background: linear-gradient(135deg, white, var(--progress-red-bg)); color: var(--progress-red-ink); border-color: var(--progress-red); }
.rojo .dot { background: var(--progress-red); } .amarillo { background: linear-gradient(135deg, white, var(--progress-yellow-bg)); color: var(--progress-yellow-ink); border-color: var(--progress-yellow); }
.amarillo .dot { background: var(--progress-yellow); } .verde { background: linear-gradient(135deg, white, var(--progress-green-bg)); color: var(--progress-green-ink); border-color: var(--progress-green); }
.verde .dot { background: var(--progress-green); } .sin_datos { background: #eeecf0; color: var(--color-muted); }
` })
export class StatusBadge {
  readonly status = input.required<ProgressStatus>();
  readonly label = computed(() => ({ rojo: 'Avance bajo', amarillo: 'Avance medio', verde: 'Avance alto', sin_datos: 'Sin datos' })[this.status()]);
}
