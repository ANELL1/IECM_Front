# Inicio rápido

Requisitos: Node 22.13+ dentro de la rama 22, pnpm 12.15.0 y MySQL 8.4 disponible (instancia comprobada: 8.4.13).

## Backend

```sh
cd iecm-backend
pnpm install --frozen-lockfile
cp .env.example .env
```

Completar .env con DB_HOST, DB_PORT (3306), DB_NAME, DB_USER y DB_PASSWORD reales. Si .env ya existe, conservarlo. La API solo consulta: no crea tablas ni carga datos al arrancar. Si faltan las tablas, una cuenta de carga puede ejecutar `iecm-backend/database/03_Base_Datos_MySQL.sql` una sola vez sobre una base de pruebas preparada para ello. No ejecutar el script original de SQL Server en MySQL.

```sh
pnpm test:db
pnpm dev
```

`http://127.0.0.1:3000/api/health` debe responder success:true y database:connected. El usuario de ejecución de la API solo necesita lectura.

## Frontend (otra terminal)

```sh
cd iecm-frontend
pnpm install --frozen-lockfile
pnpm start
```

Abrir http://localhost:4200. Reiniciar un servidor que ya estuviera abierto antes de los cambios del proxy.

## Pruebas del frontend

Desde `iecm-frontend`, sin backend ni MySQL para las pruebas de Angular:

```sh
pnpm typecheck
pnpm test:ci
pnpm build
```

La comprobación visual es independiente: con Angular iniciado, ejecutar `pnpm verify:browser`. Para revisar pantallas con datos debe estar disponible la API. Usa Chrome instalado y un perfil temporal; admite CHROME_PATH y FRONTEND_URL.

## Pruebas del backend

Desde `iecm-backend`:

```sh
pnpm test:unit
pnpm test:integration
pnpm test:db
pnpm test:api
```

Las dos primeras no necesitan MySQL. `test:db` requiere la base real con los datos de prueba. `test:api` requiere además el backend iniciado y valida los reportes con ExcelJS/PDF.js del propio backend; guarda evidencia en `iecm-backend/artifacts/api`. Admite API_BASE_URL y no requiere Angular.

Consultar docs/ENTREGA.md para la evidencia ejecutada. No existe un modo demo que suplante a la base en ejecución.
