"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";

const POLL_MS = 4000;

type State = {
  hasUnread: boolean;
  unreadHouseholdIds: number[];
  markViewed: (householdId: number) => Promise<void>;
  refresh: () => Promise<void>;
};

const QuestionnaireNotificationsContext = createContext<State | null>(null);

export function QuestionnaireNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadHouseholdIds, setUnreadHouseholdIds] = useState<number[]>([]);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/crm/questionnaire-notifications");
      if (!res.ok) return;
      const data = (await res.json()) as { hasUnread?: boolean; unreadHouseholdIds?: number[] };
      setHasUnread(Boolean(data.hasUnread));
      setUnreadHouseholdIds(Array.isArray(data.unreadHouseholdIds) ? data.unreadHouseholdIds : []);
    } catch {
      /* ignore */
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [status, refresh]);

  const markViewed = useCallback(
    async (householdId: number) => {
      if (status !== "authenticated") return;
      try {
        const res = await fetch("/api/crm/questionnaire-notifications/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ householdId }),
        });
        if (res.ok) await refresh();
      } catch {
        /* ignore */
      }
    },
    [status, refresh]
  );

  const value = useMemo(
    () => ({
      hasUnread,
      unreadHouseholdIds,
      markViewed,
      refresh,
    }),
    [hasUnread, unreadHouseholdIds, markViewed, refresh]
  );

  return (
    <QuestionnaireNotificationsContext.Provider value={value}>{children}</QuestionnaireNotificationsContext.Provider>
  );
}

export function useQuestionnaireNotifications(): State {
  const ctx = useContext(QuestionnaireNotificationsContext);
  if (!ctx) {
    throw new Error("useQuestionnaireNotifications must be used within QuestionnaireNotificationsProvider");
  }
  return ctx;
}
