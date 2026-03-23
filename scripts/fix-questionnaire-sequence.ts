/**
 * Fixes TaxRefundQuestionnaire id sequence when it's out of sync.
 * Run if you get "Unique constraint failed on (id)" on create().
 *
 * Usage: npx ts-node scripts/fix-questionnaire-sequence.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"TaxRefundQuestionnaire"', 'id'),
      COALESCE((SELECT MAX(id) + 1 FROM "TaxRefundQuestionnaire"), 1),
      false
    );
  `);
  console.log("TaxRefundQuestionnaire id sequence reset successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
