import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({ selector: 'app-not-found-page', standalone: true, imports: [RouterLink], template: '<h1>Página no encontrada</h1><a class="button" routerLink="/dashboard">Volver al monitor</a>', styles: `:host { display: block; padding: 2rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); box-shadow: var(--elevation-2); }` })
export class NotFoundPage {}
