"use client";

import { useState, useEffect } from "react";
import { formatDateTime } from "@/lib/utils";

type ActivityItem = {
  id: number;
  action: string;
  description: string | null;
  createdAt: Date | string;
};

type Props = {
  householdId: number;
};

export function ActivitySection({ householdId }: Props) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/households/${householdId}/activities`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setActivities(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [householdId]);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink-200 bg-primary-50/40 px-6 py-4">
        <h3 className="font-semibold text-ink-900">פעילות</h3>
      </div>
      <div className="p-6">
        {loading ? (
          <p className="text-center text-ink-500">טוען...</p>
        ) : activities.length === 0 ? (
          <p className="text-center text-ink-500">אין פעילות עדיין</p>
        ) : (
          <ul className="relative space-y-0 border-s-2 border-ink-200 pr-8" dir="rtl">
            {activities.map((a) => (
              <li key={a.id} className="relative pb-6 last:pb-0">
                <span className="absolute right-0 top-0 -translate-x-1/2 flex h-4 w-4 rounded-full border-2 border-primary-500 bg-white" />
                <p className="text-xs tabular-nums text-ink-500">{formatDateTime(a.createdAt)}</p>
                <p className="mt-0.5 font-medium text-ink-900">
                  {a.description ?? a.action}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
