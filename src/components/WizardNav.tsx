import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

interface WizardNavProps {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  isLast?: boolean;
}

export function WizardNav({
  onBack,
  onNext,
  nextLabel = "다음",
  backLabel = "이전",
  nextDisabled = false,
  isLast = false,
}: WizardNavProps) {
  return (
    <div className="mt-10 flex items-center justify-between gap-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-muted transition-colors hover:text-charcoal"
      >
        <ArrowLeft size={16} />
        {backLabel}
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="group inline-flex items-center justify-center gap-2 rounded-full bg-charcoal px-7 py-3.5 text-sm font-medium text-ivory transition-all hover:bg-charcoal-light active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-charcoal"
      >
        {isLast ? (
          <>
            <Sparkles size={16} />
            {nextLabel}
          </>
        ) : (
          <>
            {nextLabel}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </div>
  );
}
