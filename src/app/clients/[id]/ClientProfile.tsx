// @ts-nocheck
"use client";

import { useState } from "react";
import { useCanEdit } from "@/hooks/useCanEdit";
import { CanEditGate } from "@/components/CanEditGate";
import Link from "next/link";
import {
  User,
  Users,
  FileText,
  Calendar,
  Baby,
  FileStack,
  Activity,
  Plus,
} from "lucide-react";
import { HouseholdForm } from "./HouseholdForm";
import { PersonForm } from "./PersonForm";
import { RefundsTable } from "@/app/refunds/RefundsTable";
import { DocumentsSection } from "./DocumentsSection";
import { ChildrenSection } from "./ChildrenSection";
import { ImportantDatesSection } from "./ImportantDatesSection";
import { ActivitySection } from "./ActivitySection";
import { RefundQuestionnaireSection } from "./RefundQuestionnaireSection";
import { FileQuestion } from "lucide-react";
import { useQuestionnaireUnread } from "@/contexts/QuestionnaireUnreadContext";

const TABS = [
  { id: "info", label: "מידע ראשי", icon: User },
  { id: "household", label: "פרטים אישיים", icon: Users },
  { id: "children", label: "ילדים", icon: Baby },
  { id: "documents", label: "מסמכים", icon: FileStack },
  { id: "tax", label: "תיקי מס לפי שנה", icon: FileText },
  { id: "dates", label: "תאריכים חשובים", icon: Calendar },
  { id: "activity", label: "פעילות", icon: Activity },
  { id: "questionnaire", label: "שאלון החזר מס", icon: FileQuestion },
];

type Props = {
  household: {
    id: number;
    generalStatus: string | null;
    internalId: string | null;
    address: string | null;
    street: string | null;
    houseNumber: string | null;
    city: string | null;
    notes: string | null;
    cp: number | null;
    cp2: number | null;
    agent: { name: string | null } | null;
    clerk: { name: string | null } | null;
    persons: {
      id: number;
      role: string | null;
      firstName: string | null;
      lastName: string | null;
      idNumber: string | null;
      birthDate: Date | null;
      gender: string | null;
      phone: string | null;
      email: string | null;
      flags: string | null;
    }[];
    taxCases: {
      id: number;
      taxYear: number;
      dateSubmission: Date | null;
      amountRefund: number | null;
      dateRefund: Date | null;
      notes: string | null;
      status: { id: number; statusName: string | null; color: string | null } | null;
    }[];
    children: {
      id: number;
      firstName: string | null;
      lastName: string | null;
      childName: string | null;
      birthDay: Date | null;
      idNumber: string | null;
      gender: string | null;
      custodyOf: string | null;
      isDisabled: boolean | null;
      hasAdhd: boolean | null;
      phone: string | null;
      motherName: string | null;
      fatherName: string | null;
    }[];
    fileDocuments?: {
      id: number;
      customName: string | null;
      fileName: string | null;
      filePath: string | null;
      notes: string | null;
      documentCreatedAt: Date | null;
      uploadedAt: Date;
    }[];
    documents: {
      id: number;
      isAccepted: boolean | null;
      dateAccepted: Date | null;
      document: { documentName: string | null };
    }[];
  };
  agents: { agentId: number; name: string | null; cp: number | null; cp2: number | null }[];
  clerks: { clerkId: number; name: string | null }[];
  documents: { documentId: number; documentName: string | null }[];
  caseStatuses: { id: number; statusName: string | null; color: string | null }[];
  clientRefunds: {
    refundId: number;
    clientId: number;
    yearId: number;
    dateSubmission: Date | string | null;
    amountRefund: number | null;
    dateRefund: Date | string | null;
    paymentStatus: boolean | null;
    client: { clientId: number; clientName: string | null; lastName: string | null; cp2: number | null };
  }[];
  commissionByClientId: Record<number, number | null>;
};

export function ClientProfile({ household, agents, clerks, documents, caseStatuses, clientRefunds, commissionByClientId }: Props) {
  const [tab, setTab] = useState("info");
  const canEdit = useCanEdit();
  const { unreadHouseholdIds } = useQuestionnaireUnread();
  const questionnaireUnread = unreadHouseholdIds.has(household.id);

  const husband = household.persons.find((p) => p.role === "husband");
  const wife = household.persons.find((p) => p.role === "wife");
  const primary = husband ?? household.persons[0];
  const householdName = primary
    ? `${primary.firstName ?? ""} ${primary.lastName ?? ""}`.trim()
    : "—";
  const spouseName = wife ? `${wife.firstName ?? ""} ${wife.lastName ?? ""}`.trim() : null;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-xl font-bold text-ink-900">
          {householdName}
          {spouseName && (
            <span className="ms-2 font-normal text-ink-600">/ {spouseName}</span>
          )}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          מזהה פנימי: {household.internalId ?? "—"} • סוכן: {household.agent?.name ?? "—"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-ink-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-primary-50 text-primary-700"
                  : "text-ink-600 hover:bg-primary-50 hover:text-primary-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {t.id === "questionnaire" && questionnaireUnread ? (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                  title="שאלון חדש"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "info" && (
        <HouseholdForm
          household={household as any}
          agents={agents}
          clerks={clerks}
          readOnly={!canEdit}
        />
      )}

      {tab === "household" && (
        <PersonForm
          key={household.id}
          householdId={household.id}
          persons={household.persons}
          agents={agents}
          readOnly={!canEdit}
        />
      )}

      {tab === "tax" && (
        <div className="card overflow-hidden">
          <div className="border-b border-ink-200 bg-primary-50/40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-semibold text-ink-900">תיקי מס לפי שנה</h3>
            <CanEditGate>
              <Link
                href={`/refunds/new?client=${household.id}`}
                prefetch
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                הוסף החזר
              </Link>
            </CanEditGate>
          </div>
          <RefundsTable refunds={clientRefunds} commissionByClientId={commissionByClientId} />
        </div>
      )}

      {tab === "documents" && (
        <DocumentsSection
          householdId={household.id}
          documents={household.fileDocuments ?? []}
          readOnly={!canEdit}
        />
      )}

      {tab === "children" && (
        <ChildrenSection
          householdId={household.id}
          children={household.children}
          readOnly={!canEdit}
          fatherName={householdName}
          motherName={spouseName ?? ""}
        />
      )}

      {tab === "activity" && (
        <ActivitySection householdId={household.id} />
      )}

      {tab === "dates" && (
        <ImportantDatesSection householdId={household.id} readOnly={!canEdit} />
      )}

      {tab === "questionnaire" && (
        <RefundQuestionnaireSection householdId={household.id} household={household} />
      )}
    </div>
  );
}
