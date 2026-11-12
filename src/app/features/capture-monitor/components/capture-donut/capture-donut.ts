import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import type { Metrics } from '../../models/monitor.model';
@Component({ selector: 'app-capture-donut', standalone: true, imports: [DecimalPipe], templateUrl: './capture-donut.html', styleUrl: './capture-donut.scss' })
export class CaptureDonut {
  readonly metrics = input.required<Metrics>();
  readonly dash = computed(() => `${this.metrics().porcentaje} ${100 - this.metrics().porcentaje}`);
}
