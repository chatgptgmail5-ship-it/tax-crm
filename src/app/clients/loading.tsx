import { SkeletonBlock } from "@/components/InlineSpinner";

export default function ClientsLoading() {
  return (
    <div className="space-y-4" dir="rtl">
      <SkeletonBlock className="h-10 w-full max-w-md" />
      <div className="card overflow-hidden p-4">
        <div className="space-y-3">
          <SkeletonBlock className="h-10 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
