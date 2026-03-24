import { SkeletonBlock } from "@/components/InlineSpinner";

export default function QuestionnaireLoading() {
  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:py-8" dir="rtl">
      <div className="mx-auto max-w-xl space-y-4">
        <SkeletonBlock className="mx-auto h-9 w-3/4 max-w-sm rounded-xl" />
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
          <SkeletonBlock className="h-40 w-full" />
          <SkeletonBlock className="h-40 w-full" />
          <SkeletonBlock className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
