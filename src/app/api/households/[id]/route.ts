import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { logHouseholdActivity } from "@/lib/activity";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const householdId = parseInt(id, 10);
    if (isNaN(householdId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        agent: true,
        clerk: true,
        persons: true,
        taxCases: { include: { status: true } },
        children: true,
        documents: { include: { document: true } },
      },
    });

    if (!household) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
    return NextResponse.json(household);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "שגיאה בטעינה" }, { status: 500 });
  }
}

function parseDate(val: unknown): Date | null {
  if (val == null || val === "") return null;
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? null : d;
}

function parseIntOrNull(val: unknown): number | null {
  if (val == null || val === "") return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const householdId = parseInt(id, 10);
    if (isNaN(householdId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    const body = await req.json();
    if ("clerkName" in body) {
      const clerkName = body.clerkName != null ? String(body.clerkName).trim() : "";
      if (clerkName) {
        const existingClerk = await prisma.tblClerk.findFirst({ where: { name: clerkName } });
        const clerkId =
          existingClerk?.clerkId ??
          (
            await prisma.tblClerk.create({
              data: { name: clerkName },
            })
          ).clerkId;
        body.clerkId = clerkId;
      } else {
        body.clerkId = null;
      }
    }

    const householdData: Record<string, unknown> = {};
    if ("agentId" in body) householdData.agentId = parseIntOrNull(body.agentId);
    if ("clerkId" in body) householdData.clerkId = parseIntOrNull(body.clerkId);
    if ("generalStatus" in body) householdData.generalStatus = body.generalStatus ?? null;
    if ("address" in body) householdData.address = body.address ?? null;
    if ("street" in body) householdData.street = body.street ?? null;
    if ("houseNumber" in body) householdData.houseNumber = body.houseNumber ?? null;
    if ("city" in body) householdData.city = body.city ?? null;
    if ("notes" in body) householdData.notes = body.notes ?? null;
    if ("internalId" in body) householdData.internalId = body.internalId ?? null;
    if ("cp" in body) {
      const n = body.cp != null && body.cp !== "" ? parseFloat(String(body.cp)) : NaN;
      householdData.cp = Number.isNaN(n) ? null : n;
    }
    if ("cp2" in body) {
      const n = body.cp2 != null && body.cp2 !== "" ? parseFloat(String(body.cp2)) : NaN;
      householdData.cp2 = Number.isNaN(n) ? null : n;
    }

    if (Object.keys(householdData).length > 0) {
      await prisma.household.update({
        where: { id: householdId },
        data: householdData,
      });
    }

    if (Array.isArray(body.persons)) {
      const currentPersons = await prisma.person.findMany({
        where: { householdId },
        select: { id: true },
      });
      const validPersonIds = new Set(currentPersons.map((x) => x.id));

      for (const p of body.persons) {
        const personId = p.id != null && p.id !== "" ? parseInt(String(p.id), 10) : null;
        const isValidId = personId != null && !Number.isNaN(personId) && personId > 0;

        if (isValidId && validPersonIds.has(personId)) {
          await prisma.person.update({
            where: { id: personId },
            data: {
              firstName: p.firstName ?? null,
              lastName: p.lastName ?? null,
              idNumber: p.idNumber ?? null,
              birthDate: parseDate(p.birthDate),
              gender: p.gender ?? null,
              phone: p.phone ?? null,
              email: p.email ?? null,
              flags: (p.flags as string) ?? null,
            },
          });
        } else if (!isValidId) {
          const created = await prisma.person.create({
            data: {
              householdId,
              role: p.role ?? null,
              firstName: p.firstName ?? null,
              lastName: p.lastName ?? null,
              idNumber: p.idNumber ?? null,
              birthDate: parseDate(p.birthDate),
              gender: p.gender ?? null,
              phone: p.phone ?? null,
              email: p.email ?? null,
              flags: (p.flags as string) ?? null,
            },
          });
          validPersonIds.add(created.id);
        } else {
          return NextResponse.json(
            { error: "מזהה אדם לא שייך למשק בית זה" },
            { status: 400 }
          );
        }
      }
    }

    const didUpdate =
      Object.keys(householdData).length > 0 || Array.isArray(body.persons);
    if (didUpdate) {
      if (householdData.generalStatus != null)
        await logHouseholdActivity(householdId, "status_changed", "שונה סטטוס");
      else
        await logHouseholdActivity(householdId, "client_updated", "עודכנו פרטי לקוח");
    }

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: { agent: true, clerk: true, persons: true },
    });
    return NextResponse.json(household);
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "עדכון נכשל";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const householdId = parseInt(id, 10);
    if (isNaN(householdId)) return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
    await prisma.household.delete({ where: { id: householdId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "מחיקה נכשלה" }, { status: 500 });
  }
}
