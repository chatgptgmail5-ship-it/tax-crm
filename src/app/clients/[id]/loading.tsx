import { SkeletonBlock } from "@/components/InlineSpinner";

export default function ClientDetailLoading() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="card p-6 space-y-3">
        <SkeletonBlock className="h-8 w-2/3 max-w-md" />
        <SkeletonBlock className="h-4 w-1/2 max-w-sm" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-9 w-28 rounded-t-lg" />
        ))}
      </div>
      <div className="card p-6 space-y-4">
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-24 w-full" />
      </div>
    </div>
  );
}
