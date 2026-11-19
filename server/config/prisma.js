import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

let prisma = null;

try {
  const adapter = new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/interviewpilot?schema=public",
  });
  prisma = new PrismaClient({ adapter });
} catch (err) {
  console.warn("[prisma.js] PrismaClient adapter notice:", err.message);
}

export default prisma;
