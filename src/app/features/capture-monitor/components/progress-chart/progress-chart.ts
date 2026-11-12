import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import type { GroupRow } from '../../models/monitor.model';
@Component({ selector: 'app-progress-chart', standalone: true, imports: [DecimalPipe], templateUrl: './progress-chart.html', styleUrl: './progress-chart.scss' })
export class ProgressChart {
  readonly title = input.required<string>(); readonly subtitle = input(''); readonly rows = input.required<readonly GroupRow[]>();
}
