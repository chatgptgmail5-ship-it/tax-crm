const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const inPath = path.join(process.cwd(), "prisma", "sqlite-export.json");

const modelsInOrder = [
  "user",
  "tblAgent",
  "tblClerk",
  "tblDocument",
  "caseStatus",
  "household",
  "taxRefundQuestionnaire",
  "householdActivity",
  "householdImportantDate",
  "person",
  "taxCase",
  "taxCaseDocument",
  "householdDocument",
  "householdFileDocument",
  "householdChild",
  "tblStatus",
  "tblProcess",
  "tblClient",
  "generatedDocument",
  "tblChild",
  "tblDocClient",
  "tblRefund",
  "tblRefundSub",
];

async function main() {
  const payload = JSON.parse(fs.readFileSync(inPath, "utf8"));
  for (const model of modelsInOrder) {
    const rows = payload[model] || [];
    if (rows.length === 0) {
      console.log(`${model}: 0 (skip)`);
      continue;
    }
    const res = await prisma[model].createMany({
      data: rows,
      skipDuplicates: true,
    });
    console.log(`${model}: inserted ${res.count} / ${rows.length}`);
  }
}

main()
  .catch((e) => {
    console.error("Neon import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
