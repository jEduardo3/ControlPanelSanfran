# Sistema de Tesorería

Aplicación interna para administrar usuarios, actividades, asistencia, excusas, obligaciones financieras, pagos y reportes de una hermandad.

## Tecnologías

- Next.js 14, React 18 y TypeScript
- Prisma ORM y PostgreSQL
- Autenticación mediante JWT en cookie HTTP-only
- Nodemailer para notificaciones
- `pdf-lib` para comprobantes de pago

## Preparación local

1. Instala Node.js 20+ y npm 10+.
2. Copia `.env.example` como `.env` y reemplaza todos los secretos.
3. Levanta PostgreSQL con `docker compose up -d`, o configura otra base PostgreSQL.
4. Ejecuta:

```bash
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

`SEED_PASSWORD` debe tener al menos 12 caracteres. El seed crea las cuentas `admin@tesoreria.com`, `colaborador@tesoreria.com` y `junta@tesoreria.com` usando esa contraseña y nunca la imprime.

## Variables de entorno

- `DATABASE_URL`: conexión PostgreSQL.
- `JWT_SECRET`: secreto aleatorio de al menos 24 caracteres (se recomiendan 32 o más).
- `APP_NAME`: nombre visible de la aplicación.
- `APP_BASE_URL`: URL pública usada en los correos.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: configuración de correo.
- `SEED_PASSWORD`: contraseña inicial utilizada solamente por el seed.

## Roles y permisos

El sistema incluye los roles `SUPERADMIN`, `ADMIN_GENERAL`, `JUNTA`, `TESORERIA`, `SECRETARIA` y `COLABORADOR`. Las API verifican permisos granulares y distinguen entre acceso general y acceso a información propia.

Los cambios de rol, permisos, contraseña o estado de una cuenta invalidan o actualizan inmediatamente el acceso de sus sesiones.

## Archivos de excusas

Los archivos nuevos se guardan en `data/uploads/excuses`, que no debe versionarse ni exponerse como contenido estático. Las descargas pasan por una ruta autenticada. En producción se recomienda montar almacenamiento persistente o sustituirlo por almacenamiento privado compatible con S3.

Antes de actualizar una instalación que anteriormente guardaba archivos bajo `public/uploads/excuses`, mueve esos archivos a `data/uploads/excuses`. Las URL históricas siguen funcionando mediante una ruta autenticada.

## Comandos de verificación

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Migraciones

Las instalaciones nuevas deben usar `npx prisma migrate deploy` y después ejecutar el seed. Si una base existente fue modificada previamente con `prisma db push`, compara primero su estructura con `prisma migrate diff`; no marques ni ejecutes migraciones a ciegas sobre producción.
