import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActasStore } from '../../state/actas.store';
import { MonitorFiltersComponent } from '../../components/monitor-filters/monitor-filters';
import { ActasTable } from '../../components/actas-table/actas-table';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { LoadingState } from '../../../../shared/ui/loading-state/loading-state';
import { ErrorState } from '../../../../shared/ui/error-state/error-state';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
@Component({ selector: 'app-actas-page', standalone: true, providers: [ActasStore], imports: [DatePipe, DecimalPipe, MonitorFiltersComponent, ActasTable, Pagination, LoadingState, ErrorState, EmptyState], templateUrl: './actas.page.html', styleUrl: './actas.page.scss' })
export class ActasPage { readonly store = inject(ActasStore); }
