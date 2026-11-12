import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
@Component({ selector: 'app-metric-card', standalone: true, imports: [DecimalPipe], template: '<article class="metric" [class]="tone()"><div class="label"><span>{{ label() }}</span><span class="marker" aria-hidden="true"></span></div><p class="value">{{ value() | number: (percentage() ? "1.2-2" : "1.0-0") }}@if (percentage()) { <span class="percent">%</span> }</p><p class="description">{{ description() }}</p></article>', styleUrl: './metric-card.scss' })
export class MetricCard {
  readonly label = input.required<string>(); readonly value = input.required<number>();
  readonly description = input(''); readonly percentage = input(false);
  readonly tone = input<'neutral' | 'captured' | 'pending' | 'progress'>('neutral');
}
