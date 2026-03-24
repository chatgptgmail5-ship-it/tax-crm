import { SkeletonBlock } from "@/components/InlineSpinner";

export default function DocumentsLoading() {
  return (
    <div className="space-y-4" dir="rtl">
      <SkeletonBlock className="h-8 w-56" />
      <div className="card p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
