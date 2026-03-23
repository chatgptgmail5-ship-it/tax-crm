/**
 * Exports the Prisma SQLite database to a backup file in /backups.
 * Backup filename: backup-YYYY-MM-DD.sql
 *
 * Requires: sqlite3 CLI available in PATH for .sql dump.
 * If sqlite3 is not available, copies the .db file to backups/backup-YYYY-MM-DD.db.
 *
 * Optional – run once per day with node-cron:
 *   npm install node-cron
 *   In a separate script or server: cron.schedule("0 2 * * *", () => { require("./backup-db"); });
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

function loadEnv(): void {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*DATABASE_URL\s*=\s*["']?(.+?)["']?\s*$/);
      if (match) {
        process.env.DATABASE_URL = match[1].trim();
        break;
      }
    }
  }
}

function main(): void {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith("file:")) {
    console.error("DATABASE_URL must be set and use file: (SQLite).");
    process.exit(1);
  }

  const dbPath = path.resolve(process.cwd(), url.replace(/^file:/, "").trim());
  if (!fs.existsSync(dbPath)) {
    console.error("Database file not found:", dbPath);
    process.exit(1);
  }

  const backupsDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10);
  const outFile = path.join(backupsDir, `backup-${dateStr}.sql`);

  try {
    execSync(`sqlite3 "${dbPath}" .dump > "${outFile}"`, {
      stdio: "inherit",
      shell: true,
    });
    console.log("Backup written:", outFile);
  } catch {
    const dbCopy = path.join(backupsDir, `backup-${dateStr}.db`);
    fs.copyFileSync(dbPath, dbCopy);
    console.log("sqlite3 CLI not available; copied DB to:", dbCopy);
    console.log("For .sql dumps, install sqlite3 and ensure it is in PATH.");
  }
}

main();
