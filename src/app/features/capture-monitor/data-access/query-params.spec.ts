import { actaParams, monitorParams, reportParams } from './query-params';
describe('Parámetros de la API', () => {
  it('omite Todos', () => expect(monitorParams({}).keys()).toEqual([]));
  it('serializa IDs', () => expect(monitorParams({ distritoId: 2, tipoEleccionId: 3 }).toString()).toBe('distritoId=2&tipoEleccionId=3'));
  it.each([0, -1, 1.5, NaN, 2147483648])('rechaza ID %s', distritoId => expect(() => monitorParams({ distritoId })).toThrow());
  it('respeta valores predeterminados de paginación', () => expect(actaParams({}).toString()).toBe('pagina=1&limite=25'));
  it('rechaza páginas y límites inválidos', () => { expect(() => actaParams({ pagina: 0 })).toThrow(); expect(() => actaParams({ limite: 101 })).toThrow(); });
  it('exporta por corte sin filtros adicionales', () => {
    const corteId = '00000000-0000-4000-8000-000000000001';
    expect(reportParams({ corteId }).toString()).toBe(`corteId=${corteId}`);
    expect(() => reportParams({ corteId: 'invalid' })).toThrow();
  });
});
