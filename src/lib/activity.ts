import { prisma } from "@/lib/prisma";

export async function logHouseholdActivity(
  householdId: number,
  action: string,
  description: string | null
) {
  try {
    await prisma.householdActivity.create({
      data: { householdId, action, description },
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}
