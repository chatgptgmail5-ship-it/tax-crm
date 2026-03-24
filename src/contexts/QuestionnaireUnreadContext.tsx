"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

type UnreadPayload = {
  count: number;
  householdIds: number[];
  items: { id: number; householdId: number; displayName: string; dateReceived: string }[];
};

type Ctx = {
  count: number;
  unreadHouseholdIds: Set<number>;
  refetch: () => Promise<void>;
};

const QuestionnaireUnreadContext = createContext<Ctx | null>(null);

export function useQuestionnaireUnread() {
  const ctx = useContext(QuestionnaireUnreadContext);
  if (!ctx) {
    return {
      count: 0,
      unreadHouseholdIds: new Set<number>(),
      refetch: async () => {},
    };
  }
  return ctx;
}

export function QuestionnaireUnreadProvider({ children }: { children: React.ReactNode }) {
  const { status, data: session } = useSession();
  const pathname = usePathname();
  const [payload, setPayload] = useState<UnreadPayload>({ count: 0, householdIds: [], items: [] });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const firstPollRef = useRef(true);
  const prevQuestionnaireIdsRef = useRef<Set<number>>(new Set());
  const sessionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      sessionKeyRef.current = null;
      return;
    }
    const key = session?.user?.email ?? "session";
    if (sessionKeyRef.current !== key) {
      sessionKeyRef.current = key;
      firstPollRef.current = true;
      prevQuestionnaireIdsRef.current = new Set();
    }
  }, [status, session?.user?.email]);

  const fetchUnread = useCallback(async () => {
    if (status !== "authenticated") return;
    if (pathname != null && pathname.startsWith("/questionnaire")) return;

    try {
      const res = await fetch("/api/questionnaire/crm-unread", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as UnreadPayload;
      if (!data || !Array.isArray(data.items)) return;

      const nextIds = new Set(data.items.map((i) => i.id));

      if (!firstPollRef.current) {
        for (const item of data.items) {
          if (!prevQuestionnaireIdsRef.current.has(item.id)) {
            setToastMessage(`התקבל שאלון חדש מ${item.displayName}`);
            break;
          }
        }
      } else {
        firstPollRef.current = false;
      }

      prevQuestionnaireIdsRef.current = nextIds;
      setPayload({
        count: data.count ?? data.items.length,
        householdIds: data.householdIds ?? [...new Set(data.items.map((i) => i.householdId))],
        items: data.items,
      });
    } catch {
      /* ignore */
    }
  }, [status, pathname]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void fetchUnread();
    const id = window.setInterval(() => void fetchUnread(), 6000);
    return () => clearInterval(id);
  }, [status, fetchUnread]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const unreadHouseholdIds = useMemo(
    () => new Set(payload.householdIds.length ? payload.householdIds : payload.items.map((i) => i.householdId)),
    [payload.householdIds, payload.items]
  );

  const value = useMemo<Ctx>(
    () => ({
      count: payload.count,
      unreadHouseholdIds,
      refetch: fetchUnread,
    }),
    [payload.count, unreadHouseholdIds, fetchUnread]
  );

  return (
    <QuestionnaireUnreadContext.Provider value={value}>
      {children}
      {toastMessage ? (
        <div
          className="fixed bottom-6 z-[100] max-w-sm rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm text-ink-800 shadow-lg start-6"
          dir="rtl"
          role="status"
        >
          {toastMessage}
        </div>
      ) : null}
    </QuestionnaireUnreadContext.Provider>
  );
}
