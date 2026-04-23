/*
  Warnings:

  - The `status` column on the `buyers` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BuyerStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "buyers" ADD COLUMN     "rejected_reason" TEXT,
ADD COLUMN     "verified_at" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "BuyerStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "buyer_documents" (
    "id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_by" UUID,
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "buyer_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "buyer_documents_buyer_id_idx" ON "buyer_documents"("buyer_id");

-- AddForeignKey
ALTER TABLE "buyer_documents" ADD CONSTRAINT "buyer_documents_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_documents" ADD CONSTRAINT "buyer_documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
