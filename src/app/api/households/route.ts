import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireCanEdit } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { logHouseholdActivity } from "@/lib/activity";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const showDeleted = searchParams.get("deleted") === "1" || searchParams.get("deleted") === "true";

    // Auto cleanup: permanently delete households that have been in the recycle bin for 30+ days.
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await (prisma.household as any).deleteMany({
      where: {
        deletedAt: { not: null, lt: cutoff },
      },
    });

    const households = await prisma.household.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { internalId: { contains: q } },
                { persons: { some: { firstName: { contains: q } } } },
                { persons: { some: { lastName: { contains: q } } } },
                { persons: { some: { idNumber: { contains: q } } } },
                { persons: { some: { phone: { contains: q } } } },
                { persons: { some: { email: { contains: q } } } },
              ],
            }
          : {}),
        ...(showDeleted ? { deletedAt: { not: null } } : { deletedAt: null }),
      } as any,
      orderBy: { createdAt: "desc" },
      include: {
        agent: { select: { name: true } },
        persons: {
          select: {
            id: true,
            role: true,
            firstName: true,
            lastName: true,
            idNumber: true,
            phone: true,
            email: true,
            flags: true,
          },
        },
      },
    });

    return NextResponse.json(households);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "שגיאה בטעינת לקוחות" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireCanEdit(session?.user?.role)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  const body = await req.json();
  const createData = {
    agentId: body.agentId ?? null,
    clerkId: body.clerkId ?? null,
    generalStatus: body.generalStatus ?? null,
    address: body.address ?? null,
    street: body.street ?? null,
    houseNumber: body.houseNumber ?? null,
    city: body.city ?? null,
    notes: body.notes ?? null,
    internalId: body.internalId ?? null,
    cp: body.cp ?? null,
    cp2: body.cp2 ?? null,
    persons: body.persons?.length
      ? {
          create: body.persons.map((p: Record<string, unknown>) => ({
            role: p.role ?? null,
            firstName: p.firstName ?? null,
            lastName: p.lastName ?? null,
            idNumber: p.idNumber ?? null,
            birthDate: p.birthDate ? new Date(p.birthDate as string) : null,
            gender: p.gender ?? null,
            phone: p.phone ?? null,
            email: p.email ?? null,
            flags: (p.flags as string) ?? null,
          })),
        }
      : undefined,
  };
  try {
    const household = await prisma.household.create({
      data: createData,
      include: { persons: true },
    });
    await logHouseholdActivity(household.id, "client_created", "נוצר לקוח חדש");
    return NextResponse.json(household);
  } catch (e) {
    console.error("Household create failed:", e);
    const known = e as Prisma.PrismaClientKnownRequestError;
    const target = Array.isArray(known.meta?.target) ? known.meta.target : [];
    const isHouseholdIdConflict = known.code === "P2002" && target.includes("id");
    if (isHouseholdIdConflict) {
      try {
        // Repair out-of-sync Postgres sequence, then retry once.
        await prisma.$executeRawUnsafe(`
          SELECT setval(
            pg_get_serial_sequence('"Household"', 'id'),
            COALESCE((SELECT MAX(id) + 1 FROM "Household"), 1),
            false
          );
        `);
        const household = await prisma.household.create({
          data: createData,
          include: { persons: true },
        });
        await logHouseholdActivity(household.id, "client_created", "נוצר לקוח חדש");
        return NextResponse.json(household);
      } catch (retryError) {
        console.error("Household create retry after sequence fix failed:", retryError);
      }
    }
    return NextResponse.json({ error: "יצירת משק בית נכשלה" }, { status: 500 });
  }
}
