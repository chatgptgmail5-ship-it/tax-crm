import { prisma } from "@/lib/prisma";

/** Submitted questionnaires not yet opened in CRM (שאלון החזר מס tab). */
export async function getUnreadQuestionnaireHouseholdIds(): Promise<number[]> {
  const rows = await prisma.taxRefundQuestionnaire.findMany({
    where: {
      dateReceived: { not: null },
      isViewedInCRM: false,
    },
    select: { householdId: true },
  });
  return [...new Set(rows.map((r) => r.householdId))];
}
