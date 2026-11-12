import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import type { Acta } from '../../models/monitor.model';
@Component({ selector: 'app-actas-table', standalone: true, imports: [DatePipe, DecimalPipe], templateUrl: './actas-table.html', styleUrl: './actas-table.scss' })
export class ActasTable { readonly rows = input.required<readonly Acta[]>(); }
