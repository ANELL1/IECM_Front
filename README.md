# IECM · Monitor de avance de captura

Aplicación Angular para consultar el avance de actas por distrito y tipo de elección, visualizar indicadores y gráficas y descargar reportes generados por el backend.

## Requisitos y versiones

- Node.js **22.22.3 o superior dentro de la rama 22**, compatible con el Angular instalado. `.nvmrc` selecciona la rama 22; entorno utilizado: 22.23.3.
- **pnpm 12.15.0**, único gestor de paquetes del proyecto.
- Versiones del lockfile: Angular **22.2.5**, Angular CLI/build **22.2.6**, TypeScript **6.0.3**, RxJS **7.8.2** y Vitest **5.1.0**.
- Backend IECM disponible para consultar datos y descargar reportes. Angular consume la API; no se conecta directamente a MySQL.

## Instalación

Desde `iecm-frontend`:

```sh
pnpm install --frozen-lockfile
```

Consultar el [README del backend](../iecm-backend/README.md) para preparar e iniciar la API.

## Configuración

El frontend no utiliza `.env` ni variables de entorno para configurar la aplicación. Carga y valida el archivo público `public/app-config.json` al iniciar:

```json
{
  "apiBaseUrl": "/api",
  "refreshIntervalMs": 30000
}
```

| Propiedad | Descripción |
|---|---|
| `apiBaseUrl` | Ruta absoluta del mismo origen o URL HTTP/HTTPS de la API, sin credenciales, parámetros ni fragmentos. |
| `refreshIntervalMs` | Actualización del dashboard en milisegundos. Valor actual: 30000; rango permitido: 5000–300000. |

No incluir contraseñas, tokens ni credenciales de base de datos: esta configuración es visible en el navegador.

En desarrollo, `proxy.conf.json` reenvía `/api/**` a `http://127.0.0.1:3000`. Reiniciar Angular si se modifica el proxy. En producción, configurar un proxy inverso para `/api` o una URL absoluta con CORS en el backend. El servidor web debe resolver las rutas Angular mediante `index.html`; el proxy de desarrollo no forma parte del build.

## Comandos de ejecución

Ejecutar desde `iecm-frontend`:

| Comando | Propósito |
|---|---|
| `pnpm start` | Servidor de desarrollo en `http://localhost:4200`. |
| `pnpm build` | Compilación de producción en `dist/iecm-frontend/browser/`. |
| `pnpm watch` | Compilación continua de desarrollo. |
| `pnpm typecheck` | Verificación del tipado de la aplicación. |
| `pnpm test` | Pruebas Angular en modo continuo. |
| `pnpm test:ci` | Pruebas Angular en una ejecución. |
| `pnpm verify:browser` | Comprobación visual con Chrome y generación de capturas. |

Las pruebas Angular usan dobles HTTP y no requieren backend ni MySQL. Las pruebas de API, base de datos y contenido de reportes pertenecen al backend.

La comprobación visual requiere Angular y Chrome; para revisar pantallas con datos también necesita la API. Solo este script admite `FRONTEND_URL` (predeterminado: `http://localhost:4200`) y `CHROME_PATH` (predeterminado: ruta de Google Chrome en macOS). No son variables de configuración de la aplicación.

## Endpoints HTTP utilizados por Angular

Todas las solicitudes son `GET`. Rutas con la configuración predeterminada `/api`:

| Endpoint | Uso |
|---|---|
| `/api/catalogos` | Opciones de distrito y tipo de elección. |
| `/api/monitor` | Indicadores, gráficas y detalle agregado en un mismo corte. |
| `/api/actas` | Actas individuales con filtros y paginación del servidor. |
| `/api/reportes/xlsx` | Descarga de Excel. |
| `/api/reportes/pdf` | Descarga de PDF. |

Los servicios HTTP también implementan `/api/health`, `/api/resumen`, `/api/estadisticas/distritos`, `/api/estadisticas/elecciones` y `/api/detalle`. Las pantallas actuales obtienen los agregados mediante `/api/monitor`; el verificador de navegador consulta `/api/health`.

Filtros comunes: `distritoId` y `tipoEleccionId`; «Todos» omite el parámetro. Actas añade `estado` (`Capturada` o `Pendiente`), `pagina` y `limite` (máximo 100). Las descargas envían el `corteId` del dashboard para conservar filtros y totales, sin combinarlo con filtros adicionales.

## Decisiones técnicas relevantes

- Componentes standalone, organización por funcionalidades, rutas con carga diferida, TypeScript estricto y SCSS.
- Signals para estado de pantalla y RxJS para peticiones, cancelación y actualización automática del dashboard cada 30 segundos por defecto.
- HttpClient con servicios tipados e interceptor centralizado de errores; estados de carga, error y resultados vacíos.
- Gráficas SVG sin bibliotecas adicionales. Indicadores y porcentajes procedentes del backend, presentados con dos decimales.
- Excel/PDF generados por Node.js y descargados como Blob. Búsqueda y paginación locales en la tabla agregada; paginación de servidor en actas.
- Diseño responsive, navegación por teclado y semáforo con texto además de color: rojo < 50%, amarillo de 50% a < 80% y verde ≥ 80%.

## Declaración de uso de inteligencia artificial

Se utilizó OpenAI Codex como apoyo para el diseño técnico, la implementación de componentes, servicios y documentación.