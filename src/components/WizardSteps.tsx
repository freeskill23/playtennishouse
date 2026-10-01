import { Check } from "lucide-react";

interface WizardStepsProps {
  current: number;
  steps: string[];
}

export function WizardSteps({ current, steps }: WizardStepsProps) {
  return (
    <div className="w-full">
      <div className="hidden items-center md:flex">
        {steps.map((label, i) => {
          const status = i < current ? "done" : i === current ? "active" : "upcoming";
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                    status === "done"
                      ? "bg-charcoal text-ivory"
                      : status === "active"
                      ? "bg-charcoal text-ivory ring-4 ring-birch-200"
                      : "bg-birch-100 text-charcoal-muted"
                  }`}
                >
                  {status === "done" ? <Check size={14} /> : i + 1}
                </div>
                <span
                  className={`text-sm font-medium whitespace-nowrap ${
                    status === "active" ? "text-charcoal" : status === "done" ? "text-charcoal-light" : "text-charcoal-muted"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-4 h-px flex-1 transition-colors ${
                    i < current ? "bg-charcoal" : "bg-birch-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile progress */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-charcoal">
            {current + 1}. {steps[current]}
          </span>
          <span className="text-xs text-charcoal-muted">{current + 1} / {steps.length}</span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-birch-100">
          <div
            className="h-full rounded-full bg-charcoal transition-all duration-500"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
