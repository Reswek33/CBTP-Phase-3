/*
  Warnings:

  - A unique constraint covering the columns `[rfpId,buyerId,supplierId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Conversation_rfpId_buyerId_supplierId_key" ON "Conversation"("rfpId", "buyerId", "supplierId");
