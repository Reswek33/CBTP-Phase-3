import bcrypt from "bcryptjs";
import "dotenv/config";

import { PrismaClient } from "./../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("1234567890", salt);

  console.log("--- Cleaning database ---");

  await prisma.verificationToken.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.systemLog.deleteMany();

  await prisma.buyerDocument.deleteMany();
  await prisma.supplierDocument.deleteMany();
  await prisma.rfpDocument.deleteMany();

  await prisma.bid.deleteMany();

  await prisma.rfp.deleteMany();

  await prisma.supplier.deleteMany();
  await prisma.buyer.deleteMany();

  await prisma.user.deleteMany();

  console.log("--- Seeding Users and Profiles ---");

  await prisma.user.create({
    data: {
      firstName: "System",
      lastName: "SUPERADMIN",
      username: "superadmin",
      email: "admin@system.com",
      passwordHash: passwordHash,
      role: "SUPERADMIN",
      isActive: true,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
