import { Component, input } from '@angular/core';
@Component({ selector: 'app-loading-state', standalone: true, template: '<div class="loading" role="status" aria-live="polite"><span class="spinner" aria-hidden="true"></span><span>{{ message() }}</span></div>', styles: `
.loading { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); box-shadow: var(--elevation-1); display: flex; justify-content: center; align-items: center; gap: .8rem; min-height: 120px; padding: 1.5rem; color: var(--color-muted); }
.spinner { width: 22px; height: 22px; border: 2px solid var(--color-border); border-top-color: var(--color-brand); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
` })
export class LoadingState { readonly message = input('Consultando información…'); }
