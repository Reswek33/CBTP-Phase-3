import { prisma } from "../../config/prisma.js";

export const cleanupDatabase = async () => {
  const now = new Date();

  const deletedTokens = await prisma.verificationToken.deleteMany({
    where: {
      expires: { lt: now },
    },
  });

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      isActive: false,
      createdAt: oneDayAgo,
    },
  });

  console.log(
    `[CLEANUP] Removed ${deletedTokens.count} tokens and ${deletedUsers.count} unverified users.`,
  );
};
