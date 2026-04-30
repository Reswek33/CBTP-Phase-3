import { PrismaClient, Currency } from "./../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("--- Seeding Subscription Plans ---");

  const plans = [
    {
      name: "Basic",
      description:
        "Essential tools for small businesses starting their bidding journey.",
      price: 500,
      currency: Currency.ETB,
      durationDays: 30,
      features: [
        "Up to 5 active bids per month",
        "Basic RFP search and filters",
        "Email notifications for new RFPs",
        "Standard support",
      ],
    },
    {
      name: "Professional",
      description:
        "Advanced features for growing companies looking to scale their operations.",
      price: 1500,
      currency: Currency.ETB,
      durationDays: 30,
      features: [
        "Unlimited active bids",
        "Priority access to Bid Rooms",
        "Advanced analytics and reporting",
        "Instant SMS notifications",
        "Priority email support",
      ],
    },
    {
      name: "Enterprise",
      description:
        "Customized solutions for large organizations requiring maximum efficiency.",
      price: 5000,
      currency: Currency.ETB,
      durationDays: 365,
      features: [
        "Everything in Professional",
        "Dedicated account manager",
        "Custom integration support",
        "Bulk RFP creation tools",
        "Early access to beta features",
        "24/7 Phone support",
      ],
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  console.log("--- Seeding complete ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
