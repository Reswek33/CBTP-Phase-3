-- CreateEnum
CREATE TYPE "RfpWorkflow" AS ENUM ('STANDARD', 'TWO_ENVELOPE');

-- CreateEnum
CREATE TYPE "TechnicalStatus" AS ENUM ('PENDING', 'QUALIFIED', 'DISQUALIFIED');

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "technical_score" DECIMAL(5,2),
ADD COLUMN     "technical_status" "TechnicalStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "rfps" ADD COLUMN     "workflow" "RfpWorkflow" NOT NULL DEFAULT 'STANDARD';
