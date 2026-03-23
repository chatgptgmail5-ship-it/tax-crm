import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let instance = globalForPrisma.prisma ?? new PrismaClient();
// Dev: if cached client lacks TaxRefundQuestionnaire (schema changed, generate ran after server start), use fresh client
if (process.env.NODE_ENV !== "production" && typeof (instance as { taxRefundQuestionnaire?: unknown }).taxRefundQuestionnaire === "undefined") {
  instance = new PrismaClient();
}
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = instance;

export const prisma = instance;
