import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUnreadQuestionnaireHouseholdIds } from "@/lib/questionnaire-unread";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const householdIds = await getUnreadQuestionnaireHouseholdIds();
    return NextResponse.json({ count: householdIds.length, householdIds });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
