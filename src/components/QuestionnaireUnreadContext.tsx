"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Ctx = {
  unreadHouseholdIds: ReadonlySet<number>;
  unreadCount: number;
  refresh: () => void;
};

const QuestionnaireUnreadContext = createContext<Ctx | null>(null);

const POLL_MS = 4000;

export function QuestionnaireUnreadProvider({ children }: { children: ReactNode }) {
  const [householdIds, setHouseholdIds] = useState<number[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/questionnaire/unread");
      if (!res.ok) return;
      const data = (await res.json()) as { householdIds?: unknown };
      const ids = Array.isArray(data.householdIds)
        ? data.householdIds.filter((x): x is number => typeof x === "number")
        : [];
      setHouseholdIds(ids);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const value = useMemo<Ctx>(() => {
    const set = new Set(householdIds);
    return {
      unreadHouseholdIds: set,
      unreadCount: householdIds.length,
      refresh: load,
    };
  }, [householdIds, load]);

  return (
    <QuestionnaireUnreadContext.Provider value={value}>{children}</QuestionnaireUnreadContext.Provider>
  );
}

export function useQuestionnaireUnread(): Ctx {
  const ctx = useContext(QuestionnaireUnreadContext);
  if (!ctx) {
    return {
      unreadHouseholdIds: new Set<number>(),
      unreadCount: 0,
      refresh: () => {},
    };
  }
  return ctx;
}
