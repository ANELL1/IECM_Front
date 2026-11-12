import { Component } from '@angular/core';
import { Shell } from './layout/shell/shell';
@Component({ imports: [Shell], selector: 'app-root', standalone: true, templateUrl: './app.html', styleUrl: './app.scss' })
export class App {}
