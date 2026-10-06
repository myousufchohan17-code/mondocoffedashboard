import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@mondo.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const restaurantSlug = process.env.ADMIN_RESTAURANT_SLUG || "MondoCoffee";
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!password || password.length < 8) {
    throw new Error("Set ADMIN_PASSWORD to a value of at least 8 characters.");
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    select: { id: true },
  });

  if (!restaurant) {
    throw new Error(
      `Restaurant "${restaurantSlug}" was not found. Set ADMIN_RESTAURANT_SLUG to an existing restaurant slug.`
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name,
      role: "ADMIN",
      active: true,
      restaurantId: restaurant.id,
    },
    update: {
      passwordHash,
      name,
      role: "ADMIN",
      active: true,
      restaurantId: restaurant.id,
    },
  });

  console.log(`Admin account provisioned for ${email}.`);
}

main()
  .catch((error: unknown) => {
    const message =
      error instanceof Error
        ? error.message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[database URL redacted]")
        : "Unknown error.";
    console.error(`Admin account provisioning failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
