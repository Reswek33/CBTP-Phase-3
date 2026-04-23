-- AlterTable
ALTER TABLE "buyers" ADD COLUMN     "company_type" TEXT,
ADD COLUMN     "tax_id" TEXT;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "businessType" TEXT;
