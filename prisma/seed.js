const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Migrate existing users: isAdmin=true -> role='admin'
  await prisma.user.updateMany({
    where: { isAdmin: true },
    data: { role: "admin" },
  });
  // Case statuses for tax cases (new CRM structure)
  const caseStatusCount = await prisma.caseStatus.count();
  if (caseStatusCount === 0) {
    await prisma.caseStatus.createMany({
      data: [
        { statusName: "חדש", color: "slate" },
        { statusName: "חסרים מסמכים", color: "amber" },
        { statusName: "בבדיקה", color: "blue" },
        { statusName: "מוכן להגשה", color: "cyan" },
        { statusName: "הוגש למס הכנסה", color: "violet" },
        { statusName: "הסתיים", color: "green" },
        { statusName: "בוטל", color: "red" },
      ],
    });
  }

  const statusCount = await prisma.tblStatus.count();
  if (statusCount === 0) {
    await prisma.tblStatus.createMany({
      data: [
        { statusName: "ממתין" },
        { statusName: "הוגש" },
        { statusName: "אושר" },
        { statusName: "שולם" },
        { statusName: "נדחה" },
      ],
    });
  }

  const docCount = await prisma.tblDocument.count();
  if (docCount === 0) {
    await prisma.tblDocument.createMany({
      data: [
        { documentName: "תעודת זהות" },
        { documentName: "דוח מס" },
        { documentName: "דפוס בנק" },
        { documentName: "הצהרת הכנסה" },
      ],
    });
  }

  const procCount = await prisma.tblProcess.count();
  if (procCount === 0) {
    await prisma.tblProcess.createMany({
      data: [
        { processName: "בדיקה ראשונית" },
        { processName: "איסוף מסמכים" },
        { processName: "הגשה" },
        { processName: "מעקב" },
      ],
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
