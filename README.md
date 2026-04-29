# Sistema de Tesorería - Proyecto demo

Proyecto base en **Next.js + Prisma + PostgreSQL** para una tarea académica.

## Incluye
- Login demo con JWT
- CRUD de usuarios
- CRUD de actividades
- Registro de asistencia por API
- Creación de obligaciones financieras
- Registro de pagos
- Envío de excusas por API
- Dashboard con datos reales de la base

## Tecnologías
- Next.js 14
- React 18
- TypeScript
- Prisma ORM
- PostgreSQL
- Docker Compose

## 1. Requisitos
- Node.js 20+
- npm 10+
- Docker Desktop

## 2. Clonar o descomprimir el proyecto
Si lo recibes zip, descomprímelo y entra a la carpeta.

```bash
cd tesoreria-system
```

## 3. Crear variables de entorno
Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Si estás en Windows PowerShell:

```powershell
copy .env.example .env
```

## 4. Levantar PostgreSQL con Docker

```bash
docker compose up -d
```

Verifica que el contenedor quedó arriba:

```bash
docker ps
```

Debe aparecer `tesoreria_postgres`.

## 5. Instalar dependencias

```bash
npm install
```

## 6. Generar cliente Prisma

```bash
npm run prisma:generate
```

## 7. Crear migración inicial

```bash
npx prisma migrate dev --name init
```

## 8. Cargar datos demo

```bash
npm run seed
```

Usuarios de prueba:
- Admin: `admin@tesoreria.com` / `Admin123*`
- Colaborador: `colaborador@tesoreria.com` / `Colab123*`

## 9. Levantar el proyecto

```bash
npm run dev
```

Abrir en el navegador:

```text
http://localhost:3000
```

## 10. Rutas principales
- `/` Inicio
- `/login` Login demo
- `/dashboard` Dashboard
- `/users` Gestión de usuarios
- `/activities` Gestión de actividades
- `/treasury` Gestión de obligaciones

## 11. Endpoints API
- `POST /api/auth/login`
- `GET/POST /api/users`
- `GET/POST /api/activities`
- `POST /api/attendance/register`
- `GET/POST /api/obligations`
- `GET/POST /api/payments`
- `GET/POST /api/excuses`

## 12. Cómo presentarlo
Puedes explicar así:
1. Se levantó PostgreSQL con Docker.
2. Se modeló la base con Prisma.
3. Se creó un sistema con roles ADMIN y COLABORADOR.
4. El admin puede crear usuarios, actividades y obligaciones.
5. El sistema registra pagos y asistencia.
6. El colaborador puede consultar información y enviar excusas.

## 13. Notas
- Es un MVP funcional pensado para entregar tarea.
- La autenticación está simplificada con JWT devuelto por la API.
- No incluye protección completa por middleware de sesión en frontend.
- Se puede ampliar con reportes PDF, correos y permisos más estrictos.
