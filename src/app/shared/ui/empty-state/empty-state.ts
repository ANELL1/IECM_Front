import { Component, input } from '@angular/core';
@Component({ selector: 'app-empty-state', standalone: true, template: '<section class="empty" role="status"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h5"/></svg><h2>{{ title() }}</h2><p>{{ description() }}</p><ng-content /></section>', styles: `
.empty { box-shadow: var(--elevation-2); padding: 3rem 1.5rem; border: 1px dashed var(--color-border); border-radius: var(--radius); background: var(--color-surface); text-align: center; }
svg { color: var(--color-brand); margin-bottom: 1rem; }
h2 { font-size: 1.1rem; margin-bottom: .5rem; } p { color: var(--color-muted); font-size: .9rem; max-width: 34rem; margin: 0 auto 1rem; }
` })
export class EmptyState { readonly title = input('Sin datos'); readonly description = input('No se encontraron resultados para los filtros seleccionados.'); }
