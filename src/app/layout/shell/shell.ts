import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
@Component({ selector: 'app-shell', standalone: true, imports: [Header, Sidebar, RouterOutlet], templateUrl: './shell.html', styleUrl: './shell.scss', host: { '(document:keydown.escape)': 'closeNavigation()' } })
export class Shell {
  private readonly router = inject(Router);
  private readonly header = viewChild(Header);
  private readonly main = viewChild<ElementRef<HTMLElement>>('mainContent');
  readonly navigationOpen = signal(false);
  readonly pageTitle = signal('Avance de captura');
  constructor() {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), takeUntilDestroyed()).subscribe(event => {
      const path = event.urlAfterRedirects.split('?')[0];
      this.pageTitle.set(path === '/actas' ? 'Consulta de actas' : path === '/dashboard' ? 'Avance de captura' : 'Página no encontrada');
      this.navigationOpen.set(false);
      this.main()?.nativeElement.focus();
    });
  }
  toggleNavigation(): void { this.navigationOpen.update(open => !open); }
  closeNavigation(): void {
    if (this.navigationOpen()) { this.navigationOpen.set(false); this.header()?.focusMenu(); }
  }
  navigate(): void { this.navigationOpen.set(false); this.main()?.nativeElement.focus(); }
}
