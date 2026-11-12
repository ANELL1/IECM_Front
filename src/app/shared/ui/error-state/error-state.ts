import { Component, input, output } from '@angular/core';
@Component({ selector: 'app-error-state', standalone: true, template: '<section class="error"><div role="alert"><h2>No fue posible completar la consulta</h2><p>{{ message() }}</p>@if (requestId()) { <small>Referencia: {{ requestId() }}</small> }</div>@if (retryable()) { <button class="button" type="button" (click)="retry.emit()">Intentar nuevamente</button> }</section>', styles: `
.error { box-shadow: var(--elevation-2); padding: 1.5rem; border: 1px solid #e9bdc4; border-radius: var(--radius); background: var(--color-danger-bg); }
h2 { color: var(--color-danger); font-size: 1rem; margin-bottom: .5rem; } p { margin-bottom: .5rem; } small { display: block; color: var(--color-muted); overflow-wrap: anywhere; } button { margin-top: 1rem; }
` })
export class ErrorState { readonly message = input('Intenta nuevamente en unos momentos.'); readonly requestId = input<string | null>(null); readonly retryable = input(true); readonly retry = output<void>(); }
