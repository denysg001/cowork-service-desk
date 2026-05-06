import bcrypt from "bcrypt";
import { prisma } from "../src/db/prisma.js";

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!ChangeMe", 12);
  await prisma.user.upsert({
    where: { email: "admin@cowork.local" },
    update: {},
    create: {
      email: "admin@cowork.local",
      name: "Service Desk Admin",
      role: "ADMIN",
      passwordHash
    }
  });
}

main().finally(async () => prisma.$disconnect());
