import { ReportActions } from '../../components/report-actions/report-actions';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DashboardStore } from '../../state/dashboard.store';
import { MonitorFiltersComponent } from '../../components/monitor-filters/monitor-filters';
import { MetricCard } from '../../components/metric-card/metric-card';
import { ProgressChart } from '../../components/progress-chart/progress-chart';
import { CaptureDonut } from '../../components/capture-donut/capture-donut';
import { ProgressTable } from '../../components/progress-table/progress-table';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { ErrorState } from '../../../../shared/ui/error-state/error-state';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
@Component({ selector: 'app-dashboard-page', standalone: true, providers: [DashboardStore],
  imports: [ReportActions, DatePipe, DecimalPipe, MonitorFiltersComponent, MetricCard, ProgressChart, CaptureDonut, ProgressTable, LoadingState, ErrorState, EmptyState],
  templateUrl: './dashboard.page.html', styleUrl: './dashboard.page.scss' })
export class DashboardPage { readonly store = inject(DashboardStore); }
