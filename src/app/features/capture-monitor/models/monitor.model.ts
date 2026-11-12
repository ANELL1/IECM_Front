export interface MonitorFilters { distritoId?: number; tipoEleccionId?: number }
export interface AppliedFilters extends MonitorFilters { distrito: string; tipoEleccion: string }
export interface CatalogItem { id: number; nombre: string }
export interface Catalogs { distritos: CatalogItem[]; elecciones: CatalogItem[] }
export interface Metrics {
  esperadas: number; capturadas: number; pendientes: number; porcentaje: number;
  semaforo: 'rojo' | 'amarillo' | 'verde' | 'sin_datos';
}
export interface GroupRow extends Metrics { id: number; nombre: string }
export interface DetailRow extends Metrics { distritoId: number; distrito: string; tipoEleccionId: number; tipoEleccion: string }
export interface MonitorSnapshot {
  generadoEn: string; filtros: AppliedFilters; resumen: Metrics; distritos: GroupRow[];
  elecciones: GroupRow[]; detalle: DetailRow[]; corteId: string;
}
export interface StatisticsMeta { requestId: string; generadoEn: string; filtros: AppliedFilters }
export type ActaStatus = 'Capturada' | 'Pendiente';
export interface ActaQuery extends MonitorFilters { estado?: ActaStatus; pagina?: number; limite?: number }
export interface Acta {
  actaId: number; distritoId: number; distrito: string; tipoEleccionId: number; tipoEleccion: string;
  numeroActa: number; estado: ActaStatus; fechaCaptura: string | null;
}
export interface ActaPage { items: Acta[]; total: number; pagina: number; limite: number; totalPaginas: number }
export interface ServiceHealth { status: string; database: string }
export type ReportFormat = 'xlsx' | 'pdf';
export type ReportQuery = { corteId: string; distritoId?: never; tipoEleccionId?: never }
  | (MonitorFilters & { corteId?: never });
