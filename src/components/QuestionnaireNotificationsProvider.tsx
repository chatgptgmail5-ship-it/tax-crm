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

export type QuestionnaireNotificationItem = {
  id: number;
  householdId: number;
  clientName: string;
  dateReceived: string | null;
};

type NotificationsState = {
  count: number;
  householdIds: number[];
  items: QuestionnaireNotificationItem[];
};

const POLL_MS = 4000;
const TOAST_MS = 5000;

type Ctx = {
  refresh: () => void;
  unreadCount: number;
  unreadHouseholdIds: Set<number>;
  isHouseholdUnread: (householdId: number) => boolean;
};

const QuestionnaireNotificationsContext = createContext<Ctx | null>(null);

export function useQuestionnaireNotifications() {
  const ctx = useContext(QuestionnaireNotificationsContext);
  if (!ctx) {
    return {
      refresh: () => {},
      unreadCount: 0,
      unreadHouseholdIds: new Set<number>(),
      isHouseholdUnread: () => false,
    };
  }
  return ctx;
}

type Toast = { id: string; message: string };

export function QuestionnaireNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [state, setState] = useState<NotificationsState>({
    count: 0,
    householdIds: [],
    items: [],
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const isFirstPoll = useRef(true);
  const prevUnreadIds = useRef<Set<number>>(new Set());
  const toastSeq = useRef(0);

  const fetchNotifications = useCallback(async () => {
    if (status !== "authenticated" || !session) return;
    try {
      const res = await fetch("/api/questionnaire/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const items: QuestionnaireNotificationItem[] = Array.isArray(data.items) ? data.items : [];
      const incomingIds = new Set(items.map((i) => i.id));

      if (!isFirstPoll.current) {
        for (const item of items) {
          if (!prevUnreadIds.current.has(item.id)) {
            const msg = `התקבל שאלון חדש מ${item.clientName}`;
            const tid = `t-${++toastSeq.current}`;
            setToasts((prev) => [...prev, { id: tid, message: msg }]);
            window.setTimeout(() => {
              setToasts((prev) => prev.filter((x) => x.id !== tid));
            }, TOAST_MS);
          }
        }
      } else {
        isFirstPoll.current = false;
      }

      prevUnreadIds.current = incomingIds;
      setState({
        count: typeof data.count === "number" ? data.count : items.length,
        householdIds: Array.isArray(data.householdIds) ? data.householdIds : [...new Set(items.map((i) => i.householdId))],
        items,
      });
    } catch {
      /* ignore */
    }
  }, [session, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      isFirstPoll.current = true;
      prevUnreadIds.current = new Set();
      setState({ count: 0, householdIds: [], items: [] });
      setToasts([]);
      return;
    }
    void fetchNotifications();
    const id = window.setInterval(() => void fetchNotifications(), POLL_MS);
    return () => clearInterval(id);
  }, [status, fetchNotifications]);

  const unreadHouseholdIds = useMemo(
    () => new Set(state.householdIds.length ? state.householdIds : state.items.map((i) => i.householdId)),
    [state.householdIds, state.items]
  );

  const isHouseholdUnread = useCallback(
    (householdId: number) => unreadHouseholdIds.has(householdId),
    [unreadHouseholdIds]
  );

  const ctxValue = useMemo<Ctx>(
    () => ({
      refresh: fetchNotifications,
      unreadCount: state.count,
      unreadHouseholdIds,
      isHouseholdUnread,
    }),
    [fetchNotifications, state.count, unreadHouseholdIds, isHouseholdUnread]
  );

  return (
    <QuestionnaireNotificationsContext.Provider value={ctxValue}>
      {children}
      {toasts.length > 0 && (
        <div
          className="pointer-events-none fixed bottom-4 left-4 z-[100] flex max-w-sm flex-col gap-2 md:bottom-6 md:left-6"
          dir="rtl"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm text-ink-800 shadow-md"
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </QuestionnaireNotificationsContext.Provider>
  );
}
