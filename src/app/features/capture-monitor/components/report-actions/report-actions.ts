import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timeout, timer } from 'rxjs';
import { ApiError } from '../../../../core/http/api-error.model';
import { FileDownloadService } from '../../../../shared/utils/file-download.service';
import { ReportsApiService } from '../../data-access/reports-api.service';
import { reportFile } from '../../data-access/report-file';
import type { MonitorSnapshot, ReportFormat } from '../../models/monitor.model';
interface DownloadResult { filename: string; generadoEn: string; distrito: string; tipoEleccion: string }
@Component({ selector: 'app-report-actions', standalone: true, imports: [DatePipe], templateUrl: './report-actions.html', styleUrl: './report-actions.scss' })
export class ReportActions {
  private readonly api = inject(ReportsApiService);
  private readonly files = inject(FileDownloadService);
  private readonly destroyRef = inject(DestroyRef);
  readonly snapshot = input.required<MonitorSnapshot>();
  readonly disabled = input(false);
  readonly refresh = output<void>();
  readonly busy = signal<ReportFormat | null>(null);
  readonly error = signal<ApiError | null>(null);
  readonly success = signal<DownloadResult | null>(null);
  readonly cooldown = signal(false);
  private readonly expiredCut = signal<string | null>(null);
  private readonly lastFormat = signal<ReportFormat>('xlsx');
  readonly expired = computed(() => this.expiredCut() === this.snapshot().corteId);
  readonly blocked = computed(() => this.disabled() || this.busy() !== null || this.expired() || this.cooldown());
  readonly errorMessage = computed(() => {
    const error = this.error();
    if (error?.status === 410) return this.expired() ? 'Este corte ya no está disponible. Actualiza el panel y vuelve a descargar.' : 'El corte solicitado expiró. El panel tiene un corte nuevo; vuelve a descargar.';
    if (error?.status === 429) return this.cooldown() ? 'Se alcanzó el límite de reportes. Espera un minuto para volver a intentar.' : 'Ya puedes volver a intentar la descarga.';
    return error?.message ?? '';
  });
  constructor() {
    effect(() => {
      // Una actualización del panel habilita el nuevo corte tras un 410, sin exportarlo automáticamente.
      if (!this.expired() && this.error()?.status === 410 && !this.busy()) this.error.set(null);
    });
  }
  download(format: ReportFormat): void {
    if (this.blocked()) return;
    const snapshot = this.snapshot(); // Fijar el corte al pulsar, aunque el polling lo renueve después.
    this.lastFormat.set(format); this.busy.set(format); this.error.set(null); this.success.set(null);
    this.api.getReport(format, { corteId: snapshot.corteId }).pipe(timeout(60000),
      takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(null)),
    ).subscribe({
      next: response => {
        try {
          const file = reportFile(response, format);
          this.files.save(file.blob, file.filename);
          this.success.set({ filename: file.filename, generadoEn: snapshot.generadoEn, distrito: snapshot.filtros.distrito, tipoEleccion: snapshot.filtros.tipoEleccion });
        } catch (error) { this.fail(error, snapshot.corteId); }
      }, error: (error: unknown) => this.fail(error, snapshot.corteId),
    });
  }
  retry(): void { this.download(this.lastFormat()); }
  private fail(error: unknown, cut: string): void {
    const normalized = error instanceof ApiError ? error : new ApiError(0, 'DOWNLOAD_FAILED', 'No se pudo iniciar la descarga. Comprueba la conexión e intenta nuevamente.');
    this.error.set(normalized);
    if (normalized.status === 410) this.expiredCut.set(cut);
    if (normalized.status === 429) {
      this.cooldown.set(true);
      timer(60000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cooldown.set(false));
    }
  }
}
