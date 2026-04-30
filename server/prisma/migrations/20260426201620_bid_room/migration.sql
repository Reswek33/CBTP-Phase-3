-- CreateEnum
CREATE TYPE "BiddingType" AS ENUM ('PUBLIC', 'CLOSED');

-- CreateEnum
CREATE TYPE "BidRoomStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'CLOSED', 'CANCELLED', 'AWARDED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "invited_to_bid_room" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_eligible_for_bid_room" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "rfps" ADD COLUMN     "requiresApproval" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "bid_rooms" (
    "id" UUID NOT NULL,
    "rfp_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "biddingType" "BiddingType" NOT NULL DEFAULT 'PUBLIC',
    "status" "BidRoomStatus" NOT NULL DEFAULT 'SCHEDULED',
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "winning_bid_id" UUID,
    "awarded_at" TIMESTAMP(3),
    "awarded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_room_invitations" (
    "id" UUID NOT NULL,
    "bid_room_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "invited_by" UUID NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "bid_room_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_bids" (
    "id" UUID NOT NULL,
    "bid_room_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'ETB',
    "encrypted_amount" TEXT,
    "isBlindBid" BOOLEAN NOT NULL DEFAULT false,
    "bid_order" INTEGER,
    "previous_amount" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "room_bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_activity_logs" (
    "id" UUID NOT NULL,
    "bid_room_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "old_amount" DECIMAL(15,2),
    "new_amount" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bid_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bid_rooms_rfp_id_idx" ON "bid_rooms"("rfp_id");

-- CreateIndex
CREATE INDEX "bid_rooms_status_idx" ON "bid_rooms"("status");

-- CreateIndex
CREATE INDEX "bid_rooms_start_time_end_time_idx" ON "bid_rooms"("start_time", "end_time");

-- CreateIndex
CREATE INDEX "bid_room_invitations_bid_room_id_status_idx" ON "bid_room_invitations"("bid_room_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bid_room_invitations_bid_room_id_supplier_id_key" ON "bid_room_invitations"("bid_room_id", "supplier_id");

-- CreateIndex
CREATE INDEX "room_bids_bid_room_id_amount_idx" ON "room_bids"("bid_room_id", "amount");

-- CreateIndex
CREATE UNIQUE INDEX "room_bids_bid_room_id_supplier_id_key" ON "room_bids"("bid_room_id", "supplier_id");

-- CreateIndex
CREATE INDEX "bid_activity_logs_bid_room_id_created_at_idx" ON "bid_activity_logs"("bid_room_id", "created_at");

-- AddForeignKey
ALTER TABLE "bid_rooms" ADD CONSTRAINT "bid_rooms_rfp_id_fkey" FOREIGN KEY ("rfp_id") REFERENCES "rfps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_rooms" ADD CONSTRAINT "bid_rooms_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_rooms" ADD CONSTRAINT "bid_rooms_awarded_by_fkey" FOREIGN KEY ("awarded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_room_invitations" ADD CONSTRAINT "bid_room_invitations_bid_room_id_fkey" FOREIGN KEY ("bid_room_id") REFERENCES "bid_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_room_invitations" ADD CONSTRAINT "bid_room_invitations_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_room_invitations" ADD CONSTRAINT "bid_room_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_bids" ADD CONSTRAINT "room_bids_bid_room_id_fkey" FOREIGN KEY ("bid_room_id") REFERENCES "bid_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_bids" ADD CONSTRAINT "room_bids_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_activity_logs" ADD CONSTRAINT "bid_activity_logs_bid_room_id_fkey" FOREIGN KEY ("bid_room_id") REFERENCES "bid_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_activity_logs" ADD CONSTRAINT "bid_activity_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
