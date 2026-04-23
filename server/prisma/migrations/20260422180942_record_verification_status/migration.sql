-- AlterTable
ALTER TABLE "buyers" ADD COLUMN     "verificationStatus" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "verificationStatus" BOOLEAN DEFAULT false;
