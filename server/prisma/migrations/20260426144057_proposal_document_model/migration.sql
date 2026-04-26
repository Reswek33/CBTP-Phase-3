-- CreateEnum
CREATE TYPE "ProposalDocumentStatus" AS ENUM ('REJECTED', 'APPROVED', 'PENDING');

-- CreateTable
CREATE TABLE "proposal_documents" (
    "id" UUID NOT NULL,
    "bid_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "status" "ProposalDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proposal_documents_bid_id_idx" ON "proposal_documents"("bid_id");

-- AddForeignKey
ALTER TABLE "proposal_documents" ADD CONSTRAINT "proposal_documents_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;
