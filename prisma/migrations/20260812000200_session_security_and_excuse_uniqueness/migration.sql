-- Security/session fields introduced after the existing Neon schema was baselined.
BEGIN;

ALTER TABLE "User"
  ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "passwordResetAt" TIMESTAMP(3);

-- This intentionally fails if historical duplicates exist. Check and resolve them
-- before deployment so no excuse data is deleted automatically.
CREATE UNIQUE INDEX "Excuse_userId_activityId_key" ON "Excuse"("userId", "activityId");

COMMIT;
