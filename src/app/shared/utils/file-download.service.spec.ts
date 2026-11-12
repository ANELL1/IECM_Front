import { TestBed } from '@angular/core/testing';
import { FileDownloadService } from './file-download.service';
describe('Descarga en navegador', () => {
  const create = vi.fn(() => 'blob:test-download'); const revoke = vi.fn();
  beforeEach(() => {
    vi.useFakeTimers(); create.mockClear(); revoke.mockClear();
    vi.stubGlobal('URL', class extends URL { static override createObjectURL = create; static override revokeObjectURL = revoke; });
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('dispara el enlace y libera la URL después de permitir el inicio de la descarga', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function(this: HTMLAnchorElement) {
      expect(this.download).toBe('avance.pdf'); expect(this.href).toBe('blob:test-download'); expect(this.isConnected).toBe(true);
    });
    const blob = new Blob(['file']); TestBed.inject(FileDownloadService).save(blob, 'avance.pdf');
    expect(create).toHaveBeenCalledWith(blob); expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a[download="avance.pdf"]')).toBeNull(); expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30000); expect(revoke).toHaveBeenCalledWith('blob:test-download');
  });
  it('libera recursos si el navegador falla', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { throw new Error('blocked'); });
    expect(() => TestBed.inject(FileDownloadService).save(new Blob(['file']), 'avance.pdf')).toThrow('blocked');
    expect(revoke).toHaveBeenCalledOnce(); expect(document.querySelector('a[download]')).toBeNull();
  });
  it('libera las URLs pendientes cuando se destruye la aplicación', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    TestBed.inject(FileDownloadService).save(new Blob(['file']), 'avance.xlsx');
    TestBed.resetTestingModule(); expect(revoke).toHaveBeenCalledWith('blob:test-download');
  });
});
