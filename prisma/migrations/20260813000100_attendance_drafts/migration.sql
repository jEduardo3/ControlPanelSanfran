ALTER TABLE "Activity"
ADD COLUMN "attendanceFinalized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "attendanceUpdatedAt" TIMESTAMP(3),
ADD COLUMN "attendanceUpdatedById" TEXT;

UPDATE "Activity" AS activity
SET
  "attendanceFinalized" = true,
  "attendanceUpdatedAt" = attendance_data."lastUpdatedAt",
  "attendanceUpdatedById" = attendance_data."registeredById"
FROM (
  SELECT DISTINCT ON ("activityId")
    "activityId",
    "updatedAt" AS "lastUpdatedAt",
    "registeredById"
  FROM "Attendance"
  ORDER BY "activityId", "updatedAt" DESC
) AS attendance_data
WHERE activity.id = attendance_data."activityId";

CREATE INDEX "Activity_attendanceUpdatedById_idx"
ON "Activity"("attendanceUpdatedById");

ALTER TABLE "Activity"
ADD CONSTRAINT "Activity_attendanceUpdatedById_fkey"
FOREIGN KEY ("attendanceUpdatedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
