import { SkeletonBlock } from "@/components/InlineSpinner";

export default function ReportsLoading() {
  return (
    <div className="space-y-6" dir="rtl">
      <SkeletonBlock className="h-9 w-48" />
      <div className="card p-6 space-y-4">
        <SkeletonBlock className="h-10 w-full max-w-md" />
        <SkeletonBlock className="h-64 w-full" />
      </div>
    </div>
  );
}
