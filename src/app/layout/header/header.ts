import { Component, ElementRef, input, output, viewChild } from '@angular/core';
@Component({ selector: 'app-header', standalone: true, templateUrl: './header.html', styleUrl: './header.scss' })
export class Header {
  readonly navigationOpen = input(false);
  readonly title = input('Avance de captura');
  readonly toggleNavigation = output<void>();
  private readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');
  focusMenu(): void { this.menuButton()?.nativeElement.focus(); }
}
