-- Upgrade the original MVP schema to the current role/permission model.
CREATE TYPE "SystemRoleCode" AS ENUM ('SUPERADMIN', 'ADMIN_GENERAL', 'JUNTA', 'TESORERIA', 'SECRETARIA', 'COLABORADOR');
CREATE TYPE "PermissionModule" AS ENUM ('USERS', 'ROLES', 'PERMISSIONS', 'DASHBOARD', 'ACTIVITIES', 'ATTENDANCE', 'EXCUSES', 'TREASURY', 'OBLIGATIONS', 'PAYMENTS', 'REPORTS', 'SETTINGS');
ALTER TYPE "Role" RENAME TO "LegacyRole";

CREATE TABLE "Role" (
  "id" TEXT NOT NULL,
  "code" "SystemRoleCode" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE INDEX "Role_isActive_idx" ON "Role"("isActive");

CREATE TABLE "Permission" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "module" "PermissionModule" NOT NULL,
  "action" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");
CREATE INDEX "Permission_module_idx" ON "Permission"("module");
CREATE INDEX "Permission_action_idx" ON "Permission"("action");

CREATE TABLE "RolePermission" (
  "id" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

CREATE TABLE "UserPermission" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "granted" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "UserPermission"("userId", "permissionId");
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");
CREATE INDEX "UserPermission_permissionId_idx" ON "UserPermission"("permissionId");

CREATE TABLE "ActivityAssignment" (
  "id" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ActivityAssignment_activityId_userId_key" ON "ActivityAssignment"("activityId", "userId");
CREATE INDEX "ActivityAssignment_activityId_idx" ON "ActivityAssignment"("activityId");
CREATE INDEX "ActivityAssignment_userId_idx" ON "ActivityAssignment"("userId");

INSERT INTO "Role" ("id", "code", "name", "description", "updatedAt") VALUES
('system-role-superadmin', 'SUPERADMIN', 'Superadministrador', 'Superadministrador', CURRENT_TIMESTAMP),
('system-role-admin-general', 'ADMIN_GENERAL', 'Administrador general', 'Administrador general', CURRENT_TIMESTAMP),
('system-role-junta', 'JUNTA', 'Junta', 'Junta', CURRENT_TIMESTAMP),
('system-role-tesoreria', 'TESORERIA', 'Tesorería', 'Tesorería', CURRENT_TIMESTAMP),
('system-role-secretaria', 'SECRETARIA', 'Secretaría', 'Secretaría', CURRENT_TIMESTAMP),
('system-role-colaborador', 'COLABORADOR', 'Colaborador', 'Colaborador', CURRENT_TIMESTAMP);

ALTER TABLE "User"
  ADD COLUMN "username" TEXT,
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "roleId" TEXT;

UPDATE "User" SET
  "username" = regexp_replace(split_part("email", '@', 1), '[^a-zA-Z0-9_.-]', '', 'g') || '-' || substr("id", 1, 8),
  "roleId" = CASE WHEN "role" = 'ADMIN'::"LegacyRole" THEN 'system-role-superadmin' ELSE 'system-role-colaborador' END;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_roleId_idx" ON "User"("roleId");
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" DROP COLUMN "role";
DROP TYPE "LegacyRole";

ALTER TABLE "Attendance" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Excuse"
  ADD COLUMN "attachmentUrl" TEXT,
  ADD COLUMN "attachmentName" TEXT,
  ADD COLUMN "attachmentMimeType" TEXT;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityAssignment" ADD CONSTRAINT "ActivityAssignment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityAssignment" ADD CONSTRAINT "ActivityAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
