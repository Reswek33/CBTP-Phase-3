-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "user_agent" TEXT;

-- AlterTable
ALTER TABLE "system_logs" ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "user_agent" TEXT;
