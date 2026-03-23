const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const outPath = path.join(process.cwd(), "prisma", "sqlite-export.json");

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
  const payload = {};
  for (const model of modelsInOrder) {
    const rows = await prisma[model].findMany();
    payload[model] = rows;
    console.log(`${model}: ${rows.length}`);
  }
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Export written to ${outPath}`);
}

main()
  .catch((e) => {
    console.error("SQLite export failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
