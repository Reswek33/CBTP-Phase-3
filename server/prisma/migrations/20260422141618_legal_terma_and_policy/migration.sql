-- AlterTable
ALTER TABLE "buyers" ADD COLUMN     "acceptLegalTerms" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "acceptLegalTerms" BOOLEAN DEFAULT false;
