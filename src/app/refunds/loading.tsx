import { SkeletonBlock } from "@/components/InlineSpinner";

export default function RefundsLoading() {
  return (
    <div className="space-y-4" dir="rtl">
      <SkeletonBlock className="h-8 w-48" />
      <div className="card overflow-hidden p-4 space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}
