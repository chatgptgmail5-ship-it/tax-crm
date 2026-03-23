import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReportsManager } from "./ReportsManager";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await getServerSession(authOptions);
  return <ReportsManager />;
}

