import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { reportFile, reportFilename } from './report-file';
describe('Archivo de reporte', () => {
  it('obtiene nombre normal y UTF-8 del encabezado', () => {
    expect(reportFilename('attachment; filename="avance-2026.pdf"', 'pdf')).toBe('avance-2026.pdf');
    expect(reportFilename("attachment; filename*=UTF-8''actas%20electorales.xlsx", 'xlsx')).toBe('actas electorales.xlsx');
  });
  it.each([null, 'attachment; filename="../../file.pdf"', 'attachment; filename="script.exe"', "attachment; filename*=UTF-8''%ZZ.pdf", 'attachment; filename=".hidden.pdf"'])('usa nombre seguro con %s', header => {
    expect(reportFilename(header, 'pdf')).toBe('avance-captura.pdf');
  });
  it('acepta un PDF no vacío con MIME correcto y conserva el Blob original', () => {
    const blob = new Blob(['%PDF-test'], { type: 'application/pdf' });
    const result = reportFile(new HttpResponse({ body: blob, headers: new HttpHeaders({ 'Content-Type': 'application/pdf; charset=utf-8' }) }), 'pdf');
    expect(result.blob).toBe(blob);
  });
  it('rechaza respuestas HTML, vacías o sin cuerpo', () => {
    expect(() => reportFile(new HttpResponse({ body: new Blob(['<html>error</html>'], { type: 'text/html' }) }), 'pdf')).toThrow();
    expect(() => reportFile(new HttpResponse({ body: new Blob([], { type: 'application/pdf' }) }), 'pdf')).toThrow();
    expect(() => reportFile(new HttpResponse<Blob>({ body: null }), 'xlsx')).toThrow();
  });
});
