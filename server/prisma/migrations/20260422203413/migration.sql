/*
  Warnings:

  - You are about to drop the column `industrySector` on the `buyers` table. All the data in the column will be lost.
  - Made the column `acceptLegalTerms` on table `buyers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "buyers" DROP COLUMN "industrySector",
ADD COLUMN     "industry_sector" TEXT,
ALTER COLUMN "acceptLegalTerms" SET NOT NULL;
